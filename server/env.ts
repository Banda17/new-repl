import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    GOOGLE_SHEETS_CREDENTIALS: z.string().min(1),
    ACCESS_DB_PATH: z.string().optional(),
    DRIVE_FILE_ID: z.string().optional(),
  },
  runtimeEnv: process.env,
});
