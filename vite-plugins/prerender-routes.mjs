// Vite plugin that emits per-route static HTML snapshots for SEO/social.
// After Vite writes dist/index.html, we read it back, rewrite the head tags
// for each known route (title, description, canonical, OG, Twitter), and emit
// dist/<route>/index.html. Lovable static hosting serves these for direct hits
// to /landing, /instalar, etc., so social crawlers see correct meta without JS.
// React Router then hydrates and takes over client-side navigation.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, BASE_URL } from "../scripts/seo-routes.mjs";

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function rewriteHead(html, route) {
  const url = `${BASE_URL}${route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const image = escapeHtml(route.image);
  const type = escapeHtml(route.type || "website");

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

  // description
  html = html.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${description}">`
  );

  // canonical (insert or replace)
  if (/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<link[^>]+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${url}">`
    );
  } else {
    html = html.replace(
      /<\/head>/i,
      `  <link rel="canonical" href="${url}">\n  </head>`
    );
  }

  // OG tags
  const setMeta = (selector, attr, value) => {
    const re = new RegExp(
      `<meta\\s+${attr}=["']${selector}["'][^>]*>`,
      "i"
    );
    const tag = `<meta ${attr}="${selector}" content="${value}">`;
    if (re.test(html)) html = html.replace(re, tag);
    else html = html.replace(/<\/head>/i, `  ${tag}\n  </head>`);
  };

  setMeta("og:type", "property", type);
  setMeta("og:url", "property", url);
  setMeta("og:title", "property", title);
  setMeta("og:description", "property", description);
  setMeta("og:image", "property", image);
  setMeta("twitter:card", "name", "summary_large_image");
  setMeta("twitter:title", "name", title);
  setMeta("twitter:description", "name", description);
  setMeta("twitter:image", "name", image);

  return html;
}

export default function prerenderRoutes() {
  return {
    name: "lovable-prerender-routes",
    apply: "build",
    closeBundle() {
      const outDir = "dist";
      let indexHtml;
      try {
        indexHtml = readFileSync(join(outDir, "index.html"), "utf8");
      } catch {
        // No SPA output (library build, electron, etc.) — skip.
        return;
      }
      const emitted = [];
      for (const route of ROUTES) {
        const html = rewriteHead(indexHtml, route);
        const dir = join(outDir, route.path.replace(/^\//, ""));
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "index.html"), html, "utf8");
        emitted.push(`${route.path}/index.html`);
      }
      // eslint-disable-next-line no-console
      console.log(
        `\n[prerender] Emitted ${emitted.length} route snapshots:\n  ${emitted.join("\n  ")}\n`
      );
    },
  };
}
