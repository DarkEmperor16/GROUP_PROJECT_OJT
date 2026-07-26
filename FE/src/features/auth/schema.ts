import { z } from "zod";
import { emailRule, passwordRule, userRoleRule } from "@/utils/rules";

export const userRoleSchema = userRoleRule;

export const loginSchema = z.object({
  email: emailRule,
  password: passwordRule,
  role: userRoleSchema,
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
