import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

// src/app/layout.tsx의 provider 중첩(ThemeProvider > TooltipProvider)을 그대로 미러링한다.
// 새 provider가 layout에 추가되면 여기도 함께 갱신한다.
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider enableSystem={false}>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}

function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// RTL의 나머지 API(screen, fireEvent 등)를 그대로 재노출하고, render만 provider가 감싸진
// 버전으로 덮어쓴다. 테스트에서는 항상 "@/test/utils"에서 import한다.
export * from "@testing-library/react";
export { renderWithProviders as render };
