import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import FancyButton from "~/client/modules/shared/FancyButton";
import TextInput from "~/client/modules/shared/TextInput";
import { api } from "~/client/api";
import { event } from "~/client/modules/analytics/mixpanel";

// perhaps add extra content to fill awkward whitespace
const SignIn: NextPage = () => {
	api.profile.me.useQuery(undefined, {
		onSuccess: ({ email, name }) => {
			event.finishGoogleOAuth({ email, name });

			nameInput.length === 0 && setNameInput(name);
		},
	});

	const updateProfile = api.profile.update.useMutation().mutateAsync;

	const [nameInput, setNameInput] = useState("");

	const router = useRouter();

	const onGo = async () => {
		await updateProfile({
			name: nameInput,
		});

		router.push("/home");

		event.finishLanding({ name: nameInput });
	};

	return (
		<>
			<Head>
				<title>Understand</title>
				<meta
					name="description"
					content="Instant student feedback and teacher-centric insights platform"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex h-screen w-full justify-center bg-gradient-to-tr from-primary to-secondary">
				<div className="flex flex-[0.625] flex-col justify-center py-5 px-6">
					<div className="flex-[0.875]" />

					<div className="w-full text-center text-7xl font-bold leading-[1.05] tracking-tight text-white">
						One more question before you get started.
					</div>

					<div className="flex-1" />
				</div>

				<div className="flex-1 py-5 pr-6">
					<div className="flex h-full w-full flex-col items-center rounded-lg bg-white py-12 px-12 shadow-xl">
						<div className="flex-[0.875]" />

						<div className="text-3xl font-medium leading-none opacity-60">
							What name would you like to go by?
						</div>

						<div className="mt-6 mb-6 flex h-12 w-96 flex-col space-y-4">
							<TextInput
								value={nameInput}
								setValue={setNameInput}
								placeholder="Your name"
								bigText
								autofocus
							/>
						</div>

						<div className="h-20 w-96">
							<FancyButton
								onClick={onGo}
								disabled={nameInput.length === 0}
								bigText
							>
								Let&apos;s go
							</FancyButton>
						</div>

						<div className="flex-1" />
					</div>
				</div>
			</main>
		</>
	);
};

export default SignIn;
