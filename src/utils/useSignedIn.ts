import { createContext, useContext } from "react"

const signedInContext = createContext({
	signedIn: false,
	setSignedIn: (() => {}) as (signedIn: boolean) => void,
})

export const SignedInProvider = signedInContext.Provider

export function setSignedIn(signedIn: boolean) {
	document.cookie = `signedIn=${signedIn}`
}

export default function useSignedIn() {
	return useContext(signedInContext)
}
