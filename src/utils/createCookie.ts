const createCookie = (
	name: string,
	options?: {
		httpOnly?: boolean
		expires?: Date
		sameSite?: "strict" | "lax" | "none"
		secure?: boolean
	}
) => ({
	serialize: (value: string) => {
		return `${name}=${btoa(value)}${
			options?.expires !== undefined
				? `; Expires=${options.expires.toUTCString()}`
				: ""
		}${options?.httpOnly ? "; HttpOnly" : ""}${
			options?.sameSite !== undefined
				? `; SameSite=${options.sameSite[0]?.toUpperCase()}${options.sameSite.slice(
						1
				  )}`
				: ""
		}${options?.secure ? "; Secure" : ""}; Path=/`
	},
	parse: (cookieHeader: string) => {
		const encoded = cookieHeader
			.split(";")
			.map((nameValuePair) => nameValuePair.trim().split("="))
			.find(([cookieName]) => cookieName === name)?.[1]

		if (encoded === undefined) return undefined

		return atob(encoded)
	},
})

export default createCookie
