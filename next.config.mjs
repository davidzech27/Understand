import nextBundleAnalyzer from "@next/bundle-analyzer"

import "./env.mjs"

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	experimental: {
		serverActions: true,
	},
	webpack: (config) => {
		config.experiments = {
			asyncWebAssembly: true,
			layers: true,
		}

		return config
	},
}

export default nextBundleAnalyzer({ enabled: false })(config)
