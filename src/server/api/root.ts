import { createTRPCRouter } from "~/server/api/trpc";
import { profileRouter } from "./routers/profile";
import { coursesRouter } from "~/server/api/routers/courses";
import { assignmentsRouter } from "./routers/assignments";
import { rosterRouter } from "./routers/roster";

export const appRouter = createTRPCRouter({
	profile: profileRouter,
	courses: coursesRouter,
	assignments: assignmentsRouter,
	roster: rosterRouter,
});

export type AppRouter = typeof appRouter;
