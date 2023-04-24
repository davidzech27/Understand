import mixpanel from "mixpanel-browser";
import { env } from "~/env.mjs";

export const initMixpanel = () => mixpanel.init(env.NEXT_PUBLIC_MIXPANEL_TOKEN);

export const event = {
	startGoogleOAuth: () => {
		mixpanel.track("Start Google OAuth");
	},
	finishGoogleOAuth: ({ email, name }: { email: string; name: string }) => {
		mixpanel.identify(email);

		mixpanel.people.set({ name });

		mixpanel.track("Finish Google OAuth");
	},
	finishLanding: ({ name }: { name: string }) => {
		mixpanel.people.set({ name });

		mixpanel.track("Finish landing");
	},
	feedback: (metadata: {
		courseId: string;
		assignmentId: string;
		rawResponse: string;
	}) => {
		mixpanel.track("Feedback", metadata);
	},
	feedbackConfig: (metadata: {
		courseId: string;
		assignmentId: string;
		instructions: string;
	}) => {
		mixpanel.track("Feedback config", metadata);
	},
	feedbackDemo: (metadata: {
		courseId: string;
		assignmentId: string;
		rawFeedback: string;
	}) => {
		mixpanel.track("Feedback demo", metadata);
	},
};
