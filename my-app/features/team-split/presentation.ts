import type { useTranslations } from "next-intl";
import type { Kit } from "./model";

type KitTranslator = ReturnType<typeof useTranslations<"Kits">>;

export function getKitColorLabel(kit: Kit, t: KitTranslator) {
  return kit.key === "custom"
    ? t("fallback", { letter: kit.letter })
    : t(`colors.${kit.key}`);
}

export function getKitTeamLabel(kit: Kit, t: KitTranslator) {
  return kit.key === "custom"
    ? t("fallback", { letter: kit.letter })
    : t(`teams.${kit.key}`);
}
