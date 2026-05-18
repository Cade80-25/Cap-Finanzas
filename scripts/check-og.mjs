#!/usr/bin/env node
// Fetches each route's prerendered HTML and validates that the expected
// OG/Twitter/title/description/canonical metadata is present.
//
// Usage:
//   node scripts/check-og.mjs                    # checks https://capfinanzas.com
//   node scripts/check-og.mjs --base=https://...
//   node scripts/check-og.mjs --local            # checks ./dist/<route>/index.html

import { readFileSync } from "node:fs";
import { ROUTES, BASE_URL } from "./seo-routes.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const local = !!args.local;
const base = args.base || BASE_URL;

const META_RULES = [
  { label: "title", regex: /<title>([^<]*)<\/title>/i, expect: (r) => r.title },
  {
    label: "description",
    regex: /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    expect: (r) => r.description,
  },
  {
    label: "canonical",
    regex: /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
    expect: (r) => `${BASE_URL}${r.path}`,
  },
  {
    label: "og:title",
    regex: /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    expect: (r) => r.title,
  },
  {
    label: "og:description",
    regex: /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    expect: (r) => r.description,
  },
  {
    label: "og:url",
    regex: /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i,
    expect: (r) => `${BASE_URL}${r.path}`,
  },
  {
    label: "og:image",
    regex: /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    expect: (r) => r.image,
  },
  {
    label: "twitter:card",
    regex: /<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i,
    expect: () => "summary_large_image",
  },
  {
    label: "twitter:title",
    regex: /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i,
    expect: (r) => r.title,
  },
  {
    label: "twitter:description",
    regex: /<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i,
    expect: (r) => r.description,
  },
  {
    label: "twitter:image",
    regex: /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    expect: (r) => r.image,
  },
];

async function loadHtml(route) {
  if (local) {
    return readFileSync(`dist${route.path}/index.html`, "utf8");
  }
  const url = `${base}${route.path}`;
  const res = await fetch(url, { headers: { "user-agent": "CapFinanzasSeoCheck/1.0" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return await res.text();
}

function checkRoute(route, html) {
  const results = META_RULES.map((rule) => {
    const match = html.match(rule.regex);
    const found = match ? match[1].trim() : null;
    const expected = rule.expect(route);
    const ok = found === expected;
    return { label: rule.label, found, expected, ok };
  });
  return results;
}

(async () => {
  let totalFail = 0;
  for (const route of ROUTES) {
    console.log(`\n=== ${route.path} ===`);
    let html;
    try {
      html = await loadHtml(route);
    } catch (e) {
      console.log(`  ✗ fetch failed: ${e.message}`);
      totalFail++;
      continue;
    }
    const results = checkRoute(route, html);
    for (const r of results) {
      if (r.ok) {
        console.log(`  ✓ ${r.label}`);
      } else {
        totalFail++;
        console.log(`  ✗ ${r.label}`);
        console.log(`      expected: ${r.expected}`);
        console.log(`      found:    ${r.found ?? "(missing)"}`);
      }
    }
  }
  console.log(`\n${totalFail === 0 ? "✓ all checks passed" : `✗ ${totalFail} mismatch(es)`}`);
  process.exit(totalFail === 0 ? 0 : 1);
})();
