import { useState, useEffect } from "react";

// ── Sentiment palette (WCAG AA+ on #0f1117) ───────────────────────────────────
const CLASSES = {
  "Very Negative":     { color: "#FF6B6B", bg: "#1e0808", border: "#5a1414", glow: "#FF6B6B33", icon: "▼▼" },
  "Somewhat Negative": { color: "#FFB3B3", bg: "#180a0a", border: "#3d1818", glow: "#FFB3B322", icon: "▼"  },
  "Neutral":           { color: "#E8C070", bg: "#181408", border: "#3d300a", glow: "#E8C07022", icon: "◆"  },
  "Somewhat Positive": { color: "#86efac", bg: "#081a10", border: "#0f3d1e", glow: "#86efac22", icon: "▲"  },
  "Very Positive":     { color: "#4ade80", bg: "#061a0c", border: "#0d3d18", glow: "#4ade8044", icon: "▲▲" },
};

const EXAMPLES = [
  { label: "V.POS",  text: "This is absolutely phenomenal, best thing I've ever used!!" },
  { label: "POS",    text: "Pretty good overall, I'd recommend it to a friend." },
  { label: "NEU",    text: "It does what it says. Nothing more, nothing less." },
  { label: "NEG",    text: "Dissapointed" },
  { label: "V.NEG",  text: "Holy sh*t what an absolute disaster, completely broken garbage." },
  { label: "TRICKY", text: "Not bad, but I wouldn't say it's great either. Bloody confusing." },
];

// ── Animated bar ───────────────────────────────────────────────────────────────
function AnimatedBar({ label, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: "#9090a8" }}>{label.toUpperCase()}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: "#1e1e2a", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`, background: color,
          borderRadius: 3, boxShadow: `0 0 8px ${color}88`,
          transition: "width 0.85s cubic-bezier(0.22,1,0.36,1)",
        }} />
      </div>
    </div>
  );
}

// ── Gauge ──────────────────────────────────────────────────────────────────────
function Gauge({ value, color }) {
  const [animVal, setAnimVal] = useState(0);
  const prevRef = useState(0);

  useEffect(() => {
    let start = null;
    const from = prevRef[0];
    prevRef[0] = value;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 750, 1);
      const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
      setAnimVal(from + (value - from) * e);
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [value]);

  const pct = Math.max(0, Math.min(1, (animVal + 1) / 2));
  const r = 52, cx = 70, cy = 72;
  const sa = Math.PI * 0.78, ea = Math.PI * 2.22;
  const total = ea - sa;
  const curr = sa + total * pct;

  const pt  = (a, rr = r) => ({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) });
  const arc = (from, to, rr = r) => {
    const s = pt(from, rr), e = pt(to, rr);
    return `M${s.x} ${s.y} A${rr} ${rr} 0 ${(to - from) > Math.PI ? 1 : 0} 1 ${e.x} ${e.y}`;
  };

  const needle = pt(curr, r - 8);
  const ticks  = [-1, -0.5, 0, 0.5, 1].map(v => {
    const a = sa + total * ((v + 1) / 2);
    return { outer: pt(a, r + 4), inner: pt(a, r - 4), label: pt(a, r + 14), v };
  });

  return (
    <svg width={140} height={110} viewBox="0 0 140 110" style={{ overflow: "visible" }}>
      {[
        [sa,              sa + total*0.25, "#4a1010"],
        [sa + total*0.25, sa + total*0.40, "#351818"],
        [sa + total*0.40, sa + total*0.60, "#352808"],
        [sa + total*0.60, sa + total*0.75, "#0f3520"],
        [sa + total*0.75, ea,              "#0a3518"],
      ].map(([f, t, c], i) => (
        <path key={i} d={arc(f, t)} fill="none" stroke={c} strokeWidth={7}
          strokeLinecap={i === 0 || i === 4 ? "round" : "butt"} />
      ))}
      <path d={arc(sa + total * 0.5, curr)} fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      {ticks.map(({ outer, inner, label, v }) => (
        <g key={v}>
          <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="#555" strokeWidth={1.5} />
          <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
            fill="#7070888" style={{ fontSize: 7, fontFamily: "monospace" }}>
            {v > 0 ? `+${v}` : v}
          </text>
        </g>
      ))}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y}
        stroke={color} strokeWidth={2} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      <circle cx={needle.x} cy={needle.y} r={5} fill={color}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      <circle cx={cx} cy={cy} r={4} fill="#1a1a22" stroke={color} strokeWidth={1.5} />
      <text x={cx} y={cy + 22} textAnchor="middle" fill={color}
        style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 700 }}>
        {animVal >= 0 ? "+" : ""}{animVal.toFixed(3)}
      </text>
    </svg>
  );
}

// ── Class legend ───────────────────────────────────────────────────────────────
function ClassLegend({ active }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {Object.entries(CLASSES).map(([name, s]) => (
        <div key={name} style={{
          padding: "5px 11px",
          border: `1px solid ${name === active ? s.border : "#2a2a38"}`,
          background: name === active ? s.bg : "transparent",
          fontSize: 10, letterSpacing: 1,
          color: name === active ? s.color : "#606078",
          fontWeight: name === active ? 700 : 400,
          transition: "all 0.3s",
          boxShadow: name === active ? `0 0 12px ${s.glow}` : "none",
        }}>
          {s.icon} {name.toUpperCase()}
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SentimentAnalyzer() {
  const [text, setText]         = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [history, setHistory]   = useState([]);
  const [charWarn, setCharWarn] = useState(false);

  const analyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setResult(data);
      setHistory(h => [
        { text: text.slice(0, 58) + (text.length > 58 ? "…" : ""), result: data, id: Date.now() },
        ...h,
      ].slice(0, 8));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setCharWarn(e.target.value.length > 900);
  };

  const cls     = result?.fourClass || null;
  const palette = cls ? CLASSES[cls] : null;
  const barColors = {
    "Very Negative":     "#FF6B6B",
    "Somewhat Negative": "#FFB3B3",
    "Neutral":           "#E8C070",
    "Somewhat Positive": "#86efac",
    "Very Positive":     "#4ade80",
  };

  // Section label style — reused throughout
  const sectionLabel = { display: "block", fontSize: 10, letterSpacing: 4, color: "#7070888", marginBottom: 9, fontWeight: 500 };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #22222e",
        padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 4, color: "#5555708", marginBottom: 4 }}>
            BERT · 5-CLASS · WCAG AA+
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#eeeef5", letterSpacing: 2 }}>
            SENTIMENT<span style={{ color: "#7c6aff" }}>/</span>ENGINE
          </h1>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {Object.values(CLASSES).map((s, i) => (
            <div key={i} title={Object.keys(CLASSES)[i]} style={{
              width: 9, height: 9, borderRadius: "50%",
              background: s.color, boxShadow: `0 0 6px ${s.color}aa`,
            }} />
          ))}
        </div>
      </header>

      <main style={{ padding: "28px 32px", maxWidth: 780, margin: "0 auto" }}>

        {/* Input */}
        <section style={{ marginBottom: 22 }}>
          <label style={sectionLabel}>INPUT TEXT</label>
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze(); }}
            placeholder="Enter any text — slang, profanity, sarcasm all handled..."
            rows={4}
            maxLength={1000}
            style={{
              width: "100%", background: "#16161f", border: "1px solid #2a2a3a",
              color: charWarn ? "#FFB3B3" : "#dddde8",
              padding: "13px 15px", fontSize: 14, resize: "vertical",
              outline: "none", lineHeight: 1.65, transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "#5a5aaa"}
            onBlur={e => e.target.style.borderColor = "#2a2a3a"}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: charWarn ? "#FFB3B3" : "#606078" }}>
              {text.length}/1000 CHARS · ⌘+ENTER TO ANALYZE
            </span>
            <button
              onClick={analyze}
              disabled={loading || !text.trim()}
              style={{
                background: loading ? "#141420" : "#1a1a35",
                border: `1px solid ${loading || !text.trim() ? "#2a2a4a" : "#5a5aaa"}`,
                color: loading || !text.trim() ? "#4a4a6a" : "#aaaaff",
                padding: "9px 28px", fontSize: 11, letterSpacing: 3,
                cursor: loading || !text.trim() ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "PROCESSING…" : "▶ ANALYZE"}
            </button>
          </div>
        </section>

        {/* Examples */}
        <section style={{ marginBottom: 28 }}>
          <p style={sectionLabel}>EXAMPLES</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setText(ex.text)} style={{
                background: "#16161f", border: "1px solid #2a2a3a",
                color: "#8080a0", padding: "6px 13px", fontSize: 10,
                cursor: "pointer", letterSpacing: 1, transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#b0b0d0"; e.currentTarget.style.borderColor = "#5a5aaa"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#8080a0"; e.currentTarget.style.borderColor = "#2a2a3a"; }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 16px", border: "1px solid #5a2020",
            background: "#1a0c0c", color: "#FF8080",
            fontSize: 12, marginBottom: 20, letterSpacing: 1,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && palette && (
          <section style={{
            border: `1px solid ${palette.border}`,
            background: palette.bg,
            padding: 24, marginBottom: 24,
            boxShadow: `0 0 40px ${palette.glow}`,
            transition: "all 0.4s",
          }}>
            {/* Classification + gauge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ ...sectionLabel, marginBottom: 10 }}>CLASSIFICATION</p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "10px 20px",
                  border: `1px solid ${palette.border}`,
                  background: "#0f1117",
                  boxShadow: `0 0 16px ${palette.glow}`,
                }}>
                  <span style={{ color: palette.color, fontSize: 14 }}>{palette.icon}</span>
                  <span style={{ color: palette.color, fontSize: 20, fontWeight: 700, letterSpacing: 3 }}>
                    {cls.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#9090a8", marginTop: 10, letterSpacing: 1 }}>
                  BASE: <span style={{ color: "#c0c0d8" }}>{result.baseLabel.toUpperCase()}</span>
                  {" · "}CONF: <span style={{ color: palette.color }}>{result.confidence}%</span>
                </p>
                <p style={{ fontSize: 10, color: "#7070888", marginTop: 4 }}>
                  {result.confidence >= 78 ? "≥78% — STRONG SIGNAL" : "<78% — MODERATE SIGNAL"}
                </p>
              </div>
              <Gauge value={result.compound} color={palette.color} />
            </div>

            {/* Score bars */}
            <div style={{ borderTop: "1px solid #22222e", paddingTop: 18, marginBottom: 18 }}>
              <p style={sectionLabel}>MODEL SCORES</p>
              {result.breakdown.map((b, i) => (
                <AnimatedBar key={b.label} label={b.label} value={b.score}
                  color={barColors[b.label] || "#888"} delay={i * 100} />
              ))}
            </div>

            {/* Legend */}
            <div style={{ borderTop: "1px solid #22222e", paddingTop: 16 }}>
              <p style={sectionLabel}>SCALE</p>
              <ClassLegend active={cls} />
            </div>

            <p style={{ marginTop: 14, fontSize: 10, color: "#505068", letterSpacing: 1 }}>
              MODEL: nlptown/bert-base-multilingual-uncased-sentiment
            </p>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section>
            <p style={sectionLabel}>ANALYSIS LOG</p>
            {history.map((h, i) => {
              const s = CLASSES[h.result.fourClass];
              return (
                <div key={h.id}
                  onClick={() => { setText(h.text.replace("…", "")); setResult(h.result); }}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 14px", marginBottom: 4,
                    background: i === 0 ? s.bg : "#13131c",
                    border: `1px solid ${i === 0 ? s.border : "#22222e"}`,
                    cursor: "pointer", opacity: Math.max(1 - i * 0.1, 0.4),
                    transition: "opacity 0.2s",
                  }}>
                  <span style={{ fontSize: 12, color: "#9090a8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.text}
                  </span>
                  <span style={{ fontSize: 11, color: s.color, marginLeft: 16, whiteSpace: "nowrap", letterSpacing: 1 }}>
                    {s.icon} {h.result.fourClass.toUpperCase()} · {h.result.confidence}%
                  </span>
                </div>
              );
            })}
          </section>
        )}

      </main>
    </div>
  );
}
