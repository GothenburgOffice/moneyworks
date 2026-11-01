// A tool's presentation contract is independent of any particular translation key.
export type ToolContent = {
  category: string;
  title: string;
  description: string;
  context: string;
  detailTitle: string;
  items: readonly string[];
  note: string;
};

// Add only owner-approved tools. Status reflects actual local functionality.
export const toolCatalog = [
  { id: "fire", status: "available", href: "#fire-calculator" },
  { id: "crypto", status: "planned", href: undefined },
] as const satisfies readonly { id: string; status: "planned" | "available"; href?: string }[];

export type ToolId = (typeof toolCatalog)[number]["id"];

export function getTools(copy: Record<ToolId, ToolContent>) {
  return toolCatalog.map((tool) => ({ ...tool, content: copy[tool.id] }));
}
