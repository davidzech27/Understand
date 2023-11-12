import { type GenerateCall } from "./insightsHandler"
import qstash from "~/qstash/qstash"
import env from "~/env.mjs"

export default async function callGenerate({
	deduplicationId,
	...body
}: GenerateCall & { deduplicationId?: string }) {
	await qstash.publishJSON({
		url: `${env.NEXT_PUBLIC_URL}/api/insights`,
		retries: 3,
		body,
		deduplicationId,
	})
}
