import { type SyncCall } from "./syncHandler"
import qstash from "~/qstash/qstash"
import env from "env.mjs"

export default async function callSync({
	deduplicationId,
	...body
}: SyncCall & { deduplicationId?: string }) {
	await qstash.publishJSON({
		url: `${env.NEXT_PUBLIC_URL}/api/sync`,
		retries: 3,
		body,
		deduplicationId,
	})
}
