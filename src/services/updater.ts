import { UpdateInfo } from "../types";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export const CURRENT_APP_VERSION = "0.2.0";
const GITHUB_REPO = "IsmaLC/3SM-Secret";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// Instancia de actualización en memoria para descarga/instalación
let activeUpdateInstance: Update | null = null;

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
 * Comprueba si hay una nueva versión disponible mediante el actualizador nativo de Tauri o la API de GitHub
 */
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  activeUpdateInstance = null;

  // 1. Intentar comprobación con el plugin nativo de Tauri Updater (con verificación de firma digital)
  if (isTauri()) {
    try {
      const update = await check();
      if (update) {
        activeUpdateInstance = update;
        return {
          hasUpdate: true,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: update.version,
          releaseNotes: update.body || "",
          publishedAt: update.date || "",
        };
      }
    } catch (tauriErr) {
      console.warn("Tauri updater check avisó:", tauriErr);
      // Continuar al fallback de GitHub API en caso de que no exista aún latest.json
    }
  }

  // 2. Consulta de respaldo directo a la API de GitHub Releases
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
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
      };
    }

    if (!response.ok) {
      throw new Error(`Error al consultar GitHub Releases (${response.status})`);
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

/**
 * Descarga e instala la actualización en caliente dentro de la app (con reporte de progreso en %)
 */
export async function downloadAndInstallAppUpdate(
  onProgress?: (progressPercent: number) => void
): Promise<void> {
  if (isTauri() && activeUpdateInstance) {
    let downloadedBytes = 0;
    let totalContentLength = 0;

    await activeUpdateInstance.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          totalContentLength = event.data.contentLength ?? 0;
          onProgress?.(0);
          break;
        case "Progress":
          downloadedBytes += event.data.chunkLength;
          if (totalContentLength > 0) {
            const percent = Math.min(
              100,
              Math.round((downloadedBytes / totalContentLength) * 100)
            );
            onProgress?.(percent);
          } else {
            onProgress?.(50);
          }
          break;
        case "Finished":
          onProgress?.(100);
          break;
      }
    });
  } else {
    // Simulación web/fallback
    for (let p = 10; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 200));
      onProgress?.(p);
    }
  }
}

/**
 * Reinicia la aplicación de forma inmediata para aplicar el nuevo binario instalado
 */
export async function relaunchApp(): Promise<void> {
  if (isTauri()) {
    try {
      await relaunch();
      return;
    } catch (err) {
      console.error("Error al reiniciar la aplicación:", err);
    }
  }
  // Si no estamos en Tauri, recargamos la ventana
  window.location.reload();
}
