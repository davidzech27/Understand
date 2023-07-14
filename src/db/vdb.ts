import { PineconeClient } from "@pinecone-database/pinecone"

import env from "env.mjs"

const pinecone = new PineconeClient()

const vdbPromise = pinecone
	.init({
		environment: env.PINECONE_ENVIRONMENT,
		apiKey: env.PINECONE_API_KEY,
	})
	.then(() => pinecone.Index("understand"))

export default vdbPromise
