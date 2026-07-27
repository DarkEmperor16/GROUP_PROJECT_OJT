import { z } from "zod";

/** Reusable Zod rules — dùng chung cho mọi form auth. */
export const emailRule = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Invalid email address" })
  .transform((value) => value.toLowerCase());

export const passwordRule = z
  .string()
  .min(1, { message: "Password is required" })
  .min(6, { message: "Password must be at least 6 characters" })
  .max(128, { message: "Password is too long" })
  .refine((value) => !/\s/.test(value), {
    message: "Password cannot contain spaces",
  });
