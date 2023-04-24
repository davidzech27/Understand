import { type NextPage } from "next";
import Head from "next/head";

const NotFound: NextPage = () => (
	<>
		<Head>
			<title>Page not found</title>

			<link rel="icon" href="/favicon.ico" />
		</Head>

		<div className="flex h-screen w-full flex-col items-center bg-gradient-to-tr from-primary to-secondary">
			<div className="flex-[0.875]" />

			<span className="cursor-default px-48 text-[5rem] font-semibold leading-none text-white">
				This link does not exist. If you think it should, please contact
				us.
			</span>

			<div className="flex-1" />
		</div>
	</>
);

export default NotFound;
