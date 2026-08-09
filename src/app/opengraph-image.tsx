import { ImageResponse } from "next/og";

export const alt = "포트폴리오";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "포트폴리오";
const SUBTITLE = "Notion에 정리한 프로젝트를 웹에서 소개합니다.";

async function loadNotoSansKR(text: string, weight: 400 | 700) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`,
    )
  ).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error("Noto Sans KR 폰트 리소스를 찾지 못했습니다.");
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

export default async function Image() {
  const [titleFont, subtitleFont] = await Promise.all([
    loadNotoSansKR(TITLE, 700),
    loadNotoSansKR(SUBTITLE, 400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            fontFamily: "TitleFont",
            color: "#0a0a0a",
          }}
        >
          {TITLE}
        </div>
        <div
          style={{
            fontSize: 32,
            fontFamily: "SubtitleFont",
            color: "#71717a",
          }}
        >
          {SUBTITLE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "TitleFont", data: titleFont, weight: 700, style: "normal" },
        { name: "SubtitleFont", data: subtitleFont, weight: 400, style: "normal" },
      ],
    },
  );
}
