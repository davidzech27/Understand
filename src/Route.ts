export type Route =
	| {
			routeName: "home";
	  }
	| {
			routeName: "course";
			courseId: string;
	  }
	| {
			routeName: "assignment";
			courseId: string;
			assignmentId: string;
	  };
