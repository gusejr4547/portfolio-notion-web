import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    title: "기술 스택",
    description:
      "Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, shadcn/ui(base-nova, Base UI 기반), next-themes, lucide-react.",
  },
  {
    title: "폴더 구조",
    description:
      "src/components/ui는 shadcn CLI가 관리하는 프리미티브, src/components/layout은 Header/Footer, src/components 루트는 ThemeProvider·ModeToggle 같은 앱 전역 컴포넌트, src/hooks는 커스텀 훅, src/lib는 유틸리티입니다.",
  },
  {
    title: "다크모드",
    description:
      "next-themes로 라이트 / 다크 / 시스템 3단 테마를 지원합니다. globals.css의 .dark 클래스 기반 테마 변수를 사용하며, 헤더의 ModeToggle에서 전환할 수 있습니다.",
  },
  {
    title: "컴포넌트 추가하기",
    description:
      "npx shadcn add <component-name> 명령으로 base-nova 스타일에 맞는 컴포넌트를 추가할 수 있습니다. 설치된 예시는 Components 페이지에서 확인하세요.",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Docs</h1>
        <p className="text-muted-foreground">
          이 스타터킷을 사용하기 위해 알아두면 좋은 핵심 내용입니다.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6">
          {sections.map((section, index) => (
            <div key={section.title} className="flex flex-col gap-4">
              {index > 0 && <Separator />}
              <CardHeader className="p-0">
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
