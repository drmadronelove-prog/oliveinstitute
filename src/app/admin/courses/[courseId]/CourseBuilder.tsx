"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LessonType } from "@prisma/client";
import { formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ResourceList, type ResourceItem } from "@/components/course/ResourceList";
import { AddResourceForm } from "@/app/professor/courses/[courseId]/AddResourceForm";
import { DeleteResourceButton } from "@/app/professor/courses/[courseId]/DeleteResourceButton";
import { VideoUploadPanel } from "./VideoUploadPanel";
import {
  addLessonAction,
  addModuleAction,
  addQuizAction,
  addQuizQuestionAction,
  deleteLessonAction,
  deleteModuleAction,
  deleteQuizAction,
  deleteQuizQuestionAction,
  renameModuleAction,
  reorderLessonAction,
  reorderModuleAction,
  updateLessonAction,
} from "./course-builder-actions";

export type BuilderLesson = {
  id: string;
  title: string;
  slug: string;
  type: LessonType;
  durationSeconds: number;
  videoUid: string | null;
  body: string | null;
  transcript: string | null;
  isFreePreview: boolean;
  resources: ResourceItem[];
};

export type BuilderQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};

export type BuilderQuiz = {
  id: string;
  title: string;
  questions: BuilderQuizQuestion[];
};

export type BuilderModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: BuilderLesson[];
  quiz: BuilderQuiz | null;
};

const fieldClassName =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]";
const smallButtonClassName =
  "rounded-md border border-black/10 bg-white px-2 py-1 font-body text-xs text-[var(--color-ink)] transition-colors hover:bg-[var(--color-sage-pale)] disabled:cursor-not-allowed disabled:opacity-40";

export function CourseBuilder({
  courseId,
  modules,
  streamConfigured,
}: {
  courseId: string;
  modules: BuilderModule[];
  streamConfigured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      // router.refresh() re-renders from fresh server data but doesn't
      // return a promise this can await — this flag is the actual signal
      // that the mutation itself has landed.
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {modules.length === 0 ? (
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          No modules yet — add the first one below.
        </p>
      ) : (
        modules.map((courseModule, index) => (
          <ModuleSection
            key={courseModule.id}
            courseModule={courseModule}
            isFirst={index === 0}
            isLast={index === modules.length - 1}
            streamConfigured={streamConfigured}
            run={run}
          />
        ))
      )}

      <div className="rounded-lg border border-dashed border-black/15 p-4">
        <label
          htmlFor="new-module-title"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Add a module
        </label>
        <div className="flex gap-2">
          <input
            id="new-module-title"
            type="text"
            value={newModuleTitle}
            onChange={(event) => setNewModuleTitle(event.target.value)}
            placeholder="Module title"
            className={fieldClassName}
          />
          <button
            type="button"
            disabled={isPending || !newModuleTitle.trim()}
            onClick={() => {
              const title = newModuleTitle;
              setNewModuleTitle("");
              run(() => addModuleAction(courseId, title));
            }}
            className="shrink-0 rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
          >
            Add module
          </button>
        </div>
      </div>

      {error ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p className="font-body text-sm text-[var(--color-olive)]">Saved.</p>
      ) : null}
    </div>
  );
}

function ModuleSection({
  courseModule,
  isFirst,
  isLast,
  streamConfigured,
  run,
}: {
  courseModule: BuilderModule;
  isFirst: boolean;
  isLast: boolean;
  streamConfigured: boolean;
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [title, setTitle] = useState(courseModule.title);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState<LessonType>(LessonType.VIDEO);

  return (
    <section className="rounded-lg border border-black/10 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-body text-xs text-[var(--color-ink-muted)]">
          {courseModule.sortOrder}.
        </span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={`${fieldClassName} max-w-xs`}
        />
        <button
          type="button"
          disabled={!title.trim() || title.trim() === courseModule.title}
          onClick={() => run(() => renameModuleAction(courseModule.id, title))}
          className={smallButtonClassName}
        >
          Save name
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={isFirst}
            aria-label="Move module up"
            onClick={() => run(() => reorderModuleAction(courseModule.id, "up"))}
            className={smallButtonClassName}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={isLast}
            aria-label="Move module down"
            onClick={() => run(() => reorderModuleAction(courseModule.id, "down"))}
            className={smallButtonClassName}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Delete "${courseModule.title}" and all ${courseModule.lessons.length} of its lessons? This can't be undone.`,
                )
              ) {
                run(() => deleteModuleAction(courseModule.id));
              }
            }}
            className={`${smallButtonClassName} text-red-700`}
          >
            Delete module
          </button>
        </div>
      </div>

      {courseModule.lessons.length === 0 ? (
        <p className="font-body text-xs text-[var(--color-ink-muted)]">
          No lessons in this module yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {courseModule.lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              isFirst={index === 0}
              isLast={index === courseModule.lessons.length - 1}
              streamConfigured={streamConfigured}
              run={run}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-black/10 pt-3">
        <div className="flex-1">
          <label
            htmlFor={`new-lesson-title-${courseModule.id}`}
            className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
          >
            New lesson title
          </label>
          <input
            id={`new-lesson-title-${courseModule.id}`}
            type="text"
            value={newLessonTitle}
            onChange={(event) => setNewLessonTitle(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div>
          <label
            htmlFor={`new-lesson-type-${courseModule.id}`}
            className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
          >
            Type
          </label>
          <select
            id={`new-lesson-type-${courseModule.id}`}
            value={newLessonType}
            onChange={(event) => setNewLessonType(event.target.value as LessonType)}
            className={fieldClassName}
          >
            <option value={LessonType.VIDEO}>Video</option>
            <option value={LessonType.TEXT}>Text</option>
            <option value={LessonType.PDF}>PDF</option>
            <option value={LessonType.QUIZ}>Quiz</option>
          </select>
        </div>
        <button
          type="button"
          disabled={!newLessonTitle.trim()}
          onClick={() => {
            const lessonTitle = newLessonTitle;
            setNewLessonTitle("");
            run(() => addLessonAction(courseModule.id, lessonTitle, newLessonType));
          }}
          className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
        >
          Add lesson
        </button>
      </div>

      <QuizSection moduleId={courseModule.id} quiz={courseModule.quiz} run={run} />
    </section>
  );
}

function QuizSection({
  moduleId,
  quiz,
  run,
}: {
  moduleId: string;
  quiz: BuilderQuiz | null;
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  if (!quiz) {
    return (
      <div className="mt-4 border-t border-black/10 pt-3">
        <button
          type="button"
          onClick={() => run(() => addQuizAction(moduleId))}
          className={smallButtonClassName}
        >
          Add knowledge check
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-black/10 pt-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-sm font-medium text-[var(--color-ink)]">
          {quiz.title}
        </p>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Delete the knowledge check and all ${quiz.questions.length} of its questions?`,
              )
            ) {
              run(() => deleteQuizAction(quiz.id));
            }
          }}
          className={`${smallButtonClassName} text-red-700`}
        >
          Delete knowledge check
        </button>
      </div>

      {quiz.questions.length === 0 ? (
        <p className="mb-3 font-body text-xs text-[var(--color-ink-muted)]">
          No questions yet.
        </p>
      ) : (
        <ul className="mb-3 flex flex-col gap-3">
          {quiz.questions.map((question) => (
            <li
              key={question.id}
              className="rounded-lg bg-[var(--color-sage-pale)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-body text-sm font-medium text-[var(--color-ink)]">
                  {question.prompt}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete this question?")) {
                      run(() => deleteQuizQuestionAction(question.id));
                    }
                  }}
                  className={`${smallButtonClassName} shrink-0 text-red-700`}
                >
                  Delete
                </button>
              </div>
              <ul className="mt-2 flex flex-col gap-1">
                {question.options.map((option, index) => (
                  <li
                    key={index}
                    className={`font-body text-xs ${
                      index === question.correctIndex
                        ? "font-medium text-[var(--color-olive)]"
                        : "text-[var(--color-ink-muted)]"
                    }`}
                  >
                    {index === question.correctIndex ? "✓ " : "· "}
                    {option}
                  </li>
                ))}
              </ul>
              {question.explanation ? (
                <p className="mt-2 font-body text-xs italic text-[var(--color-ink-muted)]">
                  {question.explanation}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <AddQuizQuestionForm quizId={quiz.id} run={run} />
    </div>
  );
}

function AddQuizQuestionForm({
  quizId,
  run,
}: {
  quizId: string;
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState("");

  function reset() {
    setPrompt("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setExplanation("");
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-black/15 p-3">
      <label className="font-body text-xs font-medium text-[var(--color-ink)]">
        New question
      </label>
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Question prompt"
        rows={2}
        className={fieldClassName}
      />
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="radio"
            name={`correct-${quizId}`}
            checked={correctIndex === index}
            onChange={() => setCorrectIndex(index)}
            aria-label={`Option ${index + 1} is correct`}
          />
          <input
            type="text"
            value={option}
            onChange={(event) => {
              const next = [...options];
              next[index] = event.target.value;
              setOptions(next);
            }}
            placeholder={`Option ${index + 1}`}
            className={fieldClassName}
          />
        </div>
      ))}
      <textarea
        value={explanation}
        onChange={(event) => setExplanation(event.target.value)}
        placeholder="Explanation, shown after the learner answers (optional)"
        rows={2}
        className={fieldClassName}
      />
      <button
        type="button"
        disabled={!prompt.trim() || options.filter((o) => o.trim()).length < 2}
        onClick={() => {
          const input = { prompt, options, correctIndex, explanation };
          reset();
          run(() => addQuizQuestionAction(quizId, input));
        }}
        className="self-start rounded-md bg-[var(--color-olive)] px-3 py-1.5 font-body text-xs font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        Add question
      </button>
    </div>
  );
}

function LessonRow({
  lesson,
  isFirst,
  isLast,
  streamConfigured,
  run,
}: {
  lesson: BuilderLesson;
  isFirst: boolean;
  isLast: boolean;
  streamConfigured: boolean;
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-[var(--color-sage-pale)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{lesson.type}</Badge>
        <span className="font-body text-sm font-medium text-[var(--color-ink)]">
          {lesson.title}
        </span>
        <span className="font-body text-xs text-[var(--color-ink-muted)]">
          {formatDuration(lesson.durationSeconds)}
        </span>
        {lesson.isFreePreview ? <Badge>Free preview</Badge> : null}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={isFirst}
            aria-label="Move lesson up"
            onClick={() => run(() => reorderLessonAction(lesson.id, "up"))}
            className={smallButtonClassName}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={isLast}
            aria-label="Move lesson down"
            onClick={() => run(() => reorderLessonAction(lesson.id, "down"))}
            className={smallButtonClassName}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className={smallButtonClassName}
          >
            {expanded ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(`Delete "${lesson.title}"? This can't be undone.`)
              ) {
                run(() => deleteLessonAction(lesson.id));
              }
            }}
            className={`${smallButtonClassName} text-red-700`}
          >
            Delete
          </button>
        </div>
      </div>

      {expanded ? (
        <LessonEditor
          lesson={lesson}
          streamConfigured={streamConfigured}
          run={run}
        />
      ) : null}
    </div>
  );
}

function LessonEditor({
  lesson,
  streamConfigured,
  run,
}: {
  lesson: BuilderLesson;
  streamConfigured: boolean;
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [slug, setSlug] = useState(lesson.slug);
  const [type, setType] = useState<LessonType>(lesson.type);
  const [isFreePreview, setIsFreePreview] = useState(lesson.isFreePreview);
  const [body, setBody] = useState(lesson.body ?? "");
  const [transcript, setTranscript] = useState(lesson.transcript ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    Math.round(lesson.durationSeconds / 60),
  );

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-black/10 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`lesson-title-${lesson.id}`}
            className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
          >
            Title
          </label>
          <input
            id={`lesson-title-${lesson.id}`}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div>
          <label
            htmlFor={`lesson-slug-${lesson.id}`}
            className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
          >
            Slug
          </label>
          <input
            id={`lesson-slug-${lesson.id}`}
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`lesson-type-${lesson.id}`}
            className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
          >
            Type
          </label>
          <select
            id={`lesson-type-${lesson.id}`}
            value={type}
            onChange={(event) => setType(event.target.value as LessonType)}
            className={fieldClassName}
          >
            <option value={LessonType.VIDEO}>Video</option>
            <option value={LessonType.TEXT}>Text</option>
            <option value={LessonType.PDF}>PDF</option>
            <option value={LessonType.QUIZ}>Quiz</option>
          </select>
        </div>
        <div>
          <label
            htmlFor={`lesson-duration-${lesson.id}`}
            className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
          >
            Length (minutes)
          </label>
          <input
            id={`lesson-duration-${lesson.id}`}
            type="number"
            min={0}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className={fieldClassName}
          />
          {type === LessonType.VIDEO ? (
            <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
              Overwritten automatically once a video finishes processing.
            </p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-[var(--color-ink)]">
        <input
          type="checkbox"
          checked={isFreePreview}
          onChange={(event) => setIsFreePreview(event.target.checked)}
        />
        Free preview — viewable without buying the course
      </label>

      <div>
        <label
          htmlFor={`lesson-body-${lesson.id}`}
          className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
        >
          Body (Markdown)
        </label>
        <textarea
          id={`lesson-body-${lesson.id}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          className={fieldClassName}
        />
      </div>

      <div>
        <label
          htmlFor={`lesson-transcript-${lesson.id}`}
          className="mb-1 block font-body text-xs font-medium text-[var(--color-ink)]"
        >
          Transcript
        </label>
        <textarea
          id={`lesson-transcript-${lesson.id}`}
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={4}
          className={fieldClassName}
        />
        {lesson.type === LessonType.VIDEO ? (
          <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
            Filled in automatically from the video&apos;s auto-generated
            captions, once ready — edit here any time.
          </p>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          onClick={() =>
            run(() =>
              updateLessonAction(lesson.id, {
                title,
                slug,
                type,
                isFreePreview,
                body,
                transcript,
                durationMinutes,
              }),
            )
          }
          className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
        >
          Save lesson
        </button>
      </div>

      {type === LessonType.VIDEO ? (
        <div className="border-t border-black/10 pt-4">
          <p className="mb-2 font-body text-xs font-medium text-[var(--color-ink)]">
            Video
          </p>
          <VideoUploadPanel
            lessonId={lesson.id}
            initialVideoUid={lesson.videoUid}
            initialDurationSeconds={lesson.durationSeconds}
            hasTranscript={Boolean(lesson.transcript)}
            streamConfigured={streamConfigured}
          />
        </div>
      ) : null}

      <div className="border-t border-black/10 pt-4">
        <p className="mb-2 font-body text-xs font-medium text-[var(--color-ink)]">
          Resources
        </p>
        <ResourceList
          resources={lesson.resources}
          renderActions={(resource) => (
            <DeleteResourceButton lessonId={lesson.id} resourceId={resource.id} />
          )}
        />
        <div className="mt-3">
          <AddResourceForm lessons={[{ id: lesson.id, label: lesson.title }]} />
        </div>
      </div>
    </div>
  );
}
