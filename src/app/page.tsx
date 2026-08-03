import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Dark Mode",
    description: "next-themes 기반 라이트 / 다크 / 시스템 테마 전환",
  },
  {
    title: "shadcn/ui + Base UI",
    description: "base-nova 스타일 컴포넌트가 Base UI 프리미티브 위에 구성",
  },
  {
    title: "Type-safe",
    description: "TypeScript, Tailwind CSS v4, Next.js 16 App Router",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-24 text-center">
      <Badge variant="secondary">Starter Kit</Badge>
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          빠르게 시작하는 Next.js 스타터킷
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Next.js, TypeScript, Tailwind CSS, shadcn/ui가 준비된 기반 위에서 바로
          개발을 시작하세요.
        </p>
      </div>
      <div className="grid w-full gap-4 text-left sm:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
