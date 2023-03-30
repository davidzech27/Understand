import { OpenAIApi, Configuration } from "openai";
import { env } from "~/env.mjs";

export const openai = new OpenAIApi(
	new Configuration({
		apiKey: env.OPENAI_SECRET_KEY,
	})
);
