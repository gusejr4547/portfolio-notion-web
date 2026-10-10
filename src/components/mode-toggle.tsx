"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ModeToggleProps = {
  /** 메뉴가 열리는 방향. 하단 독처럼 화면 아래에 둘 때는 "top"으로 지정한다. */
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** 트리거와 메뉴 사이 간격(px). */
  sideOffset?: number;
};

function ModeToggle({
  side = "bottom",
  align = "end",
  sideOffset = 4,
}: ModeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon">
            <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">테마 전환</span>
          </Button>
        }
      />
      <DropdownMenuContent side={side} align={align} sideOffset={sideOffset}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ModeToggle };
