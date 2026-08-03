"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center antialiased">
        <h1 className="text-2xl font-semibold tracking-tight">
          심각한 오류가 발생했습니다
        </h1>
        <p className="text-muted-foreground">
          애플리케이션을 불러오는 중 문제가 발생했습니다.
        </p>
        <Button onClick={reset}>다시 시도</Button>
      </body>
    </html>
  );
}
