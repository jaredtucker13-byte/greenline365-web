// SWF MCP Integration Layer — Browser, DB, Image Tools
// Provides tool execution for SWF worker agents
import { createClient } from "@supabase/supabase-js";

const MCP_PLAYWRIGHT_URL = process.env.MCP_PLAYWRIGHT_URL || "http://localhost:3001";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------- Types ----------
interface MCPToolCall { tool: string; args: Record<string, any>; }
interface MCPToolResult { success: boolean; data: any; error?: string; }

// ---------- Permission Gate ----------
const TOOL_PERMISSIONS: Record<string, string[]> = {
  browser: ["browser_navigate","browser_screenshot","browser_click","browser_type","browser_extract"],
  db_read: ["db_read","db_query"],
  db_write: ["db_write"],
  image_gen: ["image_generate"],
};

export async function executeToolCall(call: MCPToolCall, agentPermissions: string[]): Promise<MCPToolResult> {
  const allowed = agentPermissions.some((perm) => TOOL_PERMISSIONS[perm]?.includes(call.tool));
  if (!allowed) return { success: false, data: null, error: "Agent lacks permission for tool: " + call.tool };
  const handlers: Record<string, (args: any) => Promise<MCPToolResult>> = {
    browser_navigate: browserNavigate, browser_screenshot: browserScreenshot, browser_click: browserClick,
    browser_type: browserType, browser_extract: browserExtract,
    db_read: dbRead, db_write: dbWrite, db_query: dbQuery, image_generate: imageGenerate,
  };
  const handler = handlers[call.tool];
  if (!handler) return { success: false, data: null, error: "Unknown tool: " + call.tool };
  try { return await handler(call.args); } catch (e: any) { return { success: false, data: null, error: e.message }; }
}

// ---------- MCP Playwright Browser Tools ----------
async function mcpCall(method: string, params: any) {
  const res = await fetch(MCP_PLAYWRIGHT_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/" + method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function browserNavigate(args: { url: string }): Promise<MCPToolResult> {
  return { success: true, data: await mcpCall("browser_navigate", { url: args.url }) };
}
async function browserScreenshot(_args: any): Promise<MCPToolResult> {
  return { success: true, data: await mcpCall("browser_screenshot", {}) };
}
async function browserClick(args: { selector: string }): Promise<MCPToolResult> {
  return { success: true, data: await mcpCall("browser_click", { selector: args.selector }) };
}
async function browserType(args: { selector: string; text: string }): Promise<MCPToolResult> {
  return { success: true, data: await mcpCall("browser_type", args) };
}
async function browserExtract(args: { selector?: string }): Promise<MCPToolResult> {
  return { success: true, data: await mcpCall("browser_extract_text", { selector: args.selector || "body" }) };
}

// ---------- Database Tools ----------
async function dbRead(args: { table: string; filters?: Record<string, any>; limit?: number }): Promise<MCPToolResult> {
  let query = supabase.from(args.table).select("*");
  if (args.filters) for (const [key, val] of Object.entries(args.filters)) query = query.eq(key, val);
  if (args.limit) query = query.limit(args.limit);
  const { data, error } = await query;
  return error ? { success: false, data: null, error: error.message } : { success: true, data };
}
async function dbWrite(args: { table: string; record: Record<string, any> }): Promise<MCPToolResult> {
  const { data, error } = await supabase.from(args.table).upsert(args.record).select();
  return error ? { success: false, data: null, error: error.message } : { success: true, data };
}
async function dbQuery(args: { sql: string }): Promise<MCPToolResult> {
  const { data, error } = await supabase.rpc("execute_sql", { query: args.sql });
  return error ? { success: false, data: null, error: error.message } : { success: true, data };
}

// ---------- Image Generation ----------
async function imageGenerate(args: { prompt: string; size?: string }): Promise<MCPToolResult> {
  if (IS_PRODUCTION) {
    // Production: Nana Banana Pro 3
    const res = await fetch("/api/generate-nano-banana", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: args.prompt, size: args.size || "1024x1024" }),
    });
    const data = await res.json();
    return { success: true, data };
  } else {
    // Dev/Test: DALL-E 3
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return { success: false, data: null, error: "OPENAI_API_KEY not configured for dev image gen" };
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST", headers: { Authorization: "Bearer " + OPENAI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "dall-e-3", prompt: args.prompt, n: 1, size: args.size || "1024x1024" }),
    });
    const data = await res.json();
    return { success: true, data: data.data?.[0]?.url || data };
  }
}

// ---------- Export tool list for agent prompts ----------
export const AVAILABLE_TOOLS = [
  { name: "browser_navigate", description: "Navigate to a URL", permission: "browser" },
  { name: "browser_screenshot", description: "Take screenshot of current page", permission: "browser" },
  { name: "browser_click", description: "Click an element by CSS selector", permission: "browser" },
  { name: "browser_type", description: "Type text into an element", permission: "browser" },
  { name: "browser_extract", description: "Extract text from page or element", permission: "browser" },
  { name: "db_read", description: "Read records from a database table", permission: "db_read" },
  { name: "db_write", description: "Write/upsert records to a database table", permission: "db_write" },
  { name: "db_query", description: "Execute a custom SQL query", permission: "db_read" },
  { name: "image_generate", description: "Generate an image from a text prompt", permission: "image_gen" },
];
