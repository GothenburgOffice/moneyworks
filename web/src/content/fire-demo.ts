import type { Locale } from "./site";

const en = {
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
    "Save collapses a payout for this page only. The pen edits it; the bin removes it. Your plan is not stored.",
    "Calculate to see a retirement path that includes the pension income.",
    "Switch to Savings plan to compare projected savings with the retirement target and see the monthly saving needed.",
    "Change an assumption and calculate again to explore a different plan. Your inputs stay on this page; they are not saved.",
  ],
};

type DemoCopy = typeof en;
const sv: DemoCopy = {
  watch: "Se en genomgång på 90 sekunder",
  label: "Demonstration av FIRE-kalkylatorn",
  note: "Engelsk berättarröst. Valfri engelsk och svensk undertext finns i spelaren.",
  example:
    "Endast exempelvärden, inte en rekommenderad plan. Exemplet använder noll i avkastning, inflation och avgifter.",
  download: "Ladda ner videon",
  transcript: "Läs genomgången",
  steps: [
    "Öppna FIRE-kalkylatorn för en fokuserad verktygsvy.",
    "Välj åldrar, utgifter, nuvarande kapital och månadssparande.",
    "Lägg till en pensionsutbetalning med månadsbelopp och vilka åldrar den gäller.",
    "Spara stänger redigeringen endast för denna sida. Pennan redigerar och papperskorgen tar bort. Planen lagras inte.",
    "Beräkna för att se en pensionsplan som inkluderar pensionsinkomsterna.",
    "Byt till Sparplan för att jämföra beräknat sparande med pensionsmålet och se vilket månadssparande som behövs.",
    "Ändra ett antagande och beräkna igen för att utforska en annan plan. Uppgifterna stannar på denna sida och lagras inte.",
  ],
};

export const getFireDemoCopy = (locale: Locale): DemoCopy => (locale === "sv" ? sv : en);
