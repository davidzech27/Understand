import { z } from "zod";
import { createTRPCRouter, authedProcedure } from "~/server/api/trpc";
import db from "~/db/db";
import { eq } from "drizzle-orm/expressions";

export const accountRouter = createTRPCRouter({});
