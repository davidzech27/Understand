const colors = require("./colors.cjs");

/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors,
		},
	},
	plugins: [],
};

module.exports = config;
