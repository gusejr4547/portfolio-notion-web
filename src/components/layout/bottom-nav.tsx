"use client";

import { Briefcase, House } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: House },
  { href: "/projects", label: "프로젝트", icon: Briefcase },
] as const;

/** 홈은 정확히 "/"일 때만, 나머지는 하위 경로(/projects/[id] 등)에서도 활성으로 본다. */
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * 화면 하단에 떠 있는 pill 형태의 내비게이션 독. 홈/프로젝트 이동과 테마 전환을 담당하며,
 * 루트 레이아웃에서 유지되므로 라우트를 이동해도 활성 표시(pill)가 미끄러지듯 따라간다.
 */
function BottomNav() {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <nav
        aria-label="주요 메뉴"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6"
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/70 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

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
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          {/* 독 안쪽 여백(p-1.5)만큼 더 띄워 메뉴가 독 테두리와 겹치지 않게 한다. */}
          <ModeToggle side="top" align="end" sideOffset={14} />
        </div>
      </nav>
    </MotionConfig>
  );
}

export { BottomNav };
