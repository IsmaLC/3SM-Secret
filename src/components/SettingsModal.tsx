import React, { useState, useEffect } from "react";
import { translations, Language } from "../i18n";
import { VaultSettings, Folder, UpdateInfo } from "../types";
import {
  X,
  Settings,
  Globe,
  Clock,
  Palette,
  Folder as FolderIcon,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { checkForAppUpdates, CURRENT_APP_VERSION } from "../services/updater";

interface SettingsModalProps {
  language: Language;
  settings: VaultSettings;
  folders: Folder[];
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: VaultSettings) => Promise<void>;
  onSaveFolders: (folders: Folder[]) => Promise<void>;
  onLanguageChange: (lang: Language) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  language,
  settings,
  folders,
  isOpen,
  onClose,
  onSaveSettings,
  onSaveFolders,
  onLanguageChange,
}) => {
  const t = translations[language];

  const [currentSettings, setCurrentSettings] = useState<VaultSettings>(settings);
  const [currentFolders, setCurrentFolders] = useState<Folder[]>(folders);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados de comprobación de actualizaciones
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateInfo | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentSettings(settings);
      setCurrentFolders(folders);
      setFolderToDelete(null);
      setNewFolderName("");
      setCheckingUpdate(false);
      setUpdateResult(null);
      setUpdateError(null);
    }
  }, [isOpen, settings, folders]);

  const handleManualCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateError(null);
    setUpdateResult(null);
    try {
      const res = await checkForAppUpdates();
      setUpdateResult(res);
      const nowIso = new Date().toISOString();
      setCurrentSettings((prev) => ({
        ...prev,
        last_update_check: nowIso,
      }));
    } catch (err: any) {
      setUpdateError(err.message || t.update_check_error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  if (!isOpen) return null;

  const handleLanguageSelect = (lang: Language) => {
    setCurrentSettings({ ...currentSettings, language: lang });
    onLanguageChange(lang);
  };

  const handleCancel = () => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
    onLanguageChange(settings.language as Language);
    setCurrentSettings(settings);
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSettings(currentSettings);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    const newFolder: Folder = {
      id: "folder-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      name: trimmed,
    };
    const updated = [...currentFolders, newFolder];
    setCurrentFolders(updated);
    setNewFolderName("");
    await onSaveFolders(updated);
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    const updated = currentFolders.filter((f) => f.id !== folderToDelete.id);
    setCurrentFolders(updated);
    setFolderToDelete(null);
    await onSaveFolders(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-lg bg-surface-canvas rounded-xl border border-border-strong p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-text-primary">
              {t.settings}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sección: Gestión de Carpetas */}
        <div className="space-y-3 p-3.5 bg-surface-panel rounded-xl border border-border-strong">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <FolderIcon className="w-3.5 h-3.5 text-primary" />
              <span>{t.manage_folders}</span>
            </div>
            <span className="text-[11px] font-mono text-text-muted bg-surface-canvas px-2 py-0.5 rounded-md border border-border-subtle">
              {currentFolders.length}
            </span>
          </div>

          {/* Formulario para añadir nueva carpeta */}
          <form onSubmit={handleAddFolder} className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={t.new_folder_placeholder}
              className="flex-1 h-8 px-2.5 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-container"
            />
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="h-8 px-3 bg-primary-container hover:bg-brand-primary-hover text-on-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.add_folder}</span>
            </button>
          </form>

          {/* Lista de Carpetas Existentes */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
            {currentFolders.length === 0 ? (
              <div className="text-[11px] text-text-muted text-center py-2 italic">
                {t.no_folders}
              </div>
            ) : (
              currentFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-surface-canvas border border-border-subtle rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="font-medium text-text-primary truncate">
                      {folder.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFolderToDelete(folder)}
                    className="p-1 rounded text-text-muted hover:text-status-danger hover:bg-red-50 transition-colors"
                    title={t.delete_folder}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Diálogo de Confirmación de Eliminación de Carpeta */}
        {folderToDelete && (
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs">
            <div className="font-semibold text-status-danger">
              {t.delete_folder_confirm}
            </div>
            <div className="text-[11px] text-text-secondary font-medium">
              Carpeta: «{folderToDelete.name}»
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-2.5 py-1 text-[11px] font-medium border border-border-strong rounded-md bg-surface-canvas text-text-secondary hover:bg-surface-sidebar"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFolder}
                className="px-3 py-1 text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                {t.delete}
              </button>
            </div>
          </div>
        )}

        {/* Sección: Idioma */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Globe className="w-3.5 h-3.5 text-text-muted" />
            <span>{t.language}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLanguageSelect("es")}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentSettings.language === "es"
                  ? "border-primary-container bg-brand-primary-subtle text-primary"
                  : "border-border-strong bg-surface-canvas hover:bg-surface-sidebar text-text-secondary"
              }`}
            >
              <span>Español (España)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSelect("ca")}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentSettings.language === "ca"
                  ? "border-primary-container bg-brand-primary-subtle text-primary"
                  : "border-border-strong bg-surface-canvas hover:bg-surface-sidebar text-text-secondary"
              }`}
            >
              <span>Català</span>
            </button>
          </div>
        </div>

        {/* Sección: Autobloqueo por Inactividad */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span>{t.auto_lock}</span>
          </div>
          <select
            value={currentSettings.auto_lock_minutes}
            onChange={(e) =>
              setCurrentSettings({
                ...currentSettings,
                auto_lock_minutes: parseInt(e.target.value),
              })
            }
            className="w-full h-9 px-3 border border-border-strong rounded-lg bg-surface-canvas text-xs text-text-primary focus:outline-none focus:border-primary-container"
          >
            <option value={1}>{t.one_minute}</option>
            <option value={5}>{t.five_minutes}</option>
            <option value={15}>{t.fifteen_minutes}</option>
            <option value={30}>{t.thirty_minutes}</option>
            <option value={60}>{t.one_hour}</option>
            <option value={0}>{t.never}</option>
          </select>
        </div>

        {/* Sección: Tema visual */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Palette className="w-3.5 h-3.5 text-text-muted" />
            <span>{t.theme}</span>
          </div>
          <select
            value={currentSettings.theme}
            onChange={(e) => {
              const newTheme = e.target.value;
              setCurrentSettings({ ...currentSettings, theme: newTheme });
              document.documentElement.classList.toggle("dark", newTheme === "dark");
            }}
            className="w-full h-9 px-3 border border-border-strong rounded-lg bg-surface-canvas text-xs text-text-primary focus:outline-none focus:border-primary-container"
          >
            <option value="light">{t.theme_light}</option>
            <option value="dark">{t.theme_dark}</option>
          </select>
        </div>

        {/* Sección: Versión y Actualizaciones */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
            <span>{t.version_and_updates}</span>
          </div>

          <div className="p-3.5 bg-surface-panel rounded-xl border border-border-strong space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted bg-surface-canvas px-2.5 py-1 rounded-md border border-border-subtle font-medium">
                v{CURRENT_APP_VERSION}
              </span>

              <button
                type="button"
                disabled={checkingUpdate}
                onClick={handleManualCheckUpdate}
                className="h-8 px-3 border border-border-strong hover:bg-surface-canvas bg-surface-canvas text-text-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${checkingUpdate ? "animate-spin text-primary" : "text-text-muted"}`}
                />
                <span>{checkingUpdate ? t.checking_updates : t.check_updates_now}</span>
              </button>
            </div>

            {/* Resultado de la comprobación en la paleta corporativa (sin verde) */}
            {updateResult && (
              <div className="p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 bg-brand-primary-subtle border-primary-container/25 text-primary">
                <div className="flex items-center gap-2">
                  {updateResult.hasUpdate ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
                  )}
                  <span className="font-medium">
                    {updateResult.hasUpdate
                      ? `${t.update_available}: v${updateResult.latestVersion}`
                      : `${t.app_up_to_date} (v${updateResult.currentVersion})`}
                  </span>
                </div>
                {updateResult.hasUpdate && updateResult.releaseUrl && (
                  <a
                    href={updateResult.releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
                  >
                    <span>{t.view_update}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {updateError && (
              <div className="p-2.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 text-status-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones al pie */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs font-medium border border-border-strong rounded-lg hover:bg-surface-sidebar text-text-secondary transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold bg-primary-container hover:bg-brand-primary-hover text-on-primary rounded-lg transition-colors shadow-xs"
          >
            {saving ? "..." : t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
