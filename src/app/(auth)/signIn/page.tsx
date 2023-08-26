import colors from "colors.cjs"
import GoogleSignInButton from "./GoogleSignInButton"

export const metadata = {
	title: "Sign in",
}

export const runtime = "edge"

export default function SignInPage() {
	return (
		<main
			style={{
				background: `linear-gradient(45deg, ${colors.primary} 25%, ${colors.secondary} 100%) border-box`,
			}}
			className="flex h-screen w-full p-6"
		>
			<div className="flex flex-1 flex-col">
				<div className="mx-auto mb-5 hidden w-fit text-center text-4xl font-bold leading-none tracking-tight text-white mobile:flex">
					Understand
				</div>

				<div className="flex h-full w-full flex-col space-y-12 rounded-lg border-[0.5px] border-border bg-white px-6 py-0 shadow-xl shadow-[#00000016] mobile:justify-between mobile:space-y-0 mobile:py-6 mobile:pt-10">
					<div className="flex-[0.875] mobile:hidden" />

					<h1 className="select-text text-center text-2xl font-semibold tracking-tight text-black/80 mobile:text-xl">
						Sign in with your Google account. Use your school Google
						account if Understand has been approved by your district
						(it probably hasn&apos;t yet).
					</h1>

					<GoogleSignInButton className="mx-auto" />

					<img
						src="/UnverifiedGoogle.png"
						alt="Screenshot of Google sign in screen"
						className="mx-auto w-1/2 rounded-lg border-[0.5px] border-border object-cover shadow-lg shadow-[#00000016] duration-[400ms] ease-out hover:scale-105 lg-mobile:w-full"
					/>

					<div className="rounded-lg border-[0.5px] border-border bg-surface px-4 py-3">
						<p className="select-text text-sm font-medium text-black/70">
							Because we&apos;re currently awaiting approval for
							Google verification, you may see this screen while
							signing in. Click &quot;Advanced&quot;, then
							&quot;Go to Understand (unsafe)&quot; to proceed.
						</p>
					</div>

					<div className="flex-1 mobile:hidden" />
				</div>
			</div>

			<div className="flex flex-1 flex-col mobile:hidden">
				<div className="flex-[0.875]" />

				<div className="w-full text-center text-7xl font-extrabold leading-none tracking-tight text-white">
					Understand
				</div>

				<div className="flex-1" />
			</div>
		</main>
	)
}
