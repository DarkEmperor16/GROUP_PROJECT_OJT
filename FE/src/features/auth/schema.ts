import { z } from "zod";
import { emailRule, passwordRule } from "@/utils/rules";

export const loginSchema = z.object({
  email: emailRule,
  password: passwordRule,
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
