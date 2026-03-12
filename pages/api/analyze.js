// nlptown/bert-base-multilingual-uncased-sentiment
// - Natively returns 1–5 star labels → maps to our 4-class UI
// - Requires HF_TOKEN set in Vercel environment variables
const MODEL  = "nlptown/bert-base-multilingual-uncased-sentiment";
const HF_URL = `https://router.huggingface.co/hf-inference/models/${MODEL}`;

const STAR_MAP = {
  "1 star":  "Very Negative",
  "2 stars": "Somewhat Negative",
  "3 stars": "Neutral",
  "4 stars": "Somewhat Positive",
  "5 stars": "Very Positive",
};

const WEIGHTS = { "1 star": -1, "2 stars": -0.5, "3 stars": 0, "4 stars": 0.5, "5 stars": 1 };

// ── Confidence thresholds ─────────────────────────────────────────────────────
// Separate floors for positive vs negative to correct the model's positive bias.
// The model needs MORE confidence to call something positive (corrects false positives
// on neutral factual statements), but LESS confidence to call something negative
// (so mild negatives like "somewhat disappointing" aren't swallowed into Neutral).
//
// HOW TO TUNE:
//   NEUTRAL_FLOOR_POS  → raise to push more statements from Positive → Neutral
//   NEUTRAL_FLOOR_NEG  → lower to pull more statements from Neutral → Negative
//   STRONG_THRESHOLD   → confidence needed to reach "Very" class (both directions)
const NEUTRAL_FLOOR_POS  = 0.48; // higher bar for positive (corrects model's positive bias)
const NEUTRAL_FLOOR_NEG  = 0.30; // lower bar for negative (catches mild negatives)
const STRONG_THRESHOLD   = 0.60; // needed for Very Positive / Very Negative

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim())
    return res.status(400).json({ error: "Missing or empty text." });
  if (text.length > 1000)
    return res.status(400).json({ error: "Text exceeds 1000 character limit." });

  const token = process.env.HF_TOKEN;
  if (!token)
    return res.status(500).json({ error: "HF_TOKEN not set — add it in Vercel environment variables." });

  try {
    const hfRes = await fetch(HF_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    });

    if (hfRes.status === 503) return res.status(503).json({ error: "Model loading — retry in ~20s." });
    if (!hfRes.ok) {
      const body = await hfRes.text();
      return res.status(hfRes.status).json({ error: `HuggingFace ${hfRes.status}: ${body}` });
    }

    const data     = await hfRes.json();
    const scores   = Array.isArray(data[0]) ? data[0] : data;
    const sorted   = [...scores].sort((a, b) => b.score - a.score);
    const top      = sorted[0];
    const topScore = top.score;
    const rawClass = STAR_MAP[top.label] || "Neutral";

    const isPositive = rawClass === "Somewhat Positive" || rawClass === "Very Positive";
    const isNegative = rawClass === "Somewhat Negative" || rawClass === "Very Negative";
    const floor      = isPositive ? NEUTRAL_FLOOR_POS : isNegative ? NEUTRAL_FLOOR_NEG : 0;

    let fourClass;
    if (topScore < floor) {
      fourClass = "Neutral";
    } else if (topScore < STRONG_THRESHOLD && (rawClass === "Very Positive" || rawClass === "Very Negative")) {
      fourClass = rawClass === "Very Positive" ? "Somewhat Positive" : "Somewhat Negative";
    } else {
      fourClass = rawClass;
    }

    const compound = parseFloat(
      scores.reduce((sum, s) => sum + (WEIGHTS[s.label] || 0) * s.score, 0).toFixed(4)
    );

    return res.status(200).json({
      fourClass,
      baseLabel:  top.label,
      confidence: Math.round(topScore * 100),
      compound,
      breakdown:  sorted.map(s => ({ label: STAR_MAP[s.label] || s.label, score: Math.round(s.score * 100) })),
      model:      MODEL,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
