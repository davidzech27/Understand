import { dirname } from "path"
import { fileURLToPath } from "url"
// @ts-expect-error
import nextBuildId from "next-build-id"

import "./src/env.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	generateBuildId: () => nextBuildId({ dir: __dirname }),
	experimental: {
		serverActions: true,
		instrumentationHook: true,
	},
	productionBrowserSourceMaps: true,
}

export default config
