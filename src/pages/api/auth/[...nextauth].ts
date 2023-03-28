import { type NextApiRequest, type NextApiResponse } from "next";
import NextAuth from "next-auth";
import { getAuthOptions } from "~/server/auth";

export default (req: NextApiRequest, res: NextApiResponse) =>
	NextAuth(getAuthOptions(req, res))(req, res);
