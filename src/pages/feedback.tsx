import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "~/components/layout/DefaultLayout";
import colors from "colors.cjs";
import { api } from "~/lib/api";

// todo - make page protected
const Feedback: NextPage = () => {
	return (
		<DefaultLayout>
			<div className="flex h-screen flex-col space-y-2.5 py-2.5 pr-3">
				<div className="flex h-full flex-col justify-between rounded-md bg-surface py-5 px-6">
					<span className="font-medium italic opacity-60">
						Feedback page coming soon...
					</span>
				</div>
			</div>
		</DefaultLayout>
	);
};

export default Feedback;
