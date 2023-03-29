import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, authedProcedure } from "~/server/api/trpc";
import db from "~/db/db";
import { eq } from "drizzle-orm/expressions";
import { user } from "~/db/schema";
import { profileSchema } from "~/server/schemas";

export const profileRouter = createTRPCRouter({
	me: authedProcedure.query(async ({ ctx: { email, people } }) => {
		const [[userRow], photo] = await Promise.all([
			db
				.select({ name: user.name })
				.from(user)
				.where(eq(user.email, email)),
			(async () => {
				const photo = (
					await people.people.get({
						resourceName: "people/me",
						personFields: "photos",
					})
				).data.photos?.[0]?.url;

				return typeof photo === "string" ? photo : undefined;
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
				photo: typeof photo === "string" ? `https:${photo}` : undefined,
			});
		}),
});
