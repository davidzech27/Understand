import { type SyncCall } from "./syncAPIRoute"
import qstash from "~/qstash/qstash"
import { env } from "~/env.mjs"

const callSync = async ({
	deduplicationId,
	...body
}: SyncCall & { deduplicationId?: string }) => {
	await qstash.publishJSON({
		url: `${env.NEXT_PUBLIC_URL}/api/sync`,
		retries: 3,
		body,
		deduplicationId,
	})
}

export default callSync
