import { z } from "zod";
import { createRouter, authedProcedure } from "~/server/api/trpc";
import { courseListSchema } from "~/server/schemas";

export const coursesRouter = createRouter({
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
});
