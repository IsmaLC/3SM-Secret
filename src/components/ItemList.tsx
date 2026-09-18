import React, { useState } from "react";
import { translations, Language } from "../i18n";
import { VaultItem } from "../types";
import { Search, Plus, SlidersHorizontal, ShieldCheck, FileText, CreditCard, UserCheck, Star } from "lucide-react";

interface ItemListProps {
  language: Language;
  items: VaultItem[];
  selectedItem: VaultItem | null;
  onSelectItem: (item: VaultItem) => void;
  onNewItem: () => void;
  categoryTitle?: string;
}

export const ItemList: React.FC<ItemListProps> = ({
  language,
  items,
  selectedItem,
  onSelectItem,
  onNewItem,
  categoryTitle,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // Filtrado reactivo en tiempo real
  const filteredItems = items
    .filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });

  const getItemInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || "•";
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "secure_note":
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case "card":
        return <CreditCard className="w-3.5 h-3.5 text-indigo-600" />;
      case "identity":
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return null;
    }
  };

  return (
    <section className="w-[380px] shrink-0 border-r border-border-strong bg-surface-panel flex flex-col h-screen select-none">
      {/* Barra de herramientas superior */}
      <div className="p-3 border-b border-border-strong bg-surface-canvas flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-text-primary text-sm tracking-tight">
              {categoryTitle || t.all_items}
            </h1>
            <p className="text-xs text-text-secondary">
              {filteredItems.length} {t.stored_items}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewItem}
            className="h-7 px-3 bg-primary-container hover:bg-brand-primary-hover active:bg-brand-primary-active text-on-primary text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.new_button}</span>
          </button>
        </div>

        {/* Input de Búsqueda Reactiva y Ordenación */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_placeholder}
              className="w-full h-8 pl-8 pr-8 bg-surface-canvas border border-border-strong rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-container transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-xs text-text-muted hover:text-text-primary"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="h-8 px-2.5 flex items-center gap-1.5 bg-surface-canvas hover:bg-surface-sidebar border border-border-strong rounded-lg text-[11px] font-medium text-text-secondary transition-colors shrink-0"
            title="Ordenar alfabéticamente"
          >
            <span>{sortAsc ? "A → Z" : "Z → A"}</span>
            <SlidersHorizontal className="w-3 h-3 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Lista scrolleable de credenciales */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle bg-surface-canvas">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            {t.selected_item_empty}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const specialIcon = getItemIcon(item.item_type);

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`p-3 cursor-pointer transition-colors border-l-[3px] ${
                  isSelected
                    ? "bg-brand-primary-subtle border-primary-container"
                    : "border-transparent hover:bg-surface-sidebar"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-canvas border border-border-strong flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs text-primary">
                      {specialIcon ? specialIcon : getItemInitial(item.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {item.name}
                        </span>
                        {item.totp_secret && (
                          <span title={t.totp_linked} className="inline-flex items-center">
                            <ShieldCheck
                              className="w-3.5 h-3.5 text-status-secure shrink-0"
                            />
                          </span>
                        )}
                        {item.favorite && (
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-text-secondary truncate mt-0.5">
                        {item.item_type === "card"
                          ? `${item.card_brand || t.cards} •••• ${item.card_number ? item.card_number.slice(-4) : "••••"}`
                          : item.username || (item.item_type === "secure_note" ? t.secure_notes : "—")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pie de lista / Estado */}
      <div className="px-3 py-2 border-t border-border-strong bg-surface-sidebar flex items-center justify-between text-[11px] text-text-muted shrink-0">
        <span>3SM Secret v0.1</span>
        <span>Local Encrypted</span>
      </div>
    </section>
  );
};
