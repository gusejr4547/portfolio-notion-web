import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    NOTION_API_KEY: z.string().min(1),
    NOTION_DATABASE_ID: z.string().min(1),
    // 선택 항목: 비어 있으면 홈이 프로필 없이 기본 히어로를 보여준다.
    NOTION_PROFILE_PAGE_ID: z.string().optional(),
    // 선택 항목: 비어 있으면 /api/chat이 503으로 "채팅 준비 중" 안내를 돌려준다.
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
    NOTION_PROFILE_PAGE_ID: process.env.NOTION_PROFILE_PAGE_ID,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
