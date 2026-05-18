#!/usr/bin/env node
// Calls Google PageSpeed Insights for each route and writes a markdown report
// summarizing LCP / TBT / CLS / Performance / SEO / Accessibility / Best
// Practices, plus the top remaining opportunities and diagnostics.
//
// Usage:
//   node scripts/psi-report.mjs                       # mobile, anon (rate-limited)
//   PSI_API_KEY=xxx node scripts/psi-report.mjs       # higher quota
//   node scripts/psi-report.mjs --strategy=desktop
//   node scripts/psi-report.mjs --base=https://...

import { writeFileSync, mkdirSync } from "node:fs";
import { ROUTES, BASE_URL } from "./seo-routes.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const base = args.base || BASE_URL;
const strategy = args.strategy || "mobile";
const apiKey = process.env.PSI_API_KEY || "";

const PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const fmt = (n, d = 0) => (n == null ? "n/a" : Number(n).toFixed(d));
const score = (s) => (s == null ? "n/a" : Math.round(s * 100));

async function runPsi(url) {
  const params = new URLSearchParams({ url, strategy });
  CATEGORIES.forEach((c) => params.append("category", c));
  if (apiKey) params.set("key", apiKey);
  const res = await fetch(`${PSI_URL}?${params}`);
  if (!res.ok) throw new Error(`PSI ${res.status}: ${await res.text()}`);
  return await res.json();
}

function extract(report) {
  const lh = report.lighthouseResult;
  if (!lh) return null;
  const audits = lh.audits || {};
  const cats = lh.categories || {};
  const opportunities = Object.values(audits)
    .filter((a) => a.details?.type === "opportunity" && (a.score ?? 1) < 0.9)
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
    .slice(0, 5)
    .map((a) => `${a.title} (${fmt(a.numericValue, 0)} ms)`);
  const diagnostics = Object.values(audits)
    .filter(
      (a) =>
        (a.score ?? 1) < 0.9 &&
        a.details?.type !== "opportunity" &&
        a.scoreDisplayMode !== "informative" &&
        a.scoreDisplayMode !== "notApplicable"
    )
    .slice(0, 5)
    .map((a) => a.title);
  return {
    perf: score(cats.performance?.score),
    a11y: score(cats.accessibility?.score),
    bp: score(cats["best-practices"]?.score),
    seo: score(cats.seo?.score),
    lcp: audits["largest-contentful-paint"]?.numericValue,
    tbt: audits["total-blocking-time"]?.numericValue,
    cls: audits["cumulative-layout-shift"]?.numericValue,
    fcp: audits["first-contentful-paint"]?.numericValue,
    si: audits["speed-index"]?.numericValue,
    opportunities,
    diagnostics,
  };
}

(async () => {
  const ts = new Date().toISOString();
  const lines = [
    `# PageSpeed Insights Report`,
    ``,
    `- Generated: ${ts}`,
    `- Strategy: **${strategy}**`,
    `- Base: ${base}`,
    `- API key: ${apiKey ? "yes" : "no (anonymous, rate-limited)"}`,
    ``,
    `## Summary`,
    ``,
    `| Route | Perf | A11y | BP | SEO | LCP (s) | TBT (ms) | CLS |`,
    `|---|---:|---:|---:|---:|---:|---:|---:|`,
  ];
  const details = [];

  for (const route of ROUTES) {
    const url = `${base}${route.path}`;
    process.stderr.write(`Auditing ${url}…\n`);
    try {
      const json = await runPsi(url);
      const m = extract(json);
      if (!m) throw new Error("no lighthouseResult");
      lines.push(
        `| \`${route.path}\` | ${m.perf} | ${m.a11y} | ${m.bp} | ${m.seo} | ${fmt(
          m.lcp / 1000,
          2
        )} | ${fmt(m.tbt, 0)} | ${fmt(m.cls, 3)} |`
      );
      details.push(
        `### \`${route.path}\``,
        ``,
        `- FCP: ${fmt(m.fcp, 0)} ms · LCP: ${fmt(m.lcp, 0)} ms · Speed Index: ${fmt(
          m.si,
          0
        )} ms · TBT: ${fmt(m.tbt, 0)} ms · CLS: ${fmt(m.cls, 3)}`,
        ``,
        `**Top opportunities**`,
        ...(m.opportunities.length ? m.opportunities.map((o) => `- ${o}`) : ["- (none above threshold)"]),
        ``,
        `**Diagnostics**`,
        ...(m.diagnostics.length ? m.diagnostics.map((d) => `- ${d}`) : ["- (none)"]),
        ``
      );
    } catch (e) {
      lines.push(`| \`${route.path}\` | error | error | error | error | - | - | - |`);
      details.push(`### \`${route.path}\``, ``, `- ✗ ${e.message}`, ``);
    }
  }

  lines.push(``, `## Details per route`, ``, ...details);

  const out = "/mnt/documents";
  try { mkdirSync(out, { recursive: true }); } catch {}
  const path = `${out}/psi-report-${strategy}.md`;
  writeFileSync(path, lines.join("\n"), "utf8");
  console.log(`Wrote ${path}`);
})();
