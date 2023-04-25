import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm/expressions";
import * as googleapis from "googleapis";
import { TRPCError } from "@trpc/server";
import { createRouter, authedProcedure } from "~/server/trpc";
import {
	courseListSchema,
	rosterSchema,
	assignmentListSchema,
} from "~/server/modules/shared/validation";
import db from "../db/db";
import { user, feedbackConfig } from "../db/schema";

const transformAssignment = ({
	id,
	title,
	description,
	materials,
	dueDate,
	dueTime,
	workType,
	state,
	alternateLink,
}: googleapis.classroom_v1.Schema$CourseWork) =>
	workType === "ASSIGNMENT"
		? {
				id,
				title,
				description,
				state,
				url: alternateLink,
				materials: (materials ?? []).map(
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
				dueDate: (() => {
					return dueDate &&
						dueDate.year &&
						dueDate.month &&
						dueDate.day &&
						dueTime &&
						dueTime.hours &&
						dueTime.minutes
						? new Date(
								Date.UTC(
									dueDate.year,
									dueDate.month - 1,
									dueDate.day,
									dueTime.hours,
									dueTime.minutes
								)
						  )
						: undefined;
				})(),
				workType,
		  }
		: undefined;

const coursesRouter = createRouter({
	all: authedProcedure.query(async ({ ctx: { classroom } }) => {
		try {
			const [teachingResponse, enrolledResponse] = await Promise.all([
				classroom.courses.list({
					teacherId: "me",
					courseStates: ["ACTIVE"],
				}),
				classroom.courses.list({
					studentId: "me",
					courseStates: ["ACTIVE"],
				}),
			]);

			const [teachingCourses, enrolledCourses] = [
				courseListSchema.parse(teachingResponse.data.courses ?? []),
				courseListSchema.parse(enrolledResponse.data.courses ?? []),
			];

			const [assignmentLists, rosters] = await Promise.all([
				Promise.all(
					teachingCourses.concat(enrolledCourses).map((course) =>
						(async () => {
							const [assignmentsResponse, feedbackConfigRows] =
								await Promise.all([
									classroom.courses.courseWork.list({
										courseId: course.id,
										courseWorkStates: [
											"PUBLISHED",
											"DRAFT",
										],
										orderBy: "dueDate",
									}),
									db
										.select({
											id: feedbackConfig.assignmentId,
											instructions:
												feedbackConfig.instructions,
										})
										.from(feedbackConfig)
										.where(
											eq(
												feedbackConfig.courseId,
												course.id
											)
										),
								]);

							const assignmentsTransformed = (
								assignmentsResponse.data.courseWork ?? []
							)
								.map(transformAssignment)
								.filter(Boolean);

							const assignments = assignmentListSchema.parse(
								assignmentsTransformed
							);

							const feedbackConfigByIdMap = new Map<
								string,
								(typeof feedbackConfigRows)[0]
							>();

							for (const feedbackConfigRow of feedbackConfigRows) {
								feedbackConfigByIdMap.set(
									feedbackConfigRow.id,
									feedbackConfigRow
								);
							}

							return assignments.map((assignment) => {
								const feedbackConfigRow =
									feedbackConfigByIdMap.get(assignment.id);

								return {
									...assignment,
									feedbackConfig: feedbackConfigRow
										? {
												instructions:
													feedbackConfigRow.instructions,
										  }
										: undefined,
								};
							});
						})()
					)
				),
				Promise.all(
					teachingCourses.concat(enrolledCourses).map((course) =>
						(async () => {
							const [studentsResponse, teachersResponse] =
								await Promise.all([
									classroom.courses.students.list({
										courseId: course.id,
									}), // look into fields parameter
									classroom.courses.teachers.list({
										courseId: course.id,
									}),
								]);

							const studentsTransformed = (
								studentsResponse.data.students ?? []
							).map(({ profile }) => ({
								email: profile?.emailAddress,
								name: profile?.name?.fullName,
								photo: `https:${profile?.photoUrl}`,
							}));

							const teachersTransformed = (
								teachersResponse.data.teachers ?? []
							).map(({ profile }) => ({
								email: profile?.emailAddress,
								name: profile?.name?.fullName,
								photo: `https:${profile?.photoUrl}`,
							}));

							const roster = rosterSchema.parse({
								students: studentsTransformed,
								teachers: teachersTransformed,
							});

							const usersWithChosenName = await db
								.select()
								.from(user)
								.where(
									sql`user.email in ${roster.students
										.concat(
											roster.teachers.filter(
												(teacher) =>
													teacher.email !== undefined
											) as typeof roster.students
										)
										.map((user) => user.email)}`
								); // inArray expression causes errno 1241

							const chosenNameByEmailMap = new Map<
								string,
								string
							>();

							for (const userWithChosenName of usersWithChosenName) {
								chosenNameByEmailMap.set(
									userWithChosenName.email,
									userWithChosenName.name
								);
							}

							return {
								teachers: roster.teachers.map((teacher) => {
									if (teacher.email === undefined)
										return teacher;

									const chosenName = chosenNameByEmailMap.get(
										teacher.email
									);

									return chosenName
										? {
												...teacher,
												name: chosenName,
										  }
										: teacher;
								}),
								students: roster.students.map((student) => {
									const chosenName = chosenNameByEmailMap.get(
										student.email
									);

									return chosenName
										? {
												...student,
												name: chosenName,
										  }
										: student;
								}),
							};
						})()
					)
				),
			]);

			return {
				teaching: teachingCourses.map((course, courseIndex) => ({
					...course,
					assignments: assignmentLists[courseIndex] ?? [], // should be defined, so only here so I don't have to use the ! type operator
					roster: (rosters[courseIndex] ?? []) as (typeof rosters)[0],
				})),
				enrolled: enrolledCourses.map((course, courseIndex) => ({
					...course,
					assignments:
						assignmentLists[courseIndex + teachingCourses.length] ??
						[],
					roster: (rosters[courseIndex + teachingCourses.length] ??
						[]) as (typeof rosters)[0],
				})),
			};
		} catch (error) {
			if (error instanceof googleapis.Common.GaxiosError) {
				if ((error.code as unknown as number) === 403)
					// annoying mistyping in library
					throw new TRPCError({ code: "FORBIDDEN" });
			}

			throw error;
		}
	}),
});

export default coursesRouter;
