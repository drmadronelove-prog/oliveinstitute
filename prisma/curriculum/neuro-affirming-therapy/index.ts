import { CourseStatus, Track } from "@prisma/client";
import type { CourseSeed } from "../types";
import { MODULE_SECONDS } from "./module";
import { module01 } from "./01-foundations";
import { module02 } from "./02-history";
import { module03 } from "./03-autism-basics";
import { module04 } from "./04-adhd-basics";
import { module05 } from "./05-assessment";
import { module06 } from "./06-co-occurring";
import { module07 } from "./07-pda";
import { module08 } from "./08-executive-functioning";
import { module09 } from "./09-emotion-regulation";
import { module10 } from "./10-sensory-burnout";
import { module11 } from "./11-relationships";
import { module12 } from "./12-families";
import { module13 } from "./13-gender-sexuality";
import { module14 } from "./14-support-outside-clinic";
import { module15 } from "./15-integration";

export const NEURO_AFFIRMING_THERAPY_MODULES = [
  module01,
  module02,
  module03,
  module04,
  module05,
  module06,
  module07,
  module08,
  module09,
  module10,
  module11,
  module12,
  module13,
  module14,
  module15,
];

/**
 * Olive Clinical's Certificate in Neuro-Affirming Therapy: fifteen three-hour
 * modules, each an hour-long lecture, two shorter videos, a cited handout,
 * and a knowledge check.
 *
 * Seeded as a DRAFT with no price so that nothing is sold until the account
 * holder has set the price and uploaded the lecture videos in the admin
 * editor; the publish gate in updateCourseStatusAction refuses to publish
 * until a price is set. The twelve topics the brief named are modules
 * 2–14 (thirteen, since "basics of ADHD" and "basics of autism" are two);
 * modules 1 (foundations) and 15 (integration) were added to reach the
 * fifteen the brief asked for — see CLAUDE.md, "Certificate curriculum".
 */
export const neuroAffirmingTherapyCertificate: CourseSeed = {
  slug: "certificate-in-neuro-affirming-therapy",
  title: "Certificate in Neuro-Affirming Therapy",
  subtitle:
    "Fifteen three-hour modules for clinicians, from foundations to a neurodivergence-informed formulation",
  description:
    "A forty-five-hour, self-paced certificate for therapists, counsellors, and other clinicians who want to work with autistic and ADHD adults in a way the neurodivergent community itself would recognise as affirming.\n\nEach of the fifteen modules is a three-hour unit: an hour-long lecture, two shorter videos to watch, a handout to read in which every claim is cited to a peer-reviewed article or book, and an untimed knowledge check. The modules move from the neurodiversity paradigm and its history, through the basics of autism and ADHD, assessment in adult practice, co-occurring diagnoses and misdiagnosis, and demand avoidance, into the clinical core — executive functioning and solution-focused skills, emotion regulation, sensory processing and burnout — and then outward to relationships, families, gender and sexuality, and the forms of support that live outside the clinic. The final module is a capstone: a neurodivergence-informed formulation of one of your own clients, checked by neurodivergent reviewers.\n\nThe handouts draw throughout on Olive Clinical's own public writing, assessments, tools, and games, so that what you learn here connects directly to resources your clients can use between sessions.\n\nThis is educational content for clinicians. It is not APA-approved continuing education, and it does not confer a licence to diagnose.",
  track: Track.CLINICIAN,
  priceCents: 0,
  estimatedMinutes: (NEURO_AFFIRMING_THERAPY_MODULES.length * MODULE_SECONDS) / 60,
  sortOrder: 0,
  status: CourseStatus.DRAFT,
  placeholderVideos: false,
  rebuild: "if-empty",
  modules: NEURO_AFFIRMING_THERAPY_MODULES,
};
