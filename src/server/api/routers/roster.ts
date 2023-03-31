import { z } from "zod";
import { createRouter, authedProcedure } from "~/server/api/trpc";
import { rosterSchema } from "~/server/validationSchemas";
import db from "~/db/db";
import { user } from "~/db/schema";
import { sql } from "drizzle-orm";

export const rosterRouter = createRouter({
	get: authedProcedure // unfortunately we are making nonconcurrent roundtrips here
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

			const studentsTransformed = (
				studentsResponse.data.students ?? []
			).map(({ profile }) => ({
				email: profile?.emailAddress,
				name: profile?.name?.fullName,
				photo: `https:${profile?.photoUrl}`,
			}));

			const teachersTransformed = (
				teachersResponse.data.teachers ?? []
			).map(({ profile }) => ({
				email: profile?.emailAddress,
				name: profile?.name?.fullName,
				photo: `https:${profile?.photoUrl}`,
			}));

			const roster = rosterSchema.parse({
				students: studentsTransformed,
				teachers: teachersTransformed,
			});

			const usersWithChosenName = await db
				.select()
				.from(user)
				.where(
					sql`user.email in ${roster.students
						.concat(roster.teachers)
						.map((user) => user.email)}`
				); // inArray expression causes errno 1241

			const chosenNameByEmailMap = new Map<string, string>();

			for (const userWithChosenName of usersWithChosenName) {
				chosenNameByEmailMap.set(
					userWithChosenName.email,
					userWithChosenName.name
				);
			}

			return {
				teachers: roster.teachers.map((teacher) => {
					const chosenName = chosenNameByEmailMap.get(teacher.email);

					return chosenName
						? {
								...teacher,
								name: chosenName,
						  }
						: teacher;
				}),
				students: roster.students.map((student) => {
					const chosenName = chosenNameByEmailMap.get(student.email);

					return chosenName
						? {
								...student,
								name: chosenName,
						  }
						: student;
				}),
			};
		}),
});
