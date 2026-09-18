import React, { useState, useEffect } from "react";
import { translations, Language } from "../i18n";
import { Folder, ItemType, VaultItem } from "../types";
import { X, Plus, Key, FileText, CreditCard, Wand2, Eye, EyeOff } from "lucide-react";

interface NewItemModalProps {
  language: Language;
  isOpen: boolean;
  folders: Folder[];
  onClose: () => void;
  onSave: (item: VaultItem) => Promise<void>;
  onOpenGenerator: () => void;
  appliedPassword?: string;
  defaultItemType?: ItemType;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  language,
  isOpen,
  folders,
  onClose,
  onSave,
  onOpenGenerator,
  appliedPassword,
  defaultItemType = "login",
}) => {
  const t = translations[language];

  const [itemType, setItemType] = useState<ItemType>(defaultItemType);
  const [name, setName] = useState("");
  
  // Campos de login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  
  // Campos específicos de tarjeta de pago
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardBrand, setCardBrand] = useState("Visa");
  const [cardExpMonth, setCardExpMonth] = useState("01");
  const [cardExpYear, setCardExpYear] = useState(new Date().getFullYear().toString());
  const [cardCvv, setCardCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false);

  // Campos comunes
  const [notes, setNotes] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Función de limpieza exhaustiva del formulario
  const resetForm = () => {
    setItemType(defaultItemType || "login");
    setName("");
    setUsername("");
    setPassword("");
    setUrl("");
    setCardholderName("");
    setCardNumber("");
    setCardBrand("Visa");
    setCardExpMonth("01");
    setCardExpYear(new Date().getFullYear().toString());
    setCardCvv("");
    setShowCvv(false);
    setNotes("");
    setFolderId("");
    setShowPassword(false);
    setSaving(false);
  };

  // Cada vez que se abra el modal, se inicializa siempre completamente limpio con la categoría activa
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, defaultItemType]);

  // Si se genera una contraseña desde el generador superpuesto, aplicarla directamente
  useEffect(() => {
    if (appliedPassword) {
      setPassword(appliedPassword);
      setShowPassword(true);
    }
  }, [appliedPassword]);

  if (!isOpen) return null;

  // Formatear número de tarjeta en grupos de 4 dígitos
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 19);
    const parts = raw.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(" "));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const newItem: VaultItem = {
        id: "",
        name: name.trim(),
        item_type: itemType,
        username: itemType === "login" ? username.trim() : "",
        password: itemType === "login" ? password : "",
        url: itemType === "login" ? url.trim() : "",
        notes: notes.trim(),
        folder_id: folderId ? folderId : null,
        favorite: false,
        cardholder_name: itemType === "card" ? cardholderName.trim() : null,
        card_number: itemType === "card" ? cardNumber.replace(/\s+/g, " ").trim() : null,
        card_brand: itemType === "card" ? cardBrand : null,
        card_exp_month: itemType === "card" ? cardExpMonth : null,
        card_exp_year: itemType === "card" ? cardExpYear : null,
        card_cvv: itemType === "card" ? cardCvv.trim() : null,
        created_at: "",
        updated_at: "",
      };
      await onSave(newItem);
      onClose();
      // Reset
      setName("");
      setUsername("");
      setPassword("");
      setUrl("");
      setCardholderName("");
      setCardNumber("");
      setCardCvv("");
      setNotes("");
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => (currentYear + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-lg bg-surface-canvas rounded-xl border border-border-strong p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-text-primary">
              {itemType === "card" ? t.new_card : itemType === "secure_note" ? t.new_note : t.new_credential}
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

        {/* Selector de Tipo de Elemento */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "login", label: t.logins, icon: Key },
            { id: "secure_note", label: t.secure_notes, icon: FileText },
            { id: "card", label: t.cards, icon: CreditCard },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = itemType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setItemType(type.id as ItemType)}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isSelected
                    ? "border-primary-container bg-brand-primary-subtle text-primary"
                    : "border-border-strong bg-surface-panel hover:bg-surface-sidebar text-text-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Nombre común */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {t.name} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                itemType === "card"
                  ? "Ej: Tarjeta Santander Débito, Visa Corporativa"
                  : itemType === "secure_note"
                  ? "Ej: Claves de recuperación servidor, WiFi oficina"
                  : "Ej: Google Workspace, Amazon, GitHub"
              }
              className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* CAMPOS ESPECÍFICOS PARA TARJETAS DE PAGO */}
          {itemType === "card" && (
            <div className="p-3 bg-surface-panel rounded-xl border border-border-strong space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t.cards}</span>
              </div>

              {/* Titular */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {t.cardholder_name}
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="NOMBRE APELLIDO"
                  className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary uppercase focus:outline-none focus:border-primary-container font-mono"
                />
              </div>

              {/* Número de Tarjeta y Marca */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    {t.card_number}
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    placeholder="4532 8791 2345 9812"
                    className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    {t.card_brand}
                  </label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="w-full h-8 px-2 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">Amex</option>
                    <option value="Maestro">Maestro</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
              </div>

              {/* Fecha de Expiración y CVV */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    {t.card_exp_month}
                  </label>
                  <select
                    value={cardExpMonth}
                    onChange={(e) => setCardExpMonth(e.target.value)}
                    className="w-full h-8 px-2 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    {t.card_exp_year}
                  </label>
                  <select
                    value={cardExpYear}
                    onChange={(e) => setCardExpYear(e.target.value)}
                    className="w-full h-8 px-2 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-secondary">
                      CVV
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCvv(!showCvv)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      {showCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <input
                    type={showCvv ? "text" : "password"}
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                    placeholder="•••"
                    className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS PARA LOGIN */}
          {itemType === "login" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {t.username_or_email}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    {t.password}
                  </label>
                  <button
                    type="button"
                    onClick={onOpenGenerator}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>{t.generator_title}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className="w-full h-8 px-2.5 pr-8 bg-surface-canvas border border-border-strong rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-primary-container"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {t.website_url}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
                />
              </div>
            </>
          )}

          {/* Carpeta */}
          {folders.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {t.folders}
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
              >
                <option value="">(Sin carpeta)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notas Cifradas */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {t.notes}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notes_placeholder}
              className="w-full p-2 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container resize-none"
            />
          </div>

          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium border border-border-strong rounded-lg hover:bg-surface-sidebar text-text-secondary transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold bg-primary-container hover:bg-brand-primary-hover text-on-primary rounded-lg transition-colors shadow-xs"
            >
              {saving ? "..." : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
