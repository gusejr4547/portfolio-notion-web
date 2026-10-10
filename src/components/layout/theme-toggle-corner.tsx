import { ModeToggle } from "@/components/mode-toggle";

/**
 * 페이지 우상단의 테마 전환 버튼. 화면에 고정하지 않고 페이지와 함께 스크롤되며(absolute),
 * 본문 컨테이너(max-w-5xl) 오른쪽 끝에 맞춘다. 자주 쓰지 않는 설정이라 항상 따라다닐 필요가 없다.
 */
function ThemeToggleCorner() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-5xl justify-end px-4 pt-4">
        <div className="pointer-events-auto">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}

export { ThemeToggleCorner };
