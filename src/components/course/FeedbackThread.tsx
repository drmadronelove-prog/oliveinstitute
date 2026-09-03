export type FeedbackItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string };
};

export function FeedbackThread({ feedback }: { feedback: FeedbackItem[] }) {
  if (feedback.length === 0) {
    return null;
  }

  return (
    <ul className="mt-3 flex flex-col gap-2 border-t border-black/10 pt-3">
      {feedback.map((item) => (
        <li key={item.id} className="rounded-md bg-white p-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="font-serif text-xs font-medium text-[var(--color-ink)]">
              {item.author.name}
            </span>
            <span className="font-serif text-xs text-[var(--color-ink-muted)]">
              {item.createdAt.toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <p className="whitespace-pre-wrap font-serif text-sm text-[var(--color-ink)]">
            {item.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
