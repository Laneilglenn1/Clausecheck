import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#07090F", surface: "#0F1420", surface2: "#161C2E",
  border: "#1C2640", accent: "#10B981", danger: "#F04F58",
  warn: "#F5A623", ok: "#10B981", text: "#EEF2FF",
  muted: "#4A5578", subtle: "#7B88B0", purple: "#6366F1",
};

async function callClaude(messages, system, maxTokens) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, max_tokens: maxTokens || 2048 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(typeof data.error === "string" ? data.error : data.error.message);
  return (data.content || []).map(b => b.text || "").join("");
}

function parseJSON(raw) {
  try { return JSON.parse(raw.trim()); } catch (_) {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (_) {} }
  const s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(s); } catch (_) {}
  throw new Error("Could not parse AI response");
}

function riskColor(r) {
  if (r === "HIGH") return C.danger;
  if (r === "MEDIUM") return C.warn;
  return C.ok;
}

function RiskMeter({ score }) {
  const color = score >= 7 ? C.danger : score >= 4 ? C.warn : C.ok;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Risk Score</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div style={{ height: 7, background: C.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(score / 10) * 100}%`, background: `linear-gradient(90deg,${C.ok},${color})`, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function Pill({ label, value, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99, background: color + "18", border: `1px solid ${color}44`, fontSize: 12, fontWeight: 600, color, marginRight: 7, marginBottom: 7 }}>
      <span style={{ opacity: 0.65 }}>{label}</span> {value}
    </span>
  );
}

function Card({ children, accent, style }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: accent ? `3px solid ${accent}` : undefined, borderRadius: 12, padding: "15px 17px", marginBottom: 10, ...(style || {}) }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: C.muted, marginBottom: 11, marginTop: 20 }}>{children}</div>;
}

function FlagCard({ flag }) {
  const [open, setOpen] = useState(false);
  const color = riskColor(flag.severity);
  return (
    <Card accent={color} style={{ cursor: "pointer" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: color + "22", color }}>{flag.severity}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{flag.title}</span>
          </div>
          {!open && <div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.5 }}>{(flag.explanation || "").slice(0, 85)}…</div>}
        </div>
        <span style={{ color: C.muted }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 11, borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
          <div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.6, marginBottom: 9 }}>{flag.explanation}</div>
          {flag.recommendation && (
            <div style={{ fontSize: 13, color: C.accent, background: C.accent + "0E", borderRadius: 8, padding: "9px 12px", lineHeight: 1.5 }}>
              💡 <strong>Fix:</strong> {flag.recommendation}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

const TABS = ["Overview", "Red Flags", "Missing", "Negotiate", "Ask AI"];

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2, background: C.surface2, borderRadius: 10, padding: 3, marginBottom: 22, flexWrap: "wrap" }}>
      {TABS.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{ flex: 1, minWidth: 60, padding: "8px 6px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: active === t ? C.accent : "transparent", color: active === t ? "#fff" : C.subtle, fontFamily: "inherit" }}>
          {t}
        </button>
      ))}
    </div>
  );
}

const SAMPLES = {
  NDA: `NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement is entered into as of January 1, 2025, between Acme Corp ("Disclosing Party") and John Doe ("Receiving Party").\n\n1. CONFIDENTIAL INFORMATION. Receiving Party agrees to keep confidential all information disclosed by Disclosing Party, including trade secrets, business plans, financial data, and technical information.\n\n2. TERM. This Agreement shall remain in effect for FIVE (5) years and shall survive termination indefinitely at Disclosing Party's sole discretion.\n\n3. NON-COMPETE. Receiving Party agrees not to engage in any competing business globally for 3 years after termination.\n\n4. REMEDIES. Any breach entitles Disclosing Party to unlimited damages. Receiving Party waives all rights to contest such remedies.\n\n5. GOVERNING LAW. Delaware law applies, with exclusive jurisdiction in Acme Corp's chosen court.\n\nSignature: _____________ Date: _____________`,
  Freelance: `FREELANCE SERVICES AGREEMENT\n\nThis Agreement is between TechStartup Inc ("Client") and Jane Smith ("Contractor") effective March 1, 2025.\n\n1. SERVICES. Contractor will design and develop a mobile application as directed by Client.\n\n2. PAYMENT. Client will pay $5,000 upon completion to Client's satisfaction. Client may withhold payment for any reason.\n\n3. INTELLECTUAL PROPERTY. All work product, including Contractor's pre-existing tools and frameworks, shall be exclusive property of Client.\n\n4. EXCLUSIVITY. Contractor may not work for any other technology company during this agreement.\n\n5. REVISIONS. Contractor agrees to unlimited revisions at no charge.\n\n6. TERMINATION. Client may terminate at any time without notice and without payment for completed work.\n\nSignatures: _____________ _____________`,
};

function downloadReport(result) {
  const lines = [
    "SIGNSHIELD CONTRACT ANALYSIS REPORT",
    "=====================================",
    "",
    "Contract Type : " + result.contractType,
    "Risk Level    : " + result.overallRisk + " (" + result.riskScore + "/10)",
    "Parties       : " + (result.parties || []).join(" / "),
    "",
    "--- VERDICT ---",
    result.verdict,
    "",
    "--- SUMMARY ---",
    result.summary,
    "",
    "--- RED FLAGS ---",
  ];
  (result.flags || []).forEach((f, i) => {
    lines.push("");
    lines.push((i + 1) + ". [" + f.severity + "] " + f.title);
    lines.push("   Issue: " + f.explanation);
    lines.push("   Fix:   " + f.recommendation);
  });
  lines.push("", "--- MISSING CLAUSES ---");
  (result.missingClauses || []).forEach(m => lines.push("- " + m.name + ": " + m.why));
  lines.push("", "--- PROTECTIVE CLAUSES ---");
  (result.positiveClauses || []).forEach(c => lines.push("+ " + c));
  lines.push("", "Generated by SignShield AI - " + new Date().toLocaleDateString());
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "signshield-analysis.txt"; a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [negotiation, setNegotiation] = useState(null);
  const [loadingNeg, setLoadingNeg] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setText(e.target.result);
    reader.readAsText(file);
  }

  async function analyze(contractText) {
    setLoading(true); setError(null); setResult(null);
    setNegotiation(null); setChatHistory([]); setTab("Overview");
    const prompt = "You are a senior contract attorney. Analyze the contract at the end of this message.\n\n" +
      "Respond with ONLY a JSON object. No markdown fences. No explanation before or after. Start your response with { and end with }.\n\n" +
      "Required fields: contractType (string), parties (array of 2 strings), summary (string), overallRisk (HIGH/MEDIUM/LOW), riskScore (number 1-10), " +
      "flags (array of {severity, title, explanation, recommendation}), missingClauses (array of {name, why}), positiveClauses (array of strings), " +
      "keyDates (array of {label, value}), keyNumbers (array of {label, value}), verdict (string)\n\n" +
      "CONTRACT TO ANALYZE:\n" + contractText.slice(0, 7000);
    try {
      const raw = await callClaude([{ role: "user", content: prompt }], null, 2048);
      const parsed = parseJSON(raw);
      parsed.flags = parsed.flags || [];
      parsed.missingClauses = parsed.missingClauses || [];
      parsed.positiveClauses = parsed.positiveClauses || [];
      parsed.keyDates = parsed.keyDates || [];
      parsed.keyNumbers = parsed.keyNumbers || [];
      parsed.parties = parsed.parties || [];
      setResult(parsed);
    } catch (e) { setError("Error: " + e.message); }
    finally { setLoading(false); }
  }

  async function generateNeg() {
    setLoadingNeg(true);
    const prompt = "Write a professional negotiation email based on these contract issues.\n" +
      "Contract: " + result.contractType + "\n" +
      "Top issues: " + (result.flags || []).slice(0, 3).map(f => "[" + f.severity + "] " + f.title + ": " + f.recommendation).join(" | ") + "\n" +
      "Missing: " + (result.missingClauses || []).map(m => m.name).join(", ") + "\n\n" +
      "Write a firm but collaborative email under 250 words. Use [YOUR NAME] and [OTHER PARTY] as placeholders.";
    try { const t = await callClaude([{ role: "user", content: prompt }], null, 1024); setNegotiation(t); }
    catch (e) { setNegotiation("Failed to generate. Try again."); }
    finally { setLoadingNeg(false); }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    const hist = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(hist); setChatLoading(true);
    const sys = "You are a contract attorney. Contract analyzed: Type: " + result?.contractType +
      ". Risk: " + result?.riskScore + "/10. Verdict: " + result?.verdict +
      ". Flags: " + (result?.flags || []).map(f => f.title).join(", ") + ". Answer concisely.";
    try {
      const reply = await callClaude(hist, sys, 512);
      setChatHistory([...hist, { role: "assistant", content: reply }]);
    } catch (e) { setChatHistory([...hist, { role: "assistant", content: "Error: " + e.message }]); }
    finally { setChatLoading(false); }
  }

  const rc = result ? riskColor(result.overallRisk) : C.accent;
  const highF = (result?.flags || []).filter(f => f.severity === "HIGH");
  const medF = (result?.flags || []).filter(f => f.severity === "MEDIUM");
  const lowF = (result?.flags || []).filter(f => f.severity === "LOW");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        *{box-sizing:border-box} body{margin:0} textarea,input{outline:none;font-family:inherit}
        textarea:focus,input:focus{border-color:#10B981!important} button{font-family:inherit}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1C2640;border-radius:2px}
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 800, paddingTop: 38, paddingBottom: 26, borderBottom: `1px solid ${C.border}`, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ width: 33, height: 33, background: `linear-gradient(135deg,${C.accent},${C.purple})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.5px" }}>SignShield</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: C.accent + "22", color: C.accent }}>AI</span>
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>Shield yourself before you sign — AI contract analysis in 60 seconds</div>
      </div>

      <div style={{ width: "100%", maxWidth: 800 }}>
        {!result && !loading && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              style={{ border: `2px dashed ${dragging ? C.accent : C.border}`, borderRadius: 14, padding: "40px 28px", textAlign: "center", cursor: "pointer", background: dragging ? C.accent + "0A" : C.surface, transition: "all 0.2s", marginBottom: 13 }}>
              <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              <div style={{ fontSize: 34, marginBottom: 9 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Drop your contract here</div>
              <div style={{ fontSize: 13, color: C.muted }}>Supports .txt files · or click to browse</div>
            </div>

            <div style={{ textAlign: "center", fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "11px 0" }}>or paste text</div>

            <textarea
              style={{ width: "100%", minHeight: 130, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 14, padding: "13px 15px", resize: "vertical", lineHeight: 1.6 }}
              placeholder="Paste your contract text here..."
              value={text} onChange={e => setText(e.target.value)}
            />

            {error && <div style={{ color: C.danger, fontSize: 13, marginTop: 8, padding: "8px 12px", background: C.danger + "11", borderRadius: 8 }}>{error}</div>}

            <div style={{ marginTop: 12, marginBottom: 2, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Try a sample:</span>
              {Object.keys(SAMPLES).map(k => (
                <button key={k} onClick={() => setText(SAMPLES[k])} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>{k}</button>
              ))}
            </div>

            <button
              disabled={text.trim().length < 50}
              onClick={() => analyze(text)}
              style={{ width: "100%", background: text.trim().length >= 50 ? `linear-gradient(135deg,${C.accent},${C.purple})` : C.border, color: text.trim().length >= 50 ? "#fff" : C.muted, border: "none", borderRadius: 11, padding: "15px 0", fontSize: 15, fontWeight: 700, cursor: text.trim().length >= 50 ? "pointer" : "not-allowed", marginTop: 14 }}>
              Analyze Contract →
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "70px 0" }}>
            <div style={{ width: 42, height: 42, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 5 }}>Analyzing your contract...</div>
            <div style={{ fontSize: 13, color: C.muted }}>Checking for risks, red flags, and missing clauses</div>
          </div>
        )}

        {result && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{result.contractType}</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>Contract Analysis</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => downloadReport(result)} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⬇ Report</button>
                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(result, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: copied ? C.ok : C.subtle, borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{copied ? "✓ Copied" : "📋 Copy"}</button>
                <button onClick={() => { setResult(null); setText(""); setError(null); }} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← New</button>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <Pill label="Risk" value={result.overallRisk} color={rc} />
              <Pill label="Flags" value={result.flags?.length || 0} color={C.subtle} />
              {(result.parties || []).map((p, i) => <Pill key={i} label={"P" + (i + 1)} value={p} color={C.purple} />)}
            </div>

            <RiskMeter score={result.riskScore || 0} />

            <div style={{ background: rc + "0D", border: `1px solid ${rc}33`, borderLeft: `3px solid ${rc}`, borderRadius: 12, padding: "13px 17px", marginBottom: 22 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Verdict</div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{result.verdict}</div>
            </div>

            {((result.keyDates || []).length > 0 || (result.keyNumbers || []).length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 20 }}>
                {[...(result.keyDates || []), ...(result.keyNumbers || [])].slice(0, 4).map((item, i) => (
                  <div key={i} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px" }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            <TabBar active={tab} onChange={setTab} />

            {tab === "Overview" && (
              <div>
                <Label>Summary</Label>
                <Card><div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.7 }}>{result.summary}</div></Card>
                <Label>Risk Breakdown</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 8 }}>
                  {[["High", highF.length, C.danger], ["Medium", medF.length, C.warn], ["Low", lowF.length, C.ok]].map(([l, n, col]) => (
                    <div key={l} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderTop: `2px solid ${col}`, borderRadius: 10, padding: 13, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: col }}>{n}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{l} Risk</div>
                    </div>
                  ))}
                </div>
                {(result.positiveClauses || []).length > 0 && (
                  <><Label>Protective Clauses</Label>
                    <Card>{result.positiveClauses.map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, fontSize: 13, color: C.subtle, paddingBottom: 6, lineHeight: 1.5 }}>
                        <span style={{ color: C.ok }}>✓</span>{c}
                      </div>
                    ))}</Card></>
                )}
              </div>
            )}

            {tab === "Red Flags" && (
              <div>
                {(result.flags || []).length === 0 && <Card><div style={{ textAlign: "center", color: C.ok, padding: "20px 0" }}>✓ No significant red flags found</div></Card>}
                {highF.length > 0 && <><Label>🔴 High Severity</Label>{highF.map((f, i) => <FlagCard key={i} flag={f} />)}</>}
                {medF.length > 0 && <><Label>🟡 Medium Severity</Label>{medF.map((f, i) => <FlagCard key={i} flag={f} />)}</>}
                {lowF.length > 0 && <><Label>🟢 Low Severity</Label>{lowF.map((f, i) => <FlagCard key={i} flag={f} />)}</>}
              </div>
            )}

            {tab === "Missing" && (
              <div>
                {(result.missingClauses || []).length === 0 && <Card><div style={{ textAlign: "center", color: C.ok, padding: "20px 0" }}>✓ No major missing clauses</div></Card>}
                {(result.missingClauses || []).map((m, i) => (
                  <Card key={i} accent={C.warn}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{m.name}</div>
                    <div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.6 }}>{m.why}</div>
                  </Card>
                ))}
              </div>
            )}

            {tab === "Negotiate" && (
              <div>
                <div style={{ fontSize: 13, color: C.subtle, marginBottom: 14, lineHeight: 1.6 }}>Generate a professional negotiation email — ready to copy and send.</div>
                {!negotiation && (
                  <button onClick={generateNeg} disabled={loadingNeg} style={{ width: "100%", background: loadingNeg ? C.border : `linear-gradient(135deg,${C.accent},${C.purple})`, color: loadingNeg ? C.muted : "#fff", border: "none", borderRadius: 11, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: loadingNeg ? "not-allowed" : "pointer" }}>
                    {loadingNeg ? "Drafting..." : "✍️ Generate Negotiation Email"}
                  </button>
                )}
                {negotiation && (
                  <>
                    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "17px 18px", fontSize: 13, color: C.subtle, lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 11 }}>{negotiation}</div>
                    <div style={{ display: "flex", gap: 9 }}>
                      <button onClick={() => { navigator.clipboard.writeText(negotiation); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, color: copied ? C.ok : C.subtle, borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{copied ? "✓ Copied!" : "📋 Copy Email"}</button>
                      <button onClick={() => setNegotiation(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "10px 14px", fontSize: 13, cursor: "pointer" }}>Redo</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "Ask AI" && (
              <div>
                <div style={{ fontSize: 13, color: C.subtle, marginBottom: 13 }}>Ask anything about this contract.</div>
                {chatHistory.length === 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                    {["What's the worst clause?", "Can I exit early?", "What to negotiate first?", "Is this standard?"].map(q => (
                      <button key={q} onClick={() => setChatInput(q)} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 8, padding: "7px 11px", fontSize: 12, cursor: "pointer" }}>{q}</button>
                    ))}
                  </div>
                )}
                <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 11 }}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 9 }}>
                      <div style={{ maxWidth: "82%", padding: "10px 13px", borderRadius: 11, fontSize: 13, lineHeight: 1.6, background: m.role === "user" ? C.accent : C.surface2, color: m.role === "user" ? "#fff" : C.subtle }}>{m.content}</div>
                    </div>
                  ))}
                  {chatLoading && <div style={{ color: C.muted, fontSize: 13, padding: "4px 8px" }}>Thinking…</div>}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Ask about this contract..."
                    style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, padding: "11px 13px" }} />
                  <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} style={{ background: chatInput.trim() ? C.accent : C.border, border: "none", borderRadius: 10, padding: "0 16px", color: chatInput.trim() ? "#fff" : C.muted, fontSize: 15, fontWeight: 700, cursor: chatInput.trim() ? "pointer" : "not-allowed" }}>→</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
