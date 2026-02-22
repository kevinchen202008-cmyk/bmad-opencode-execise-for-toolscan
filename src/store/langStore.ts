import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language } from "@/lib/i18n/translations";

interface LangState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "zh",
      setLang: (lang) => set({ lang }),
      toggleLang: () =>
        set((state) => ({ lang: state.lang === "en" ? "zh" : "en" })),
    }),
    {
      name: "compliance-lang-storage",
    },
  ),
);
