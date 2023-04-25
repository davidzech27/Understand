import { type NextPage } from "next";
import DefaultLayout from "~/client/modules/layout/DefaultLayout";

const Home: NextPage = () => {
	return (
		<DefaultLayout
			Component={() => (
				<div className="flex h-screen flex-col space-y-2.5 py-2.5 pr-3">
					<div className="flex h-full flex-col justify-between rounded-md border border-border bg-surface py-5 px-6 shadow-lg shadow-[#00000016]">
						<span className="font-medium italic opacity-60">
							Overview page coming soon...
						</span>
					</div>
				</div>
			)}
		/>
	);
};

export default Home;
