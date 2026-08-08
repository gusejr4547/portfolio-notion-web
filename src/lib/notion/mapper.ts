import type { PageObjectResponse } from "@notionhq/client";

import { NOTION_PROPERTY, type Project, type ProjectPeriod } from "@/types/project";

type NotionProperty = PageObjectResponse["properties"][string];

/**
 * Notion 페이지(`PageObjectResponse`)를 이 앱의 `Project` 도메인 타입으로 변환한다.
 * Notion DB 스키마 변경(속성 삭제/타입 변경)에도 죽지 않도록 각 필드는 개별 방어 처리한다.
 * 유일한 예외는 title: 페이지의 최소 식별 정보이므로 없으면 매핑 자체를 실패시킨다.
 */
export function mapPageToProject(page: PageObjectResponse): Project {
  const title = extractTitle(page.properties[NOTION_PROPERTY.title]);
  if (!title) {
    throw new Error(`Notion page ${page.id} is missing a usable title`);
  }

  return {
    id: page.id,
    title,
    summary: extractRichText(page.properties[NOTION_PROPERTY.summary]),
    techStack: extractMultiSelect(page.properties[NOTION_PROPERTY.techStack]),
    githubUrl: extractUrl(page.properties[NOTION_PROPERTY.github]) ?? "",
    demoUrl: extractUrl(page.properties[NOTION_PROPERTY.demo]),
    thumbnailUrl: extractThumbnail(page.properties[NOTION_PROPERTY.thumbnail]),
    period: extractPeriod(page.properties[NOTION_PROPERTY.period]),
    featured: extractCheckbox(page.properties[NOTION_PROPERTY.featured]),
  };
}

function extractTitle(property: NotionProperty | undefined): string {
  if (!property || property.type !== "title") return "";
  return property.title.map((item) => item.plain_text).join("");
}

function extractRichText(property: NotionProperty | undefined): string {
  if (!property || property.type !== "rich_text") return "";
  return property.rich_text.map((item) => item.plain_text).join("");
}

function extractMultiSelect(property: NotionProperty | undefined): string[] {
  if (!property || property.type !== "multi_select") return [];
  return property.multi_select.map((option) => option.name);
}

function extractUrl(property: NotionProperty | undefined): string | undefined {
  if (!property || property.type !== "url") return undefined;
  return property.url ?? undefined;
}

function extractThumbnail(property: NotionProperty | undefined): string | undefined {
  if (!property || property.type !== "files") return undefined;
  const file = property.files[0];
  if (!file) return undefined;
  if (file.type === "external") return file.external.url;
  if (file.type === "file") return file.file.url;
  return undefined;
}

function extractPeriod(property: NotionProperty | undefined): ProjectPeriod | undefined {
  if (!property || property.type !== "date") return undefined;
  if (!property.date) return undefined;
  return {
    start: property.date.start,
    end: property.date.end ?? undefined,
  };
}

function extractCheckbox(property: NotionProperty | undefined): boolean {
  if (!property || property.type !== "checkbox") return false;
  return property.checkbox;
}
