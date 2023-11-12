"use server"
import { zact } from "zact/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const signOutAction = zact()(() => {
	cookies()
		.getAll()
		.forEach((cookie) => {
			cookies().delete(cookie.name)
		})

	return redirect("/")
})

export default signOutAction
