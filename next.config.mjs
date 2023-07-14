import "./env.mjs"

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	experimental: {
		serverActions: true,
	},
	productionBrowserSourceMaps: true,
}

export default config
