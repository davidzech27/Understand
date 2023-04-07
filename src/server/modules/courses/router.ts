import { z } from "zod";
import { createRouter, authedProcedure } from "~/server/trpc";
import { courseListSchema } from "~/server/modules/shared/validation";

const coursesRouter = createRouter({
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

export default coursesRouter;
