# Sentiment Engine

DistilBERT-powered sentiment analysis via HuggingFace's Inference Providers API.
4-class output (Very Negative → Very Positive), WCAG AA+ compliant UI.

## Stack

- **Next.js 14** — framework + serverless API route
- **distilbert-base-uncased-finetuned-sst-2-english** — fast, reliable, free tier
- **HuggingFace Inference Providers** — new router.huggingface.co endpoint
- **Vercel** — hosting

---

## Local development

```bash
# 1. Install
npm install

# 2. Add your free HuggingFace token
cp .env.local.example .env.local
# Edit .env.local and paste your token

# 3. Run
npm run dev
# → http://localhost:3000
```

Get a free token at: https://huggingface.co/settings/tokens
(Read access is enough — no billing required)

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
vercel env add HF_TOKEN    # paste your HuggingFace token when prompted
vercel --prod
```

### Option B — GitHub + Vercel dashboard

1. Push this repo to GitHub
2. Go to vercel.com/new → Import your repo
3. Under Environment Variables, add:
   - Key:   HF_TOKEN
   - Value: your HuggingFace token
4. Click Deploy

Every push to main auto-deploys. Your token never reaches the browser.

---

## How the 4-class mapping works

DistilBERT returns binary Positive/Negative + a confidence score.
We derive 4 classes from that:

| Confidence | Label     | → 4-class result   |
|------------|-----------|--------------------|
| < 65%      | either    | Neutral            |
| 65–89%     | Positive  | Somewhat Positive  |
| 65–89%     | Negative  | Somewhat Negative  |
| ≥ 90%      | Positive  | Very Positive      |
| ≥ 90%      | Negative  | Very Negative      |

## Colour palette (all WCAG AA+ on #060608)

| Class             | Hex       | Contrast |
|-------------------|-----------|----------|
| Very Negative     | `#FF6B6B` | 7.30:1   |
| Somewhat Negative | `#FFB3B3` | 11.91:1  |
| Neutral           | `#E8C070` | 11.77:1  |
| Somewhat Positive | `#86efac` | 14.42:1  |
| Very Positive     | `#4ade80` | 11.62:1  |
