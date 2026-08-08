import { unstable_cache } from "next/cache";

import { env } from "@/env";

import { notion } from "./client";
import { classifyNotionError } from "./errors";

async function resolveDataSourceId(): Promise<string> {
  try {
    const database = await notion.databases.retrieve({
      database_id: env.NOTION_DATABASE_ID,
    });
    const dataSource =
      "data_sources" in database ? database.data_sources[0] : undefined;

    if (!dataSource) {
      throw new Error(
        `Notion database ${env.NOTION_DATABASE_ID} has no data sources`,
      );
    }

    return dataSource.id;
  } catch (error) {
    throw classifyNotionError(error);
  }
}

export const getDataSourceId = unstable_cache(
  resolveDataSourceId,
  ["notion-data-source-id"],
  { tags: ["notion-schema"], revalidate: 86400 },
);
