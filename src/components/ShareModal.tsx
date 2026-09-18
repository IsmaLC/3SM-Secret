import { useState, useEffect } from "react";
import { VaultItem } from "../types";
import { Language, translations } from "../i18n";
import { api } from "../api";
import {
  X,
  Share2,
  Copy,
  Check,
  Flame,
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

  // Reiniciar estado cada vez que se abre el modal o se selecciona un elemento diferente
  useEffect(() => {
    if (isOpen) {
      setGeneratedUrl(null);
      setCopied(false);
      setLoading(false);
      setIncludeUsername(!!item.username);
      setIncludePassword(!!item.password);
      setIncludeNotes(!!item.notes);
      setIncludeCardNumber(!!item.card_number);
      setIncludeCardCvv(!!item.card_cvv);
      setTtlMinutes(60);
    }
  }, [isOpen, item.id]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
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

      // Enlace Zero-Knowledge: la clave AES-256 viaja solo en el fragmento #key del hash
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const fullUrl = `${baseUrl}#/share/${shareId}#key=${shareKeyHex}`;
      setGeneratedUrl(fullUrl);
    } catch (err) {
      console.error("Error generando enlace de un solo uso:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Error al copiar enlace:", err);
    }
  };

  const handleReset = () => {
    setGeneratedUrl(null);
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t.share_title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {item.name}
              </p>
            </div>
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
              {/* Explicación de seguridad */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-start gap-3">
                <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p className="font-medium mb-0.5">Autodestrucción garantizada (Burn-After-Reading)</p>
                  <p>{t.share_desc}</p>
                </div>
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
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    {t.share_link_ready}
                  </h4>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 mt-1 leading-relaxed">
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3.5 py-3 pr-24 font-mono select-all focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-semibold">{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copy}</span>
                    </>
                  )}
                </button>
              </div>

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
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
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
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={loading || (!includeUsername && !includePassword && !includeNotes && !includeCardNumber && !includeCardCvv)}
              onClick={handleGenerate}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.share_generating}
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  {t.share_generate_link}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
