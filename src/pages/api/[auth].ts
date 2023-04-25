import { Highlight } from "@highlight-run/next";
import { env } from "~/env.mjs";

import authHandler from "~/server/modules/auth/apiRoute";

export default Highlight({ projectID: env.NEXT_PUBLIC_HIGHLIGHT_PRODUCT_ID })(
	authHandler
);
