// SWF Dashboard Intake — Receives Vibe Commands
// POST /api/swf/dashboard — Submit a vibe command
// GET /api/swf/dashboard — List recent tasks or get task by ID
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
function getServiceClient() { return createClient(supabaseUrl, supabaseServiceKey); }

export async function POST(req: NextRequest) {
  const { command, priority, initiated_by } = await req.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ error: "Missing 'command' field" }, { status: 400 });
  }
  const supabase = getServiceClient();
  const taskId = crypto.randomUUID();
  const { error } = await supabase.from("task_queue").insert({
    id: taskId,
    vibe_command: command,
    priority: priority || "medium",
    initiated_by: initiated_by || "dashboard",
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: "accepted", task_id: taskId, message: "Vibe command received. Task " + taskId + " is being processed." }, { status: 202 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const taskId = url.searchParams.get("task_id");
  const supabase = getServiceClient();
  if (taskId) {
    const { data, error } = await supabase.from("task_queue").select("*").eq("id", taskId).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }
  const { data, error } = await supabase.from("task_queue").select("id, vibe_command, status, priority, signed_off, created_at, updated_at").order("created_at", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}
