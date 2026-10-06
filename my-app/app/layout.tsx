import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { themeVariables } from "./theme";
import { getLocale, getTranslations } from "next-intl/server";
import { LanguageProvider } from "@/i18n/provider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("App");
  return { title: t("title") };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={themeVariables}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Preserve the original font stylesheet in the shared App Router root layout. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap"
        />
      </head>
      <body className="m-0 bg-paper font-sans text-[15px] leading-[1.6] text-ink antialiased [-webkit-text-size-adjust:100%] [text-size-adjust:100%] **:motion-reduce:transition-none! **:motion-reduce:animate-none!">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-3X83NGW2R1');`}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3X83NGW2R1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
