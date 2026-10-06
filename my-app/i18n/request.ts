import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { localeCookie, resolveLocale } from "./config";
import { messagesByLocale } from "./messages";

export default getRequestConfig(async () => {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get(localeCookie)?.value,
    requestHeaders.get("accept-language") ?? "",
  );
  return { locale, messages: messagesByLocale[locale] };
});
