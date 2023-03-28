import { createTRPCRouter } from "~/server/api/trpc";
import { coursesRouter } from "~/server/api/routers/courses";
import { profileRouter } from "./routers/profile";

export const appRouter = createTRPCRouter({
	courses: coursesRouter,
	profile: profileRouter,
});

export type AppRouter = typeof appRouter;
