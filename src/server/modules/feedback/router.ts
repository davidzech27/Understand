import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as googleapis from "googleapis";
import { createRouter, authedProcedure } from "~/server/trpc";
import db from "~/server/modules/db/db";
import { and, eq } from "drizzle-orm/expressions";
import { feedback, feedbackConfig } from "~/server/modules/db/schema";
import { attachmentListSchema } from "~/server/modules/shared/validation";

const feedbackRouter = createRouter({
	getGoogleDocText: authedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input: { id }, ctx: { drive } }) => {
			try {
				const instructions = (
					await drive.files.export({
						fileId: id,
						mimeType: "text/plain",
					})
				).data;

				if (typeof instructions !== "string")
					throw new TRPCError({ code: "NOT_FOUND" });

				return instructions;
			} catch (error) {
				if (error instanceof googleapis.Common.GaxiosError) {
					if ((error.code as unknown as number) === 403)
						// annoying mistyping in library
						throw new TRPCError({ code: "FORBIDDEN" });
					else throw error;
				} else throw error;
			}
		}),

	getGoogleDocHTML: authedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input: { id }, ctx: { drive } }) => {
			try {
				const instructions = (
					await drive.files.export({
						fileId: id,
						mimeType: "text/html",
					})
				).data;

				if (typeof instructions !== "string")
					throw new TRPCError({ code: "NOT_FOUND" });

				return instructions;
			} catch (error) {
				if (error instanceof googleapis.Common.GaxiosError) {
					if ((error.code as unknown as number) === 403)
						// annoying mistyping in library
						throw new TRPCError({ code: "FORBIDDEN" });
					else throw error;
				} else throw error;
			}
		}),
	configureFeedback: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
				assignmentId: z.string(),
				instructions: z.string(),
			})
		)
		.mutation(
			async ({ input: { courseId, assignmentId, instructions } }) => {
				await db
					.insert(feedbackConfig)
					.values({
						courseId,
						assignmentId,
						instructions,
					})
					.onDuplicateKeyUpdate({
						set: {
							instructions,
						},
					});
			}
		),
	getPriorFeedback: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
				assignmentId: z.string(),
			})
		)
		.query(
			async ({ input: { assignmentId, courseId }, ctx: { email } }) => {
				return db
					.select()
					.from(feedback)
					.where(
						and(
							and(
								eq(feedback.assignmentId, assignmentId),
								eq(feedback.courseId, courseId)
							),
							eq(feedback.userEmail, email)
						)
					)
					.orderBy(feedback.givenAt);
			}
		),
	getSubmissions: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
				assignmentId: z.string(),
			})
		)
		.query(
			async ({
				input: { courseId, assignmentId },
				ctx: { classroom },
			}) => {
				const submissionsResponse =
					await classroom.courses.courseWork.studentSubmissions.list({
						courseId,
						courseWorkId: assignmentId,
					});

				const submissionsTransformed =
					submissionsResponse.data.studentSubmissions
						?.at(-1)
						?.assignmentSubmission?.attachments?.map(
							({ driveFile, youTubeVideo, link, form }) => {
								if (driveFile)
									return {
										type: "driveFile",
										driveFile: {
											id: driveFile.id,
											title: driveFile.title,
											url: driveFile.alternateLink,
											thumbnailUrl:
												driveFile.thumbnailUrl,
										},
									};
								if (youTubeVideo)
									return {
										type: "youTubeVideo",
										youtubeVideo: {
											id: youTubeVideo.id,
											title: youTubeVideo.title,
											url: youTubeVideo.alternateLink,
											thumbnailUrl:
												youTubeVideo.thumbnailUrl,
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
						)
						.filter(Boolean) ?? [];

				return attachmentListSchema.parse(submissionsTransformed);
			}
		),
});

export default feedbackRouter;
