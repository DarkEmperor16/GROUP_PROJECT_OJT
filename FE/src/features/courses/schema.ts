import { z } from "zod";

export const courseStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createCourseSchema = z.object({
  courseCode: z
    .string()
    .min(1, { message: "Course code is required" })
    .max(16, { message: "Course code is too long" })
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: "Course code may only contain letters, numbers, - and _",
    }),
  courseName: z
    .string()
    .min(1, { message: "Course name is required" })
    .max(100, { message: "Course name is too long" }),
  description: z
    .string()
    .max(500, { message: "Description is too long" })
    .default(""),
  teacherId: z
    .string()
    .min(1, { message: "Teacher in charge is required" }),
  status: courseStatusSchema,
});

export const updateCourseSchema = createCourseSchema;

export type CreateCourseSchemaType = z.infer<typeof createCourseSchema>;
export type UpdateCourseSchemaType = z.infer<typeof updateCourseSchema>;
