import { describe, expect, it } from "vitest";

import { richTextAnnotationSamples, richTextItem } from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { RichText } from "./rich-text";

describe("RichText", () => {
  it("bold 어노테이션이 있으면 font-bold 클래스로 렌더된다", () => {
    render(<RichText richText={[richTextItem("굵게", { bold: true })]} />);

    expect(screen.getByText("굵게")).toHaveClass("font-bold");
  });

  it("italic 어노테이션이 있으면 italic 클래스로 렌더된다", () => {
    render(<RichText richText={[richTextItem("기울임", { italic: true })]} />);

    expect(screen.getByText("기울임")).toHaveClass("italic");
  });

  it("strikethrough 어노테이션이 있으면 line-through 클래스로 렌더된다", () => {
    render(<RichText richText={[richTextItem("취소선", { strikethrough: true })]} />);

    expect(screen.getByText("취소선")).toHaveClass("line-through");
  });

  it("code 어노테이션이 있으면 코드 스타일 클래스로 렌더된다", () => {
    render(<RichText richText={[richTextItem("코드", { code: true })]} />);

    expect(screen.getByText("코드")).toHaveClass("font-mono");
  });

  it("여러 어노테이션이 조합되면 각 클래스가 모두 적용된다", () => {
    render(
      <RichText
        richText={[richTextItem("굵고 기울임", { bold: true, italic: true })]}
      />,
    );

    const element = screen.getByText("굵고 기울임");
    expect(element).toHaveClass("font-bold");
    expect(element).toHaveClass("italic");
  });

  it("href가 있으면 새 탭 속성을 가진 링크로 렌더된다", () => {
    render(
      <RichText
        richText={[richTextItem("링크", { href: "https://example.com" })]}
      />,
    );

    const link = screen.getByRole("link", { name: "링크" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("빈 배열이 주어지면 아무것도 렌더되지 않는다", () => {
    render(
      <div data-testid="rich-text-root">
        <RichText richText={[]} />
      </div>,
    );

    expect(screen.getByTestId("rich-text-root")).toBeEmptyDOMElement();
  });

  it("픽스처의 모든 어노테이션 조합 샘플이 각각 텍스트로 렌더된다", () => {
    render(<RichText richText={richTextAnnotationSamples} />);

    for (const item of richTextAnnotationSamples) {
      expect(screen.getByText(item.plain_text)).toBeInTheDocument();
    }
  });
});
