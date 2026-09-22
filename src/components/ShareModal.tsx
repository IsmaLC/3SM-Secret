import { useState, useEffect } from "react";
import { VaultItem } from "../types";
import { Language, translations } from "../i18n";
import { api } from "../api";
import { FuseButton } from "./FuseButton";
import {
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  KeyRound,
  Eye,
  CreditCard,
  FileText
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VaultItem;
  language: Language;
}

export function ShareModal({ isOpen, onClose, item, language }: ShareModalProps) {
  const t = translations[language];

  // Configuración de compartición
  const [includeUsername, setIncludeUsername] = useState(!!item.username);
  const [includePassword, setIncludePassword] = useState(!!item.password);
  const [includeNotes, setIncludeNotes] = useState(!!item.notes);
  const [includeCardNumber, setIncludeCardNumber] = useState(!!item.card_number);
  const [includeCardCvv, setIncludeCardCvv] = useState(!!item.card_cvv);
  const [ttlMinutes, setTtlMinutes] = useState(60); // 1 hora por defecto

  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [clipboardSeconds, setClipboardSeconds] = useState<number | null>(null);

  // Reiniciar estado cada vez que se abre el modal o se selecciona un elemento diferente
  useEffect(() => {
    if (isOpen) {
      setGeneratedUrl(null);
      setCopied(false);
      setClipboardSeconds(null);
      setLoading(false);
      setIncludeUsername(!!item.username);
      setIncludePassword(!!item.password);
      setIncludeNotes(!!item.notes);
      setIncludeCardNumber(!!item.card_number);
      setIncludeCardCvv(!!item.card_cvv);
      setTtlMinutes(60);
    }
  }, [isOpen, item.id]);

  // Contador regresivo para la purga del portapapeles (20 segundos)
  useEffect(() => {
    if (clipboardSeconds !== null && clipboardSeconds > 0) {
      const timer = setTimeout(() => {
        setClipboardSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [clipboardSeconds]);

  if (!isOpen) return null;

  const handleGenerate = async (): Promise<string | void> => {
    setLoading(true);
    try {
      const payload: any = {
        title: item.name,
      };

      if (includeUsername && item.username) payload.username = item.username;
      if (includePassword && item.password) payload.password = item.password;
      if (includeNotes && item.notes) payload.notes = item.notes;
      if (includeCardNumber && item.card_number) {
        payload.card_number = item.card_number;
        payload.cardholder_name = item.cardholder_name || undefined;
        if (item.card_exp_month && item.card_exp_year) {
          payload.card_exp = `${item.card_exp_month}/${item.card_exp_year}`;
        }
      }
      if (includeCardCvv && item.card_cvv) payload.card_cvv = item.card_cvv;

      const { shareId, shareKeyHex } = await api.createSecureShare(payload, ttlMinutes);

      // Obtener URL base de Cloudflare Tunnel (trycloudflare.com) para acceso universal
      const publicBase = await api.getPublicShareBaseUrl();
      const baseClean = publicBase.endsWith("/") ? publicBase : `${publicBase}/`;
      // Enlace Zero-Knowledge: la clave AES-256 viaja únicamente en el fragmento #key del hash
      const fullUrl = `${baseClean}#/share/${shareId}#key=${shareKeyHex}`;
      return fullUrl;
    } catch (err) {
      console.error("Error generando enlace de un solo uso:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      // Copiar al portapapeles y programar la purga automática estricta a los 20 segundos
      await api.copyToClipboardTimed(generatedUrl, 20);

      // Respaldo navegador directo por seguridad adicional
      if (navigator.clipboard) {
        setTimeout(async () => {
          try {
            const current = await navigator.clipboard.readText();
            if (current === generatedUrl) {
              await navigator.clipboard.writeText("");
            }
          } catch {}
        }, 20000);
      }

      setCopied(true);
      setClipboardSeconds(20);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Error al copiar enlace:", err);
    }
  };

  const handleReset = () => {
    setGeneratedUrl(null);
    setCopied(false);
    setClipboardSeconds(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <Share2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.share_title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!generatedUrl ? (
            <>
              {/* Aviso claro y sobrio de un solo uso */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.share_desc}
                </p>
              </div>

              {/* Elementos a incluir */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Datos que se revelarán en el enlace
                </label>

                <div className="space-y-2">
                  {item.username && (
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {t.username_or_email}
                          </span>
                          <p className="text-xs text-slate-400">{item.username}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeUsername}
                        onChange={(e) => setIncludeUsername(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                    </label>
                  )}

                  {item.password && (
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {t.password}
                          </span>
                          <p className="text-xs text-slate-400">••••••••••••</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includePassword}
                        onChange={(e) => setIncludePassword(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                    </label>
                  )}

                  {item.card_number && (
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {t.card_number}
                          </span>
                          <p className="text-xs text-slate-400">•••• {item.card_number.slice(-4)}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeCardNumber}
                        onChange={(e) => setIncludeCardNumber(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                    </label>
                  )}

                  {item.card_cvv && (
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {t.card_cvv}
                          </span>
                          <p className="text-xs text-slate-400">•••</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeCardCvv}
                        onChange={(e) => setIncludeCardCvv(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                    </label>
                  )}

                  {item.notes && (
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {t.notes}
                          </span>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">
                            {item.notes}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeNotes}
                        onChange={(e) => setIncludeNotes(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Tiempo de caducidad */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {t.share_expiration}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTtlMinutes(60)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      ttlMinutes === 60
                        ? "bg-primary/10 border-primary text-primary dark:bg-primary/20"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t.share_1h}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTtlMinutes(1440)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      ttlMinutes === 1440
                        ? "bg-primary/10 border-primary text-primary dark:bg-primary/20"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t.share_24h}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Vista tras generar el enlace */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/20 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.share_link_ready}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t.share_link_warning}
                  </p>
                </div>
              </div>

              {/* Input con la URL generada */}
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="w-full bg-slate-50/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3.5 py-3 pr-24 font-mono select-all focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleCopy}
                  className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-primary-container hover:bg-brand-primary-hover text-on-primary"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copy}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Indicador discreto de autodestrucción del portapapeles (20 segundos) */}
              {clipboardSeconds !== null && (
                <div className="flex items-center gap-2 text-xs text-primary dark:text-primary-fixed-dim bg-brand-primary-subtle px-3 py-2 rounded-xl border border-primary-container/20 animate-in fade-in duration-150">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>El enlace permanecerá en el portapapeles durante {clipboardSeconds} s</span>
                </div>
              )}

              {/* Acciones tras generar el enlace */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2 px-3 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Generar otro enlace
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl transition-all border border-slate-300 dark:border-slate-700 shadow-2xs"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        {!generatedUrl && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl transition-all shadow-2xs"
            >
              {t.cancel}
            </button>
            <FuseButton
              label={t.share_generate_link}
              activeLabel={t.share_generating}
              icon={<Share2 className="w-3.5 h-3.5" />}
              duration={3200}
              disabled={loading || (!includeUsername && !includePassword && !includeNotes && !includeCardNumber && !includeCardCvv)}
              onTrigger={handleGenerate}
              onComplete={(url) => {
                if (url) {
                  setGeneratedUrl(url);
                }
              }}
              className="bg-primary-container hover:bg-brand-primary-hover text-on-primary rounded-xl shadow-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}
