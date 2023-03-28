import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import DefaultLayout from "~/components/layout/DefaultLayout";
import colors from "colors.cjs";
import { api } from "~/lib/api";

// todo - make page protected
const Home: NextPage = () => {
	return (
		<DefaultLayout
			routeName="home"
			children={({ profile, coursesTeaching }) => null}
		/>
	);
};

export default Home;
