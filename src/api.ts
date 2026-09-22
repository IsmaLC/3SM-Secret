import { invoke } from "@tauri-apps/api/core";
import {
  Folder,
  VaultItem,
  VaultPayload,
  VaultSettings,
  PasswordGenOptions,
  PasswordGenResult,
  SharePayload,
  ConsumedShareResponse,
} from "./types";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const WEB_VAULT_KEY = "3sm_secret_vault_payload";
const WEB_HASH_KEY = "3sm_secret_master_hash";

const initialDemoItems: VaultItem[] = [];
const initialDemoFolders: Folder[] = [];

export const api = {
  async vaultExists(): Promise<boolean> {
    if (isTauri()) {
      try {
        return await invoke<boolean>("vault_exists");
      } catch (err) {
        console.warn("Fallo invoke vault_exists:", err);
      }
    }
    return localStorage.getItem(WEB_VAULT_KEY) !== null;
  },

  async setupVault(masterPassword: string, hint?: string, language?: string): Promise<VaultPayload> {
    if (isTauri()) {
      try {
        return await invoke<VaultPayload>("setup_vault", {
          masterPassword,
          hint: hint || null,
          language: language || "es",
        });
      } catch (err) {
        console.warn("Fallo invoke setup_vault, usando fallback:", err);
      }
    }

    const payload: VaultPayload = {
      items: initialDemoItems,
      folders: initialDemoFolders,
      settings: {
        auto_lock_minutes: 15,
        language: language || "es",
        theme: "light",
        check_updates_daily: true,
        last_update_check: null,
      },
      password_hint: hint || null,
    };

    localStorage.setItem(WEB_VAULT_KEY, JSON.stringify(payload));
    localStorage.setItem(WEB_HASH_KEY, btoa(masterPassword));
    return payload;
  },

  async unlockVault(masterPassword: string): Promise<VaultPayload> {
    if (isTauri()) {
      try {
        return await invoke<VaultPayload>("unlock_vault", { masterPassword });
      } catch (err) {
        console.warn("Fallo invoke unlock_vault, usando fallback:", err);
        throw err;
      }
    }

    const raw = localStorage.getItem(WEB_VAULT_KEY);
    const hash = localStorage.getItem(WEB_HASH_KEY);

    if (!raw) {
      throw new Error("El baúl no existe. Configura una nueva contraseña.");
    }

    if (hash && hash !== btoa(masterPassword)) {
      throw new Error("Contraseña maestra incorrecta.");
    }

    return JSON.parse(raw) as VaultPayload;
  },

  async lockVault(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke<void>("lock_vault");
      } catch (err) {
        console.warn("Fallo invoke lock_vault:", err);
      }
    }
  },

  async getVaultPayload(): Promise<VaultPayload> {
    if (isTauri()) {
      try {
        return await invoke<VaultPayload>("get_vault_payload");
      } catch (err) {
        console.warn("Fallo invoke get_vault_payload:", err);
      }
    }

    const raw = localStorage.getItem(WEB_VAULT_KEY);
    if (!raw) throw new Error("Baúl bloqueado");
    return JSON.parse(raw);
  },

  async saveVaultItem(item: VaultItem): Promise<VaultItem> {
    if (isTauri()) {
      try {
        return await invoke<VaultItem>("save_vault_item", { item });
      } catch (err) {
        console.warn("Fallo invoke save_vault_item, usando fallback:", err);
      }
    }

    const raw = localStorage.getItem(WEB_VAULT_KEY);
    const payload: VaultPayload = raw
      ? JSON.parse(raw)
      : { items: [], folders: [], settings: { auto_lock_minutes: 15, language: "es", theme: "light" } };

    const now = new Date().toISOString();
    let savedItem = { ...item };

    if (!savedItem.id) {
      savedItem.id = "item-" + Date.now();
      savedItem.created_at = now;
      savedItem.updated_at = now;
      payload.items.push(savedItem);
    } else {
      savedItem.updated_at = now;
      const idx = payload.items.findIndex((i) => i.id === savedItem.id);
      if (idx >= 0) {
        payload.items[idx] = savedItem;
      } else {
        payload.items.push(savedItem);
      }
    }

    localStorage.setItem(WEB_VAULT_KEY, JSON.stringify(payload));
    return savedItem;
  },

  async deleteVaultItem(id: string): Promise<void> {
    if (isTauri()) {
      try {
        return await invoke<void>("delete_vault_item", { id });
      } catch (err) {
        console.warn("Fallo invoke delete_vault_item, usando fallback:", err);
      }
    }

    const raw = localStorage.getItem(WEB_VAULT_KEY);
    if (raw) {
      const payload: VaultPayload = JSON.parse(raw);
      payload.items = payload.items.filter((i) => i.id !== id);
      localStorage.setItem(WEB_VAULT_KEY, JSON.stringify(payload));
    }
  },

  async saveSettings(settings: VaultSettings): Promise<void> {
    if (isTauri()) {
      try {
        return await invoke<void>("save_settings", { settings });
      } catch (err) {
        console.warn("Fallo invoke save_settings:", err);
      }
    }

    const raw = localStorage.getItem(WEB_VAULT_KEY);
    if (raw) {
      const payload: VaultPayload = JSON.parse(raw);
      payload.settings = settings;
      localStorage.setItem(WEB_VAULT_KEY, JSON.stringify(payload));
    }
  },

  async saveFolders(folders: Folder[]): Promise<Folder[]> {
    if (isTauri()) {
      try {
        return await invoke<Folder[]>("save_folders", { folders });
      } catch (err) {
        console.warn("Fallo invoke save_folders, usando fallback:", err);
      }
    }

    const raw = localStorage.getItem(WEB_VAULT_KEY);
    if (raw) {
      const payload: VaultPayload = JSON.parse(raw);
      payload.folders = folders;
      localStorage.setItem(WEB_VAULT_KEY, JSON.stringify(payload));
    }
    return folders;
  },

  async touchActivity(): Promise<void> {
    if (isTauri()) {
      try {
        await invoke<void>("touch_activity");
      } catch (err) {
        console.warn("Fallo invoke touch_activity:", err);
      }
    }
  },

  async copyToClipboardTimed(text: string, timeoutSecs: number = 10): Promise<void> {
    if (isTauri()) {
      try {
        return await invoke<void>("copy_to_clipboard_timed", {
          text,
          timeoutSecs,
        });
      } catch (err) {
        console.warn("Fallo invoke copy_to_clipboard_timed, usando fallback web:", err);
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setTimeout(() => {
        navigator.clipboard.readText().then((current) => {
          if (current === text) {
            navigator.clipboard.writeText("");
          }
        }).catch(() => {});
      }, timeoutSecs * 1000);
    }
  },

  async generatePassword(options: PasswordGenOptions): Promise<PasswordGenResult> {
    if (isTauri()) {
      try {
        return await invoke<PasswordGenResult>("generate_secure_password", { options });
      } catch (err) {
        console.warn("Fallo invoke generate_secure_password:", err);
      }
    }

    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*()-_=+[]{};:,.<>?";

    let charset = "";
    if (options.use_uppercase) charset += uppercase;
    if (options.use_lowercase) charset += lowercase;
    if (options.use_numbers) charset += numbers;
    if (options.use_symbols) charset += symbols;
    if (!charset) charset = lowercase;

    const array = new Uint32Array(options.length);
    crypto.getRandomValues(array);

    let pwd = "";
    for (let i = 0; i < options.length; i++) {
      pwd += charset[array[i] % charset.length];
    }

    const entropy = Math.round(options.length * Math.log2(charset.length) * 10) / 10;
    const score = entropy < 40 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;

    return {
      password: pwd,
      entropy_bits: entropy,
      strength_score: score,
    };
  },

  async checkAutoLock(): Promise<boolean> {
    if (isTauri()) {
      try {
        return await invoke<boolean>("check_auto_lock");
      } catch {
        return false;
      }
    }
    return false;
  },

  // ===== COMPARTICIÓN SEGURA DE UN SOLO USO (ONE-TIME BURN-AFTER-READING) =====
  // ===== COMPARTICIÓN SEGURA DE UN SOLO USO (ONE-TIME BURN-AFTER-READING) =====
  async createSecureShare(
    payload: SharePayload,
    ttlMinutes: number = 60
  ): Promise<{ shareId: string; shareKeyHex: string }> {
    // Generación Zero-Knowledge en cliente con Web Crypto API
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const nonceBytes = new Uint8Array(12);
    crypto.getRandomValues(nonceBytes);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const json = JSON.stringify(payload);
    const encoded = new TextEncoder().encode(json);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonceBytes },
      cryptoKey,
      encoded
    );

    const shareId = "sec-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    const nonceHex = Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const shareKeyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // 1. Guardar en memoria RAM volátil del servidor local (/api/shares) sin caché ni persistencia en disco
    try {
      await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          shareId,
          ciphertext: ciphertextB64,
          nonce: nonceHex,
          ttlMinutes,
        }),
      });
    } catch (err) {
      console.warn("No se pudo contactar con /api/shares:", err);
    }

    // Purgar cualquier residuo de versiones anteriores en localStorage para máxima privacidad
    try {
      localStorage.removeItem("3sm_secret_ephemeral_shares");
    } catch {}

    return { shareId, shareKeyHex };
  },

  // Consultar estado de la URL pública de Cloudflare Tunnel (trycloudflare.com)
  async getTunnelStatus(): Promise<{ url: string | null; ready: boolean }> {
    try {
      const res = await fetch("/api/tunnel-url", { cache: "no-store" });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { url: null, ready: false };
  },

  // Obtener la URL base pública para compartir en cualquier ordenador
  async getPublicShareBaseUrl(): Promise<string> {
    try {
      for (let i = 0; i < 4; i++) {
        const status = await this.getTunnelStatus();
        if (status.ready && status.url) {
          return status.url;
        }
        await new Promise((r) => setTimeout(r, 700));
      }
    } catch {}
    return `${window.location.origin}${window.location.pathname}`;
  },

  async consumeSecureShare(shareId: string): Promise<ConsumedShareResponse> {
    // Purgar cualquier residuo antiguo
    try {
      localStorage.removeItem("3sm_secret_ephemeral_shares");
    } catch {}

    // 1. Consumir de la memoria RAM del servidor local /api/shares/ (Burn-After-Reading de un solo uso)
    try {
      const res = await fetch(`/api/shares/${shareId}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          ciphertext: data.ciphertext,
          nonce: data.nonce,
        };
      } else if (res.status === 410 || res.status === 404) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.error || "Este enlace de un solo uso ya ha sido consumido y destruido permanentemente."
        );
      }
    } catch (err: any) {
      if (err.message && err.message.includes("consumido")) {
        throw err;
      }
    }

    // 2. Respaldo en memoria RAM de Tauri (ShareStore)
    if (isTauri()) {
      try {
        return await invoke<ConsumedShareResponse>("consume_secure_share", { shareId });
      } catch (err: any) {
        throw new Error(err || "Este enlace de un solo uso no existe o ya ha sido consumido.");
      }
    }

    throw new Error("Este enlace de un solo uso no existe o ya ha sido consumido y destruido permanentemente.");
  },

  // Descifrado en cliente con Web Crypto API (Zero-Knowledge)
  async decryptSharePayload(
    ciphertextB64: string,
    nonceHex: string,
    keyHex: string
  ): Promise<SharePayload> {
    const keyBytes = hexToBytes(keyHex);
    const nonceBytes = hexToBytes(nonceHex);
    const ciphertextBytes = base64ToBytes(ciphertextB64);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes as unknown as BufferSource,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonceBytes as unknown as BufferSource },
      cryptoKey,
      ciphertextBytes as unknown as BufferSource
    );

    const json = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(json) as SharePayload;
  },
};

// Utilidades de conversión binaria seguras
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64.trim());
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}
