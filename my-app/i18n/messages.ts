import zhCN from "@/messages/zh-CN.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { Locale } from "./config";

export type Messages = typeof zhCN;

// The small set of dictionaries keeps language switching immediate and offline-capable.
export const messagesByLocale = { "zh-CN": zhCN, en, fr } satisfies Record<Locale, Messages>;
