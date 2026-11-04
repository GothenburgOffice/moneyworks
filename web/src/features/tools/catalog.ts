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
  { id: "fire", status: "available" },
  { id: "crypto", status: "planned" },
] as const satisfies readonly { id: string; status: "planned" | "available" }[];

export type ToolId = (typeof toolCatalog)[number]["id"];
export type AvailableToolId = Extract<(typeof toolCatalog)[number], { status: "available" }>["id"];

export const availableToolIds = toolCatalog
  .filter((tool) => tool.status === "available")
  .map((tool) => tool.id) as AvailableToolId[];

// Every tool has its own static page; only the locale prefix differs between languages.
export function toolPath(locale: string, id: AvailableToolId) {
  return `/${locale}/tools/${id}`;
}

export function getTools(copy: Record<ToolId, ToolContent>) {
  return toolCatalog.map((tool) => ({ ...tool, content: copy[tool.id] }));
}
