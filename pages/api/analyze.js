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

// Weighted compound score: 1★=-1, 2★=-0.5, 3★=0, 4★=0.5, 5★=1
const WEIGHTS = { "1 star": -1, "2 stars": -0.5, "3 stars": 0, "4 stars": 0.5, "5 stars": 1 };

// ── Confidence thresholds ─────────────────────────────────────────────────────
// The model is biased towards positive for neutral/factual statements.
// These thresholds override the raw star label when confidence is too low,
// collapsing uncertain predictions into Neutral.
//
// HOW TO TUNE:
//   Raise NEUTRAL_FLOOR   → more statements fall into Neutral (fixes false positives
//                           like "I will move to Bangalore"). Try 0.55 or 0.60.
//   Lower NEUTRAL_FLOOR   → fewer Neutrals, model opinion trusted more
//   Raise STRONG_THRESHOLD → harder to reach Very Positive / Very Negative
//   Lower STRONG_THRESHOLD → easier to reach Very Positive / Very Negative

const NEUTRAL_FLOOR    = 0.50; // raise to 0.55–0.60 to fix neutral false positives
const STRONG_THRESHOLD = 0.60; // top score needed to qualify as "Very" class

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

    const data   = await hfRes.json();
    const scores = Array.isArray(data[0]) ? data[0] : data;
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const top    = sorted[0];
    const topScore = top.score;

    // Apply threshold logic:
    // 1. If the model isn't confident enough, force Neutral
    // 2. If confident but not strongly, downgrade "Very" → "Somewhat"
    let fourClass;
    const rawClass = STAR_MAP[top.label] || "Neutral";

    if (topScore < NEUTRAL_FLOOR) {
      // Not confident enough to assign any sentiment — call it Neutral
      fourClass = "Neutral";
    } else if (topScore < STRONG_THRESHOLD && (rawClass === "Very Positive" || rawClass === "Very Negative")) {
      // Confident enough for a sentiment, but not strong enough for "Very"
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