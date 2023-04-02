import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as googleapis from "googleapis";
import { createRouter, authedProcedure } from "~/server/api/trpc";
import db from "~/db/db";
import { eq } from "drizzle-orm/expressions";
import { user } from "~/db/schema";
import { profileSchema } from "~/server/validationSchemas";

export const profileRouter = createRouter({
	me: authedProcedure.query(async ({ ctx: { email, classroom } }) => {
		const [[userRow], photo] = await Promise.all([
			db
				.select({ name: user.name })
				.from(user)
				.where(eq(user.email, email)),
			(async () => {
				const photo = (
					await classroom.userProfiles.get({
						userId: email,
					})
				).data.photoUrl;

				return typeof photo === "string" ? `https:${photo}` : undefined;
			})(),
		]);

		if (!userRow) {
			throw new TRPCError({ code: "NOT_FOUND" });
		}

		return {
			email,
			name: userRow.name,
			photo,
		};
	}),
	get: authedProcedure
		.input(z.object({ email: z.string() }))
		.query(async ({ input: { email }, ctx: { classroom } }) => {
			try {
				const [
					[userRow],
					{
						data: { photoUrl: photo, name: googleName },
					},
				] = await Promise.all([
					db
						.select({ name: user.name })
						.from(user)
						.where(eq(user.email, email)),
					classroom.userProfiles.get({
						userId: email,
					}),
				]);

				if (!userRow && !googleName) {
					throw new TRPCError({ code: "NOT_FOUND" });
				}

				return profileSchema.parse({
					email,
					name: userRow?.name ?? googleName?.fullName,
					photo:
						typeof photo === "string"
							? `https:${photo}`
							: undefined,
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
	update: authedProcedure
		.input(z.object({ name: z.string().optional() }))
		.mutation(async ({ input: { name }, ctx: { email } }) => {
			await db.update(user).set({ name }).where(eq(user.email, email));
		}),
});
