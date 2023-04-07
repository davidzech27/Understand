import { createRouter } from "./trpc";
import profileRouter from "./modules/profile/router";
import coursesRouter from "./modules/courses/router";
import assignmentsRouter from "./modules/assignments/router";
import rosterRouter from "./modules/roster/router";
import feedbackRouter from "./modules/feedback/router";

export const appRouter = createRouter({
	profile: profileRouter,
	courses: coursesRouter,
	assignments: assignmentsRouter,
	roster: rosterRouter,
	feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
