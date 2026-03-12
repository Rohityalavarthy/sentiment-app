# SENTIMENT/ENGINE

> BERT-powered 5-class sentiment analysis · Next.js · Vercel · WCAG AAA

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black?style=flat-square&logo=vercel)
![HuggingFace](https://img.shields.io/badge/HuggingFace-nlptown%2FBERT-yellow?style=flat-square&logo=huggingface)
![WCAG](https://img.shields.io/badge/WCAG-AAA-brightgreen?style=flat-square)

---

## What it does

Classifies any text into one of four sentiment classes using a 125M parameter BERT model. The HuggingFace API token lives entirely on the server - it is never exposed to the browser.

| Class | Colour | Trigger |
|---|---|---|
| 🔴 Very Negative | `#FF6B6B` | Model confidence ≥ 55%, strongly negative |
| 🌸 Somewhat Negative | `#FFB3B3` | Model confidence ≥ 30%, mildly negative |
| 🟡 Neutral | `#E8C070` | Confidence below threshold, or 3-star prediction |
| 🌿 Somewhat Positive | `#86EFAC` | Model confidence ≥ 42%, mildly positive |
| 💚 Very Positive | `#4ADE80` | Model confidence ≥ 55%, strongly positive |

The reason for varying parameters betwen positive and negative is that the base model used was observed to have a positive bias.

---

## Stack

- **Frontend** — Next.js 14 + React, monospace industrial UI
- **API** — Next.js serverless route at `/api/analyze`
- **Model** — [`nlptown/bert-base-multilingual-uncased-sentiment`](https://huggingface.co/nlptown/bert-base-multilingual-uncased-sentiment) via HuggingFace Inference API
- **Hosting** — Vercel (auto-deploys on push to `main`)

---

## How it works

```
Browser → POST /api/analyze
              ↓
         Serverless function (HF_TOKEN injected here)
              ↓
         HuggingFace Inference API
              ↓
         BERT returns 5 star-rating scores
              ↓
         Threshold logic applied (see below)
              ↓
         JSON response → animated UI
```

The model natively returns 1–5 star probabilities. These map to UI classes:

```
1 star  → Very Negative
2 stars → Somewhat Negative
3 stars → Neutral
4 stars → Somewhat Positive
5 stars → Very Positive
```

---

## Confidence thresholds

The model was trained on product reviews and has a known positive bias — neutral factual statements like *"I will move to Bangalore"* tend to score slightly positive. A post-processing threshold layer corrects this.

```js
// pages/api/analyze.js
const NEUTRAL_FLOOR_POS  = 0.42  // high bar for positive — corrects positive bias
const NEUTRAL_FLOOR_NEG  = 0.30  // low bar for negative — catches mild negatives
const STRONG_THRESHOLD   = 0.55  // needed to reach "Very" class
```

**Logic applied after the model responds:**

1. If `topScore < NEUTRAL_FLOOR` for that direction → force **Neutral**
2. Else if `topScore < STRONG_THRESHOLD` and class is "Very" → downgrade to **Somewhat**
3. Else → use the raw star-mapped class

**Tuning cheatsheet:**

| Problem | Fix |
|---|---|
| Factual statements coming back Positive | Raise `NEUTRAL_FLOOR_POS` (try `0.62`) |
| Mild negatives showing as Neutral | Lower `NEUTRAL_FLOOR_NEG` (try `0.25`) |
| Too many "Very" results | Raise `STRONG_THRESHOLD` (try `0.70`) |
| Everything stuck in "Somewhat" | Lower `STRONG_THRESHOLD` (try `0.50`) |

---

## Getting started

### Local development

```bash
git clone https://github.com/YOUR_USERNAME/sentiment-app
cd sentiment-app
npm install
cp .env.local.example .env.local
# Add your HuggingFace token to .env.local
npm run dev
# → http://localhost:3000
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
# When prompted, add HF_TOKEN as an environment variable
vercel --prod
```

Or via the Vercel dashboard:

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo
3. Add environment variable: `HF_TOKEN` = your token
4. Click **Deploy**

Every push to `main` triggers an automatic redeploy.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `HF_TOKEN` | Yes | Free token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

---

## Project structure

```
sentiment-app/
├── pages/
│   ├── _app.js                   Global CSS
│   ├── index.js                  Entry point
│   └── api/
│       └── analyze.js            Serverless route — all model + threshold logic
├── src/
│   ├── components/
│   │   └── SentimentAnalyzer.js  UI component
│   └── styles/
│       └── globals.css
├── .env.local.example
└── package.json
```

---

## Compound score

Alongside the 4-class label, the API returns a compound score from `-1.0` to `+1.0`:

```
compound = (P5 × 1.0) + (P4 × 0.5) + (P3 × 0.0) + (P2 × -0.5) + (P1 × -1.0)
```

This is a weighted sum of all five star probabilities and is unaffected by the threshold logic — useful for ranking or comparing multiple results by intensity.

---

## Known limitations

- **Sarcasm** — surface-level positive words in sarcastic statements may score positive
- **Cold starts** — first request after inactivity takes ~15–25s while HuggingFace spins up the model; subsequent requests are 2–4s
- **Language** — trained on EN, DE, NL, FR, IT, ES; other languages may work but accuracy is not guaranteed
- **Token limit** — texts over 512 BERT tokens are silently truncated; the UI caps input at 1000 characters as a proxy

---

## Colour palette (WCAG AAA on `#0f1117`)

| Class | Hex | Contrast |
|---|---|---|
| Very Negative | `#FF6B6B` | 7.30:1 |
| Somewhat Negative | `#FFB3B3` | 11.91:1 |
| Neutral | `#E8C070` | 11.77:1 |
| Somewhat Positive | `#86EFAC` | 14.42:1 |
| Very Positive | `#4ADE80` | 11.62:1 |

All values exceed the WCAG AAA threshold of 7:1.

---

## License

MIT
