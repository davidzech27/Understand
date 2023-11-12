import { z } from "zod"
import { createEnv } from "@t3-oss/env-nextjs"

const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),
		JWT_SECRET: z.string(),
		DATABASE_URL: z.string(),
		KV_URL: z.string(),
		KV_REST_API_URL: z.string(),
		KV_REST_API_TOKEN: z.string(),
		KV_REST_API_READ_ONLY_TOKEN: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		OPENAI_SECRET_KEY: z.string(),
		PINECONE_ENVIRONMENT: z.string(),
		PINECONE_API_KEY: z.string(),
		QSTASH_TOKEN: z.string(),
		QSTASH_CURRENT_SIGNING_KEY: z.string(),
		QSTASH_NEXT_SIGNING_KEY: z.string(),
	},
	client: {
		NEXT_PUBLIC_URL: z.string().url(),
		NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
		NEXT_PUBLIC_BOOK_MEETING_URL: z.string().url(),
	},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		JWT_SECRET: process.env.JWT_SECRET,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		KV_URL: process.env.KV_URL,
		KV_REST_API_URL: process.env.KV_REST_API_URL,
		KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
		KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN,
		PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
		PINECONE_API_KEY: process.env.PINECONE_API_KEY,
		QSTASH_TOKEN: process.env.QSTASH_TOKEN,
		QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
		QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		OPENAI_SECRET_KEY: process.env.OPENAI_SECRET_KEY,
		NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
		NEXT_PUBLIC_BOOK_MEETING_URL: process.env.NEXT_PUBLIC_BOOK_MEETING_URL,
	},
})

export default env
