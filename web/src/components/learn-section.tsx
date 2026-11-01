import type { SiteCopy } from "@/content/site";
import { PlusIcon } from "./ui-icons";

export function LearnSection({ copy }: { copy: SiteCopy["learn"] }) {
  return (
    <section className="learn-section" id="learn" aria-labelledby="learn-heading">
      <div className="page-width learn-inner">
        <div className="learn-intro">
          <h2 id="learn-heading">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="question-list">
          {copy.items.map((item, index) => (
            <details key={item.question} className="learn-question" open={index === 0}>
              <summary>
                {item.question}
                <PlusIcon />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
