import React, { useEffect, useState } from "react";
import { Globe, Check } from "lucide-react";

export type LanguageCode = "en" | "es" | "hi" | "ar";

export interface Translations {
  home: string;
  search: string;
  library: string;
  playlists: string;
  premium: string;
  settings: string;
  support: string;
  nowPlaying: string;
  tasteCapture: string;
  logout: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    home: "Home",
    search: "Search",
    library: "Your Library",
    playlists: "Playlists",
    premium: "Premium Status",
    settings: "Settings",
    support: "Help & Support",
    nowPlaying: "Now Playing",
    tasteCapture: "Reset Taste Profile",
    logout: "Sign Out",
  },
  es: {
    home: "Inicio",
    search: "Buscar",
    library: "Tu Biblioteca",
    playlists: "Listas de Reproducción",
    premium: "Estado Premium",
    settings: "Configuración",
    support: "Ayuda y Soporte",
    nowPlaying: "Sonando Ahora",
    tasteCapture: "Reiniciar Gustos",
    logout: "Cerrar Sesión",
  },
  hi: {
    home: "होम",
    search: "खोजें",
    library: "आपकी लाइब्रेरी",
    playlists: "प्लेलिस्ट",
    premium: "प्रीमियम सदस्यता",
    settings: "सेटिंग्स",
    support: "सहायता और संपर्क",
    nowPlaying: "अभी बज रहा है",
    tasteCapture: "पसंदीदा रीसेट करें",
    logout: "लॉग आउट करें",
  },
  ar: {
    home: "الرئيسية",
    search: "البحث",
    library: "مكتبتك الموسيقية",
    playlists: "قوائم التشغيل",
    premium: "اشتراك بريميوم",
    settings: "الإعدادات",
    support: "المساعدة والدعم",
    nowPlaying: "يعمل حالياً",
    tasteCapture: "إعادة ضبط التفضيلات",
    logout: "تسجيل الخروج",
  },
};

interface LocalisationSelectorProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const LocalisationSelector: React.FC<LocalisationSelectorProps> = ({
  currentLang,
  onLanguageChange,
}) => {
  const [open, setOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", label: "EN" },
    { code: "es", name: "Español", label: "ES" },
    { code: "hi", name: "हिन्दी", label: "HI" },
    { code: "ar", name: "العربية (RTL)", label: "AR" },
  ];

  // Auto-flip body text-direction (LTR/RTL) based on current active language
  useEffect(() => {
    const isRtl = currentLang === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.body.dir = isRtl ? "rtl" : "ltr";
  }, [currentLang]);

  const selectLanguage = (code: LanguageCode) => {
    onLanguageChange(code);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-950/60 hover:bg-gray-900 border border-gray-800 rounded-lg text-xs font-semibold text-gray-300 hover:text-emerald-400 transition-all duration-200"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{languages.find((l) => l.code === currentLang)?.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-gray-950 border border-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden divide-y divide-gray-900 animate-in fade-in slide-in-from-top-2 duration-150">
            {languages.map((lang) => {
              const active = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => selectLanguage(lang.code as LanguageCode)}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors ${
                    active
                      ? "bg-emerald-500/10 text-emerald-400 font-bold"
                      : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                  }`}
                >
                  <span>{lang.name}</span>
                  {active && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
