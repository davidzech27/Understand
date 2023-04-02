import { z } from "zod";

export const courseSchema = z.object({
	id: z.string(),
	name: z.string(),
	section: z.string().optional(),
});

export const courseListSchema = z.array(courseSchema);

export const profileSchema = z.object({
	email: z.string(),
	name: z.string(),
	photo: z.string(),
});

export const studentSchema = z.object({
	email: z.string(),
	name: z.string(),
	photo: z.string(),
});

export const teacherSchema = z.object({
	email: z.string().optional(),
	name: z.string(),
	photo: z.string(),
});

export const rosterSchema = z.object({
	teachers: z.array(teacherSchema),
	students: z.array(studentSchema),
});

export const materialSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("driveFile"),
		driveFile: z.object({
			id: z.string(),
			title: z.string(),
			url: z.string().url(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("youtubeVideo"),
		youtubeVideo: z.object({
			id: z.string(),
			title: z.string(),
			url: z.string().url(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("link"),
		link: z.object({
			url: z.string().url(),
			title: z.string().optional(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
	z.object({
		type: z.literal("form"),
		form: z.object({
			formUrl: z.string().url(),
			responseUrl: z.string().url().optional(),
			title: z.string(),
			thumbnailUrl: z.string().url().optional(),
		}),
	}),
]);

export const assignmentSchema = z.intersection(
	// assuming that DELETED assignments are not being fetched, or parse will throw
	z.object({
		id: z.string(),
		title: z.string(),
		description: z.string().optional(),
		materials: z.array(materialSchema),
		dueDate: z.date().optional(),
		workType: z.literal("ASSIGNMENT"), // potentially support SHORT_ANSWER_QUESTION and MULTIPLE_CHOICE_QUESTION in the future
	}),
	z.discriminatedUnion("state", [
		z.object({
			state: z.literal("PUBLISHED"),
			url: z.string().url(),
		}),
		z.object({
			state: z.literal("DRAFT"),
		}),
	])
);

export const assignmentListSchema = z.array(assignmentSchema);
