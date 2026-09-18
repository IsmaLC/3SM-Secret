import React, { useState, useEffect } from "react";
import { translations, Language } from "../i18n";
import { api } from "../api";
import { PasswordGenOptions, PasswordGenResult } from "../types";
import { X, RefreshCw, Copy, Check, Wand2 } from "lucide-react";

interface PasswordGeneratorModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  language,
  isOpen,
  onClose,
  onSelectPassword,
}) => {
  const t = translations[language];

  const [options, setOptions] = useState<PasswordGenOptions>({
    length: 18,
    use_uppercase: true,
    use_lowercase: true,
    use_numbers: true,
    use_symbols: true,
  });

  const [result, setResult] = useState<PasswordGenResult>({
    password: "",
    entropy_bits: 0,
    strength_score: 4,
  });

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.generatePassword(options);
      setResult(res);
    } catch {
      // Fallback local
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
      let pwd = "";
      for (let i = 0; i < options.length; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setResult({
        password: pwd,
        entropy_bits: Math.round(options.length * Math.log2(chars.length) * 10) / 10,
        strength_score: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generate();
    }
  }, [isOpen, options]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!result.password) return;
    try {
      await api.copyToClipboardTimed(result.password, 10);
    } catch {
      navigator.clipboard.writeText(result.password);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 1:
        return "bg-status-danger";
      case 2:
        return "bg-status-warning";
      case 3:
        return "bg-primary-container";
      case 4:
      default:
        return "bg-status-secure";
    }
  };

  const getStrengthText = (score: number) => {
    switch (score) {
      case 1:
        return t.strength_weak;
      case 2:
        return t.strength_medium;
      case 3:
        return t.strength_good;
      case 4:
      default:
        return t.strength_strong;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-surface-canvas rounded-xl border border-border-strong p-6 shadow-2xl space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-text-primary">
              {t.generator_title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display de la contraseña generada */}
        <div className="p-3 bg-surface-sidebar border border-border-strong rounded-xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-base font-bold text-primary break-all tracking-wider">
              {result.password || "••••••••••••••••"}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={generate}
                className="p-1.5 rounded-lg border border-border-strong bg-surface-canvas hover:bg-surface-panel text-text-secondary transition-colors"
                title={t.regenerate}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg border border-border-strong bg-surface-canvas hover:bg-surface-panel text-text-secondary transition-colors"
                title={t.copy}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-status-secure" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Barra de Fuerza y Entropía */}
          <div className="pt-1">
            <div className="h-1.5 w-full bg-surface-canvas rounded-full overflow-hidden border border-border-subtle">
              <div
                className={`h-full ${getStrengthColor(result.strength_score)} transition-all`}
                style={{ width: `${Math.min(100, (result.entropy_bits / 90) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-text-muted mt-1 font-medium">
              <span>{getStrengthText(result.strength_score)}</span>
              <span>{result.entropy_bits} {t.bits}</span>
            </div>
          </div>
        </div>

        {/* Control Deslizante de Longitud */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>{t.length}</span>
            <span className="font-mono text-primary font-bold">{options.length}</span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
            className="w-full accent-primary-container cursor-pointer"
          />
        </div>

        {/* Alternadores de Caracteres */}
        <div className="space-y-2 pt-1">
          {[
            { key: "use_uppercase", label: t.uppercase },
            { key: "use_lowercase", label: t.lowercase },
            { key: "use_numbers", label: t.numbers },
            { key: "use_symbols", label: t.symbols },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between text-xs text-text-secondary cursor-pointer hover:text-text-primary"
            >
              <span>{item.label}</span>
              <input
                type="checkbox"
                checked={(options as any)[item.key]}
                onChange={(e) =>
                  setOptions({ ...options, [item.key]: e.target.checked })
                }
                className="w-4 h-4 rounded accent-primary-container cursor-pointer"
              />
            </label>
          ))}
        </div>

        {/* Acciones al pie */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium border border-border-strong rounded-lg hover:bg-surface-sidebar text-text-secondary transition-colors"
          >
            {t.cancel}
          </button>
          {onSelectPassword ? (
            <button
              type="button"
              onClick={() => {
                onSelectPassword(result.password);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-semibold bg-primary-container hover:bg-brand-primary-hover text-on-primary rounded-lg transition-colors shadow-xs"
            >
              {t.use_in_form}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-1.5 text-xs font-semibold bg-primary-container hover:bg-brand-primary-hover text-on-primary rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copied : t.copy_password}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
