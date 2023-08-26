"use client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

import colors from "colors.cjs"

export default function Footer() {
	const router = useRouter()

	const pathname = usePathname()

	return (
		<footer
			style={{
				background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary} 100%) border-box`,
			}}
			className="p-8"
		>
			<div className="flex justify-between">
				{" "}
				<button
					onClick={() => {
						if (pathname === "/")
							window.scrollTo({ top: 0, behavior: "smooth" })
						else router.push("/")
					}}
					className="text-3xl font-extrabold tracking-tight text-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
				>
					Understand
				</button>
				<div className="flex items-center gap-4">
					<a
						href="https://www.linkedin.com/company/understandschool"
						target="_blank"
						rel="noreferrer"
					>
						<svg
							fill="#000000"
							version="1.1"
							id="Layer_1"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="-143 145 512 512"
							className="h-6 w-6 fill-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
						>
							<path
								d="M329,145h-432c-22.1,0-40,17.9-40,40v432c0,22.1,17.9,40,40,40h432c22.1,0,40-17.9,40-40V185C369,162.9,351.1,145,329,145z
	 M41.4,508.1H-8.5V348.4h49.9V508.1z M15.1,328.4h-0.4c-18.1,0-29.8-12.2-29.8-27.7c0-15.8,12.1-27.7,30.5-27.7
	c18.4,0,29.7,11.9,30.1,27.7C45.6,316.1,33.9,328.4,15.1,328.4z M241,508.1h-56.6v-82.6c0-21.6-8.8-36.4-28.3-36.4
	c-14.9,0-23.2,10-27,19.6c-1.4,3.4-1.2,8.2-1.2,13.1v86.3H71.8c0,0,0.7-146.4,0-159.7h56.1v25.1c3.3-11,21.2-26.6,49.8-26.6
	c35.5,0,63.3,23,63.3,72.4V508.1z"
							/>
						</svg>
					</a>

					<a
						href="mailto:support@understand.school"
						target="_blank"
						rel="noreferrer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
							className="h-6 w-6 fill-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
						>
							<path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
						</svg>
					</a>
				</div>
			</div>

			<div className="mt-2.5 flex flex-col gap-2.5">
				<Link
					href="/privacypolicy"
					className="w-fit font-bold leading-none tracking-tight text-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
				>
					Privacy Policy
				</Link>

				<Link
					href="/termsofservice"
					className="w-fit font-bold leading-none tracking-tight text-white transition duration-200 hover:opacity-75 focus-visible:opacity-75 active:opacity-75"
				>
					Terms of Service
				</Link>
			</div>
		</footer>
	)
}
