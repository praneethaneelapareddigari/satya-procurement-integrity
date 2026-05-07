import { useState } from "react";
type V = "ELIGIBLE"|"NOT_ELIGIBLE"|"NEEDS_REVIEW"|"ESCALATED";
const VM: Record<V,{l:string;a:string;fg:string;bg:string;bd:string}> = {
  ELIGIBLE:     {l:"ELIGIBLE",    a:"E",fg:"#1a3a1a",bg:"#f0f7f0",bd:"#2d7a2d"},
  NOT_ELIGIBLE: {l:"NOT ELIGIBLE",a:"N",fg:"#3a1a1a",bg:"#fdf0f0",bd:"#c0392b"},
  NEEDS_REVIEW: {l:"NEEDS REVIEW",a:"R",fg:"#3a2a0a",bg:"#fdf8ee",bd:"#c8930a"},
  ESCALATED:    {l:"ESCALATED",   a:"!",fg:"#3a1f0a",bg:"#fdf3ec",bd:"#d4600a"},
};
const Chip=({v}:{v:V})=>{const m=VM[v]||VM.NEEDS_REVIEW;return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:"50%",fontFamily:"monospace",fontSize:11,fontWeight:600,border:`1px solid ${m.bd}`,color:m.fg,background:m.bg}}>{m.a}</span>};
const Pill=({v}:{v:V})=>{const m=VM[v]||VM.NEEDS_REVIEW;return <span style={{display:"inline-block",padding:"4px 12px",borderRadius:2,fontFamily:"monospace",fontSize:11,fontWeight:600,letterSpacing:"0.05em",border:`1px solid ${m.bd}`,color:m.fg,background:m.bg}}>{m.l}</span>};
const Bar=({v}:{v:number})=>{const p=Math.round(v*100);const c=p>=85?"#2d7a2d":p>=60?"#c8930a":"#c0392b";return <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:3,background:"#e0ddd6",borderRadius:2}}><div style={{width:`${p}%`,height:"100%",background:c,borderRadius:2}}/></div><span style={{fontFamily:"monospace",fontSize:12,color:"#555",minWidth:28}}>{p}%</span></div>};
export default function Dashboard(){
  const [res,setRes]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState("matrix");
  const [sel,setSel]=useState<any>(null);
  const [toast,setToast]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadedTender,setUploadedTender]=useState<string|null>(null);
  async function run(){
    setLoading(true);
    try{const r=await fetch("/api/evaluation/run-demo",{method:"POST"});const d=await r.json();setRes(d);setTab("matrix");setSel(null);setToast(true);setTimeout(()=>setToast(false),3000);}
    catch{alert("Backend connection failed. Make sure server is running on port 8000.");}
    finally{setLoading(false);}
  }
  async function uploadTender(file: File){
    setUploading(true);
    try{
      const fd=new FormData();
      fd.append('file',file);
      const r=await fetch('/api/tender/upload',{method:'POST',body:fd});
      const d=await r.json();
      setUploadedTender(d.criteria?.tender_title||file.name);
      alert('Tender uploaded! Criteria extracted: '+d.criteria?.criteria?.length+' criteria found. Now click Run Demo Evaluation.');
    }catch{alert('Upload failed.');}
    finally{setUploading(false);}
  }
  const el=res?.evaluation_results?.filter((b:any)=>b.overall_verdict==="ELIGIBLE").length??0;
  const rj=res?.evaluation_results?.filter((b:any)=>b.overall_verdict==="NOT_ELIGIBLE").length??0;
  const rv=res?.evaluation_results?.filter((b:any)=>["NEEDS_REVIEW","ESCALATED"].includes(b.overall_verdict)).length??0;
  const hr=res?.risk_signals?.filter((r:any)=>r.severity==="HIGH")??[];const fixSignal=(r:any)=>({...r,affected_bidders:r.affected_bidders||r.bidders_involved||[]});
  return(<>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{background:#f5f3ef;font-family:'DM Sans',sans-serif;}.rtr{cursor:pointer;transition:background 0.12s;}.rtr:hover{background:#f0ede8!important;}.tbb{background:none;border:none;cursor:pointer;padding:12px 20px;font-size:13px;font-weight:500;color:#888;border-bottom:2px solid transparent;transition:all 0.15s;}.tbb:hover{color:#1a1a1a;}.tba{color:#1a1a1a!important;border-bottom:2px solid #1a1a1a!important;}.bi{padding:12px 16px;border-left:2px solid transparent;cursor:pointer;transition:all 0.12s;}.bi:hover{background:#f0ede8;}.bis{border-left-color:#1a1a1a!important;background:#eeecea!important;}`}</style>
    {toast&&<div style={{position:"fixed",top:20,right:24,background:"#1a1a1a",color:"#fff",padding:"12px 20px",borderRadius:2,fontSize:13,display:"flex",gap:10,alignItems:"center",zIndex:999}}><span style={{color:"#4ade80"}}>✓</span><div><div style={{fontWeight:500}}>Evaluation complete</div><div style={{fontSize:11,color:"#aaa",marginTop:1}}>{res?.evaluation_results?.length} bidders · {res?.risk_signals?.length} signals</div></div></div>}
    <div style={{minHeight:"100vh",background:"#f5f3ef"}}>
      <header style={{background:"#f5f3ef",borderBottom:"1px solid #dedad2",padding:"0 40px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:70}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <img src="/chakra.svg" width={42} height={42} alt="Ashoka Chakra"/>
            <div><div style={{fontFamily:"Georgia,serif",fontSize:21,fontWeight:700,color:"#1a1a1a",lineHeight:1.2}}>SATYA — सत्य</div><div style={{fontSize:11,color:"#888",marginTop:1}}>Procurement Integrity System · AI-Assisted Tender Evaluation</div></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={run} disabled={loading} style={{background:"#1a1a1a",color:"#fff",border:"none",padding:"10px 22px",fontSize:13,fontWeight:600,cursor:"pointer",opacity:loading?0.5:1}}>{loading?"Processing…":res?"Re-run Evaluation":"Run Demo Evaluation"}</button>{res&&<button onClick={()=>{setRes(null);setTab("matrix");setSel(null);}} style={{background:"transparent",color:"#1a1a1a",border:"1px solid #c8c4bc",padding:"10px 18px",fontSize:13,cursor:"pointer"}}>← New Evaluation</button>}
            {res&&<button onClick={()=>window.open("/api/audit/generate-demo-report")} style={{background:"transparent",color:"#1a1a1a",border:"1px solid #c8c4bc",padding:"10px 18px",fontSize:13,cursor:"pointer"}}>↓ Export RTI Report</button>}
            <label style={{background:"transparent",color:"#1a1a1a",border:"1px solid #c8c4bc",padding:"10px 18px",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              {uploading?"⏳ Uploading...":"↑ Upload Tender PDF"}
              <input type="file" accept=".pdf" style={{display:"none"}} onChange={e=>e.target.files&&uploadTender(e.target.files[0])} disabled={uploading}/>
            </label>
          </div>
        </div>
      </header>
      <main style={{maxWidth:1280,margin:"0 auto",padding:"0 40px 60px"}}>
        {!res?(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,paddingTop:72,alignItems:"start"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}><img src="/chakra.svg" width={16} height={16} alt=""/><span style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",color:"#999",textTransform:"uppercase"}}>Operational · V1.0</span></div>
            <h1 style={{fontFamily:"Georgia,serif",fontSize:44,fontWeight:700,color:"#1a1a1a",lineHeight:1.1,letterSpacing:"-0.02em",marginBottom:20}}>Eliminate<br/>procurement bias.<br/>Defend public trust.</h1>
            <p style={{fontSize:15,color:"#666",lineHeight:1.7,marginBottom:32,maxWidth:400}}>SATYA evaluates bidder submissions against tender criteria, surfaces integrity risks, and produces an RTI-ready audit trail.</p>
            <button onClick={run} disabled={loading} style={{background:"#1a1a1a",color:"#fff",border:"none",padding:"13px 30px",fontSize:14,fontWeight:600,cursor:"pointer"}}>{loading?"Processing…":"Run Demo Evaluation →"}</button>
            <div style={{marginTop:14,fontSize:12,color:"#bbb",fontFamily:"monospace"}}>Demo: CRPF/2026/CONST/0042 · 3 bidders · 5 criteria</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            {[{n:"01",t:"Document Intelligence",d:"Parses financial statements, GST certificates, ISO scans and project records."},{n:"02",t:"Verdict Matrix",d:"Scores each bidder against every criterion with confidence levels. Edge cases escalate automatically."},{n:"03",t:"Integrity Signals",d:"Detects duplicate GSTINs, shared addresses, and suspicious bid clustering."}].map(f=>(<div key={f.n} style={{padding:"22px 24px",background:"#fff",border:"1px solid #e0ddd6",display:"flex",justifyContent:"space-between",gap:16}}><div><div style={{fontWeight:600,fontSize:14,color:"#1a1a1a",marginBottom:6}}>{f.t}</div><div style={{fontSize:13,color:"#777",lineHeight:1.55}}>{f.d}</div></div><span style={{fontFamily:"monospace",fontSize:11,color:"#ddd",flexShrink:0}}>{f.n}</span></div>))}
          </div>
        </div>):(<>
          <div style={{background:"#fff",border:"1px solid #e0ddd6",padding:"16px 22px",marginTop:22,display:"flex",alignItems:"center",borderRadius:2}}>
            <div style={{flex:1}}><div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Active Tender</div><div style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:"#1a1a1a",marginBottom:2}}>{res.tender_title}</div><div style={{fontFamily:"monospace",fontSize:11,color:"#bbb"}}>Tender ID: CRPF/2026/CONST/0042</div></div>
            <div style={{display:"flex",borderLeft:"1px solid #e0ddd6"}}>
              {[{l:"Total Bidders",v:res.evaluation_results?.length,c:"#1a1a1a"},{l:"Eligible",v:el,c:"#1a6b3c"},{l:"Rejected",v:rj,c:"#c0392b"},{l:"Under Review",v:rv,c:"#c8930a"},{l:"Risk Flags",v:res.risk_signals?.length,c:"#d4600a"}].map((s,i)=>(<div key={s.l} style={{padding:"0 24px",textAlign:"center",borderRight:i<4?"1px solid #e0ddd6":"none"}}><div style={{fontSize:24,fontWeight:700,color:s.c,fontFamily:"Georgia,serif",lineHeight:1}}>{s.v}</div><div style={{fontSize:10,color:"#bbb",marginTop:4,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase"}}>{s.l}</div></div>))}
            </div>
          </div>
          {hr.length>0&&<div style={{marginTop:10,background:"#fdf8ee",borderLeft:"3px solid #c8930a",border:"1px solid #e8dfc8",padding:"11px 16px",display:"flex",alignItems:"flex-start",gap:10}}><span style={{color:"#c8930a"}}>⚠</span><div style={{flex:1}}><span style={{fontSize:10,fontWeight:700,color:"#c8930a",textTransform:"uppercase"}}>Integrity Alert</span><span style={{fontSize:13,color:"#3a2a0a",marginLeft:8}}>{hr[0].description}</span></div><button onClick={()=>setTab("risks")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#c8930a",fontWeight:500}}>View signals →</button></div>}
          <div style={{borderBottom:"1px solid #e0ddd6",marginTop:22,display:"flex"}}>
            {[{id:"matrix",l:"Evaluation Matrix"},{id:"evidence",l:"Detailed Evidence"},{id:"risks",l:`Risk Signals (${res.risk_signals?.length})`}].map(t=>(<button key={t.id} className={`tbb${tab===t.id?" tba":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>))}
          </div>
          {tab==="matrix"&&<div style={{background:"#fff",border:"1px solid #e0ddd6",borderTop:"none",overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#fdfcfa",borderBottom:"1px solid #e0ddd6"}}>
                <th style={{padding:"11px 18px",textAlign:"left",fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.08em",textTransform:"uppercase",borderRight:"1px solid #f0ede8",minWidth:180}}>Bidder</th>
                {res.criteria?.map((c:any)=>(<th key={c.code} style={{padding:"11px 14px",textAlign:"center",fontSize:10,fontWeight:600,color:"#bbb",textTransform:"uppercase",borderRight:"1px solid #f0ede8",minWidth:68}}><div style={{fontFamily:"monospace",fontSize:11,color:"#555"}}>{c.code}{c.is_mandatory&&<span style={{color:"#c0392b"}}>*</span>}</div><div style={{fontSize:9,color:"#ccc",marginTop:1}}>{c.category}</div></th>))}
                <th style={{padding:"11px 18px",textAlign:"center",fontSize:10,fontWeight:600,color:"#bbb",textTransform:"uppercase",borderRight:"1px solid #f0ede8",minWidth:120}}>Overall</th>
                <th style={{padding:"11px 18px",textAlign:"left",fontSize:10,fontWeight:600,color:"#bbb",textTransform:"uppercase",minWidth:120}}>Confidence</th>
              </tr></thead>
              <tbody>{res.evaluation_results?.map((b:any,i:number)=>(<tr key={b.bidder_name} className="rtr" style={{borderBottom:"1px solid #f0ede8",background:i%2===0?"#fff":"#fdfcfa"}} onClick={()=>{setSel(b);setTab("evidence");}}>
                <td style={{padding:"13px 18px",borderRight:"1px solid #f0ede8"}}><div style={{fontWeight:600,color:"#1a1a1a"}}>{b.bidder_name}</div><div style={{fontSize:11,color:"#ccc",marginTop:1}}>Click for evidence →</div></td>
                {b.criterion_verdicts.map((cv:any)=>(<td key={cv.criterion_code} style={{padding:"13px 14px",textAlign:"center",borderRight:"1px solid #f0ede8"}}><Chip v={cv.verdict}/></td>))}
                <td style={{padding:"13px 18px",textAlign:"center",borderRight:"1px solid #f0ede8"}}><Pill v={b.overall_verdict}/></td>
                <td style={{padding:"13px 18px"}}><Bar v={b.overall_confidence}/></td>
              </tr>))}</tbody>
            </table>
            <div style={{padding:"9px 18px",borderTop:"1px solid #f0ede8",background:"#fdfcfa",display:"flex",gap:18,alignItems:"center"}}>
              <span style={{fontSize:10,color:"#ccc",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Legend:</span>
              {Object.entries(VM).map(([k,m])=>(<span key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#777"}}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:"50%",fontSize:9,fontFamily:"monospace",color:m.fg,background:m.bg,border:`1px solid ${m.bd}`}}>{m.a}</span>{m.a} · {m.l.toLowerCase()}</span>))}
              <span style={{marginLeft:"auto",fontSize:11,color:"#ccc"}}>* mandatory</span>
            </div>
          </div>}
          {tab==="evidence"&&<div style={{background:"#fff",border:"1px solid #e0ddd6",borderTop:"none",display:"grid",gridTemplateColumns:"200px 1fr",minHeight:480}}>
            <div style={{borderRight:"1px solid #e0ddd6"}}>
              <div style={{padding:"12px 14px 6px",fontSize:10,fontWeight:600,color:"#ccc",letterSpacing:"0.1em",textTransform:"uppercase"}}>Select Bidder</div>
              {res.evaluation_results?.map((b:any)=>(<div key={b.bidder_name} className={`bi${sel?.bidder_name===b.bidder_name?" bis":""}`} onClick={()=>setSel(b)}><div style={{fontWeight:600,fontSize:13,color:"#1a1a1a",marginBottom:5}}>{b.bidder_name}</div><Pill v={b.overall_verdict}/></div>))}
            </div>
            <div style={{padding:"22px 26px"}}>
              {!sel?<div style={{color:"#ccc",fontSize:13,textAlign:"center",paddingTop:60}}>← Select a bidder to view evidence</div>:(<>
                <div style={{marginBottom:18,paddingBottom:16,borderBottom:"1px solid #f0ede8"}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#ccc",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>Bidder Evaluation Report</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:19,fontWeight:700,color:"#1a1a1a",marginBottom:10}}>{sel.bidder_name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}><Pill v={sel.overall_verdict}/><div style={{width:150}}><Bar v={sel.overall_confidence}/></div><span style={{fontSize:12,color:"#bbb"}}>Overall Confidence</span></div>
                </div>
                {sel.criterion_verdicts.map((cv:any)=>{const m=VM[cv.verdict as V]||VM.NEEDS_REVIEW;return(<div key={cv.criterion_code} style={{border:"1px solid #e0ddd6",borderLeft:`3px solid ${m.bd}`,marginBottom:10,overflow:"hidden",borderRadius:"0 2px 2px 0"}}>
                  <div style={{padding:"9px 14px",background:"#f9f8f5",borderBottom:"1px solid #e8e5de",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"monospace",fontSize:12,color:"#555"}}>{cv.criterion_code}</span>{cv.is_mandatory&&<span style={{fontSize:9,fontWeight:700,color:"#c0392b",letterSpacing:"0.06em"}}>MANDATORY</span>}<span style={{fontSize:13,color:"#666"}}>{cv.criterion_description}</span></div>
                    <Pill v={cv.verdict}/>
                  </div>
                  <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                    <div><div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>Evidence Found</div><div style={{fontSize:13,color:cv.evidence_value?"#1a1a1a":"#ccc",fontStyle:cv.evidence_value?"normal":"italic"}}>{cv.evidence_value||"Not found"}</div>{cv.evidence_source&&<div style={{fontSize:11,color:"#bbb",marginTop:3,fontFamily:"monospace"}}>{cv.evidence_source}</div>}</div>
                    <div><div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>AI Reasoning</div><div style={{fontSize:13,color:"#555",lineHeight:1.5}}>{cv.reasoning}</div></div>
                    <div><div style={{fontSize:10,fontWeight:600,color:"#bbb",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>Confidence</div><Bar v={cv.confidence}/>{cv.missing_info&&<div style={{marginTop:8,padding:"6px 9px",background:"#fdf8ee",border:"1px solid #c8930a",borderRadius:2,fontSize:12,color:"#3a2a0a"}}><strong>Action:</strong> {cv.missing_info}</div>}</div>
                  </div>
                </div>);})}
              </>)}
            </div>
          </div>}
          {tab==="risks"&&<div style={{background:"#fff",border:"1px solid #e0ddd6",borderTop:"none",padding:"22px 26px"}}>
            {res.risk_signals?.length===0?<div style={{textAlign:"center",padding:60,color:"#2d7a2d",fontSize:14}}>No integrity risks detected.</div>:res.risk_signals?.map((r:any,i:number)=>{
              const sc=r.severity==="HIGH"?{fg:"#3a1a1a",bd:"#c0392b",bg:"#fdf8f8"}:r.severity==="MEDIUM"?{fg:"#3a2a0a",bd:"#c8930a",bg:"#fdf9f0"}:{fg:"#1a3a1a",bd:"#2d7a2d",bg:"#f5faf5"};
              return(<div key={i} style={{border:`1px solid ${sc.bd}`,borderLeft:`3px solid ${sc.bd}`,background:sc.bg,padding:"14px 18px",marginBottom:10,borderRadius:"0 2px 2px 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontWeight:600,fontSize:14,color:"#1a1a1a"}}>{r.signal_type.replace(/_/g," ")}</div><span style={{padding:"2px 8px",fontFamily:"monospace",fontSize:10,fontWeight:500,borderRadius:2,border:`1px solid ${sc.bd}`,color:sc.fg,background:"#fff"}}>{r.severity} RISK</span></div>
                <p style={{fontSize:13,color:"#555",lineHeight:1.6,marginBottom:10}}>{r.description}</p>
                <div style={{fontSize:12,color:"#bbb",display:"flex",alignItems:"center",gap:6}}>Affected: {(r.affected_bidders||r.bidders_involved||[]).map((b:string)=>(<span key={b} style={{padding:"2px 8px",background:"#f5f3ef",border:"1px solid #e0ddd6",borderRadius:2,color:"#555",fontSize:12,marginLeft:4}}>{b}</span>))}</div>
              </div>);
            })}
          </div>}
        </>)}
      </main>
      <footer style={{borderTop:"1px solid #e0ddd6",padding:"14px 40px",background:"#f5f3ef",marginTop:40}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#bbb"}}>
          <div style={{display:"flex",gap:14}}><span style={{fontFamily:"monospace"}}>SATYA v1.0</span><span>·</span><span>AI verdicts are advisory. Final decisions rest with the procurement officer.</span></div>
          <span style={{fontFamily:"Georgia,serif",fontSize:13,color:"#888",fontStyle:"italic"}}>सत्यमेव जयते</span>
        </div>
      </footer>
    </div>
  </>);
}