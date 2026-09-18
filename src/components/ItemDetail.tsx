import React, { useState, useEffect } from "react";
import { translations, Language } from "../i18n";
import { VaultItem } from "../types";
import { api } from "../api";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Star,
  Trash2,
  Save,
  Clock,
  CreditCard,
  FileText,
  Key,
  Share2,
} from "lucide-react";
import { ShareModal } from "./ShareModal";

interface ItemDetailProps {
  language: Language;
  item: VaultItem | null;
  onSaveItem: (item: VaultItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const ItemDetail: React.FC<ItemDetailProps> = ({
  language,
  item,
  onSaveItem,
  onDeleteItem,
}) => {
  const t = translations[language];

  const [formData, setFormData] = useState<VaultItem | null>(item);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [clipboardTimer, setClipboardTimer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setFormData(item);
    setIsEditing(false);
    setShowPassword(false);
    setShowCardNumber(false);
    setShowCvv(false);
    setCopiedField(null);
    setIsShareModalOpen(false);
    setShowDeleteConfirm(false);
  }, [item]);

  useEffect(() => {
    let interval: any = null;
    if (clipboardTimer !== null && clipboardTimer > 0) {
      interval = setInterval(() => {
        setClipboardTimer((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clipboardTimer]);

  if (!item || !formData) {
    return (
      <main className="flex-1 flex items-center justify-center bg-surface-canvas p-8 text-center text-text-secondary select-none">
        <div className="max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-surface-sidebar border border-border-strong flex items-center justify-center mx-auto mb-3 text-text-muted">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary mb-1">
            {t.selected_item_empty}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            {t.select_or_create}
          </p>
        </div>
      </main>
    );
  }

  const handleCopy = async (text: string, fieldName: string) => {
    if (!text) return;
    try {
      await api.copyToClipboardTimed(text, 10);
      setCopiedField(fieldName);
      if (fieldName === "password" || fieldName === "card_number" || fieldName === "cvv") {
        setClipboardTimer(10);
      }
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      await onSaveItem(formData);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(formData.password);

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "card":
        return t.cards;
      case "secure_note":
        return t.secure_notes;
      default:
        return t.logins;
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
      case "secure_note":
        return <FileText className="w-4 h-4 text-amber-600" />;
      default:
        return <Key className="w-4 h-4 text-primary" />;
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => (currentYear + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  return (
    <main className="flex-1 bg-surface-canvas flex flex-col h-screen overflow-hidden">
      {/* 1. Banner de Estado de Seguridad Criptográfica Global (Siempre Visible Arriba) */}
      <div className="w-full px-6 py-2.5 bg-brand-primary-subtle border-b border-primary-container/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-text-primary">
              {t.security_status}
            </span>
            <span className="text-[11px] text-text-secondary hidden sm:inline">
              — {t.vault_encrypted_notice}
            </span>
          </div>
        </div>
        {clipboardTimer !== null && (
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Purga: {clipboardTimer}s</span>
          </div>
        )}
      </div>

      {/* 2. Cabecera del Elemento Seleccionado (Estable, Anclada a la Derecha) */}
      <div className="w-full px-6 py-3 border-b border-border-strong bg-surface-canvas flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-surface-panel border border-border-strong flex items-center justify-center font-bold text-sm text-primary shadow-2xs shrink-0">
            {getItemIcon(formData.item_type)}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full font-semibold text-sm text-text-primary px-2 py-1 border border-primary-container rounded bg-surface-panel focus:outline-none"
              />
            ) : (
              <h2 className="font-semibold text-sm text-text-primary truncate block" title={formData.name}>
                {formData.name}
              </h2>
            )}
            <span className="text-[11px] text-text-secondary block">
              {getItemTypeLabel(formData.item_type)}
            </span>
          </div>
        </div>

        {/* Grupo de botones de acción anclado a la derecha con altura uniforme h-8 */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => {
              const updated = { ...formData, favorite: !formData.favorite };
              setFormData(updated);
              onSaveItem(updated);
            }}
            className="h-8 w-8 rounded-lg border border-border-strong hover:bg-surface-sidebar text-text-secondary flex items-center justify-center transition-colors shrink-0"
            title={t.favorites}
          >
            <Star
              className={`w-4 h-4 ${
                formData.favorite ? "fill-amber-400 text-amber-400" : ""
              }`}
            />
          </button>

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setFormData(item);
                  setIsEditing(false);
                }}
                className="h-8 px-3 text-xs font-medium border border-border-strong rounded-lg hover:bg-surface-sidebar transition-colors flex items-center justify-center shrink-0"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="h-8 px-3 text-xs font-semibold bg-primary-container hover:bg-brand-primary-hover text-on-primary rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "..." : t.save}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="h-8 px-3 text-xs font-medium border border-border-strong rounded-lg hover:bg-surface-sidebar text-text-primary flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0"
                title={t.share}
              >
                <Share2 className="w-3.5 h-3.5 text-primary" />
                <span>{t.share}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-8 px-3 text-xs font-medium border border-border-strong rounded-lg hover:bg-surface-sidebar text-text-primary flex items-center justify-center transition-colors shrink-0"
              >
                {t.edit}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-8 w-8 rounded-lg border border-red-200 text-status-danger hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                title={t.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Cuerpo del Inspector con Scroll Vertical Propio */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-5 max-w-3xl w-full">

        {/* VISTA ESPECÍFICA: TARJETAS DE CRÉDITO / DÉBITO */}
        {formData.item_type === "card" && (
          <div className="space-y-4">
            {/* Visualización Gráfica de Tarjeta de Pago con Proporción Real ISO 1.586:1 */}
            <div className="w-full max-w-[320px] sm:max-w-[340px] aspect-[1.586/1] bg-gradient-to-tr from-slate-900 via-primary to-primary-container text-white p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden select-none">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                  {formData.card_brand || "Tarjeta de Pago"}
                </span>
                <div className="w-9 h-7 bg-amber-400/90 rounded-md flex items-center justify-center shadow-inner">
                  <div className="w-7 h-5 border border-amber-900/40 rounded-xs" />
                </div>
              </div>

              <div className="font-mono text-base sm:text-lg tracking-widest font-bold">
                {showCardNumber
                  ? formData.card_number || "•••• •••• •••• ••••"
                  : formData.card_number
                  ? `•••• •••• •••• ${formData.card_number.slice(-4)}`
                  : "•••• •••• •••• ••••"}
              </div>

              <div className="flex justify-between items-end text-xs pt-1">
                <div className="max-w-[65%] truncate">
                  <span className="block text-[10px] text-white/70 uppercase font-semibold">{t.cardholder_name}</span>
                  <span className="font-semibold uppercase tracking-wide truncate block">
                    {formData.cardholder_name || "—"}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-[10px] text-white/70 uppercase font-semibold">CADUCA</span>
                  <span className="font-mono font-semibold">
                    {formData.card_exp_month && formData.card_exp_year
                      ? `${formData.card_exp_month}/${formData.card_exp_year.slice(-2)}`
                      : "••/••"}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario / Datos de Tarjeta */}
            <div className="space-y-4 bg-surface-panel p-4 rounded-xl border border-border-strong">
              {/* Titular */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    {t.cardholder_name}
                  </label>
                  {!isEditing && formData.cardholder_name && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.cardholder_name || "", "cardholder_name")}
                      className="flex items-center gap-1 px-2 py-0.5 bg-surface-canvas hover:bg-surface-sidebar border border-border-strong rounded text-[11px] font-medium text-text-secondary transition-colors"
                    >
                      {copiedField === "cardholder_name" ? (
                        <>
                          <Check className="w-3 h-3 text-status-secure" />
                          <span className="text-status-secure">{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t.copy}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={formData.cardholder_name || ""}
                    onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
                    className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono uppercase text-text-primary focus:outline-none focus:border-primary-container"
                  />
                ) : (
                  <div className="text-xs font-mono text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle uppercase">
                    {formData.cardholder_name || "—"}
                  </div>
                )}
              </div>

              {/* Número de Tarjeta */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    {t.card_number}
                  </label>
                  {!isEditing && formData.card_number && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowCardNumber(!showCardNumber)}
                        className="p-1 text-text-muted hover:text-text-primary"
                        title={showCardNumber ? t.hide_password : t.reveal_password}
                      >
                        {showCardNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.card_number || "", "card_number")}
                        className="flex items-center gap-1 px-2 py-0.5 bg-surface-canvas hover:bg-surface-sidebar border border-border-strong rounded text-[11px] font-medium text-text-secondary transition-colors"
                      >
                        {copiedField === "card_number" ? (
                          <>
                            <Check className="w-3 h-3 text-status-secure" />
                            <span className="text-status-secure">{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t.copy}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={formData.card_number || ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 19);
                      const parts = raw.match(/.{1,4}/g) || [];
                      setFormData({ ...formData, card_number: parts.join(" ") });
                    }}
                    className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container"
                  />
                ) : (
                  <div className="text-xs font-mono text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle flex items-center justify-between">
                    <span>
                      {showCardNumber ? formData.card_number : `•••• •••• •••• ${formData.card_number ? formData.card_number.slice(-4) : "••••"}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Marca, Fecha de Caducidad y CVV */}
              <div className="grid grid-cols-3 gap-3">
                {/* Marca */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    {t.card_brand}
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.card_brand || "Visa"}
                      onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                      className="w-full h-8 px-2 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">Amex</option>
                      <option value="Maestro">Maestro</option>
                      <option value="Otra">Otra</option>
                    </select>
                  ) : (
                    <div className="text-xs text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle">
                      {formData.card_brand || "—"}
                    </div>
                  )}
                </div>

                {/* Expiración */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    {t.card_expiration}
                  </label>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <select
                        value={formData.card_exp_month || "01"}
                        onChange={(e) => setFormData({ ...formData, card_exp_month: e.target.value })}
                        className="w-1/2 h-8 px-1 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary"
                      >
                        {months.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={formData.card_exp_year || currentYear.toString()}
                        onChange={(e) => setFormData({ ...formData, card_exp_year: e.target.value })}
                        className="w-1/2 h-8 px-1 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary"
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle">
                      {formData.card_exp_month && formData.card_exp_year
                        ? `${formData.card_exp_month}/${formData.card_exp_year}`
                        : "—"}
                    </div>
                  )}
                </div>

                {/* CVV */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-secondary">
                      CVV
                    </label>
                    {!isEditing && formData.card_cvv && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowCvv(!showCvv)}
                          className="text-text-muted hover:text-text-primary"
                        >
                          {showCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(formData.card_cvv || "", "cvv")}
                          className="text-[10px] text-primary hover:underline font-medium"
                        >
                          {copiedField === "cvv" ? t.copied : t.copy}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <input
                      type={showCvv ? "text" : "password"}
                      maxLength={4}
                      value={formData.card_cvv || ""}
                      onChange={(e) => setFormData({ ...formData, card_cvv: e.target.value.replace(/\D/g, "") })}
                      className="w-full h-8 px-2 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container text-center"
                    />
                  ) : (
                    <div className="text-xs font-mono text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle text-center">
                      {showCvv ? formData.card_cvv : formData.card_cvv ? "•••" : "—"}
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {t.notes}
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t.notes_placeholder}
                    className="w-full p-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container resize-none"
                  />
                ) : (
                  <div className="text-xs text-text-primary bg-surface-canvas p-2.5 rounded-lg border border-border-subtle whitespace-pre-wrap min-h-[60px]">
                    {formData.notes || <span className="text-text-muted italic">{t.notes_placeholder}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VISTA ESPECÍFICA: INICIO DE SESIÓN */}
        {formData.item_type === "login" && (
          <div className="space-y-4 bg-surface-panel p-4 rounded-xl border border-border-strong">
            {/* Usuario / Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">
                  {t.username_or_email}
                </label>
                {!isEditing && formData.username && (
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.username, "username")}
                    className="flex items-center gap-1 px-2 py-0.5 bg-surface-canvas hover:bg-surface-sidebar border border-border-strong rounded text-[11px] font-medium text-text-secondary transition-colors"
                  >
                    {copiedField === "username" ? (
                      <>
                        <Check className="w-3 h-3 text-status-secure" />
                        <span className="text-status-secure">{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.copy}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
                />
              ) : (
                <div className="text-xs font-mono text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle">
                  {formData.username || "—"}
                </div>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">
                  {t.password}
                </label>
                {!isEditing && formData.password && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-text-muted hover:text-text-primary"
                      title={showPassword ? t.hide_password : t.reveal_password}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.password, "password")}
                      className="flex items-center gap-1 px-2 py-0.5 bg-surface-canvas hover:bg-surface-sidebar border border-border-strong rounded text-[11px] font-medium text-text-secondary transition-colors"
                    >
                      {copiedField === "password" ? (
                        <>
                          <Check className="w-3 h-3 text-status-secure" />
                          <span className="text-status-secure">{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t.copy}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container"
                />
              ) : (
                <div className="text-xs font-mono text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle flex items-center justify-between">
                  <span>
                    {showPassword ? formData.password : "••••••••••••••••"}
                  </span>
                </div>
              )}

              {/* Medidor de Fuerza */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-surface-canvas rounded-full overflow-hidden border border-border-subtle">
                    <div className={`h-full ${strength >= 1 ? "bg-status-danger" : "bg-transparent"}`} />
                    <div className={`h-full ${strength >= 2 ? "bg-status-warning" : "bg-transparent"}`} />
                    <div className={`h-full ${strength >= 3 ? "bg-primary-container" : "bg-transparent"}`} />
                    <div className={`h-full ${strength >= 4 ? "bg-status-secure" : "bg-transparent"}`} />
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>{t.password_strength}</span>
                    <span className="font-semibold text-text-secondary">
                      {strength === 1 && t.strength_weak}
                      {strength === 2 && t.strength_medium}
                      {strength === 3 && t.strength_good}
                      {strength >= 4 && t.strength_strong}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Código 2FA / TOTP */}
            {formData.totp_secret && (
              <div className="p-3 bg-surface-sidebar rounded-lg border border-border-subtle space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-border-strong"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-status-secure"
                          strokeDasharray="75, 100"
                          strokeWidth="3"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-text-primary">
                      {t.totp_code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy("584920", "totp")}
                    className="flex items-center gap-1 px-2 py-0.5 bg-surface-canvas hover:bg-surface-sidebar border border-border-strong rounded text-[11px] font-medium text-text-secondary transition-colors"
                  >
                    {copiedField === "totp" ? (
                      <>
                        <Check className="w-3 h-3 text-status-secure" />
                        <span className="text-status-secure">{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.copy_totp}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xl font-mono tracking-widest font-bold text-primary pl-7">
                  584 920
                </div>
              </div>
            )}

            {/* URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">
                  {t.website_url}
                </label>
                {!isEditing && formData.url && (
                  <a
                    href={formData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-0.5 bg-surface-canvas hover:bg-surface-sidebar border border-border-strong rounded text-[11px] font-medium text-text-secondary hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{t.open_url}</span>
                  </a>
                )}
              </div>

              {isEditing ? (
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
                />
              ) : (
                <div className="text-xs text-text-primary bg-surface-canvas p-2 rounded-lg border border-border-subtle truncate">
                  {formData.url || "—"}
                </div>
              )}
            </div>

            {/* Notas Cifradas */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {t.notes}
              </label>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t.notes_placeholder}
                  className="w-full p-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container resize-none"
                />
              ) : (
                <div className="text-xs text-text-primary bg-surface-canvas p-2.5 rounded-lg border border-border-subtle whitespace-pre-wrap min-h-[70px]">
                  {formData.notes || <span className="text-text-muted italic">{t.notes_placeholder}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA ESPECÍFICA: NOTAS SEGURAS */}
        {formData.item_type === "secure_note" && (
          <div className="space-y-4 bg-surface-panel p-4 rounded-xl border border-border-strong">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {t.notes}
              </label>
              {isEditing ? (
                <textarea
                  rows={10}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t.notes_placeholder}
                  className="w-full p-3 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container resize-none"
                />
              ) : (
                <div className="text-xs text-text-primary bg-surface-canvas p-3 rounded-lg border border-border-subtle whitespace-pre-wrap min-h-[150px]">
                  {formData.notes || <span className="text-text-muted italic">{t.notes_placeholder}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección: Rejilla de Metadatos de Seguridad de Stitch */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-text-muted border-t border-border-subtle">
          <div>
            <span className="block font-medium">{t.metadata_created}:</span>
            <span className="font-mono text-text-secondary">
              {formatSafeDate(formData.created_at, language)}
            </span>
          </div>
          <div>
            <span className="block font-medium">{t.metadata_updated}:</span>
            <span className="font-mono text-text-secondary">
              {formatSafeDate(formData.updated_at, language)}
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación Personalizado */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-sm bg-surface-canvas rounded-xl border border-border-strong p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-status-danger" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text-primary">
                  {t.delete_item_title}
                </h4>
                <p className="text-xs text-text-secondary mt-0.5 truncate max-w-[200px] font-medium">
                  {formData.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              {t.delete_item_desc}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium border border-border-strong rounded-lg hover:bg-surface-sidebar text-text-secondary transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await onDeleteItem(formData.id);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        key={`${formData.id}-${isShareModalOpen}`}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={formData}
        language={language}
      />
    </main>
  );
};

function formatSafeDate(dateStr?: string, lang: string = "es"): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(lang === "ca" ? "ca-ES" : "es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}
