import type { Project } from "@/types/project";

/**
 * Task004(홈/목록/상세 UI)와 컴포넌트 유닛 테스트가 공유하는 더미 프로젝트 픽스처.
 * Notion 연동(Task006~) 전까지 UI 완성 및 테스트에 재사용한다.
 */
const mockProjects: Project[] = [
  {
    id: "mock-project-1",
    title: "Notion 포트폴리오 사이트",
    summary: "Notion 데이터베이스를 웹 포트폴리오로 보여주는 Next.js 프로젝트",
    techStack: ["Next.js", "TypeScript", "TailwindCSS"],
    githubUrl: "https://github.com/example/notion-portfolio",
    demoUrl: "https://notion-portfolio.example.com",
    thumbnailUrl: "https://picsum.photos/seed/mock-project-1/640/360",
    period: { start: "2026-01-05", end: "2026-03-20" },
    featured: true,
  },
  {
    id: "mock-project-2",
    title: "실시간 채팅 애플리케이션",
    summary: "WebSocket 기반 실시간 메시징 서비스",
    techStack: ["React", "Node.js", "Socket.IO"],
    githubUrl: "https://github.com/example/realtime-chat",
    demoUrl: "https://chat.example.com",
    thumbnailUrl: "https://picsum.photos/seed/mock-project-2/640/360",
    period: { start: "2026-04-01" },
    featured: true,
  },
  {
    id: "mock-project-3",
    title: "개인 가계부 관리 앱",
    summary: "수입/지출 내역을 시각화해 보여주는 가계부 서비스",
    techStack: ["React", "Chart.js", "Firebase"],
    githubUrl: "https://github.com/example/budget-manager",
    demoUrl: "https://budget.example.com",
    thumbnailUrl: "https://picsum.photos/seed/mock-project-3/640/360",
    period: { start: "2025-09-10", end: "2025-12-01" },
    featured: false,
  },
  {
    id: "mock-project-4",
    title: "오픈소스 CLI 도구",
    summary: "터미널에서 반복 작업을 자동화하는 CLI 유틸리티",
    techStack: ["Rust", "Clap"],
    githubUrl: "https://github.com/example/cli-tool",
    demoUrl: undefined,
    thumbnailUrl: "https://picsum.photos/seed/mock-project-4/640/360",
    period: { start: "2025-06-15", end: "2025-07-30" },
    featured: false,
  },
  {
    id: "mock-project-5",
    title: "레시피 공유 커뮤니티",
    summary: "사용자가 직접 레시피를 등록하고 공유하는 커뮤니티 플랫폼",
    techStack: ["Vue", "Express", "MongoDB"],
    githubUrl: "https://github.com/example/recipe-share",
    demoUrl: "https://recipe.example.com",
    thumbnailUrl: undefined,
    period: { start: "2025-03-01", end: "2025-05-20" },
    featured: false,
  },
  {
    id: "mock-project-6",
    title: "습관 트래커",
    summary: "매일의 습관 형성을 돕는 트래킹 애플리케이션",
    techStack: ["React Native", "TypeScript"],
    githubUrl: "https://github.com/example/habit-tracker",
    demoUrl: "https://habit.example.com",
    thumbnailUrl: "https://picsum.photos/seed/mock-project-6/640/360",
    period: undefined,
    featured: false,
  },
];

export { mockProjects };
