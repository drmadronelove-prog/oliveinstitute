import ReactMarkdown from "react-markdown";

/**
 * Renders a lesson's `body` field as Markdown — what's authored in the
 * admin course builder as plain Markdown source. react-markdown parses to
 * React elements directly (no rehype-raw plugin, no dangerouslySetInnerHTML),
 * so raw HTML in the source is never rendered — safe by construction, not
 * by sanitizing.
 */
export function LessonBody({ body }: { body: string }) {
  return (
    <div className="flex flex-col gap-3 font-body text-sm [&_a]:text-[var(--color-olive)] [&_a]:underline [&_a]:underline-offset-2">
      <ReactMarkdown
        components={{
          h1: (props) => (
            <h3
              className="font-heading text-xl font-semibold text-[var(--color-ink)]"
              {...props}
            />
          ),
          h2: (props) => (
            <h3
              className="font-heading text-lg font-semibold text-[var(--color-ink)]"
              {...props}
            />
          ),
          h3: (props) => (
            <h4
              className="font-heading text-base font-semibold text-[var(--color-ink)]"
              {...props}
            />
          ),
          p: (props) => <p className="text-[var(--color-ink-muted)]" {...props} />,
          ul: (props) => (
            <ul className="list-disc pl-5 text-[var(--color-ink-muted)]" {...props} />
          ),
          ol: (props) => (
            <ol className="list-decimal pl-5 text-[var(--color-ink-muted)]" {...props} />
          ),
          strong: (props) => (
            <strong className="font-semibold text-[var(--color-ink)]" {...props} />
          ),
          blockquote: (props) => (
            <blockquote
              className="border-l-2 border-[var(--color-sage)] pl-3 italic text-[var(--color-ink-muted)]"
              {...props}
            />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
