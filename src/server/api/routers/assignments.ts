import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, authedProcedure } from "~/server/api/trpc";
import { assignmentSchema, assignmentListSchema } from "~/server/schemas";
import { classroom_v1 } from "googleapis";
import undefinedTypeGuard from "~/util/undefinedTypeGuard";

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
}: classroom_v1.Schema$CourseWork) =>
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

export const assignmentsRouter = createTRPCRouter({
	get: authedProcedure
		.input(
			z.object({
				id: z.string(),
				courseId: z.string(),
			})
		)
		.query(async ({ input: { id, courseId }, ctx: { classroom } }) => {
			return assignmentSchema.parse(
				transformAssignment(
					(
						await classroom.courses.courseWork.get({
							id,
							courseId,
						})
					).data
				)
			);
		}),
	byCourse: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
			})
		)
		.query(async ({ input: { courseId }, ctx: { classroom } }) => {
			return assignmentListSchema.parse(
				(
					(
						await classroom.courses.courseWork.list({
							courseId,
							courseWorkStates: ["PUBLISHED", "DRAFT"], // decide how to handle/display draft assignments later
							orderBy: "dueDate",
						})
					).data.courseWork ?? []
				)
					.map(transformAssignment)
					.filter(undefinedTypeGuard)
			);
		}),
});
