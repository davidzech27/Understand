import nextBundleAnalyzer from "@next/bundle-analyzer"

import "./src/env.mjs"

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	experimental: {
		optimizeServerReact: true,
	},
	webpack: (config) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		config.experiments = {
			asyncWebAssembly: true,
			layers: true,
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return config
	},
}

export default nextBundleAnalyzer({ enabled: false })(config)
