import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { SharePayload } from "../types";
import { Language, translations } from "../i18n";
import { Logo3SM } from "./Logo";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  CreditCard,
  FileText,
  Lock,
  Clock
} from "lucide-react";

interface ShareViewProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function ShareView({ language }: ShareViewProps) {
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Temporizador de 15 segundos exactos
  const [timeLeft, setTimeLeft] = useState(15);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  // Evitar doble llamada por React.StrictMode
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    async function loadAndBurnSecret() {
      try {
        const fullHash = window.location.hash; // Ej: '#/share/sec-123#key=abcd...'
        if (!fullHash.includes("/share/")) {
          setError("URL de enlace no válida.");
          setLoading(false);
          return;
        }

        const parts = fullHash.split("#key=");
        const sharePath = parts[0];
        const keyHex = parts[1];

        const match = sharePath.match(/\/share\/([^/?#]+)/);
        const shareId = match ? match[1] : null;

        if (!shareId || !keyHex) {
          setError("El enlace no contiene los parámetros criptográficos necesarios.");
          setLoading(false);
          return;
        }

        // 1. Consumir inmediatamente del backend/servidor (Burn-After-Reading)
        const consumed = await api.consumeSecureShare(shareId);

        // 2. Descifrar en memoria cliente usando la clave contenida en el fragmento hash
        const decrypted = await api.decryptSharePayload(
          consumed.ciphertext,
          consumed.nonce,
          keyHex
        );

        setPayload(decrypted);

        // Limpiar el fragmento de la clave de la URL del navegador para no dejar rastros en historial
        try {
          window.history.replaceState(null, "", window.location.pathname + "#/share/active");
        } catch {}
      } catch (err: any) {
        console.error("Error al consumir secreto:", err);
        setError(err.message || t.share_view_burned_desc);
      } finally {
        setLoading(false);
      }
    }

    loadAndBurnSecret();
  }, []);

  // Temporizador regresivo de 15 segundos para la visualización con higiene de memoria
  useEffect(() => {
    if (!payload || isTimeExpired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Higiene de memoria: sobrescritura antes de descartar (Zeroize en frontend)
          if (payload) {
            payload.password = "";
            payload.username = "";
            payload.notes = "";
            payload.card_number = "";
            payload.card_cvv = "";
          }
          setPayload(null);
          setIsTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (payload) {
        payload.password = "";
        payload.username = "";
        payload.notes = "";
      }
    };
  }, [payload, isTimeExpired]);

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await api.copyToClipboardTimed(text, 15);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
    }
  };

  // Porcentaje restante de tiempo (15s = 100%)
  const progressPercent = Math.max(0, (timeLeft / 15) * 100);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-primary/20 font-sans">
      {/* Barra superior con Logo */}
      <div className="w-full max-w-lg mb-5 flex items-center px-2">
        <div className="flex items-center gap-3">
          <Logo3SM className="h-11 w-auto" />
          <div className="h-7 w-px bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
          <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-base font-sans">
            3SM Secret <span className="text-xs font-normal text-slate-400">| Send</span>
          </span>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
        {/* Barra de progreso de tiempo de vida (15 segundos) */}
        {payload && !isTimeExpired && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 font-sans">
              {t.share_view_loading}
            </p>
          </div>
        ) : isTimeExpired ? (
          /* Vista tras agotarse los 15 segundos exactos */
          <div className="p-8 text-center space-y-5 animate-in fade-in duration-300 font-sans">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-primary-subtle text-primary flex items-center justify-center">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-sans">
                Tiempo de visualización agotado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto font-sans">
                Los 15 segundos han expirado y la información ha sido eliminada permanentemente.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 text-left font-sans">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                La credencial ya no existe en ningún servidor ni en este navegador.
              </span>
            </div>
          </div>
        ) : error ? (
          /* Vista de enlace ya quemado o no válido */
          <div className="p-8 text-center space-y-5 animate-in fade-in duration-300 font-sans">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-sans">
                {t.share_view_burned}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto font-sans">
                {error}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 text-left font-sans">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                Por razones de seguridad, cada enlace solo puede descifrarse una única vez.
              </span>
            </div>
          </div>
        ) : payload ? (
          /* Vista de credencial descifrada con éxito durante los 15 segundos */
          <div>
            {/* Cabecera de secreto armonizada con el resto de la app */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-primary-subtle text-primary flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-sans">
                      {t.share_view_title}
                    </h1>
                  </div>
                </div>

                {/* Badge de cuenta atrás de 15 segundos con paleta corporativa */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary-subtle text-primary border border-primary-container/20 font-sans">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{timeLeft}s</span>
                </div>
              </div>
            </div>

            {/* Campos descifrados */}
            <div className="p-6 space-y-4">
              {/* Usuario / Email */}
              {payload.username && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    {t.username_or_email}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={payload.username}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-medium select-all focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopy(payload.username!, "username")}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title={t.copy}
                    >
                      {copiedField === "username" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Contraseña */}
              {payload.password && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    {t.password}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full">
                      <input
                        type={showPassword ? "text" : "password"}
                        readOnly
                        value={payload.password}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 pr-10 text-xs font-medium tracking-wider select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => handleCopy(payload.password!, "password")}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title={t.copy}
                    >
                      {copiedField === "password" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Datos de tarjeta si aplica */}
              {payload.card_number && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>Datos de Tarjeta de Pago</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-400">{t.card_number}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {payload.card_number}
                        </span>
                        <button
                          onClick={() => handleCopy(payload.card_number!, "card")}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {copiedField === "card" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {payload.card_exp && (
                        <div>
                          <span className="text-[11px] text-slate-400">{t.card_expiration}</span>
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                            {payload.card_exp}
                          </p>
                        </div>
                      )}
                      {payload.card_cvv && (
                        <div>
                          <span className="text-[11px] text-slate-400">{t.card_cvv}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                              {showCvv ? payload.card_cvv : "•••"}
                            </span>
                            <button
                              onClick={() => setShowCvv(!showCvv)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {showCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleCopy(payload.card_cvv!, "cvv")}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              {copiedField === "cvv" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {payload.notes && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {t.notes}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(payload.notes!, "notes")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors shadow-sm"
                      title={t.copy}
                    >
                      {copiedField === "notes" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.copy}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all cursor-text focus:outline-none">
                    {payload.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
