export type ItemType = 'login' | 'secure_note' | 'card' | 'identity';

export interface VaultItem {
  id: string;
  name: string;
  item_type: ItemType;
  username: string;
  password: string;
  url: string;
  notes: string;
  folder_id?: string | null;
  favorite: boolean;
  totp_secret?: string | null;
  cardholder_name?: string | null;
  card_number?: string | null;
  card_brand?: string | null;
  card_exp_month?: string | null;
  card_exp_year?: string | null;
  card_cvv?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface VaultSettings {
  auto_lock_minutes: number;
  language: string; // 'es' | 'ca'
  theme: string; // 'light' | 'dark' | 'system'
  check_updates_daily?: boolean;
  last_update_check?: string | null;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
}

export interface VaultPayload {
  items: VaultItem[];
  folders: Folder[];
  settings: VaultSettings;
  password_hint?: string | null;
}

export interface PasswordGenOptions {
  length: number;
  use_uppercase: boolean;
  use_lowercase: boolean;
  use_numbers: boolean;
  use_symbols: boolean;
}

export interface PasswordGenResult {
  password: string;
  entropy_bits: number;
  strength_score: number; // 1 to 4
}

export interface SharePayload {
  title: string;
  username?: string | null;
  password?: string | null;
  notes?: string | null;
  cardholder_name?: string | null;
  card_number?: string | null;
  card_cvv?: string | null;
  card_exp?: string | null;
}

export interface ConsumedShareResponse {
  ciphertext: string;
  nonce: string;
}
