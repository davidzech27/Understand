const colors = require("./src/colors.cjs")

/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors,
			keyframes: {
				"scale-in": {
					"0%": {
						opacity: "0",
						transform: "rotateX(-30deg) scale(0.9)",
					},
					"100%": {
						opacity: "1",
						transform: "rotateX(0deg) scale(1)",
					},
				},
				"scale-out": {
					"0%": {
						opacity: "1",
						transform: "rotateX(0deg) scale(1)",
					},
					"100%": {
						opacity: "0",
						transform: "rotateX(-30deg) scale(0.9)",
					},
				},
			},
		},
	},
	// @ts-ignore
	plugins: [require("tailwindcss-animate")],
}

module.exports = config
