const tokenCost = {
	prompt: {
		"gpt-4": 0.03 / 1000,
		"gpt-3.5-turbo": 0.0015 / 1000,
		"gpt-3.5-turbo-16k": 0.003 / 1000,
		"text-embedding-ada-002": 0.0001 / 1000,
	},
	completion: {
		"gpt-4": 0.06 / 1000,
		"gpt-3.5-turbo": 0.002 / 1000,
		"gpt-3.5-turbo-16k": 0.004 / 1000,
	},
}

export default tokenCost
