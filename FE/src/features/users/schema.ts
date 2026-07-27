import { z } from "zod";
import { userRoleSchema } from "@/features/auth/schema";

export const userStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: "Full name is required" })
    .max(100, { message: "Full name is too long" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  userCode: z
    .string()
    .min(1, { message: "User code is required" })
    .max(32, { message: "User code is too long" })
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: "User code may only contain letters, numbers, - and _",
    }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  role: userRoleSchema,
  status: userStatusSchema,
});

export const updateUserSchema = createUserSchema.omit({ password: true });

export type CreateUserSchemaType = z.infer<typeof createUserSchema>;
export type UpdateUserSchemaType = z.infer<typeof updateUserSchema>;
