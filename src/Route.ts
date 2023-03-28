export type Route =
	| {
			routeName: "home";
	  }
	| {
			routeName: "course";
			courseId: string;
	  };
