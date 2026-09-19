import Link from "next/link";
import {
  CourseTile,
  TILE_TONES,
} from "@/components/dashboard/CourseTile";
import { BentoTiles, TileIcons } from "@/components/dashboard/BentoTiles";

type CourseSummary = {
  id: string;
  title: string;
  meta: string;
  secondaryLabel?: string;
};

type RolePanelProps =
  | { role: "ADMIN" }
  | { role: "INSTRUCTOR"; courses: (CourseSummary & { secondaryLabel: string })[] }
  | { role: "LEARNER"; courses: CourseSummary[] };

function SectionHeading({
  title,
  subtext,
}: {
  title: string;
  subtext: string;
}) {
  return (
    <div className="mt-14">
      <h2 className="m-0 font-heading text-[clamp(28px,3.2vw,38px)] font-medium leading-none tracking-[-0.025em] text-[var(--ink)]">
        {title}
      </h2>
      <p className="mt-1.5 font-body text-[var(--muted)]">{subtext}</p>
    </div>
  );
}

export function RolePanel(props: RolePanelProps) {
  if (props.role === "ADMIN") {
    return (
      <>
        <SectionHeading
          title="Admin tools"
          subtext="Create and manage Instructor and Learner accounts, courses, and enrollment."
        />
        <BentoTiles
          tiles={[
            {
              href: "/admin/courses",
              title: "Manage courses",
              description:
                "Build modules and lessons, upload video, set prices and publish.",
              icon: TileIcons.courses,
            },
            {
              href: "/admin/users",
              title: "Manage users",
              description: "Invite instructors and learners, send reset links.",
              icon: TileIcons.users,
            },
            {
              href: "/admin/learners",
              title: "Enrollment",
              description:
                "See who is enrolled where, and grant comp access.",
              icon: TileIcons.enrollment,
            },
            {
              href: "/admin/purchases",
              title: "Finances",
              description: "Purchases, refunds and course revenue.",
              icon: TileIcons.finances,
            },
          ]}
        />
      </>
    );
  }

  if (props.role === "LEARNER") {
    return (
      <>
        <SectionHeading
          title="Your courses"
          subtext="Take them in order, or jump to what you need today."
        />
        {props.courses.length === 0 ? (
          <p className="mt-5 font-body text-[var(--muted)]">
            You aren&apos;t enrolled in any courses yet.{" "}
            <Link
              href="/explore"
              className="text-[var(--ink)] underline underline-offset-4"
            >
              Browse the catalogue
            </Link>
            .
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {props.courses.map((course, index) => (
              <CourseTile
                key={course.id}
                href={`/student/courses/${course.id}`}
                title={course.title}
                meta={course.meta}
                secondaryLabel={course.secondaryLabel}
                tone={TILE_TONES[index % TILE_TONES.length]}
                muted={course.secondaryLabel === "Completed"}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <SectionHeading
        title="Your courses"
        subtext="The courses you are the instructor on."
      />
      {props.courses.length === 0 ? (
        <p className="mt-5 font-body text-[var(--muted)]">
          You haven&apos;t been assigned any courses yet. Ask an admin to assign
          you as instructor on a course.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.courses.map((course, index) => (
            <CourseTile
              key={course.id}
              href={`/professor/courses/${course.id}`}
              title={course.title}
              meta={course.meta}
              secondaryLabel={course.secondaryLabel}
              tone={TILE_TONES[index % TILE_TONES.length]}
            />
          ))}
        </div>
      )}
    </>
  );
}
