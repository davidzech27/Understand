import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedProcedure } from "~/server/api/trpc";
import {
	assignmentSchema,
	assignmentListSchema,
} from "~/server/validationSchemas";
import * as googleapis from "googleapis";
import db from "~/db/db";
import { feedbackConfig } from "~/db/schema";
import { eq, and } from "drizzle-orm/expressions";

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

export const assignmentsRouter = createRouter({
	get: authedProcedure
		.input(
			z.object({
				id: z.string(),
				courseId: z.string(),
			})
		)
		.query(async ({ input: { id, courseId }, ctx: { classroom } }) => {
			try {
				const [assignmentResponse, [feedbackConfigRow]] =
					await Promise.all([
						classroom.courses.courseWork.get({
							id,
							courseId,
						}),
						db
							.select({
								instructions: feedbackConfig.instructions,
							})
							.from(feedbackConfig)
							.where(
								and(
									eq(feedbackConfig.courseId, courseId),
									eq(feedbackConfig.assignmentId, id)
								)
							),
					]);

				return {
					...assignmentSchema.parse(
						transformAssignment(assignmentResponse.data)
					),
					feedbackConfig: feedbackConfigRow,
				};
			} catch (error) {
				if (error instanceof googleapis.Common.GaxiosError) {
					if (error.code === "404")
						throw new TRPCError({
							code: "NOT_FOUND",
						});
					else throw error;
				} else throw error;
			}
		}),
	byCourse: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
			})
		)
		.query(async ({ input: { courseId }, ctx: { classroom } }) => {
			try {
				const [assignmentsResponse, feedbackConfigRows] =
					await Promise.all([
						classroom.courses.courseWork.list({
							courseId,
							courseWorkStates: ["PUBLISHED", "DRAFT"],
							orderBy: "dueDate",
						}),
						db
							.select({
								id: feedbackConfig.assignmentId,
								instructions: feedbackConfig.instructions,
							})
							.from(feedbackConfig)
							.where(eq(feedbackConfig.courseId, courseId)),
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
					const feedbackConfigRow = feedbackConfigByIdMap.get(
						assignment.id
					);

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
			} catch (error) {
				if (error instanceof googleapis.Common.GaxiosError) {
					if (error.code === "404")
						throw new TRPCError({
							code: "NOT_FOUND",
						});
					else throw error;
				} else throw error;
			}
		}),
});
