/* eslint-disable @typescript-eslint/no-var-requires */
const colors = require("./colors.cjs")

/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors,
			screens: {
				"sm-mobile": { max: "375px" },
				"lg-mobile": { min: "376px", max: "480px" },
				mobile: { max: "480px" },
				tablet: { min: "481px", max: "1024px" },
				desktop: { min: "1440px" },
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
