import type { CodeBlockObjectResponse } from "@notionhq/client";

function CodeBlock({ block }: { block: CodeBlockObjectResponse }) {
  const code = block.code.rich_text.map((item) => item.plain_text).join("");

  return (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4">
      <code className="font-mono text-sm">{code}</code>
    </pre>
  );
}

export { CodeBlock };
