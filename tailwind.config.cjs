/* eslint-disable @typescript-eslint/no-var-requires */
const colors = require("./colors.cjs")

/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors,
			gradientColorStopPositions: {
				80: "80%",
			},
			keyframes: {
				"scale-in": {
					"0%": {
						opacity: "0",
						transform: "scale(0.95)",
					},
					"100%": {
						opacity: "1",
						transform: "scale(1)",
					},
				},
				"scale-out": {
					"0%": {
						opacity: "1",
						transform: "scale(1)",
					},
					"100%": {
						opacity: "0",
						transform: "scale(0.95)",
					},
				},
				"highlight-fade-in": {
					"0%": {
						backgroundColor: "#00000000",
					},
					"100%": {
						backgroundColor: colors["surface-selected-hover"],
					},
				},
			},
		},
	},
	plugins: [],
}

module.exports = config
