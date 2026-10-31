export function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg className={`arrow-icon${diagonal ? ' arrow-icon--diagonal' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon() {
  return <svg className="plus-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

export function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="m15 5 4 4M4 20l1-5L16 4a2.83 2.83 0 0 1 4 4L9 19l-5 1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6m4-6v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
