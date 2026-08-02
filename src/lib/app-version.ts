// Single source of truth para la versión de la app.
// Se lee desde package.json para que Instalar, AboutDialog,
// auto-updater y release notes nunca se desfasen.
import pkg from "../../package.json";

export const APP_VERSION: string = pkg.version;
export const GITHUB_OWNER = "Cade80-25";
export const GITHUB_REPO = "Cap-Finanzas";
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
export const GITHUB_LATEST_RELEASE_URL = `${GITHUB_RELEASES_URL}/latest`;

/** URL directa a un asset de una versión específica (default: la actual). */
export const releaseAssetUrl = (file: string, version: string = APP_VERSION) =>
  `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/v${version}/${file}`;

/** Nombres de los instaladores que produce electron-builder por defecto. */
export const installerFiles = (version: string = APP_VERSION) => ({
  windows: `Cap.Finanzas.Setup.${version}.exe`,
  macArm: `Cap.Finanzas-${version}-arm64.dmg`,
  macIntel: `Cap.Finanzas-${version}.dmg`,
  linuxAppImage: `Cap.Finanzas-${version}.AppImage`,
});
