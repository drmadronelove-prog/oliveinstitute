"use client";

import { useActionState } from "react";
import { withBasePath } from "@/lib/basePath";
import { updateCourseAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

const fieldClassName =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]";
const labelClassName =
  "mb-1 block font-body text-sm font-medium text-[var(--color-ink)]";

export function EditCourseForm({
  course,
}: {
  course: {
    id: string;
    title: string;
    slug: string;
    subtitle: string;
    description: string;
    track: string;
    priceCents: number;
    estimatedMinutes: number;
    sortOrder: number;
    stripePriceId: string | null;
    coverImageKey: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateCourseAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={course.id} />

      <div>
        <label htmlFor="edit-course-title" className={labelClassName}>
          Title
        </label>
        <input
          id="edit-course-title"
          name="title"
          type="text"
          required
          defaultValue={course.title}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="edit-course-slug" className={labelClassName}>
          Slug
        </label>
        <input
          id="edit-course-slug"
          name="slug"
          type="text"
          required
          defaultValue={course.slug}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          className={fieldClassName}
        />
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          Lowercase, hyphen-separated. Changing this changes the course&apos;s
          public URL.
        </p>
      </div>

      <div>
        <label htmlFor="edit-course-subtitle" className={labelClassName}>
          Subtitle
        </label>
        <input
          id="edit-course-subtitle"
          name="subtitle"
          type="text"
          defaultValue={course.subtitle}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="edit-course-description" className={labelClassName}>
          Description
        </label>
        <textarea
          id="edit-course-description"
          name="description"
          rows={3}
          defaultValue={course.description}
          className={fieldClassName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-course-track" className={labelClassName}>
            Track
          </label>
          <select
            id="edit-course-track"
            name="track"
            required
            defaultValue={course.track}
            className={fieldClassName}
          >
            <option value="PUBLIC">Public</option>
            <option value="CLINICIAN">Clinician</option>
          </select>
        </div>
        <div>
          <label htmlFor="edit-course-price" className={labelClassName}>
            Price (USD)
          </label>
          <input
            id="edit-course-price"
            name="priceDollars"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={(course.priceCents / 100).toFixed(2)}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-course-minutes" className={labelClassName}>
            Estimated minutes
          </label>
          <input
            id="edit-course-minutes"
            name="estimatedMinutes"
            type="number"
            min={0}
            required
            defaultValue={course.estimatedMinutes}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="edit-course-sort" className={labelClassName}>
            Sort order
          </label>
          <input
            id="edit-course-sort"
            name="sortOrder"
            type="number"
            min={0}
            required
            defaultValue={course.sortOrder}
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-course-stripe-price" className={labelClassName}>
          Stripe price ID
        </label>
        <input
          id="edit-course-stripe-price"
          name="stripePriceId"
          type="text"
          placeholder="price_… (optional)"
          defaultValue={course.stripePriceId ?? ""}
          className={fieldClassName}
        />
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          Not required — checkout builds its own price from the amount
          above.
        </p>
      </div>

      <div>
        <label htmlFor="edit-course-cover" className={labelClassName}>
          Cover image
        </label>
        {course.coverImageKey ? (
          // eslint-disable-next-line @next/next/no-img-element -- an admin-only thumbnail preview of an arbitrary uploaded image; not worth next/image's optimization pipeline here.
          <img
            src={withBasePath(`/api/course-covers/${course.coverImageKey}`)}
            alt=""
            className="mb-2 h-24 w-auto rounded-md object-cover"
          />
        ) : null}
        <input
          id="edit-course-cover"
          name="coverImage"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={fieldClassName}
        />
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          PNG, JPEG, WEBP, or GIF, up to 5 MB. Leave empty to keep the
          current image.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save course"}
      </button>

      {state.status === "error" ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="font-body text-sm text-[var(--color-olive)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
