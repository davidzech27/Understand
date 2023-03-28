import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, authedProcedure } from "~/server/api/trpc";
import db from "~/db/db";
import { eq } from "drizzle-orm/expressions";
import { user } from "~/db/schema";

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
});
