import { createRouter } from "./trpc";
import profileRouter from "./modules/profile/router";
import coursesRouter from "./modules/courses/router";
import feedbackRouter from "./modules/feedback/router";

export const appRouter = createRouter({
	profile: profileRouter,
	courses: coursesRouter,
	feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
