import type { Locale } from "./site";

// Each language has its own narrated video in public/media/fire-demo/<locale>/,
// rendered from video/ (see VIDEO.md). Bump the version when a file changes.
const version = "money-working-1";

const en = {
  media: "/media/fire-demo/en",
  version,
  captions: ["en", "sv"] as readonly string[],
  watch: "Watch a 90-second walkthrough",
  label: "FIRE calculator demonstration",
  note: "English narration. Optional English and Swedish captions are available in the player.",
  example:
    "Illustrative inputs only, not a recommended plan. This example uses zero return, inflation and fees.",
  download: "Download video",
  transcript: "Read the walkthrough",
  steps: [
    "Open the FIRE calculator to focus on the tool.",
    "Choose your ages, spending, current portfolio and monthly saving.",
    "Add a pension payout with a monthly amount and the ages it covers.",
    "Save collapses a payout into a compact row. The pen edits it; the bin removes it.",
    "Calculate to see a retirement path that includes the pension income.",
    "Switch to Savings plan to compare projected savings with the retirement target and see the monthly saving needed.",
    "Change an assumption and calculate again to explore a different plan. Your inputs stay on this page. Saving your plan is optional.",
  ],
};

type DemoCopy = typeof en;
const sv: DemoCopy = {
  media: "/media/fire-demo/sv",
  version,
  captions: ["sv"],
  watch: "Se en genomgång på 90 sekunder",
  label: "Demonstration av FIRE-kalkylatorn",
  note: "Svensk berättarröst. Valfri svensk undertext finns i spelaren.",
  example:
    "Endast exempelvärden, inte en rekommenderad plan. Exemplet använder noll i avkastning, inflation och avgifter.",
  download: "Ladda ner videon",
  transcript: "Läs genomgången",
  steps: [
    "Öppna FIRE-kalkylatorn för en fokuserad verktygsvy.",
    "Välj åldrar, utgifter, nuvarande kapital och månadssparande.",
    "Lägg till en pensionsutbetalning med månadsbelopp och vilka åldrar den gäller.",
    "Spara stänger redigeringen och lägger utbetalningen i en kompakt rad. Pennan redigerar och papperskorgen tar bort.",
    "Beräkna för att se en pensionsplan som inkluderar pensionsinkomsterna.",
    "Byt till Sparplan för att jämföra beräknat sparande med pensionsmålet och se vilket månadssparande som behövs.",
    "Ändra ett antagande och beräkna igen för att utforska en annan plan. Dina uppgifter stannar på den här sidan. Att spara planen är valfritt.",
  ],
};

export const getFireDemoCopy = (locale: Locale): DemoCopy => (locale === "sv" ? sv : en);
