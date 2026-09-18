import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import { Folder, ItemType, VaultItem, VaultPayload, VaultSettings } from "./types";
import { translations, Language } from "./i18n";
import { LockScreen } from "./components/LockScreen";
import { Sidebar } from "./components/Sidebar";
import { ItemList } from "./components/ItemList";
import { ItemDetail } from "./components/ItemDetail";
import { PasswordGeneratorModal } from "./components/PasswordGeneratorModal";
import { SettingsModal } from "./components/SettingsModal";
import { NewItemModal } from "./components/NewItemModal";
import { ShareView } from "./components/ShareView";

export function App() {
  const [loading, setLoading] = useState(true);
  const [vaultExists, setVaultExists] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [payload, setPayload] = useState<VaultPayload | null>(null);

  // Filtros de navegación
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

  // Modales
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [appliedPasswordToNewItem, setAppliedPasswordToNewItem] = useState<string | undefined>(undefined);

  // Idioma
  const [language, setLanguage] = useState<Language>("es");

  // Detección de actividad del usuario (Inactividad real)
  const lastActivityRef = useRef<number>(Date.now());
  const lastTouchTauriRef = useRef<number>(0);

  // Detección de ruta de compartición de un solo uso
  const [isShareRoute, setIsShareRoute] = useState(() =>
    window.location.hash.includes("/share/")
  );

  useEffect(() => {
    const handleHashChange = () => {
      setIsShareRoute(window.location.hash.includes("/share/"));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Comprobar existencia del baúl al inicio
  useEffect(() => {
    async function init() {
      try {
        const exists = await api.vaultExists();
        setVaultExists(exists);
      } catch (err) {
        console.error("Error al comprobar bóveda:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Escuchadores globales de eventos de interacción del usuario para inactividad real
  useEffect(() => {
    if (!isUnlocked) return;

    const recordUserActivity = () => {
      lastActivityRef.current = Date.now();
      const now = Date.now();
      // Limitar llamadas a Rust a un intervalo mínimo de 10 segundos
      if (now - lastTouchTauriRef.current > 10000) {
        lastTouchTauriRef.current = now;
        api.touchActivity();
      }
    };

    const userEvents = ["mousedown", "mousemove", "keydown", "wheel", "touchstart"];
    userEvents.forEach((event) => {
      window.addEventListener(event, recordUserActivity, { passive: true });
    });

    return () => {
      userEvents.forEach((event) => {
        window.removeEventListener(event, recordUserActivity);
      });
    };
  }, [isUnlocked]);

  // Temporizador de verificación de autobloqueo por inactividad
  useEffect(() => {
    if (!isUnlocked) return;

    const interval = setInterval(async () => {
      try {
        const timeoutMinutes = payload?.settings?.auto_lock_minutes ?? 15;
        if (timeoutMinutes > 0) {
          const inactiveMillis = Date.now() - lastActivityRef.current;
          const isIdleTimeout = inactiveMillis >= timeoutMinutes * 60 * 1000;
          const shouldLockBackend = await api.checkAutoLock();

          if (isIdleTimeout || shouldLockBackend) {
            handleLockVault();
            return;
          }
        }
      } catch (err) {
        console.error("Error comprobando autobloqueo:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isUnlocked, payload?.settings?.auto_lock_minutes]);

  // Aplicar tema visual oscuro/claro a nivel de documento HTML
  const applyTheme = (themeName?: string) => {
    const isDark = themeName === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("3sm_secret_theme", isDark ? "dark" : "light");
    } catch {}
  };

  // Cargar tema persistido al arrancar
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("3sm_secret_theme") || "light";
      applyTheme(savedTheme);
    } catch {}
  }, []);

  // Manejador al desbloquear
  const handleUnlocked = (data: VaultPayload) => {
    lastActivityRef.current = Date.now();
    setPayload(data);
    setIsUnlocked(true);
    if (data.settings?.theme) {
      applyTheme(data.settings.theme);
    }
    if (data.settings?.language === "ca" || data.settings?.language === "es") {
      setLanguage(data.settings.language);
    }
    if (data.items.length > 0) {
      setSelectedItem(data.items[0]);
    }
  };

  // Bloqueo manual
  const handleLockVault = async () => {
    try {
      await api.lockVault();
    } finally {
      setIsUnlocked(false);
      setPayload(null);
      setSelectedItem(null);
    }
  };

  // Guardar elemento
  const handleSaveItem = async (item: VaultItem) => {
    lastActivityRef.current = Date.now();
    try {
      const saved = await api.saveVaultItem(item);
      if (payload) {
        const items = [...payload.items];
        const idx = items.findIndex((i) => i.id === saved.id);
        if (idx >= 0) {
          items[idx] = saved;
        } else {
          items.push(saved);
        }
        setPayload({ ...payload, items });
        setSelectedItem(saved);
      }
    } catch (err) {
      console.error("Error guardando elemento:", err);
      alert("Error al guardar elemento en el baúl cifrado");
    }
  };

  // Eliminar elemento
  const handleDeleteItem = async (id: string) => {
    lastActivityRef.current = Date.now();
    try {
      await api.deleteVaultItem(id);
      if (payload) {
        const items = payload.items.filter((i) => i.id !== id);
        setPayload({ ...payload, items });
        setSelectedItem(items.length > 0 ? items[0] : null);
      }
    } catch (err) {
      console.error("Error eliminando elemento:", err);
      alert("Error al eliminar elemento");
    }
  };

  // Guardar configuración
  const handleSaveSettings = async (settings: VaultSettings) => {
    lastActivityRef.current = Date.now();
    try {
      await api.saveSettings(settings);
      if (payload) {
        setPayload({ ...payload, settings });
      }
      setLanguage(settings.language as Language);
      applyTheme(settings.theme);
    } catch (err) {
      console.error("Error guardando ajustes:", err);
    }
  };

  // Guardar carpetas
  const handleSaveFolders = async (folders: Folder[]) => {
    lastActivityRef.current = Date.now();
    try {
      await api.saveFolders(folders);
      if (payload) {
        const currentFolderStillExists = folders.some((f) => f.id === selectedFolderId);
        if (!currentFolderStillExists) {
          setSelectedFolderId(null);
        }
        // Desvincular folder_id de los items cuya carpeta haya sido eliminada
        const validFolderIds = new Set(folders.map((f) => f.id));
        const updatedItems = payload.items.map((it) => {
          if (it.folder_id && !validFolderIds.has(it.folder_id)) {
            return { ...it, folder_id: null };
          }
          return it;
        });
        setPayload({ ...payload, folders, items: updatedItems });
      }
    } catch (err) {
      console.error("Error al guardar carpetas:", err);
    }
  };

  // Conteo de elementos para el Sidebar
  const itemCounts = {
    all: payload?.items.length || 0,
    login: payload?.items.filter((i) => i.item_type === "login").length || 0,
    secure_note: payload?.items.filter((i) => i.item_type === "secure_note").length || 0,
    card: payload?.items.filter((i) => i.item_type === "card").length || 0,
    identity: payload?.items.filter((i) => i.item_type === "identity").length || 0,
    favorites: payload?.items.filter((i) => i.favorite).length || 0,
  };

  // Filtro de elementos para ItemList
  const t = translations[language];

  // Determinar el tipo de elemento por defecto al pulsar "+ Nuevo":
  // Si estamos en "Notas seguras" -> "secure_note"
  // Si estamos en "Tarjetas de pago" -> "card"
  // Si estamos en "Inicios de sesión", "Todas las contraseñas", "Favoritos", etc. -> "login"
  const defaultItemType: ItemType =
    selectedCategory === "secure_note" || selectedCategory === "card"
      ? selectedCategory
      : "login";

  // Obtener el título descriptivo para la cabecera de la lista
  const getCurrentCategoryTitle = () => {
    if (selectedFolderId) {
      const folder = payload?.folders?.find((f) => f.id === selectedFolderId);
      if (folder) return folder.name;
    }
    switch (selectedCategory) {
      case "login":
        return t.logins;
      case "secure_note":
        return t.secure_notes;
      case "card":
        return t.cards;
      case "favorites":
        return t.favorites;
      case "all":
      default:
        return t.all_items;
    }
  };

  const visibleItems = (payload?.items || []).filter((item) => {
    if (selectedFolderId) {
      return item.folder_id === selectedFolderId;
    }
    if (selectedCategory === "all") return true;
    if (selectedCategory === "favorites") return item.favorite;
    return item.item_type === selectedCategory;
  });

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si la URL es de un enlace de un solo uso (One-Time Secret Sharing)
  if (isShareRoute) {
    return <ShareView language={language} onLanguageChange={setLanguage} />;
  }

  // Pantalla de bloqueo si no está autenticado
  if (!isUnlocked) {
    return (
      <LockScreen
        isSetup={!vaultExists}
        language={language}
        onLanguageChange={setLanguage}
        onUnlocked={handleUnlocked}
      />
    );
  }

  return (
    <div className="flex w-full h-screen bg-surface-canvas overflow-hidden">
      {/* 1. Columna Izquierda: Barra Lateral Bitwarden */}
      <Sidebar
        language={language}
        selectedCategory={selectedCategory}
        selectedFolderId={selectedFolderId}
        folders={payload?.folders || []}
        itemCounts={itemCounts}
        onSelectCategory={setSelectedCategory}
        onSelectFolder={setSelectedFolderId}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockVault={handleLockVault}
      />

      {/* 2. Columna Central: Master List Panel de 380px de Stitch */}
      <ItemList
        language={language}
        categoryTitle={getCurrentCategoryTitle()}
        items={visibleItems}
        selectedItem={selectedItem}
        onSelectItem={setSelectedItem}
        onNewItem={() => setIsNewItemOpen(true)}
      />

      {/* 3. Columna Derecha: Detailed Item Inspector con Viewport Flexible */}
      <ItemDetail
        language={language}
        item={selectedItem}
        onSaveItem={handleSaveItem}
        onDeleteItem={handleDeleteItem}
      />

      {/* Modales */}
      <PasswordGeneratorModal
        language={language}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSelectPassword={
          isNewItemOpen
            ? (pwd) => {
                setAppliedPasswordToNewItem(pwd);
                setIsGeneratorOpen(false);
              }
            : undefined
        }
      />

      {payload && (
        <SettingsModal
          language={language}
          settings={payload.settings}
          folders={payload.folders || []}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaveSettings={handleSaveSettings}
          onSaveFolders={handleSaveFolders}
          onLanguageChange={setLanguage}
        />
      )}

      <NewItemModal
        language={language}
        isOpen={isNewItemOpen}
        defaultItemType={defaultItemType}
        folders={payload?.folders || []}
        appliedPassword={appliedPasswordToNewItem}
        onClose={() => {
          setIsNewItemOpen(false);
          setAppliedPasswordToNewItem(undefined);
        }}
        onSave={handleSaveItem}
        onOpenGenerator={() => {
          // Mantener el formulario abierto y superponer el generador
          setIsGeneratorOpen(true);
        }}
      />
    </div>
  );
}

export default App;
