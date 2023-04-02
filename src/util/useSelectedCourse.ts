import { useMemo } from "react";
import { useRouter } from "next/router";
import { api } from "~/lib/trpc";

export default ({ selectedCourseId }: { selectedCourseId: string }) => {
	const router = useRouter();

	const { data: coursesTeaching } = api.courses.teaching.useQuery();

	const { data: coursesEnrolled } = api.courses.enrolled.useQuery();

	const [selectedCourse, role] = useMemo(() => {
		if (!coursesEnrolled || !coursesTeaching)
			return [undefined, "unknown"] as const;

		const courseEnrolled = coursesEnrolled.find(
			(course) => course.id === selectedCourseId
		);

		if (courseEnrolled) return [courseEnrolled, "student"] as const;

		const courseTeaching = coursesTeaching.find(
			(course) => course.id === selectedCourseId
		);

		if (courseTeaching) return [courseTeaching, "teacher"] as const;

		return [undefined, "none"] as const;
	}, [coursesEnrolled, coursesTeaching, selectedCourseId]);

	return { selectedCourse, role };
};
