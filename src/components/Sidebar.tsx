import React from "react";
import { translations, Language } from "../i18n";
import { Folder } from "../types";
import {
  Shield,
  Key,
  FileText,
  CreditCard,
  Star,
  FolderIcon,
  Wand2,
  Settings,
  Lock,
} from "lucide-react";
import { Logo3SM } from "./Logo";

interface SidebarProps {
  language: Language;
  selectedCategory: string;
  selectedFolderId: string | null;
  folders: Folder[];
  itemCounts: {
    all: number;
    login: number;
    secure_note: number;
    card: number;
    identity: number;
    favorites: number;
  };
  onSelectCategory: (category: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onOpenGenerator: () => void;
  onOpenSettings: () => void;
  onLockVault: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  language,
  selectedCategory,
  selectedFolderId,
  folders,
  itemCounts,
  onSelectCategory,
  onSelectFolder,
  onOpenGenerator,
  onOpenSettings,
  onLockVault,
}) => {
  const t = translations[language];

  const navItems = [
    { id: "all", label: t.all_items, icon: Shield, count: itemCounts.all },
    { id: "login", label: t.logins, icon: Key, count: itemCounts.login },
    { id: "secure_note", label: t.secure_notes, icon: FileText, count: itemCounts.secure_note },
    { id: "card", label: t.cards, icon: CreditCard, count: itemCounts.card },
    { id: "favorites", label: t.favorites, icon: Star, count: itemCounts.favorites },
  ];

  return (
    <aside className="w-64 shrink-0 bg-surface-sidebar border-r border-border-strong flex flex-col h-screen select-none">
      {/* Cabecera con Branding Oficial de Stitch */}
      <div className="h-16 px-4 border-b border-border-strong flex items-center justify-between bg-surface-canvas shrink-0">
        <div className="flex items-center gap-3">
          <Logo3SM className="h-10 w-auto" color="text-primary" />
          <div>
            <span className="font-bold text-text-primary text-sm tracking-tight block">
              3SM Secret
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">
              Bóveda Local
            </span>
          </div>
        </div>
      </div>

      {/* Navegación por Categorías */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 mb-1.5">
            {t.vault_title}
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedCategory === item.id && selectedFolderId === null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(item.id);
                    onSelectFolder(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-primary-container text-white shadow-xs"
                      : "text-text-secondary hover:bg-surface-canvas hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-text-secondary"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-surface-canvas border border-border-subtle text-text-muted"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Carpetas */}
        <div>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 mb-1.5">
            {t.folders}
          </div>
          <nav className="space-y-0.5">
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => onSelectFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-primary-container text-white shadow-xs"
                      : "text-text-secondary hover:bg-surface-canvas hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-text-secondary"}`} />
                    <span className="truncate">{folder.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Botones de acción inferiores */}
      <div className="p-3 border-t border-border-strong bg-surface-canvas space-y-1 shrink-0">
        <button
          type="button"
          onClick={onOpenGenerator}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-sidebar hover:text-text-primary transition-colors"
        >
          <Wand2 className="w-4 h-4 text-primary" />
          <span>{t.generator_title}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-sidebar hover:text-text-primary transition-colors"
        >
          <Settings className="w-4 h-4 text-text-secondary" />
          <span>{t.settings}</span>
        </button>

        <button
          type="button"
          onClick={onLockVault}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-status-danger hover:bg-red-50 transition-colors"
        >
          <Lock className="w-4 h-4" />
          <span>{t.lock_now}</span>
        </button>
      </div>
    </aside>
  );
};
