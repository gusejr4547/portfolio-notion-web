"use client";

import { Briefcase, House, MessageCircle } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: House },
  { href: "/projects", label: "프로젝트", icon: Briefcase },
  { href: "/chat", label: "챗", icon: MessageCircle },
] as const;

/** 홈은 정확히 "/"일 때만, 나머지는 하위 경로(/projects/[id] 등)에서도 활성으로 본다. */
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const subscribeNoop = () => () => {};

/** 서버 렌더와 하이드레이션 첫 렌더에서는 false, 그 뒤 클라이언트에서는 true. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/**
 * 화면 하단에 떠 있는 pill 형태의 내비게이션 독(홈/프로젝트/챗 이동 전용). 루트 레이아웃에서
 * 유지되므로 라우트를 이동해도 활성 표시(pill)가 미끄러지듯 따라간다.
 *
 * 활성 표시는 하이드레이션이 끝난 뒤에만 그린다. Vercel의 `/` 프리렌더 HTML에서는 서버가 본
 * pathname이 `/`가 아니라 활성 탭이 빠진 채 내려와, 클라이언트 첫 렌더와 어긋나 React #418이 났다.
 */
function BottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();

  return (
    <MotionConfig reducedMotion="user">
      <nav
        aria-label="주요 메뉴"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 print:hidden"
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/70 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const active = hydrated && isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative isolate flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                ) : null}
                <item.icon aria-hidden className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </MotionConfig>
  );
}

export { BottomNav };
