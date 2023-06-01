import { z } from "zod"

const server = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]),
	JWT_SECRET: z.string(),
	DATABASE_URL: z.string(),
	NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	OPENAI_SECRET_KEY: z.string(),
	PINECONE_ENVIRONMENT: z.string(),
	PINECONE_API_KEY: z.string(),
	QSTASH_TOKEN: z.string(),
	QSTASH_CURRENT_SIGNING_KEY: z.string(),
	QSTASH_NEXT_SIGNING_KEY: z.string(),
	NEXT_PUBLIC_URL: z.string().url(),
})

const client = z.object({
	NEXT_PUBLIC_URL: z.string().url(),
	NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
	NEXT_PUBLIC_LEARN_MORE_URL: z.string().url(),
})

/**
 * @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>}
 */
const processEnv = {
	NODE_ENV: process.env.NODE_ENV,
	JWT_SECRET: process.env.JWT_SECRET,
	NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
	DATABASE_URL: process.env.DATABASE_URL,
	NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
	PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
	PINECONE_API_KEY: process.env.PINECONE_API_KEY,
	QSTASH_TOKEN: process.env.QSTASH_TOKEN,
	QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
	QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	OPENAI_SECRET_KEY: process.env.OPENAI_SECRET_KEY,
	NEXT_PUBLIC_LEARN_MORE_URL: process.env.NEXT_PUBLIC_LEARN_MORE_URL,
}

// Don't touch the part below
// --------------------------

const merged = server.merge(client)

/** @typedef {z.input<typeof merged>} MergedInput */
/** @typedef {z.infer<typeof merged>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

let env = /** @type {MergedOutput} */ (process.env)

if (!!process.env.SKIP_ENV_VALIDATION == false) {
	const isServer = typeof window === "undefined"

	const parsed = /** @type {MergedSafeParseReturn} */ (
		isServer
			? merged.safeParse(processEnv) // on server we can validate all env vars
			: client.safeParse(processEnv) // on client we can only validate the ones that are exposed
	)

	if (parsed.success === false) {
		console.error(
			"❌ Invalid environment variables:",
			parsed.error.flatten().fieldErrors
		)
		throw new Error("Invalid environment variables")
	}

	env = new Proxy(parsed.data, {
		get(target, prop) {
			if (typeof prop !== "string") return undefined
			// Throw a descriptive error if a server-side env var is accessed on the client
			// Otherwise it would just be returning `undefined` and be annoying to debug
			if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
				throw new Error(
					process.env.NODE_ENV === "production"
						? "❌ Attempted to access a server-side environment variable on the client"
						: `❌ Attempted to access server-side environment variable '${prop}' on the client`
				)
			return target[/** @type {keyof typeof target} */ (prop)]
		},
	})
}

export { env }
