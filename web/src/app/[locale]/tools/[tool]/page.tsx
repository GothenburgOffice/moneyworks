import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteCopy, type Locale } from "@/content/site";
import { getBrand } from "@/content/brand";
import { getFireCopy } from "@/content/fire";
import { availableToolIds, type AvailableToolId } from "@/features/tools/catalog";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToolView } from "@/components/tool-view";
import { FireCalculator } from "@/components/fire/fire-calculator";

export const dynamic = "force-static";
export const dynamicParams = false;

type Props = { params: Promise<{ locale: string; tool: string }> };

export function generateStaticParams() {
  return availableToolIds.map((tool) => ({ tool }));
}

// Each available tool supplies its banner, page metadata and workspace.
function getToolPage(tool: AvailableToolId, locale: Locale) {
  switch (tool) {
    case "fire": {
      const fire = getFireCopy(locale);
      return {
        title: fire.bannerLabel,
        description: fire.bannerDescription,
        banner: {
          label: fire.bannerLabel,
          back: fire.backToTools,
          titleLead: fire.bannerLead,
          titleEnd: fire.bannerEnd,
          description: fire.bannerDescription,
          facts: [fire.bannerPensions, fire.bannerSavings, fire.bannerDrawdown],
        },
        workspace: <FireCalculator locale={locale} />,
      };
    }
  }
}

async function resolve(params: Props["params"]) {
  const { locale, tool } = await params;
  if (!availableToolIds.includes(tool as AvailableToolId)) notFound();
  const language: Locale = locale === "sv" ? "sv" : "en";
  return { language, tool: tool as AvailableToolId };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language, tool } = await resolve(params);
  const page = getToolPage(tool, language);
  const brand = getBrand(language);
  return {
    title: `${page.title} | ${brand.name}`,
    description: page.description,
    icons: { icon: brand.icon },
  };
}

export default async function ToolPage({ params }: Props) {
  const { language, tool } = await resolve(params);
  setRequestLocale(language);
  const copy = getSiteCopy(language);
  const page = getToolPage(tool, language);

  return (
    <div id="top">
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>
      <SiteHeader
        copy={copy}
        locale={language}
        homeHref={`/${language}`}
        localeSuffix={`/tools/${tool}`}
      />
      <main id="main-content">
        <ToolView id={tool} backHref={`/${language}#tools`} {...page.banner}>
          {page.workspace}
        </ToolView>
      </main>
      <SiteFooter copy={copy} locale={language} />
      <script src="/site-ui.js" defer />
    </div>
  );
}
