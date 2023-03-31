import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedProcedure } from "~/server/api/trpc";
import db from "~/db/db";
import { eq } from "drizzle-orm/expressions";
import { feedbackConfig } from "~/db/schema";

export const feedbackRouter = createRouter({
	getGoogleDocText: authedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input: { id }, ctx: { drive } }) => {
			const instructions = (
				await drive.files.export({
					fileId: id,
					mimeType: "text/plain",
				})
			).data;

			if (typeof instructions !== "string")
				throw new TRPCError({ code: "NOT_FOUND" });

			return instructions;
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
});
