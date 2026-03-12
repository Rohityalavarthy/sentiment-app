import { useState, useEffect } from "react";

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

function AnimatedBar({ label, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, letterSpacing: 2, color: "#b0b0c8", fontWeight: 600 }}>{label.toUpperCase()}</span>
        <span style={{ fontSize: 14, color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 7, background: "#2a2a3e", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`, background: color,
          borderRadius: 4, boxShadow: `0 0 10px ${color}99`,
          transition: "width 0.85s cubic-bezier(0.22,1,0.36,1)",
        }} />
      </div>
    </div>
  );
}

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
    return { outer: pt(a, r + 4), inner: pt(a, r - 4), label: pt(a, r + 16), v };
  });

  return (
    <svg width={140} height={115} viewBox="0 0 140 115" style={{ overflow: "visible" }}>
      {[
        [sa,              sa + total*0.25, "#4a1010"],
        [sa + total*0.25, sa + total*0.40, "#351818"],
        [sa + total*0.40, sa + total*0.60, "#352808"],
        [sa + total*0.60, sa + total*0.75, "#0f3520"],
        [sa + total*0.75, ea,              "#0a3518"],
      ].map(([f, t, c], i) => (
        <path key={i} d={arc(f, t)} fill="none" stroke={c} strokeWidth={8}
          strokeLinecap={i === 0 || i === 4 ? "round" : "butt"} />
      ))}
      <path d={arc(sa + total * 0.5, curr)} fill="none" stroke={color} strokeWidth={6}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
      {ticks.map(({ outer, inner, label, v }) => (
        <g key={v}>
          <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="#7070888" strokeWidth={2} />
          <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
            fill="#9090a8" style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 600 }}>
            {v > 0 ? `+${v}` : v}
          </text>
        </g>
      ))}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y}
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      <circle cx={needle.x} cy={needle.y} r={6} fill={color}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      <circle cx={cx} cy={cy} r={5} fill="#1a1a2e" stroke={color} strokeWidth={2} />
      <text x={cx} y={cy + 24} textAnchor="middle" fill={color}
        style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700 }}>
        {animVal >= 0 ? "+" : ""}{animVal.toFixed(3)}
      </text>
    </svg>
  );
}

function ClassLegend({ active }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Object.entries(CLASSES).map(([name, s]) => (
        <div key={name} style={{
          padding: "6px 14px",
          border: `1px solid ${name === active ? s.border : "#3a3a52"}`,
          background: name === active ? s.bg : "#16161f",
          fontSize: 11, letterSpacing: 1,
          color: name === active ? s.color : "#8080a0",
          fontWeight: name === active ? 700 : 500,
          transition: "all 0.3s",
          boxShadow: name === active ? `0 0 14px ${s.glow}` : "none",
        }}>
          {s.icon} {name.toUpperCase()}
        </div>
      ))}
    </div>
  );
}

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

  const sectionLabel = {
    display: "block", fontSize: 11, letterSpacing: 4,
    color: "#a0a0c0", marginBottom: 10, fontWeight: 700,
    textTransform: "uppercase",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a12" }}>

      {/* Header */}
      <header style={{
        borderBottom: "2px solid #2a2a3e",
        padding: "18px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0d0d18",
      }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 5, color: "#7070908", marginBottom: 5, fontWeight: 600 }}>
            BERT · 5-CLASS · WCAG AA+
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0ff", letterSpacing: 3 }}>
            SENTIMENT<span style={{ color: "#7c6aff" }}>/</span>ENGINE
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.values(CLASSES).map((s, i) => (
            <div key={i} title={Object.keys(CLASSES)[i]} style={{
              width: 11, height: 11, borderRadius: "50%",
              background: s.color, boxShadow: `0 0 7px ${s.color}bb`,
            }} />
          ))}
        </div>
      </header>

      <main style={{ padding: "32px 36px", maxWidth: 800, margin: "0 auto" }}>

        {/* Input */}
        <section style={{ marginBottom: 26 }}>
          <label style={sectionLabel}>Input Text</label>
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze(); }}
            placeholder="Enter any text — slang, profanity, sarcasm all handled..."
            rows={4}
            maxLength={1000}
            style={{
              width: "100%", background: "#13131e", border: "2px solid #30304a",
              color: charWarn ? "#FFB3B3" : "#eeeef8",
              padding: "14px 16px", fontSize: 15, resize: "vertical",
              outline: "none", lineHeight: 1.7, transition: "border-color 0.2s",
              fontWeight: 400,
            }}
            onFocus={e => e.target.style.borderColor = "#6a6acc"}
            onBlur={e => e.target.style.borderColor = "#30304a"}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: charWarn ? "#FFB3B3" : "#7878989", fontWeight: 500 }}>
              {text.length}/1000 CHARS · ⌘+ENTER TO ANALYZE
            </span>
            <button
              onClick={analyze}
              disabled={loading || !text.trim()}
              style={{
                background: loading ? "#141428" : "#1e1e40",
                border: `2px solid ${loading || !text.trim() ? "#30304a" : "#6a6acc"}`,
                color: loading || !text.trim() ? "#50507a" : "#c0c0ff",
                padding: "10px 32px", fontSize: 12, letterSpacing: 3,
                cursor: loading || !text.trim() ? "default" : "pointer",
                fontWeight: 700, transition: "all 0.2s",
              }}
            >
              {loading ? "PROCESSING…" : "▶ ANALYZE"}
            </button>
          </div>
        </section>

        {/* Examples */}
        <section style={{ marginBottom: 32 }}>
          <p style={sectionLabel}>Examples</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setText(ex.text)} style={{
                background: "#13131e", border: "1px solid #30304a",
                color: "#9090b8", padding: "7px 15px", fontSize: 11,
                cursor: "pointer", letterSpacing: 1, transition: "all 0.15s", fontWeight: 600,
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#c8c8f0"; e.currentTarget.style.borderColor = "#6a6acc"; e.currentTarget.style.background = "#1a1a30"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#9090b8"; e.currentTarget.style.borderColor = "#30304a"; e.currentTarget.style.background = "#13131e"; }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div style={{
            padding: "13px 18px", border: "2px solid #6a2020",
            background: "#1a0808", color: "#FF9090",
            fontSize: 13, marginBottom: 22, letterSpacing: 1, fontWeight: 500,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && palette && (
          <section style={{
            border: `2px solid ${palette.border}`,
            background: palette.bg,
            padding: 28, marginBottom: 28,
            boxShadow: `0 0 50px ${palette.glow}`,
            transition: "all 0.4s",
          }}>
            {/* Classification + gauge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26, flexWrap: "wrap", gap: 16 }}>
              <div>
                <p style={{ ...sectionLabel, marginBottom: 12 }}>Classification</p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 12,
                  padding: "12px 24px",
                  border: `2px solid ${palette.border}`,
                  background: "#0a0a12",
                  boxShadow: `0 0 20px ${palette.glow}`,
                }}>
                  <span style={{ color: palette.color, fontSize: 18 }}>{palette.icon}</span>
                  <span style={{ color: palette.color, fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
                    {cls.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#b0b0c8", marginTop: 12, letterSpacing: 1, fontWeight: 500 }}>
                  BASE: <span style={{ color: "#d8d8f0", fontWeight: 700 }}>{result.baseLabel.toUpperCase()}</span>
                  {" · "}CONF: <span style={{ color: palette.color, fontWeight: 700 }}>{result.confidence}%</span>
                </p>
                <p style={{ fontSize: 11, color: "#8888a8", marginTop: 5, fontWeight: 500 }}>
                  {result.confidence >= 78 ? "≥78% — STRONG SIGNAL" : "<78% — MODERATE SIGNAL"}
                </p>
              </div>
              <Gauge value={result.compound} color={palette.color} />
            </div>

            {/* Score bars */}
            <div style={{ borderTop: "2px solid #22223a", paddingTop: 20, marginBottom: 20 }}>
              <p style={sectionLabel}>Model Scores</p>
              {result.breakdown.map((b, i) => (
                <AnimatedBar key={b.label} label={b.label} value={b.score}
                  color={barColors[b.label] || "#888"} delay={i * 100} />
              ))}
            </div>

            {/* Legend */}
            <div style={{ borderTop: "2px solid #22223a", paddingTop: 18 }}>
              <p style={sectionLabel}>Scale</p>
              <ClassLegend active={cls} />
            </div>

            <p style={{ marginTop: 16, fontSize: 11, color: "#6060808", letterSpacing: 1, fontWeight: 500 }}>
              MODEL: nlptown/bert-base-multilingual-uncased-sentiment
            </p>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section>
            <p style={sectionLabel}>Analysis Log</p>
            {history.map((h, i) => {
              const s = CLASSES[h.result.fourClass];
              return (
                <div key={h.id}
                  onClick={() => { setText(h.text.replace("…", "")); setResult(h.result); }}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 16px", marginBottom: 5,
                    background: i === 0 ? s.bg : "#111120",
                    border: `1px solid ${i === 0 ? s.border : "#2a2a3e"}`,
                    cursor: "pointer", opacity: Math.max(1 - i * 0.1, 0.4),
                    transition: "opacity 0.2s",
                  }}>
                  <span style={{ fontSize: 13, color: "#b0b0c8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                    {h.text}
                  </span>
                  <span style={{ fontSize: 12, color: s.color, marginLeft: 16, whiteSpace: "nowrap", letterSpacing: 1, fontWeight: 700 }}>
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
