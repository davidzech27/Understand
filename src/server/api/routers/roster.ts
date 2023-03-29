import { z } from "zod";
import { createTRPCRouter, authedProcedure } from "~/server/api/trpc";
import { rosterSchema } from "~/server/schemas";

export const rosterRouter = createTRPCRouter({
	get: authedProcedure
		.input(
			z.object({
				courseId: z.string(),
			})
		)
		.query(async ({ input: { courseId }, ctx: { classroom } }) => {
			const [studentsResponse, teachersResponse] = await Promise.all([
				classroom.courses.students.list({ courseId }), // look into fields parameter
				classroom.courses.teachers.list({ courseId }),
			]);
			const students = (studentsResponse.data.students ?? []).map(
				({ profile }) => ({
					email: profile?.emailAddress,
					name: profile?.name?.fullName,
					photo: `https:${profile?.photoUrl}`,
				})
			);
			const teachers = (teachersResponse.data.teachers ?? []).map(
				({ profile }) => ({
					email: profile?.emailAddress,
					name: profile?.name?.fullName,
					photo: `https:${profile?.photoUrl}`,
				})
			);
			return rosterSchema.parse({
				teachers,
				students,
			});
		}),
});
