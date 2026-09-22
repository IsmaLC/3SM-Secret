import { UpdateInfo } from "../types";

export const CURRENT_APP_VERSION = "0.2.0";
const GITHUB_REPO = "IsmaLC/3SM-Secret";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Compara dos versiones semánticas (ej: '0.1.0' y '0.2.0')
 * Devuelve 1 si v1 > v2, -1 si v1 < v2, y 0 si son equivalentes.
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, "").trim();
  const clean2 = v2.replace(/^v/i, "").trim();

  const parts1 = clean1.split(".").map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split(".").map((p) => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Determina si han transcurrido más de 24 horas desde la última comprobación
 */
export function isDailyCheckDue(lastCheckIso?: string | null): boolean {
  if (!lastCheckIso) return true;
  try {
    const lastDate = new Date(lastCheckIso).getTime();
    if (isNaN(lastDate)) return true;
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - lastDate >= oneDayMs;
  } catch {
    return true;
  }
}

/**
 * Consulta la última versión pública disponible en GitHub Releases
 */
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(GITHUB_API_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.status === 404) {
      // Repositorio o sin releases publicados aún
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
      };
    }

    if (!response.ok) {
      throw new Error(`Error del servidor de actualizaciones (${response.status})`);
    }

    const data = await response.json();
    const releaseTag = (data.tag_name || "").replace(/^v/i, "").trim();

    if (!releaseTag) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
      };
    }

    const hasNewer = compareSemver(releaseTag, CURRENT_APP_VERSION) > 0;

    return {
      hasUpdate: hasNewer,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: releaseTag,
      releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      releaseNotes: data.body || "",
      publishedAt: data.published_at || "",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
