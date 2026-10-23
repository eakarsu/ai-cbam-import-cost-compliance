// Deterministic domain insights over this app's own feature_records.
// No provider call is made here; callers label results aiGenerated:false.
export function filterRecords(rows,{q="",status="",risk=""}={}){
  const needle=String(q).trim().toLowerCase();
  return rows.filter(r=>{
    if(status && r.status!==status) return false;
    if(risk && r.risk!==risk) return false;
    if(!needle) return true;
    const hay=[r.reference,r.title,r.status,r.owner,r.risk,JSON.stringify(r.payload||{})].join(" ").toLowerCase();
    return hay.includes(needle);
  });
}
export function recordsToCsv(rows){
  const cols=["id","reference","title","status","owner","risk","due_date","amount"];
  const esc=v=>{const s=v==null?"":String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  return [cols.join(","),...rows.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\n")+"\n";
}
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
export function buildInsights(feature,records){
  const rows=Array.isArray(records)?records:[];
  const totalAmount=rows.reduce((s,r)=>s+num(r.amount),0);
  const variance=rows.reduce((s,r)=>{const p=r.payload||{};const a=num(p["customsValue"]);const e=num(p["customsValue"]);return s+Math.max(0,Math.abs(a-e));},0);
  const highRisk=rows.filter(r=>["High","Critical"].includes(r.risk)).length;
  const incomplete=rows.filter(r=>{const e=r.payload?.evidenceState;return e!=null && e!=="Complete";}).length;
  const open=rows.filter(r=>!["Approved","Closed"].includes(r.status)).length;
  const closed=rows.filter(r=>r.status==="Closed").length;
  const overdue=rows.filter(r=>r.due_date && String(r.due_date).slice(0,10) < new Date().toISOString().slice(0,10) && !["Approved","Closed"].includes(r.status)).length;
  const top=[...rows].sort((a,b)=>num(b.amount)-num(a.amount))[0]||null;
  return {aiGenerated:false,source:"deterministic-fallback",featureId:feature.id,
    metrics:{records:rows.length,totalAmount,variance,highRisk,incompleteEvidence:incomplete,open,closed,overdue,allClosed:rows.length>0&&closed===rows.length,hasOverdue:overdue>0},
    sections:[
      {label:"Certificate cost exposure",value:variance,detail:rows.length?`Across ${rows.length} own record(s) totalling ${totalAmount}, the governed variance signal is ${variance}. Largest record: ${top?top.reference+" ("+num(top.amount)+")":"none"}.`:"No records yet; variance is 0."},
      {label:"Emissions evidence-gap triage",value:highRisk,detail:`${highRisk} high/critical-risk record(s) and ${incomplete} record(s) without complete evidence state require reviewer triage before approval.`},
      {label:"Declaration readiness queue",value:overdue,detail:`${open} open record(s), ${closed} closed, ${overdue} overdue. All closed: ${rows.length>0&&closed===rows.length}.`}
    ]};
}
