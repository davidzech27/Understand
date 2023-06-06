// @ts-expect-error
const nextBuildId = require("next-build-id")

import "./src/env.mjs"

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
