import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getSiteCopy } from "@/content/site";
import { getBrand } from "@/content/brand";
import { SiteHeader } from "@/components/site-header";
import { IntroSection } from "@/components/intro-section";
import { ToolsSection } from "@/components/tools-section";
import { LearnSection } from "@/components/learn-section";
import { AboutSection } from "@/components/about-section";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-static";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("title"),
    description: t("description"),
    icons: { icon: getBrand(locale === "sv" ? "sv" : "en").icon },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const language = locale === "sv" ? "sv" : "en";
  const copy = getSiteCopy(language);

  return (
    <div id="top">
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>
      <SiteHeader copy={copy} locale={language} />
      <main id="main-content">
        <IntroSection copy={copy.intro} locale={language} />
        <ToolsSection copy={copy.tools} locale={language} />
        <LearnSection copy={copy.learn} />
        <AboutSection copy={copy.about} locale={language} />
      </main>
      <SiteFooter copy={copy} locale={language} />
      <script src="/site-ui.js" defer />
    </div>
  );
}
