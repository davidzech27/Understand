import { z } from "zod";
import { createTRPCRouter, authedProcedure } from "~/server/api/trpc";
import db from "~/db/db";
import { user } from "~/db/schema";
import { eq } from "drizzle-orm/expressions";

const courseSchema = z.object({
	id: z.string(),
	name: z.string(),
	section: z.string().optional(),
});

const courseListSchema = z.array(courseSchema);

const profileSchema = z.object({
	email: z.string(),
	name: z.string(),
	photo: z.string(),
});

const rosterSchema = z.object({
	teachers: z.array(profileSchema),
	students: z.array(profileSchema),
});

const materialSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("driveFile"),
		driveFile: z.object({
			id: z.string(),
			title: z.string(),
			url: z.string().url(),
			thumbnailUrl: z.string().url(),
		}),
	}),
	z.object({
		type: z.literal("youtubeVideo"),
		youtubeVideo: z.object({
			id: z.string(),
			title: z.string(),
			url: z.string().url(),
			thumbnailUrl: z.string().url(),
		}),
	}),
	z.object({
		type: z.literal("link"),
		link: z.object({
			url: z.string().url(),
			title: z.string(),
			thumbnailUrl: z.string().url(),
		}),
	}),
	z.object({
		type: z.literal("form"),
		form: z.object({
			formUrl: z.string().url(),
			responseUrl: z.string().url(),
			title: z.string(),
			thumbnailUrl: z.string().url(),
		}),
	}),
]);

const assignmentSchema = z.intersection(
	// assuming that DELETED assignments are not being fetched, or parse will throw
	z.object({
		id: z.string(),
		title: z.string(),
		description: z.string().optional(),
		materials: z.array(materialSchema),
		dueDate: z.date().optional(),
		workType: z.enum([
			"ASSIGNMENT",
			"SHORT_ANSWER_QUESTION",
			"MULTIPLE_CHOICE_QUESTION",
		]),
	}),
	z.discriminatedUnion("state", [
		z.object({
			state: z.literal("PUBLISHED"),
			url: z.string().url(),
		}),
		z.object({
			state: z.literal("DRAFT"),
		}),
	])
);

const assignmentListSchema = z.array(assignmentSchema);

export const coursesRouter = createTRPCRouter({
	teaching: authedProcedure.query(async ({ ctx: { classroom } }) => {
		return courseListSchema.parse(
			(
				await classroom.courses.list({
					teacherId: "me",
					courseStates: ["ACTIVE"],
				})
			).data.courses ?? []
		);
	}),
	enrolled: authedProcedure.query(async ({ ctx: { classroom } }) => {
		return courseListSchema.parse(
			(
				await classroom.courses.list({
					studentId: "me",
					courseStates: ["ACTIVE"],
				})
			).data.courses ?? []
		);
	}),
	roster: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
			})
		)
		.query(async ({ input: { courseId }, ctx: { classroom } }) => {
			const [studentsResponse, teachersResponse] = await Promise.all([
				classroom.courses.students.list({ courseId }), // look into fields parameter
				classroom.courses.teachers.list({ courseId }),
			]);

			const students = (studentsResponse.data.students ?? []).map(
				({ profile }) => ({
					email: profile?.emailAddress,
					name: profile?.name?.fullName,
					photo: profile?.photoUrl,
				})
			);

			const teachers = (teachersResponse.data.teachers ?? []).map(
				({ profile }) => ({
					email: profile?.emailAddress,
					name: profile?.name?.fullName,
					photo: profile?.photoUrl,
				})
			);

			return rosterSchema.parse({
				teachers,
				students,
			});
		}),
	assignments: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
			})
		)
		.query(async ({ input: { courseId }, ctx: { classroom } }) => {
			const assignments = (
				(
					await classroom.courses.courseWork.list({
						courseId,
						courseWorkStates: ["PUBLISHED", "DRAFT"], // decide how to handle/display draft assignments later
					})
				).data.courseWork ?? []
			).map(
				({
					id,
					title,
					description,
					materials,
					dueDate,
					dueTime,
					workType,
					state,
					alternateLink,
				}) => ({
					id,
					title,
					description,
					state,
					url: alternateLink,
					materials: materials?.map(
						({ driveFile, youtubeVideo, link, form }) => {
							if (driveFile)
								return {
									type: "driveFile",
									driveFile: {
										id: driveFile.driveFile?.id,
										title: driveFile.driveFile?.title,
										url: driveFile.driveFile?.alternateLink,
										thumbnailUrl:
											driveFile.driveFile?.thumbnailUrl,
									},
								};
							if (youtubeVideo)
								return {
									type: "youtubeVideo",
									youtubeVideo: {
										id: youtubeVideo.id,
										title: youtubeVideo.title,
										url: youtubeVideo.alternateLink,
										thumbnailUrl: youtubeVideo.thumbnailUrl,
									},
								};
							if (link)
								return {
									type: "link",
									link: {
										title: link.title,
										url: link.url,
										thumbnailUrl: link.thumbnailUrl,
									},
								};
							if (form)
								return {
									type: "form",
									form: {
										title: form.title,
										formUrl: form.formUrl,
										responseUrl: form.responseUrl,
										thumbnailUrl: form.thumbnailUrl,
									},
								};
						}
					),
					dueDate:
						dueDate &&
						dueDate.year &&
						dueDate.month &&
						dueDate.day &&
						dueTime &&
						dueTime.hours &&
						dueTime.minutes &&
						dueTime.seconds
							? new Date(
									dueDate.year,
									dueDate.month - 1,
									dueDate.day,
									dueTime.hours,
									dueTime.minutes,
									dueTime.seconds
							  )
							: undefined,
					workType,
				})
			);

			return assignmentListSchema.parse(assignments);
		}),
});
