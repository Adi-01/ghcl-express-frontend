import { z } from "zod";

const envSchema = z.object({
  BACKEND_URL: z.string().url().default("http://127.0.0.1:5000"),
  FRONTEND_SECRET_KEY: z
    .string()
    .min(1, "FRONTEND_SECRET_KEY is required for JWE session decryption."),
});

export const env = envSchema.parse({
  BACKEND_URL: process.env.BACKEND_URL || "http://127.0.0.1:5000",
  FRONTEND_SECRET_KEY: process.env.FRONTEND_SECRET_KEY,
});

