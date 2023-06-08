import { type GenerateCall } from "./insightsAPIRoute"
import qstash from "~/qstash/qstash"
import { env } from "~/env.mjs"

const callGenerate = async ({
	deduplicationId,
	...body
}: GenerateCall & { deduplicationId?: string }) => {
	await qstash.publishJSON({
		url: `${env.NEXT_PUBLIC_URL}/api/insights`,
		retries: 3,
		body,
		deduplicationId,
	})
}

export default callGenerate
