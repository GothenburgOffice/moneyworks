import "@/styles/tool-demo.css";

type ToolDemoProps = {
  id: string;
  title: string;
  label: string;
  note: string;
  example: string;
  downloadLabel: string;
  transcriptLabel: string;
  steps: readonly string[];
  source: string;
  poster: string;
  subtitles: readonly { language: string; label: string; source: string; default: boolean }[];
};

/** Static, reusable self-hosted media. Native controls work without React/JS. */
export function ToolDemo({
  id,
  title,
  label,
  note,
  example,
  downloadLabel,
  transcriptLabel,
  steps,
  source,
  poster,
  subtitles,
}: ToolDemoProps) {
  return (
    <details id={id} className="tool-demo" data-tool-demo>
      <summary>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="m9 5 11 7-11 7V5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
        <span>{title}</span>
      </summary>
      <div className="tool-demo-body">
        <p id={`${id}-description`}>{note}</p>
        <video
          controls
          playsInline
          crossOrigin="anonymous"
          preload="none"
          width="1280"
          height="720"
          poster={poster}
          aria-label={label}
          aria-describedby={`${id}-description`}
        >
          <source src={source} type="video/mp4" />
          {subtitles.map((track) => (
            <track
              key={track.language}
              kind="subtitles"
              src={track.source}
              srcLang={track.language}
              label={track.label}
              default={track.default}
            />
          ))}
          <a href={source}>{downloadLabel}</a>
        </video>
        <div className="tool-demo-links">
          <p>{example}</p>
          <a href={source} download>
            {downloadLabel}
          </a>
        </div>
        <details className="tool-demo-transcript">
          <summary>{transcriptLabel}</summary>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      </div>
    </details>
  );
}
