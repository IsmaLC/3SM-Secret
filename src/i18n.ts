export type Language = 'es' | 'ca';

export interface Translations {
  app_name: string;
  vault_title: string;
  unlock_vault: string;
  enter_master_password: string;
  master_password: string;
  unlock_button: string;
  unlocking: string;
  create_vault_title: string;
  create_vault_subtitle: string;
  confirm_master_password: string;
  password_hint: string;
  password_hint_placeholder: string;
  create_vault_button: string;
  creating: string;
  passwords_dont_match: string;
  password_too_short: string;
  all_items: string;
  logins: string;
  secure_notes: string;
  cards: string;
  identities: string;
  favorites: string;
  folders: string;
  work_folder: string;
  finance_folder: string;
  search_placeholder: string;
  stored_items: string;
  new_button: string;
  category_all: string;
  order_az: string;
  filter: string;
  sort: string;
  selected_item_empty: string;
  select_or_create: string;
  username_or_email: string;
  password: string;
  reveal_password: string;
  hide_password: string;
  copy: string;
  copied: string;
  copy_totp: string;
  totp_code: string;
  authenticator_code: string;
  website_url: string;
  open_url: string;
  notes: string;
  notes_placeholder: string;
  security_status: string;
  vault_encrypted_notice: string;
  password_strength: string;
  strength_weak: string;
  strength_medium: string;
  strength_good: string;
  strength_strong: string;
  metadata_created: string;
  metadata_updated: string;
  generator_title: string;
  length: string;
  uppercase: string;
  lowercase: string;
  numbers: string;
  symbols: string;
  regenerate: string;
  use_password: string;
  entropy: string;
  bits: string;
  settings: string;
  language: string;
  auto_lock: string;
  theme: string;
  theme_light: string;
  theme_dark: string;
  immediate: string;
  one_minute: string;
  five_minutes: string;
  fifteen_minutes: string;
  thirty_minutes: string;
  one_hour: string;
  never: string;
  lock_now: string;
  save: string;
  saved: string;
  cancel: string;
  delete: string;
  delete_confirm: string;
  delete_item_title: string;
  delete_item_desc: string;
  manage_folders: string;
  new_folder_placeholder: string;
  add_folder: string;
  delete_folder: string;
  delete_folder_confirm: string;
  no_folders: string;
  use_in_form: string;
  edit: string;
  name: string;
  new_credential: string;
  new_note: string;
  new_card: string;
  cardholder_name: string;
  card_number: string;
  card_brand: string;
  card_expiration: string;
  card_exp_month: string;
  card_exp_year: string;
  card_cvv: string;
  reveal_cvv: string;
  hide_cvv: string;
  copy_card_number: string;
  copy_cvv: string;
  copy_password: string;
  clipboard_cleared_notice: string;
  totp_linked: string;
  share: string;
  share_title: string;
  share_desc: string;
  share_expiration: string;
  share_1h: string;
  share_24h: string;
  share_generate_link: string;
  share_generating: string;
  share_link_ready: string;
  share_link_warning: string;
  share_copy_link: string;
  share_link_copied: string;
  share_open_browser: string;
  share_destroyed_notice: string;
  share_view_title: string;
  share_view_burned: string;
  share_view_burned_desc: string;
  share_view_expired_desc: string;
  share_view_loading: string;
  share_view_error: string;
  updates: string;
  version_and_updates: string;
  check_updates_daily_desc: string;
  check_updates_now: string;
  checking_updates: string;
  app_up_to_date: string;
  update_available: string;
  update_available_desc: string;
  view_update: string;
  last_check: string;
  never_checked: string;
  update_check_error: string;
}

export const translations: Record<Language, Translations> = {
  es: {
    app_name: "3SM Secret",
    vault_title: "Bóveda de Contraseñas",
    unlock_vault: "Desbloquear Bóveda",
    enter_master_password: "Introduce tu contraseña maestra para acceder a tus claves cifradas",
    master_password: "Contraseña maestra",
    unlock_button: "Desbloquear",
    unlocking: "Descifrando bóveda...",
    create_vault_title: "Configurar Nueva Bóveda",
    create_vault_subtitle: "Establece la clave maestra de alta seguridad que protegerá tu bóveda local.",
    confirm_master_password: "Confirmar contraseña maestra",
    password_hint: "Pista de la contraseña (opcional)",
    password_hint_placeholder: "Ej: Nombre de mi primera mascota en verano",
    create_vault_button: "Crear Bóveda Cifrada",
    creating: "Generando claves seguras...",
    passwords_dont_match: "Las contraseñas no coinciden",
    password_too_short: "La contraseña maestra debe tener al menos 8 caracteres",
    all_items: "Todas las contraseñas",
    logins: "Inicios de sesión",
    secure_notes: "Notas seguras",
    cards: "Tarjetas de pago",
    identities: "Identidades",
    favorites: "Favoritos",
    folders: "Carpetas",
    work_folder: "Trabajo",
    finance_folder: "Finanzas",
    search_placeholder: "Buscar contraseñas, etiquetas, dominios...",
    stored_items: "elementos almacenados",
    new_button: "Nuevo",
    category_all: "Categoría: Todas",
    order_az: "Orden: Nombre (A-Z)",
    filter: "Filtrar",
    sort: "Ordenar",
    selected_item_empty: "Ningún elemento seleccionado",
    select_or_create: "Selecciona un registro de la lista o crea uno nuevo para inspeccionarlo.",
    username_or_email: "Nombre de usuario o Correo",
    password: "Contraseña",
    reveal_password: "Ver contraseña",
    hide_password: "Ocultar contraseña",
    copy: "Copiar",
    copied: "¡Copiado!",
    copy_totp: "Copiar TOTP",
    totp_code: "Código de Verificación (2FA / TOTP)",
    authenticator_code: "Código temporal",
    website_url: "URL de acceso",
    open_url: "Abrir enlace",
    notes: "Notas seguras cifradas",
    notes_placeholder: "Añade notas, preguntas de seguridad o claves de recuperación...",
    security_status: "Protección Criptográfica Activa",
    vault_encrypted_notice: "Cifrado local con Argon2id + AES-256-GCM. Cero registros en la nube.",
    password_strength: "Fuerza de la contraseña",
    strength_weak: "Muy Débil",
    strength_medium: "Aceptable",
    strength_good: "Buena",
    strength_strong: "Muy Fuerte",
    metadata_created: "Fecha de creación",
    metadata_updated: "Última modificación",
    generator_title: "Generador de Contraseñas",
    length: "Longitud",
    uppercase: "Mayúsculas (A-Z)",
    lowercase: "Minúsculas (a-z)",
    numbers: "Números (0-9)",
    symbols: "Caracteres especiales (!@#$...)",
    regenerate: "Regenerar",
    use_password: "Usar Contraseña",
    entropy: "Entropía estimada",
    bits: "bits",
    settings: "Ajustes",
    language: "Idioma de la interfaz",
    auto_lock: "Autobloqueo por inactividad",
    theme: "Tema visual",
    theme_light: "Claro",
    theme_dark: "Oscuro",
    immediate: "Inmediato al minimizar",
    one_minute: "1 minuto",
    five_minutes: "5 minutos",
    fifteen_minutes: "15 minutos",
    thirty_minutes: "30 minutos",
    one_hour: "1 hora",
    never: "Nunca",
    lock_now: "Bloquear bóveda",
    save: "Guardar cambios",
    saved: "¡Guardado!",
    cancel: "Cancelar",
    delete: "Eliminar",
    delete_confirm: "¿Seguro que deseas eliminar este elemento de forma permanente?",
    delete_item_title: "¿Eliminar este elemento?",
    delete_item_desc: "Esta acción es definitiva e irrevocable.",
    manage_folders: "Gestión de Carpetas",
    new_folder_placeholder: "Nombre de la nueva carpeta...",
    add_folder: "Añadir carpeta",
    delete_folder: "Eliminar carpeta",
    delete_folder_confirm: "¿Eliminar esta carpeta? Los elementos que contiene no se borrarán, solo quedarán sin carpeta asignada.",
    no_folders: "No hay carpetas creadas en este baúl.",
    use_in_form: "Usar en formulario",
    edit: "Editar",
    name: "Nombre del elemento",
    new_credential: "Nueva Credencial",
    new_note: "Nueva Nota Segura",
    new_card: "Nueva Tarjeta de Pago",
    cardholder_name: "Titular de la tarjeta",
    card_number: "Número de tarjeta",
    card_brand: "Marca / Emisor",
    card_expiration: "Fecha de caducidad",
    card_exp_month: "Mes de expiración",
    card_exp_year: "Año de expiración",
    card_cvv: "Código de seguridad (CVV)",
    reveal_cvv: "Ver código de seguridad",
    hide_cvv: "Ocultar código de seguridad",
    copy_card_number: "Copiar número de tarjeta",
    copy_cvv: "Copiar CVV",
    copy_password: "Copiar Contraseña",
    clipboard_cleared_notice: "El portapapeles se purgará automáticamente a los 10 segundos.",
    totp_linked: "2FA Vinculado",
    share: "Compartir",
    share_title: "Compartir Credencial",
    share_desc: "Este enlace solo podrá abrirse una única vez y la información será visible durante 15 segundos.",
    share_expiration: "Tiempo de validez",
    share_1h: "1 hora",
    share_24h: "24 horas",
    share_generate_link: "Generar enlace",
    share_generating: "Generando",
    share_link_ready: "Enlace generado con éxito",
    share_link_warning: "Copia y comparte este enlace. Por seguridad, solo se puede abrir una vez y dejará de funcionar tras 15 segundos.",
    share_copy_link: "Copiar Enlace",
    share_link_copied: "¡Enlace copiado!",
    share_open_browser: "Abrir en el Navegador",
    share_destroyed_notice: "Este enlace ha dejado de estar disponible tras esta lectura.",
    share_view_title: "Información Compartida",
    share_view_burned: "Enlace no disponible",
    share_view_burned_desc: "Este enlace ya ha sido consultado o ha caducado. Por seguridad, solo se puede abrir una única vez.",
    share_view_expired_desc: "El tiempo de validez de este enlace ha expirado.",
    share_view_loading: "Cargando información...",
    share_view_error: "No se ha podido acceder al enlace.",
    updates: "Actualizaciones",
    version_and_updates: "Versión y Actualizaciones",
    check_updates_daily_desc: "La aplicación comprueba automáticamente una vez al día si hay nuevas versiones disponibles.",
    check_updates_now: "Buscar actualizaciones",
    checking_updates: "Comprobando...",
    app_up_to_date: "La aplicación está actualizada",
    update_available: "Nueva versión disponible",
    update_available_desc: "Hay una versión más reciente lista para descargar.",
    view_update: "Ver actualización",
    last_check: "Última comprobación",
    never_checked: "Nunca",
    update_check_error: "No se pudo comprobar en este momento",
  },
  ca: {
    app_name: "3SM Secret",
    vault_title: "Volta de Contrasenyes",
    unlock_vault: "Desbloquejar Volta",
    enter_master_password: "Introdueix la teva contrasenya mestra per accedir a les claus xifrades",
    master_password: "Contrasenya mestra",
    unlock_button: "Desbloquejar",
    unlocking: "Desxifrant volta...",
    create_vault_title: "Configurar Nova Volta",
    create_vault_subtitle: "Estableix la clau mestra d'alta seguretat que protegirà la teva volta local.",
    confirm_master_password: "Confirmar contrasenya mestra",
    password_hint: "Pista de la contrasenya (opcional)",
    password_hint_placeholder: "Ex: Nom de la meva primera mascota a l'estiu",
    create_vault_button: "Crear Volta Xifrada",
    creating: "Generant claus segures...",
    passwords_dont_match: "Les contrasenyes no coincideixen",
    password_too_short: "La contrasenya mestra ha de tenir com a mínim 8 caràcters",
    all_items: "Totes les contrasenyes",
    logins: "Inicis de sessió",
    secure_notes: "Notes segures",
    cards: "Targetes de pagament",
    identities: "Identitats",
    favorites: "Preferits",
    folders: "Carpetes",
    work_folder: "Feina",
    finance_folder: "Finances",
    search_placeholder: "Cercar contrasenyes, etiquetes, dominis...",
    stored_items: "elements emmagatzemats",
    new_button: "Nou",
    category_all: "Categoria: Totes",
    order_az: "Ordre: Nom (A-Z)",
    filter: "Filtrar",
    sort: "Ordenar",
    selected_item_empty: "Cap element seleccionat",
    select_or_create: "Selecciona un registre de la llista o crea'n un de nou per inspeccionar-lo.",
    username_or_email: "Nom d'usuari o Correu",
    password: "Contrasenya",
    reveal_password: "Veure contrasenya",
    hide_password: "Amagar contrasenya",
    copy: "Copiar",
    copied: "Copiat!",
    copy_totp: "Copiar TOTP",
    totp_code: "Codi de Verificació (2FA / TOTP)",
    authenticator_code: "Codi temporal",
    website_url: "URL d'accés",
    open_url: "Obrir enllaç",
    notes: "Notes segures xifrades",
    notes_placeholder: "Afegeix notes, preguntes de seguretat o claus de recuperació...",
    security_status: "Protecció Criptogràfica Activa",
    vault_encrypted_notice: "Xifrat local amb Argon2id + AES-256-GCM. Zero registres al núvol.",
    password_strength: "Força de la contrasenya",
    strength_weak: "Molt Dèbil",
    strength_medium: "Acceptable",
    strength_good: "Bona",
    strength_strong: "Molt Forta",
    metadata_created: "Data de creació",
    metadata_updated: "Darrera modificació",
    generator_title: "Generador de Contrasenyes",
    length: "Longitud",
    uppercase: "Majúscules (A-Z)",
    lowercase: "Minúscules (a-z)",
    numbers: "Nombres (0-9)",
    symbols: "Caràcters especials (!@#$...)",
    regenerate: "Regenerar",
    use_password: "Usar Contrasenya",
    entropy: "Entropia estimada",
    bits: "bits",
    settings: "Ajustos",
    language: "Idioma de la interfície",
    auto_lock: "Autobloqueig per inactivitat",
    theme: "Tema visual",
    theme_light: "Clar",
    theme_dark: "Fosc",
    immediate: "Immediat en minimitzar",
    one_minute: "1 minut",
    five_minutes: "5 minuts",
    fifteen_minutes: "15 minuts",
    thirty_minutes: "30 minuts",
    one_hour: "1 hora",
    never: "Mai",
    lock_now: "Bloquejar volta",
    save: "Desar canvis",
    saved: "Desat!",
    cancel: "Cancel·lar",
    delete: "Eliminar",
    delete_confirm: "Segur que vols eliminar aquest element permanentment?",
    delete_item_title: "Eliminar aquest element?",
    delete_item_desc: "Aquesta acció és definitiva i irrevocable.",
    manage_folders: "Gestió de Carpetes",
    new_folder_placeholder: "Nom de la nova carpeta...",
    add_folder: "Afegir carpeta",
    delete_folder: "Eliminar carpeta",
    delete_folder_confirm: "Vols eliminar aquesta carpeta? Els elements continguts no s'esborraran, només quedaran sense carpeta.",
    no_folders: "No hi ha carpetes creades en aquesta volta.",
    use_in_form: "Utilitzar al formulari",
    edit: "Editar",
    name: "Nom de l'element",
    new_credential: "Nova Credencial",
    new_note: "Nova Nota Segura",
    new_card: "Nova Targeta de Pagament",
    cardholder_name: "Titular de la targeta",
    card_number: "Número de targeta",
    card_brand: "Marca / Emissor",
    card_expiration: "Data de caducitat",
    card_exp_month: "Mes d'expiració",
    card_exp_year: "Any d'expiració",
    card_cvv: "Codi de seguretat (CVV)",
    reveal_cvv: "Veure codi de seguretat",
    hide_cvv: "Amagar codi de seguretat",
    copy_card_number: "Copiar número de targeta",
    copy_cvv: "Copiar CVV",
    copy_password: "Copiar Contrasenya",
    clipboard_cleared_notice: "El porta-retalls es purgarà automàticament als 10 segons.",
    totp_linked: "2FA Vinculat",
    share: "Compartir",
    share_title: "Compartir Credencial Segura",
    share_desc: "Genera un enllaç efímer d'un sol ús. Les credencials es xifren localment i s'autodestrueixen després d'obrir-se una única vegada.",
    share_expiration: "Temps de vida màxim",
    share_1h: "1 hora",
    share_24h: "24 hores",
    share_generate_link: "Generar Enllaç Segur",
    share_generating: "Xifrant i generant...",
    share_link_ready: "Enllaç Xifrat d'Un Sol Ús",
    share_link_warning: "Atenció! Aquest enllaç mostrarà la informació compartida una única vegada i només durant 15 segons. Després d'aquest temps, l'enllaç quedarà inoperatiu i no podrà tornar a ser utilitzat.",
    share_copy_link: "Copiar Enllaç",
    share_link_copied: "Enllaç copiat!",
    share_open_browser: "Obrir al Navegador",
    share_destroyed_notice: "Aquest secret s'ha autodestruït permanentment després d'aquesta lectura.",
    share_view_title: "Credencial Compartida Segura",
    share_view_burned: "Enllaç no disponible o ja destruït",
    share_view_burned_desc: "Aquest enllaç d'un sol ús ja ha estat visualitzat i destruït permanentment segons la política de seguretat Zero-Knowledge.",
    share_view_expired_desc: "El temps de vida d'aquest enllaç ha expirat i les dades han estat purgades.",
    share_view_loading: "Desxifrant credencials d'un sol ús...",
    share_view_error: "Error en desxifrar o consumir l'enllaç segur.",
    updates: "Actualitzacions",
    version_and_updates: "Versió i Actualitzacions",
    check_updates_daily_desc: "L'aplicació comprova automàticament un cop al dia si hi ha noves versions disponibles.",
    check_updates_now: "Cercar actualitzacions",
    checking_updates: "Comprovant...",
    app_up_to_date: "L'aplicació està actualitzada",
    update_available: "Nova versió disponible",
    update_available_desc: "Hi ha una versió més recent a punt per descarregar.",
    view_update: "Veure actualització",
    last_check: "Darrera comprovació",
    never_checked: "Mai",
    update_check_error: "No s'ha pogut comprovar en aquest moment",
  },
};
