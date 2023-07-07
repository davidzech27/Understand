import type { Config } from "drizzle-kit"
import "dotenv/config"
import { join } from "path"
import { z } from "zod"

export default {
	schema: join(__dirname, "schema.ts"),
	dbCredentials: {
		connectionString: z.string().parse(process.env.DATABASE_URL),
	},
	driver: "mysql2",
} satisfies Config
