#!/usr/bin/env node
/**
 * Release helper para Cap Finanzas.
 *
 * Uso:
 *   node scripts/release.mjs patch     # 1.1.8 -> 1.1.9
 *   node scripts/release.mjs minor     # 1.1.8 -> 1.2.0
 *   node scripts/release.mjs major     # 1.1.8 -> 2.0.0
 *   node scripts/release.mjs 1.2.3     # versión exacta
 *
 * Qué hace:
 *  1. Verifica que el árbol de git esté limpio y estés en main actualizado.
 *  2. Sube la versión en package.json.
 *  3. Crea un commit "chore(release): vX.Y.Z" y el tag vX.Y.Z.
 *  4. Hace push de main y del tag → dispara .github/workflows/build.yml,
 *     que compila y publica los instaladores Win/Mac/Linux en el release.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const run = (cmd, opts = {}) => {
  console.log(`\n$ ${cmd}`);
  return execSync(cmd, { stdio: "inherit", ...opts });
};
const capture = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

const arg = process.argv[2];
if (!arg) {
  console.error("Uso: node scripts/release.mjs <patch|minor|major|X.Y.Z>");
  process.exit(1);
}

const pkgPath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const current = pkg.version;

const bump = (v, kind) => {
  const [M, m, p] = v.split(".").map(Number);
  if (kind === "patch") return `${M}.${m}.${p + 1}`;
  if (kind === "minor") return `${M}.${m + 1}.0`;
  if (kind === "major") return `${M + 1}.0.0`;
  if (/^\d+\.\d+\.\d+$/.test(kind)) return kind;
  throw new Error(`Argumento inválido: ${kind}`);
};

const next = bump(current, arg);
const tag = `v${next}`;
console.log(`Versión actual: ${current} → nueva: ${next} (tag ${tag})`);

// 1. Validar estado del repo
try {
  const status = capture("git status --porcelain");
  if (status) {
    console.error("❌ Hay cambios sin commitear. Commiteá o stash antes de release.");
    console.error(status);
    process.exit(1);
  }
  const branch = capture("git rev-parse --abbrev-ref HEAD");
  if (branch !== "main") {
    console.error(`❌ Estás en '${branch}'. Cambiá a 'main' antes de release.`);
    process.exit(1);
  }
  run("git fetch --tags origin");
  const existing = capture(`git tag -l ${tag}`);
  if (existing) {
    console.error(`❌ El tag ${tag} ya existe.`);
    process.exit(1);
  }
} catch (e) {
  if (e.status) process.exit(e.status);
  throw e;
}

// 2. Bump package.json
pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✅ package.json actualizado a ${next}`);

// 3. Commit + tag
run(`git add package.json`);
run(`git commit -m "chore(release): ${tag}"`);
run(`git tag -a ${tag} -m "Release ${tag}"`);

// 4. Push
run(`git push origin main`);
run(`git push origin ${tag}`);

console.log(`\n🚀 Tag ${tag} publicado.`);
console.log(`Mirá el workflow: https://github.com/Cade80-25/Cap-Finanzas/actions`);
console.log(`Release: https://github.com/Cade80-25/Cap-Finanzas/releases/tag/${tag}`);
