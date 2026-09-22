use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ItemTypeSerdeWrapper {
    Login,
    SecureNote,
    Card,
    Identity,
}

impl Zeroize for ItemTypeSerdeWrapper {
    fn zeroize(&mut self) {
        *self = ItemTypeSerdeWrapper::Login;
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct VaultItem {
    pub id: String,
    pub name: String,
    pub item_type: ItemTypeSerdeWrapper,
    pub username: String,
    pub password: String,
    pub url: String,
    pub notes: String,
    pub folder_id: Option<String>,
    pub favorite: bool,
    pub totp_secret: Option<String>,
    #[serde(default)]
    pub cardholder_name: Option<String>,
    #[serde(default)]
    pub card_number: Option<String>,
    #[serde(default)]
    pub card_brand: Option<String>,
    #[serde(default)]
    pub card_exp_month: Option<String>,
    #[serde(default)]
    pub card_exp_year: Option<String>,
    #[serde(default)]
    pub card_cvv: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub name: String,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultSettings {
    pub auto_lock_minutes: u32,
    pub language: String,
    pub theme: String,
    #[serde(default = "default_true")]
    pub check_updates_daily: bool,
    #[serde(default)]
    pub last_update_check: Option<String>,
}

impl Default for VaultSettings {
    fn default() -> Self {
        Self {
            auto_lock_minutes: 15,
            language: "es".to_string(),
            theme: "light".to_string(),
            check_updates_daily: true,
            last_update_check: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultPayload {
    pub items: Vec<VaultItem>,
    pub folders: Vec<Folder>,
    pub settings: VaultSettings,
    pub password_hint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedEnvelope {
    pub version: u32,
    pub salt: String, // hex
    pub nonce: String, // hex
    pub ciphertext: String, // base64
    pub hint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordGenOptions {
    pub length: usize,
    pub use_uppercase: bool,
    pub use_lowercase: bool,
    pub use_numbers: bool,
    pub use_symbols: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordGenResult {
    pub password: String,
    pub entropy_bits: f64,
    pub strength_score: u8,
}
