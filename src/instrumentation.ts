import { env } from "./env.mjs"

export const register = async () => {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { registerHighlight } = await import("@highlight-run/next")

		registerHighlight({
			projectID: env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID,
			tracingOrigins: true,
			networkRecording: {
				enabled: true,
				recordHeadersAndBody: true,
				urlBlocklist: [],
			},
		})
	}
}
