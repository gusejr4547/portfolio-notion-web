import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
