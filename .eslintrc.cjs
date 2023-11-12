/** @type {import("eslint").Linter.Config} */
const config = {
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: true,
	},
	plugins: ["@typescript-eslint"],
	extends: [
		"next/core-web-vitals",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
	],
	rules: {
		"@typescript-eslint/array-type": "off",
		"@typescript-eslint/consistent-type-definitions": "off",
		"@typescript-eslint/consistent-type-imports": [
			"warn",
			{
				prefer: "type-imports",
				fixStyle: "inline-type-imports",
			},
		],
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{ argsIgnorePattern: "^_" },
		],
		"@typescript-eslint/no-misused-promises": [
			2,
			{
				checksVoidReturn: { attributes: false },
			},
		],
		"@next/next/no-img-element": "off",
	},
}

module.exports = config
