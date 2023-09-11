/** @type {import("prettier").Config} */
const config = {
	plugins: [require.resolve("prettier-plugin-tailwindcss")],
	tabWidth: 4,
	useTabs: true,
	semi: false,
}

module.exports = config
