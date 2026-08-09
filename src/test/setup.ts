import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { ImageProps } from "next/image";

// 각 테스트 후 렌더된 DOM을 정리해 테스트 간 누수를 막는다.
afterEach(() => {
  cleanup();
});

// next-themes(ThemeProvider)가 시스템 테마를 감지할 때 matchMedia를 사용하는데,
// jsdom에는 구현되어 있지 않다. 최소 스텁으로 대체한다.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// next/image의 실제 로더는 src를 "/_next/image?url=...&w=...&q=..."로 재작성해
// 기존 테스트의 정확한 src 단언을 깨뜨리고, next.config.ts에 등록되지 않은 픽스처
// 도메인에 대한 설정 검증이 테스트 환경에서 실행될 수 있다. 실제로 쓰는 DOM prop만
// 통과시킨 순수 <img>로 치환해 기존 단언을 그대로 유지한다.
vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, sizes, className }: ImageProps) =>
    React.createElement("img", { src, alt, width, height, sizes, className }),
}));
