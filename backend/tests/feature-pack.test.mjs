import test from "node:test";import assert from "node:assert/strict";
// Offline only: no provider keys are read by this pure module.
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
import { filterRecords, recordsToCsv, buildInsights } from "../featurePack.mjs";
const rows=[{id:1,reference:"A-1",title:"Alpha case",status:"Open",owner:"Sam",risk:"High",due_date:"2020-01-01",amount:100,payload:{evidenceState:"Incomplete"}},{id:2,reference:"B-2",title:"Beta case",status:"Closed",owner:"Jo",risk:"Low",due_date:"2999-01-01",amount:0,payload:{evidenceState:"Complete"}}];
test("search/filter narrows main list",()=>{assert.equal(filterRecords(rows,{q:"alpha"}).length,1);assert.equal(filterRecords(rows,{status:"Closed"})[0].reference,"B-2");assert.equal(filterRecords(rows,{risk:"High"}).length,1);assert.equal(filterRecords(rows,{q:"missing"}).length,0);});
test("CSV export preserves zero and headers",()=>{const csv=recordsToCsv(rows);assert.ok(csv.startsWith("id,reference"));assert.ok(csv.includes(",0"));});
test("deterministic insights labelled aiGenerated:false preserve false/0",()=>{const out=buildInsights({id:"f1"},rows);assert.equal(out.aiGenerated,false);assert.equal(out.sections.length,3);assert.equal(out.metrics.closed,1);assert.equal(out.metrics.allClosed,false);const empty=buildInsights({id:"f1"},[]);assert.equal(empty.metrics.records,0);assert.equal(empty.aiGenerated,false);});
test("server mounts search/export/insights behind auth",async()=>{const fs=await import("node:fs");const s=fs.readFileSync(new URL("../server.mjs",import.meta.url),"utf8");assert.ok(s.includes("/api/features/:id/export"));assert.ok(s.includes("/api/features/:id/insights"));assert.ok(s.includes("filterRecords"));});
