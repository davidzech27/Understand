import { Client } from "@upstash/qstash/cloudflare"

import { env } from "~/env.mjs"

const qstash = new Client({
	token: env.QSTASH_TOKEN,
})

export default qstash
