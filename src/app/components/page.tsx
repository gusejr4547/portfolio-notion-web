import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export default function ComponentsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
        <p className="text-muted-foreground">
          스타터킷에 설치된 shadcn/ui 컴포넌트 예시입니다.
        </p>
      </div>

      <Section title="Button">
        <Button variant="default">Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </Section>

      <Section title="Badge">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </Section>

      <Section title="Avatar">
        <Avatar>
          <AvatarFallback>SK</AvatarFallback>
        </Avatar>
      </Section>

      <Section title="Input & Label">
        <div className="flex w-full max-w-xs flex-col gap-1.5">
          <Label htmlFor="example-email">Email</Label>
          <Input
            id="example-email"
            type="email"
            placeholder="you@example.com"
          />
        </div>
      </Section>

      <Section title="Separator">
        <div className="flex w-full max-w-xs flex-col gap-3">
          <p className="text-sm">위 콘텐츠</p>
          <Separator />
          <p className="text-sm">아래 콘텐츠</p>
        </div>
      </Section>

      <Section title="Card">
        <Card className="w-full max-w-xs">
          <CardHeader>
            <CardTitle>카드 제목</CardTitle>
            <CardDescription>카드 설명 텍스트입니다.</CardDescription>
          </CardHeader>
        </Card>
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            다이얼로그 열기
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>예시 다이얼로그</DialogTitle>
              <DialogDescription>
                Base UI Dialog 위에 구성된 shadcn/ui 컴포넌트입니다.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Tooltip">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            호버해보세요
          </TooltipTrigger>
          <TooltipContent>툴팁 내용입니다.</TooltipContent>
        </Tooltip>
      </Section>

      <Section title="Dropdown Menu">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            메뉴 열기
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>프로필</DropdownMenuItem>
            <DropdownMenuItem>설정</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>
    </div>
  );
}
