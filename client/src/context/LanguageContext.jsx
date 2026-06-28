import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    channels: "Channels",
    dms: "Direct Messages",
    search: "Search...",
    create_channel: "Create Channel",
    join_channel: "Join Channel",
    settings: "Settings",
    members: "Members",
    pinned: "Pinned",
    logout: "Logout",
    online: "Online",
    away: "Away",
    busy: "Busy",
    offline: "Offline",
  },
  es: {
    channels: "Canales",
    dms: "Mensajes Directos",
    search: "Buscar...",
    create_channel: "Crear Canal",
    join_channel: "Unirse al Canal",
    settings: "Ajustes",
    members: "Miembros",
    pinned: "Anclado",
    logout: "Cerrar sesión",
    online: "En línea",
    away: "Ausente",
    busy: "Ocupado",
    offline: "Desconectado",
  },
  fr: {
    channels: "Salons",
    dms: "Messages Directs",
    search: "Rechercher...",
    create_channel: "Créer un salon",
    join_channel: "Rejoindre un salon",
    settings: "Paramètres",
    members: "Membres",
    pinned: "Épinglé",
    logout: "Déconnexion",
    online: "En ligne",
    away: "Absent",
    busy: "Occupé",
    offline: "Hors ligne",
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
