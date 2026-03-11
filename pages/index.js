import Head from "next/head";
import SentimentAnalyzer from "../src/components/SentimentAnalyzer";

export default function Home() {
  return (
    <>
      <Head>
        <title>Sentiment Engine</title>
        <meta name="description" content="RoBERTa-powered sentiment analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <SentimentAnalyzer />
    </>
  );
}
