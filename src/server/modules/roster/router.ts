import { z } from "zod";
import * as googleapis from "googleapis";
import { TRPCError } from "@trpc/server";
import { createRouter, authedProcedure } from "~/server/trpc";
import { rosterSchema } from "~/server/modules/shared/validation";
import db from "~/server/modules/db/db";
import { user } from "~/server/modules/db/schema";
import { sql } from "drizzle-orm";
//! limitation - names set up through understand aren't being used on non-workspace/school google classrooms because students can't view their teachers' email addresses so they can't be associated to their user database row
// errors going on in this router but frontend seems to be fine
const rosterRouter = createRouter({
	get: authedProcedure // unfortunately we are making nonconcurrent roundtrips here
		.input(
			z.object({
				courseId: z.string(),
			})
		)
		.query(async ({ input: { courseId }, ctx: { classroom } }) => {
			try {
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
							.concat(
								roster.teachers.filter(
									(teacher) => teacher.email !== undefined
								) as typeof roster.students
							)
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
						if (teacher.email === undefined) return teacher;

						const chosenName = chosenNameByEmailMap.get(
							teacher.email
						);

						return chosenName
							? {
									...teacher,
									name: chosenName,
							  }
							: teacher;
					}),
					students: roster.students.map((student) => {
						const chosenName = chosenNameByEmailMap.get(
							student.email
						);

						return chosenName
							? {
									...student,
									name: chosenName,
							  }
							: student;
					}),
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
});

export default rosterRouter;
