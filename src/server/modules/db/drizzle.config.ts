import type { Config } from "drizzle-kit";
import "dotenv/config";
import { join } from "path";

export default {
	schema: join(__dirname, "schema.ts"),
	connectionString: process.env.DATABASE_URL,
} satisfies Config;
