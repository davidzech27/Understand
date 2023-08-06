import nextBundleAnalyzer from "@next/bundle-analyzer"

import "./env.mjs"

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	experimental: {
		serverActions: true,
	},
}

export default nextBundleAnalyzer({ enabled: false })(config)
