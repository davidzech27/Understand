import { Highlight } from "@highlight-run/next";
import { H } from "@highlight-run/node";
import { env } from "~/env.mjs";
import authHandler from "~/server/modules/auth/apiRoute";

H.init({ projectID: env.NEXT_PUBLIC_HIGHLIGHT_PRODUCT_ID });

export default Highlight({ projectID: env.NEXT_PUBLIC_HIGHLIGHT_PRODUCT_ID })(
	authHandler
);
