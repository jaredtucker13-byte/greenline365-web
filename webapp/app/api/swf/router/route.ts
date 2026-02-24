// SWF Smart Router
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MODEL_MAP: Record<string, string> = { "opus_4.6": "anthropic/claude-opus-4.6", gpt_4o: "anthropic/claude-sonnet-4.6", haiku: "anthropic/claude-sonnet-4.6", perplexity: "perplexity/sonar-pro" };
const DEPT_KW: Record<string, string[]> = { executive:["strategy","plan","vision","priority","decision"], growth_sales:["lead","prospect","sales","outreach","pipeline","deal","revenue","funnel"], operations:["book","schedule","calendar","dispatch","logistics","meeting"], success:["support","ticket","customer","resolve","onboard","complaint","help"], dev_it:["code","deploy","test","fix","build","api","database","server","debug"], creative:["content","blog","social","seo","design","brand","copy","image","video","campaign","marketing"] };

export async function POST(req: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) return NextResponse.json({error:"OpenRouter API key not configured"},{status:500});
    const p = await req.json();
    if (p.table === "task_queue" && p.type === "INSERT") return handleNewTask(p.record);
    if (p.table === "task_queue" && p.type === "UPDATE" && p.record.status === "completed") return handleDone(p.record);
    if (p.table === "reasoning_traces" && p.type === "UPDATE" && p.record.status === "completed") { await log("worker_completed", p.record.task_id, { role: p.record.role_slug }); return NextResponse.json({ status: "logged" }); }
    if (p.table === "event_log" && p.record.event_type === "escalation") return handleEscalation(p.record);
    return NextResponse.json({ status: "ack" });
  } catch (e: any) { await log("system_error","unknown",{error:e.message}); return NextResponse.json({error:e.message},{status:500}); }
}

async function handleNewTask(task: any) {
  await supabase.from("task_queue").update({status:"in_progress"}).eq("id",task.id);
  await log("vibe_command",task.id,{command:task.vibe_command});
  const {data:roles} = await supabase.from("workforce_roles").select("*");
  const triagePrompt = buildTriage(task.vibe_command, roles||[]);
  const parsed = await callModel("opus_4.6", triagePrompt, "ceo");
  let intent: any;
  try { intent = JSON.parse(parsed.output); } catch { intent = kwTriage(task.vibe_command); }
  await supabase.from("task_queue").update({parsed_intent:intent}).eq("id",task.id);
  const results = (await Promise.allSettled(intent.sub_tasks.map((st:any) => spawnWorker(task.id, st, roles||[])))).filter((r:any)=>r.status==="fulfilled").map((r:any)=>r.value);
  await supabase.from("task_queue").update({worker_outputs:results}).eq("id",task.id);
  const final = await audit(task.id, task.vibe_command, intent, results);
  return NextResponse.json({status:"completed",task_id:task.id,output:final});
}

function buildTriage(cmd: string, roles: any[]) {
  const list = roles.map((r:any)=>`- ${r.role_slug} (${r.department}): ${r.display_name}`).join("\n");
  return `You are the CEO Orchestrator.\nWORKFORCE:\n${list}\nCOMMAND: "${cmd}"\nReturn JSON: {"departments":[],"roles":[],"action_type":"research|create|build|analyze|resolve","urgency":"critical|high|medium|low","requires_supervisor":true,"sub_tasks":[{"role_slug":"","instruction":"","tools_needed":[],"model_override":null}]}`;
}

function kwTriage(cmd: string) {
  const l = cmd.toLowerCase();
  const m: string[] = [];
  for (const [d,kw] of Object.entries(DEPT_KW)) if (kw.some(k=>l.includes(k))) m.push(d);
  if (!m.length) m.push("executive");
  return {departments:m,roles:[],action_type:"analyze",urgency:"medium",requires_supervisor:true,sub_tasks:m.map(d=>({role_slug:d+"_lead",instruction:cmd,tools_needed:["db_read"]}))};
}

async function spawnWorker(taskId: string, st: any, roles: any[]) {
  const role = roles.find((r:any)=>r.role_slug===st.role_slug);
  const tier = st.model_override||role?.model_tier||"gpt_4o";
  const tid = crypto.randomUUID();
  await supabase.from("reasoning_traces").insert({id:tid,task_id:taskId,role_slug:st.role_slug,department:role?.department||"executive",model_used:tier,input_prompt:st.instruction,status:"in_progress"});
  await log("worker_started",taskId,{role:st.role_slug,trace_id:tid});
  const t0 = Date.now();
  try {
    const r = await callModel(tier, (role?.system_prompt||"You are a helpful assistant.")+"\nTASK: "+st.instruction, st.role_slug);
    const ms = Date.now()-t0;
    await supabase.from("reasoning_traces").update({raw_output:r.output,status:"completed",confidence_score:0.85,tokens_in:r.tokens.input,tokens_out:r.tokens.output,latency_ms:ms,completed_at:new Date().toISOString()}).eq("id",tid);
    return {role_slug:st.role_slug,trace_id:tid,output:r.output,confidence:0.85,tool_calls:[],status:"completed",tokens_used:r.tokens,latency_ms:ms};
  } catch(e:any) {
    await supabase.from("reasoning_traces").update({status:"failed",raw_output:"ERROR: "+e.message,completed_at:new Date().toISOString()}).eq("id",tid);
    return {role_slug:st.role_slug,trace_id:tid,output:"FAILED: "+e.message,confidence:0,tool_calls:[],status:"failed",tokens_used:{input:0,output:0},latency_ms:Date.now()-t0};
  }
}

async function audit(taskId: string, cmd: string, intent: any, results: any[]) {
  const summary = results.map(r=>`--- ${r.role_slug} (${r.confidence}) ---\n${r.output}`).join("\n");
  const p = `SUPREME AUDITOR: Verify and synthesize.\nCOMMAND: "${cmd}"\nWORKERS:\n${summary}\nRespond JSON: {"final_synthesis":"","vetoed_items":[],"confidence":0.95,"audit_notes":"","recommended_actions":[]}`;
  const a = await callModel("opus_4.6", p, "supreme_auditor");
  let o: any;
  try { o = JSON.parse(a.output); } catch { o = {final_synthesis:a.output,vetoed_items:[],confidence:0.7,audit_notes:"Raw",recommended_actions:[]}; }
  await supabase.from("task_queue").update({final_output:o.final_synthesis,signed_off:true,signed_off_at:new Date().toISOString(),status:"signed_off",metadata:{audit:o,signed_by:"SIGNED_OFF_BY_OPUS_4.6"}}).eq("id",taskId);
  await log("audit_pass",taskId,{confidence:o.confidence,signed_by:"SIGNED_OFF_BY_OPUS_4.6"});
  await supabase.from("reasoning_traces").insert({task_id:taskId,role_slug:"supreme_auditor",department:"executive",model_used:"opus_4.6",input_prompt:p,raw_output:JSON.stringify(o),status:"signed_off",confidence_score:o.confidence,signed_off_by:"SIGNED_OFF_BY_OPUS_4.6",completed_at:new Date().toISOString()});
  return o.final_synthesis;
}

async function handleEscalation(ev: any) {
  const r = await callModel("opus_4.6","ESCALATION from "+ev.source_role+": "+JSON.stringify(ev.payload),"ceo");
  await supabase.from("reasoning_traces").insert({task_id:ev.task_id,role_slug:"ceo",department:"executive",model_used:"opus_4.6",input_prompt:"Escalation",raw_output:r.output,status:"completed",signed_off_by:"SIGNED_OFF_BY_OPUS_4.6",completed_at:new Date().toISOString()});
  return NextResponse.json({status:"resolved",output:r.output});
}

async function handleDone(rec: any) {
  const {data} = await supabase.from("reasoning_traces").select("status").eq("task_id",rec.id).neq("role_slug","supreme_auditor");
  if (data?.every((t:any)=>t.status==="completed"||t.status==="failed")) await log("audit_pass",rec.id,{message:"All workers complete"});
  return NextResponse.json({status:"noted"});
}

async function callModel(tier: string, prompt: string, caller: string) {
  const model = MODEL_MAP[tier]||MODEL_MAP["gpt_4o"];
  const res = await fetch(OPENROUTER_BASE+"/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+OPENROUTER_API_KEY,"Content-Type":"application/json","HTTP-Referer":"https://www.greenline365.com","X-Title":"SWF"},body:JSON.stringify({model,messages:[{role:"user",content:prompt}],temperature:tier==="opus_4.6"?0.3:0.7,max_tokens:tier==="opus_4.6"?8192:4096})});
  if (!res.ok) throw new Error("OpenRouter "+res.status+": "+(await res.text()));
  const d = await res.json();
  return {output:d.choices?.[0]?.message?.content||"",tokens:{input:d.usage?.prompt_tokens||0,output:d.usage?.completion_tokens||0}};
}

async function log(type: string, taskId: string, payload: any) { await supabase.from("event_log").insert({event_type:type,task_id:taskId,payload}); }
