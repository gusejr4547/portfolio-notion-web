import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

const navLinks = [
  { href: "/", label: "홈" },
  { href: "/projects", label: "프로젝트" },
];

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold">
          포트폴리오
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <ModeToggle />
      </div>
    </header>
  );
}

export { Header };
