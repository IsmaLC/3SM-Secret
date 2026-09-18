import React, { useState } from "react";
import { translations, Language } from "../i18n";
import { api } from "../api";
import { VaultPayload } from "../types";
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, Globe } from "lucide-react";
import { Logo3SM } from "./Logo";

interface LockScreenProps {
  isSetup: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onUnlocked: (payload: VaultPayload) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isSetup,
  language,
  onLanguageChange,
  onUnlocked,
}) => {
  const t = translations[language];

  // Estados
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hint, setHint] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSetup) {
      if (password.length < 8) {
        setError(t.password_too_short);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.passwords_dont_match);
        return;
      }

      setLoading(true);
      try {
        const payload = await api.setupVault(password, hint, language);
        onUnlocked(payload);
      } catch (err: any) {
        setError(typeof err === "string" ? err : err.message || "Error al configurar la bóveda");
      } finally {
        setLoading(false);
      }
    } else {
      if (!password) return;
      setLoading(true);
      try {
        const payload = await api.unlockVault(password);
        onUnlocked(payload);
      } catch (err: any) {
        setError(typeof err === "string" ? err : err.message || "Contraseña maestra incorrecta");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface-canvas p-8 shadow-sm relative">
        {/* Selector de idioma flotante en esquina superior derecha */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface-sidebar border border-border-subtle p-1 rounded-lg">
          <Globe className="w-3.5 h-3.5 text-text-muted ml-1" />
          <button
            type="button"
            onClick={() => onLanguageChange("es")}
            className={`px-2 py-0.5 text-xs font-semibold rounded ${
              language === "es"
                ? "bg-surface-canvas text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange("ca")}
            className={`px-2 py-0.5 text-xs font-semibold rounded ${
              language === "ca"
                ? "bg-surface-canvas text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            CA
          </button>
        </div>

        {/* Cabecera centrada con Logo Oficial de Stitch */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6 border-b border-border-subtle">
          <Logo3SM className="h-20 w-auto mb-3" color="text-primary" />
          <h1 className="font-bold text-lg text-text-primary tracking-tight">
            {t.app_name}
          </h1>
          <p className="font-medium text-xs text-text-secondary">
            {t.vault_title}
          </p>
        </div>

        {/* Título y descripción de la acción */}
        <div className="pt-6 pb-4 text-center">
          <h2 className="text-base font-bold tracking-tight text-text-primary">
            {isSetup ? t.create_vault_title : t.unlock_vault}
          </h2>
          <p className="mt-1 text-xs text-text-secondary leading-relaxed">
            {isSetup ? t.create_vault_subtitle : t.enter_master_password}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 border border-red-200 text-status-danger text-sm">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t.master_password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                placeholder=""
                className="w-full h-10 px-3 pr-10 rounded-lg border border-border-strong bg-surface-canvas text-text-primary focus:outline-none focus:border-primary-container transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2.5 text-text-muted hover:text-text-primary"
                title={showPassword ? t.hide_password : t.reveal_password}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Medidor visual de fuerza si es creación de baúl */}
            {isSetup && password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-surface-sidebar rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      strength >= 1 ? "bg-status-danger" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full ${
                      strength >= 2 ? "bg-status-warning" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full ${
                      strength >= 3 ? "bg-primary-container" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full ${
                      strength >= 4 ? "bg-status-secure" : "bg-transparent"
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-secondary">
                  <span>{t.password_strength}</span>
                  <span className="font-medium">
                    {strength === 1 && t.strength_weak}
                    {strength === 2 && t.strength_medium}
                    {strength === 3 && t.strength_good}
                    {strength >= 4 && t.strength_strong}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isSetup && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t.confirm_master_password}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder=""
                  className="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-canvas text-text-primary focus:outline-none focus:border-primary-container transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t.password_hint}
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder={t.password_hint_placeholder}
                  className="w-full h-10 px-3 rounded-lg border border-border-strong bg-surface-canvas text-text-primary focus:outline-none focus:border-primary-container transition-colors text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-primary-container hover:bg-brand-primary-hover active:bg-brand-primary-active text-on-primary font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isSetup ? t.creating : t.unlocking}</span>
              </>
            ) : (
              <>
                {isSetup ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isSetup ? t.create_vault_button : t.unlock_button}</span>
              </>
            )}
          </button>
        </form>

        {/* Notificación de seguridad al pie */}
        <div className="mt-6 pt-4 border-t border-border-subtle text-center text-xs text-text-muted">
          {t.vault_encrypted_notice}
        </div>
      </div>
    </div>
  );
};
