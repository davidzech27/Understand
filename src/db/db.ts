import { drizzle } from "drizzle-orm/planetscale-serverless"
import { connect } from "@planetscale/database"

import env from "env.mjs"

const connection = connect({
	url: env.DATABASE_URL,
})

const db = drizzle(connection)

export default db
