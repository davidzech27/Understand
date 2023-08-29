import { and, eq } from "drizzle-orm"
import { kv } from "@vercel/kv"

import db from "~/db/db"
import { school } from "~/db/schema"

export type School = Exclude<
	Awaited<ReturnType<ReturnType<typeof School>["get"]>>,
	undefined
>

const School = ({
	districtName,
	name,
}: {
	districtName: string
	name: string
}) => {
	const maxUserMonthlyCostKey = `${districtName}:${name}:maxusermonthlycost`

	const maxCourseMonthlyCostKey = `${districtName}:${name}:maxcoursemonthlycost`

	return {
		create: async ({
			teacherEmailDomain,
			studentEmailDomain,
			maxUserMonthlyCost,
			maxCourseMonthlyCost,
		}: {
			teacherEmailDomain: string | undefined
			studentEmailDomain: string | undefined
			maxUserMonthlyCost: number
			maxCourseMonthlyCost: number
		}) => {
			await Promise.all([
				db.insert(school).values({
					districtName,
					name,
					teacherEmailDomain,
					studentEmailDomain,
					maxUserMonthlyCost,
					maxCourseMonthlyCost,
				}),
				kv.set(maxUserMonthlyCostKey, maxUserMonthlyCost),
				kv.set(maxCourseMonthlyCostKey, maxCourseMonthlyCost),
			])
		},
		get: async () => {
			const [row] = await db
				.select({
					teacherEmailDomain: school.teacherEmailDomain,
					studentEmailDomain: school.studentEmailDomain,
				})
				.from(school)
				.where(
					and(
						eq(school.districtName, districtName),
						eq(school.name, name)
					)
				)

			return (
				row && {
					teacherEmailDomain: row.teacherEmailDomain ?? undefined,
					studentEmailDomain: row.studentEmailDomain ?? undefined,
				}
			)
		},
		maxUserMonthlyCost: async () => {
			const result = kv.get(maxUserMonthlyCostKey)

			if (typeof result === "number") return result

			const maxUserMonthlyCost =
				(
					await db
						.select({
							maxUserMonthlyCost: school.maxUserMonthlyCost,
						})
						.from(school)
						.where(
							and(
								eq(school.districtName, districtName),
								eq(school.name, name)
							)
						)
				)[0]?.maxUserMonthlyCost ?? 0

			await kv.set(maxUserMonthlyCostKey, maxUserMonthlyCost)

			return maxUserMonthlyCost
		},
		maxCourseMonthlyCost: async () => {
			const result = kv.get(maxCourseMonthlyCostKey)

			if (typeof result === "number") return result

			const maxCourseMonthlyCost =
				(
					await db
						.select({
							maxCourseMonthlyCost: school.maxCourseMonthlyCost,
						})
						.from(school)
						.where(
							and(
								eq(school.districtName, districtName),
								eq(school.name, name)
							)
						)
				)[0]?.maxCourseMonthlyCost ?? 0

			await kv.set(maxCourseMonthlyCostKey, maxCourseMonthlyCost)

			return maxCourseMonthlyCost
		},
		update: async ({
			teacherEmailDomain,
			studentEmailDomain,
			maxUserMonthlyCost,
			maxCourseMonthlyCost,
		}: {
			teacherEmailDomain?: string | null
			studentEmailDomain?: string | null
			maxUserMonthlyCost?: number
			maxCourseMonthlyCost?: number
		}) => {
			await Promise.all([
				db
					.update(school)
					.set({
						teacherEmailDomain,
						studentEmailDomain,
						maxUserMonthlyCost,
						maxCourseMonthlyCost,
					})
					.where(
						and(
							eq(school.districtName, districtName),
							eq(school.name, name)
						)
					),
				maxUserMonthlyCost !== undefined &&
					kv.set(maxUserMonthlyCostKey, maxUserMonthlyCost),
				maxCourseMonthlyCost !== undefined &&
					kv.set(maxCourseMonthlyCostKey, maxCourseMonthlyCost),
			])
		},
		delete: async () => {
			await Promise.all([
				db
					.delete(school)
					.where(
						and(
							eq(school.districtName, districtName),
							eq(school.name, name)
						)
					),
				kv.del(maxUserMonthlyCostKey),
				kv.del(maxCourseMonthlyCostKey),
			])
		},
	}
}

export default School
