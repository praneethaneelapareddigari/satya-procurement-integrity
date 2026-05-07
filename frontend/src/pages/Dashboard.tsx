import { useState } from "react";

type Verdict = "ELIGIBLE" | "NOT_ELIGIBLE" | "NEEDS_REVIEW" | "ESCALATED";
interface CriterionVerdict {
  criterion_code: string; criterion_description: string; verdict: Verdict;
  confidence: number; evidence_value: string | null; evidence_source: string | null;
  reasoning: string; missing_info: string | null; is_mandatory: boolean;
}
interface BidderResult {
  bidder_name: string; overall_verdict: Verdict; overall_confidence: number;
  criterion_verdicts: CriterionVerdict[];
}
interface RiskSignal { signal_type: string; severity: string; description: string; affected_bidders: string[]; }
interface EvalResult { tender_title: string; criteria: any[]; bidder_results: BidderResult[]; risk_signals: RiskSignal[]; }

const VM: Record<Verdict, { label: string; abbr: string; fg: string; bg: string; border: string }> = {
  ELIGIBLE:     { label: "ELIGIBLE",     abbr: "E", fg: "#1a3a1a", bg: "#f0f7f0", border: "#2d7a2d" },
  NOT_ELIGIBLE: { label: "NOT ELIGIBLE", abbr: "N", fg: "#3a1a1a", bg: "#fdf0f0", border: "#c0392b" },
  NEEDS_REVIEW: { label: "NEEDS REVIEW", abbr: "R", fg: "#3a2a0a", bg: "#fdf8ee", border: "#c8930a" },
  ESCALATED:    { label: "ESCALATED",    abbr: "!", fg: "#3a1f0a", bg: "#fdf3ec", border: "#d4600a" },
};

function VerdictChip({ v }: { v: Verdict }) {
  const m = VM[v];
  return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:500,border:`1px solid ${m.border}`,color:m.fg,background:m.bg }}>{m.abbr}</span>;
}
function OverallPill({ v }: { v: Verdict }) {
  const m = VM[v];
  return <span style={{ display:"inline-block",padding:"4px 12px",borderRadius:2,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:500,letterSpacing:"0.06em",border:`1px solid ${m.border}`,color:m.fg,background:m.bg }}>{m.label}</span>;
}
function ConfBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "#2d7a2d" : pct >= 60 ? "#c8930a" : "#c0392b";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ flex:1,height:3,background:"#e0ddd6",borderRadius:2,overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:2 }} />
      </div>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#555",minWidth:30,textAlign:"right" }}>{pct}%</span>
    </div>
  );
}
function Chakra({ size = 44 }: { size?: number }) {
  return <img src="/src/chakra.svg" width={size} height={size} alt="Ashoka Chakra" style={{ display:"block" }} />;
}

export default function Dashboard() {
  const [result, setResult] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"matrix"|"evidence"|"risks">("matrix");
  const [selBidder, setSelBidder] = useState<BidderResult | null>(null);
  const [toast, setToast] = useState(false);

  async function runDemo() {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluation/run-demo", { method: "POST" });
      const data = await res.json();
      setResult(data); setTab("matrix"); setSelBidder(null);
      setToast(true); setTimeout(() => setToast(false), 3500);
    } catch { alert("Backend connection failed. Make sure server is running on port 8000."); }
    finally { setLoading(false); }
  }

  const eligible = result?.bidder_results.filter(b => b.overall_verdict === "ELIGIBLE").length ?? 0;
  const rejected = result?.bidder_results.filter(b => b.overall_verdict === "NOT_ELIGIBLE").length ?? 0;
  const review   = result?.bidder_results.filter(b => ["NEEDS_REVIEW","ESCALATED"].includes(b.overall_verdict)).length ?? 0;
  const highRisks = result?.risk_signals.filter(r => r.severity === "HIGH") ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5f3ef;}
        .tab-btn{background:none;border:none;cursor:pointer;padding:14px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:#888;border-bottom:2px solid transparent;transition:all 0.15s;letter-spacing:0.02em;}
        .tab-btn:hover{color:#1a1a1a;}
        .tab-btn.active{color:#1a1a1a;border-bottom:2px solid #1a1a1a;}
        .row-tr{border-bottom:1px solid #f0ede8;cursor:pointer;transition:background 0.12s;}
        .row-tr:hover{background:#f7f6f2 !important;}
        .bidder-item{padding:12px 16px;border-left:2px solid transparent;cursor:pointer;transition:all 0.12s;}
        .bidder-item:hover{background:#f0ede8;}
        .bidder-item.sel{border-left-color:#1a1a1a;background:#eeecea;}
        .run-btn{background:#1a1a1a;color:#f5f3ef;border:none;padding:10px 24px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;letter-spacing:0.02em;transition:opacity 0.15s;}
        .run-btn:hover{opacity:0.82;}
        .run-btn:disabled{opacity:0.45;cursor:not-allowed;}
        .exp-btn{background:transparent;color:#1a1a1a;border:1px solid #c8c4bc;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:7px;transition:background 0.15s;}
        .exp-btn:hover{background:#eeecea;}
        .toast{position:fixed;top:20px;right:24px;background:#1a1a1a;color:#f5f3ef;padding:14px 20px;border-radius:2px;font-family:'DM Sans',sans-serif;font-size:13px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.18);z-index:999;animation:slideIn 0.25s ease;}
        @keyframes slideIn{from{transform:translateY(-10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        .feat-card{padding:24px 28px;background:#fff;border:1px solid #e0ddd6;border-radius:2px;display:flex;gap:16px;align-items:flex-start;}
        .ev-card{border:1px solid #e0ddd6;border-radius:2px;overflow:hidden;margin-bottom:10px;}
        .ev-head{padding:10px 16px;background:#f9f8f5;border-bottom:1px solid #e8e5de;display:flex;align-items:center;justify-content:space-between;}
        .ev-body{padding:14px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;}
        .fl{font-size:10px;font-weight:600;color:#999;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:5px;font-family:'DM Sans',sans-serif;}
        .fv{font-size:13px;color:#1a1a1a;line-height:1.5;font-family:'DM Sans',sans-serif;}
        .risk-card{border:1px solid #e0ddd6;border-radius:2px;padding:16px 20px;margin-bottom:10px;}
        .risk-card.HIGH{border-left:3px solid #c0392b;background:#fdf8f8;}
        .risk-card.MEDIUM{border-left:3px solid #c8930a;background:#fdf9f0;}
        .risk-card.LOW{border-left:3px solid #2d7a2d;background:#f5faf5;}
      `}</style>

      {toast && (
        <div className="toast">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4ade80" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div>
            <div style={{fontWeight:500}}>Evaluation complete</div>
            <div style={{fontSize:12,color:"#aaa",marginTop:2}}>{result?.bidder_results.length} bidders processed · {result?.risk_signals.length} risk signals</div>
          </div>
        </div>
      )}

      <div style={{minHeight:"100vh",background:"#f5f3ef",fontFamily:"'DM Sans',sans-serif"}}>
        {/* Header */}
        <header style={{background:"#f5f3ef",borderBottom:"1px solid #dedad2",padding:"0 40px"}}>
          <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:72}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <Chakra size={44} />
              <div>
                <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:22,fontWeight:700,color:"#1a1a1a",letterSpacing:"-0.01em",lineHeight:1.2}}>SATYA — सत्य</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>Procurement Integrity System · AI-Assisted Tender Evaluation</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <button className="run-btn" onClick={runDemo} disabled={loading}>{loading?"Processing…":result?"Re-run Evaluation":"Run Demo Evaluation"}</button>
              {result && <button className="exp-btn" onClick={()=>window.open("/api/audit/generate-demo-report")}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11h10M7 2v7M4 6l3 3 3-3" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Export RTI Report
              </button>}
            </div>
          </div>
        </header>

        <main style={{maxWidth:1280,margin:"0 auto",padding:"0 40px 60px"}}>
          {!result ? (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,paddingTop:80,alignItems:"start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
                  <Chakra size={18} />
                  <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",color:"#888",textTransform:"uppercase"}}>Operational · V1.0</span>
                </div>
                <h1 style={{fontFamily:"'Libre Baskerville',serif",fontSize:46,fontWeight:700,color:"#1a1a1a",lineHeight:1.1,letterSpacing:"-0.02em",marginBottom:24}}>
                  Eliminate<br/>procurement bias.<br/>Defend public trust.
                </h1>
                <p style={{fontSize:15,color:"#666",lineHeight:1.7,marginBottom:36,maxWidth:420}}>
                  SATYA (सत्य) evaluates bidder submissions against tender criteria, surfaces integrity risks across the bidder pool, and produces an RTI-ready audit trail — so every CRPF procurement decision can withstand public scrutiny.
                </p>
                <button className="run-btn" onClick={runDemo} disabled={loading} style={{fontSize:14,padding:"13px 32px"}}>{loading?"Processing…":"Run Demo Evaluation →"}</button>
                <div style={{marginTop:16,fontSize:12,color:"#aaa",fontFamily:"'IBM Plex Mono',monospace"}}>Demo data: CRPF/2026/CONST/0042 · 3 bidders · 5 criteria</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:1}}>
                {[
                  {num:"01",title:"Document Intelligence",desc:"Parses financial statements, GST certificates, ISO scans and project records — extracts evidence with source provenance for every claim."},
                  {num:"02",title:"Verdict Matrix",desc:"Scores each bidder against every criterion with confidence levels. Mandatory failures are flagged. Edge cases escalate to human officers automatically."},
                  {num:"03",title:"Integrity Signals",desc:"Cross-checks the bidder pool for collusion patterns: duplicate GSTINs, shared addresses, suspicious bid clustering — surfaced as actionable risks."},
                ].map(f => (
                  <div key={f.num} className="feat-card">
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div style={{fontWeight:600,fontSize:14,color:"#1a1a1a"}}>{f.title}</div>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#ccc"}}>{f.num}</span>
                      </div>
                      <div style={{fontSize:13,color:"#777",lineHeight:1.55}}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Tender bar */}
              <div style={{background:"#fff",border:"1px solid #e0ddd6",borderRadius:2,padding:"18px 24px",marginTop:24,display:"flex",alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#aaa",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>Active Tender</div>
                  <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:3}}>{result.tender_title}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#aaa"}}>Tender ID: CRPF/2026/CONST/0042</div>
                </div>
                <div style={{display:"flex",gap:0,borderLeft:"1px solid #e0ddd6"}}>
                  {[
                    {label:"Total Bidders",val:result.bidder_results.length,color:"#1a1a1a"},
                    {label:"Eligible",val:eligible,color:"#1a6b3c"},
                    {label:"Rejected",val:rejected,color:"#c0392b"},
                    {label:"Under Review",val:review,color:"#c8930a"},
                    {label:"Risk Flags",val:result.risk_signals.length,color:"#d4600a"},
                  ].map((s,i)=>(
                    <div key={s.label} style={{padding:"0 28px",textAlign:"center",borderRight:i<4?"1px solid #e0ddd6":"none"}}>
                      <div style={{fontSize:26,fontWeight:700,color:s.color,fontFamily:"'Libre Baskerville',serif",lineHeight:1}}>{s.val}</div>
                      <div style={{fontSize:10,color:"#aaa",marginTop:5,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert */}
              {highRisks.length > 0 && (
                <div style={{margin:"12px 0 0",background:"#fdf8ee",border:"1px solid #e0ddd6",borderLeft:"3px solid #c8930a",padding:"12px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,marginTop:1}}><path d="M8 2L14.9 14H1.1L8 2z" stroke="#c8930a" strokeWidth="1.2" strokeLinejoin="round"/><line x1="8" y1="7" x2="8" y2="10" stroke="#c8930a" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="12" r="0.6" fill="#c8930a"/></svg>
                  <div style={{flex:1}}>
                    <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"#c8930a",textTransform:"uppercase"}}>Integrity Alert</span>
                    <span style={{fontSize:13,color:"#3a2a0a",marginLeft:10}}>{highRisks[0].description}</span>
                  </div>
                  <button onClick={()=>setTab("risks")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#c8930a",fontWeight:500,whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"}}>View signals →</button>
                </div>
              )}

              {/* Tabs */}
              <div style={{borderBottom:"1px solid #e0ddd6",marginTop:24,display:"flex"}}>
                {[{id:"matrix",label:"Evaluation Matrix"},{id:"evidence",label:"Detailed Evidence"},{id:"risks",label:`Risk Signals (${result.risk_signals.length})`}].map(t=>(
                  <button key={t.id} className={`tab-btn${tab===t.id?" active":""}`} onClick={()=>setTab(t.id as any)}>{t.label}</button>
                ))}
              </div>

              {/* Matrix */}
              {tab==="matrix" && (
                <div style={{background:"#fff",border:"1px solid #e0ddd6",borderTop:"none",borderRadius:"0 0 2px 2px"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid #e0ddd6"}}>
                        <th style={{padding:"12px 20px",textAlign:"left",fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:"#aaa",textTransform:"uppercase",borderRight:"1px solid #f0ede8",minWidth:200}}>Bidder</th>
                        {result.criteria.map((c:any)=>(
                          <th key={c.code} style={{padding:"12px 16px",textAlign:"center",fontSize:10,fontWeight:600,color:"#aaa",textTransform:"uppercase",borderRight:"1px solid #f0ede8",minWidth:72}}>
                            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#555"}}>{c.code}{c.is_mandatory&&<span style={{color:"#c0392b"}}>*</span>}</div>
                            <div style={{fontSize:9,color:"#bbb",marginTop:2}}>{c.category}</div>
                          </th>
                        ))}
                        <th style={{padding:"12px 20px",textAlign:"center",fontSize:10,fontWeight:600,color:"#aaa",textTransform:"uppercase",borderRight:"1px solid #f0ede8",minWidth:130}}>Overall</th>
                        <th style={{padding:"12px 20px",textAlign:"left",fontSize:10,fontWeight:600,color:"#aaa",textTransform:"uppercase",minWidth:130}}>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.bidder_results.map((b,i)=>(
                        <tr key={b.bidder_name} className="row-tr" style={{background:i%2===0?"#fff":"#fdfcfa"}} onClick={()=>{setSelBidder(b);setTab("evidence");}}>
                          <td style={{padding:"14px 20px",borderRight:"1px solid #f0ede8"}}>
                            <div style={{fontWeight:600,color:"#1a1a1a",fontSize:14}}>{b.bidder_name}</div>
                            <div style={{fontSize:11,color:"#bbb",marginTop:2}}>Click to view evidence →</div>
                          </td>
                          {b.criterion_verdicts.map(cv=>(
                            <td key={cv.criterion_code} style={{padding:"14px 16px",textAlign:"center",borderRight:"1px solid #f0ede8"}}><VerdictChip v={cv.verdict as Verdict}/></td>
                          ))}
                          <td style={{padding:"14px 20px",textAlign:"center",borderRight:"1px solid #f0ede8"}}><OverallPill v={b.overall_verdict as Verdict}/></td>
                          <td style={{padding:"14px 20px"}}><ConfBar value={b.overall_confidence}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{padding:"10px 20px",borderTop:"1px solid #f0ede8",display:"flex",alignItems:"center",gap:20,background:"#fdfcfa"}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.08em",textTransform:"uppercase"}}>Legend:</span>
                    {Object.entries(VM).map(([k,m])=>(
                      <span key={k} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#777"}}>
                        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:"50%",fontSize:9,fontFamily:"'IBM Plex Mono',monospace",color:m.fg,background:m.bg,border:`1px solid ${m.border}`}}>{m.abbr}</span>
                        {m.abbr} · {m.label.charAt(0)+m.label.slice(1).toLowerCase()}
                      </span>
                    ))}
                    <span style={{marginLeft:"auto",fontSize:11,color:"#bbb"}}>* mandatory criterion</span>
                  </div>
                </div>
              )}

              {/* Evidence */}
              {tab==="evidence" && (
                <div style={{background:"#fff",border:"1px solid #e0ddd6",borderTop:"none",borderRadius:"0 0 2px 2px",display:"grid",gridTemplateColumns:"210px 1fr",minHeight:500}}>
                  <div style={{borderRight:"1px solid #e0ddd6"}}>
                    <div style={{padding:"14px 16px 8px",fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.1em",textTransform:"uppercase"}}>Select Bidder</div>
                    {result.bidder_results.map(b=>(
                      <div key={b.bidder_name} className={`bidder-item${selBidder?.bidder_name===b.bidder_name?" sel":""}`} onClick={()=>setSelBidder(b)}>
                        <div style={{fontWeight:600,fontSize:13,color:"#1a1a1a",marginBottom:6}}>{b.bidder_name}</div>
                        <OverallPill v={b.overall_verdict as Verdict}/>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"24px 28px"}}>
                    {!selBidder ? (
                      <div style={{color:"#bbb",fontSize:13,textAlign:"center",paddingTop:60}}>← Select a bidder to view detailed evidence</div>
                    ) : (
                      <>
                        <div style={{marginBottom:20,paddingBottom:18,borderBottom:"1px solid #f0ede8"}}>
                          <div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Bidder Evaluation Report</div>
                          <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:10}}>{selBidder.bidder_name}</div>
                          <div style={{display:"flex",alignItems:"center",gap:14}}>
                            <OverallPill v={selBidder.overall_verdict as Verdict}/>
                            <div style={{width:160}}><ConfBar value={selBidder.overall_confidence}/></div>
                            <span style={{fontSize:12,color:"#aaa"}}>Overall Confidence</span>
                          </div>
                        </div>
                        {selBidder.criterion_verdicts.map(cv=>{
                          const m=VM[cv.verdict as Verdict];
                          return (
                            <div key={cv.criterion_code} className="ev-card" style={{borderLeft:`3px solid ${m.border}`}}>
                              <div className="ev-head">
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:500,color:"#555"}}>{cv.criterion_code}</span>
                                  {cv.is_mandatory&&<span style={{fontSize:9,fontWeight:700,color:"#c0392b",letterSpacing:"0.08em"}}>MANDATORY</span>}
                                  <span style={{fontSize:13,color:"#555"}}>{cv.criterion_description}</span>
                                </div>
                                <OverallPill v={cv.verdict as Verdict}/>
                              </div>
                              <div className="ev-body">
                                <div>
                                  <div className="fl">Evidence Found</div>
                                  <div className="fv" style={{color:cv.evidence_value?"#1a1a1a":"#ccc",fontStyle:cv.evidence_value?"normal":"italic"}}>{cv.evidence_value||"Not found"}</div>
                                  {cv.evidence_source&&<div style={{fontSize:11,color:"#aaa",marginTop:4,fontFamily:"'IBM Plex Mono',monospace"}}>{cv.evidence_source}</div>}
                                </div>
                                <div>
                                  <div className="fl">AI Reasoning</div>
                                  <div className="fv" style={{color:"#555"}}>{cv.reasoning}</div>
                                </div>
                                <div>
                                  <div className="fl">Confidence</div>
                                  <ConfBar value={cv.confidence}/>
                                  {cv.missing_info&&<div style={{marginTop:10,padding:"7px 10px",background:"#fdf8ee",border:"1px solid #c8930a",borderRadius:2,fontSize:12,color:"#3a2a0a"}}><strong>Officer action:</strong> {cv.missing_info}</div>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Risks */}
              {tab==="risks" && (
                <div style={{background:"#fff",border:"1px solid #e0ddd6",borderTop:"none",borderRadius:"0 0 2px 2px",padding:"24px 28px"}}>
                  {result.risk_signals.length===0 ? (
                    <div style={{textAlign:"center",padding:60,color:"#2d7a2d",fontSize:14}}>No integrity risks detected.</div>
                  ) : result.risk_signals.map((r,i)=>{
                    const sc=r.severity==="HIGH"?{fg:"#3a1a1a",border:"#c0392b",badge:"#fdf0f0"}:r.severity==="MEDIUM"?{fg:"#3a2a0a",border:"#c8930a",badge:"#fdf8ee"}:{fg:"#1a3a1a",border:"#2d7a2d",badge:"#f0f7f0"};
                    return (
                      <div key={i} className={`risk-card ${r.severity}`}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div style={{fontWeight:600,fontSize:15,color:"#1a1a1a"}}>{r.signal_type.replace(/_/g," ")}</div>
                          <span style={{padding:"2px 8px",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:500,letterSpacing:"0.06em",borderRadius:2,border:`1px solid ${sc.border}`,color:sc.fg,background:sc.badge}}>{r.severity} RISK</span>
                        </div>
                        <p style={{fontSize:13,color:"#555",lineHeight:1.6,marginBottom:12}}>{r.description}</p>
                        <div style={{fontSize:12,color:"#aaa",display:"flex",alignItems:"center",gap:6}}>
                          Affected bidders:
                          {r.affected_bidders.map(b=>(
                            <span key={b} style={{padding:"2px 8px",background:"#f5f3ef",border:"1px solid #e0ddd6",borderRadius:2,color:"#555",fontSize:12}}>{b}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        <footer style={{borderTop:"1px solid #e0ddd6",padding:"16px 40px",background:"#f5f3ef"}}>
          <div style={{maxWidth:1280,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#aaa"}}>
            <div style={{display:"flex",gap:16}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace"}}>SATYA v1.0</span>
              <span>·</span>
              <span>AI verdicts are advisory. Final decisions rest with the procurement officer.</span>
            </div>
            <span style={{fontFamily:"'Libre Baskerville',serif",fontSize:13,color:"#888",fontStyle:"italic"}}>सत्यमेव जयते</span>
          </div>
        </footer>
      </div>
    </>
  );
}
