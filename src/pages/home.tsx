import { type NextPage } from "next";
import DefaultLayout from "~/components/layout/DefaultLayout";
import colors from "colors.cjs";
import { api } from "~/lib/api";

// todo - make page protected
const Home: NextPage = () => {
	return (
		<DefaultLayout>
			<div className="flex h-screen flex-col space-y-2.5 py-2.5 pr-3">
				<div className="flex h-full flex-col justify-between rounded-md bg-surface py-5 px-6">
					<span className="font-medium italic opacity-60">
						Overview page coming soon...
					</span>
				</div>
			</div>
		</DefaultLayout>
	);
};

export default Home;
