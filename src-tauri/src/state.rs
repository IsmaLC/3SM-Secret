use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;
use zeroize::Zeroize;
use crate::crypto::DerivedKey;
use crate::models::VaultPayload;

pub struct UnlockedVaultSession {
    pub key: DerivedKey,
    pub salt: [u8; 16],
    pub payload: VaultPayload,
    pub last_activity: Instant,
}

impl Drop for UnlockedVaultSession {
    fn drop(&mut self) {
        self.payload.items.zeroize();
    }
}

#[derive(Clone)]
pub struct AppSessionState {
    pub session: Arc<Mutex<Option<UnlockedVaultSession>>>,
}

impl AppSessionState {
    pub fn new() -> Self {
        Self {
            session: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn is_unlocked(&self) -> bool {
        let guard = self.session.lock().await;
        guard.is_some()
    }

    pub async fn lock(&self) {
        let mut guard = self.session.lock().await;
        if let Some(mut session) = guard.take() {
            session.payload.items.zeroize();
        }
    }

    pub async fn touch_activity(&self) {
        let mut guard = self.session.lock().await;
        if let Some(ref mut session) = *guard {
            session.last_activity = Instant::now();
        }
    }

    pub async fn check_auto_lock(&self) -> bool {
        let guard = self.session.lock().await;
        if let Some(ref session) = *guard {
            let timeout_mins = session.payload.settings.auto_lock_minutes;
            if timeout_mins > 0 {
                let elapsed = session.last_activity.elapsed();
                if elapsed.as_secs() >= (timeout_mins as u64) * 60 {
                    drop(guard);
                    self.lock().await;
                    return true;
                }
            }
        }
        false
    }
}
