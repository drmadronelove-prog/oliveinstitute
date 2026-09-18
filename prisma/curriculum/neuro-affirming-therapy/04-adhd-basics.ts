import { defineModule, OC } from "./module";

export const module04 = defineModule({
  number: 4,
  title: "Basics of ADHD",
  lecture: "ADHD as a regulation difference, not an attention deficit",
  watch: [
    "ADHD adults on what a day actually feels like",
    "Medication, explained without hype: what it does and does not do",
  ],
  handout: {
    title: "ADHD for clinicians, updated",
    body: `## What this module covers

Attention-deficit/hyperactivity disorder is badly named. The dominant theoretical account treats it as a difference in self-regulation and executive functioning rather than a shortage of attention (Barkley, 1997), and clinicians who work with adults describe attention that is reliably available for what is interesting or urgent and unreliably available for what is merely important (Dodson, 2016; Hallowell & Ratey, 2021). This handout lays out what that means for adults in therapy.

## Learning objectives

- Describe the three DSM-5-TR presentations and explain why the inattentive presentation is under-recognised.
- Explain ADHD in terms of self-regulation and interest-based attention rather than attention capacity.
- Recognise adult ADHD, including in women and in people with a long history of anxiety or depression diagnoses.
- Discuss medication accurately and neutrally with clients.

## The criteria

DSM-5-TR lists nine inattentive symptoms and nine hyperactive-impulsive symptoms; adults need five from a list, with several symptoms present before age twelve, in more than one setting, and impairing. There are three presentations: predominantly inattentive, predominantly hyperactive-impulsive, and combined (American Psychiatric Association, 2022).

Limits to hold in mind:

- **Hyperactivity goes internal with age.** The consensus literature describes adult hyperactivity as restlessness and an inability to relax rather than running and climbing (Faraone et al., 2021; Kooij et al., 2019).
- **The inattentive presentation is quiet.** Girls are more often inattentive, less disruptive, and so less often referred; they are diagnosed later and less often (Quinn & Madhoo, 2014). The longest prospective study of girls with ADHD found continuing impairment into early adulthood, including elevated risk of suicide attempts and self-injury (Hinshaw et al., 2012).
- **"Before age twelve" depends on memory** and on someone having noticed; a first diagnosis in adulthood is recognised in the European consensus as valid when the developmental history supports it (Kooij et al., 2019).

## ADHD as a regulation difference

Barkley's model treats ADHD as a disorder of behavioural inhibition and the executive functions that depend on it: working memory, self-regulation of affect and motivation, and the organisation of action across time (Barkley, 1997). The informal notion of an interest-based nervous system captures what clients describe: attention is available for what is interesting, novel, challenging, or urgent (Dodson, 2016; Hallowell & Ratey, 2021). Consequences the client will recognise:

- **Hyperfocus**, the flip side of distractibility (Hallowell & Ratey, 2021).
- **Time blindness**: difficulty sensing elapsed time and acting on a future that does not yet feel real, which Barkley (1997) describes as a deficit in the temporal organisation of behaviour.
- **Task initiation**: knowing what to do and being unable to start; it does not respond to shame (Hallowell & Ratey, 2021; Love, 2025b).
- **Working-memory load**: instructions, names, and intentions drop out (Barkley, 1997).
- **Emotional dysregulation**, now regarded as a core feature rather than a comorbidity (Shaw et al., 2014); rejection sensitivity, an intense response to perceived criticism or exclusion, is widely reported by adults with ADHD though it is not a formal diagnostic term (Dodson, 2016), and it emerged as a major theme when 355 adults with ADHD described their romantic relationships (O'Brien et al., 2025).
- **Impulsivity** in spending, speech, and relationships, with the shame that follows (Wymbs et al., 2021).
- **Sleep**: delayed sleep phase is present in most children and adults with ADHD (Bijlenga et al., 2019).
- **Substance use**: childhood ADHD roughly doubles the risk of later nicotine, alcohol, and cocaine use disorders (Lee et al., 2011).

## The shame layer

Adults with ADHD describe a fractured self-concept and a sense of being a burden to those they love (O'Brien et al., 2025). Many arrive with a working diagnosis of anxiety or depression, sometimes accurate, often the downstream effect of undiagnosed ADHD (Kooij et al., 2019). A large part of neuro-affirming work is separating the trait ("I lose track of time") from the moral story ("I don't care about people"); the practice's own writing on ADHD time makes exactly this argument (Love, 2025a).

## ADHD in women

Women are more likely to have the inattentive presentation, to be diagnosed late, and to be treated first for anxiety or depression (Quinn & Madhoo, 2014). Hormonal change matters: the European consensus notes symptom worsening in the premenstrual phase and around the menopause (Kooij et al., 2019). Ask about it.

## Medication, accurately

The largest network meta-analysis to date, covering 133 trials, supports amphetamines as the first-choice short-term medication for adults and methylphenidate for children, with all included drugs superior to placebo (Cortese et al., 2018). Non-stimulants such as atomoxetine and guanfacine are alternatives (Cortese et al., 2018). Points for a non-prescribing clinician, drawn from the consensus statements:

- Medication is a treatment for a neurodevelopmental condition, not a character judgement; framing it as a failure of willpower reflects one of the misconceptions the international consensus was written to correct (Faraone et al., 2021).
- It reduces core symptoms; it does not teach organisation, so psychological treatment is recommended alongside it (Kooij et al., 2019). Cognitive-behavioural therapy for medication-treated adults with residual symptoms outperformed relaxation with educational support in a randomised trial (Safren et al., 2010).
- Side effects (appetite, sleep, heart rate, anxiety) are real and are the prescriber's to manage; encourage reporting rather than quietly stopping (Cortese et al., 2018).
- You do not need an opinion on whether a client should take medication. You need to discuss it without hype or suspicion (Faraone et al., 2021).

## In the room

Adaptations that follow from the executive-functioning account (Barkley, 1997; Safren et al., 2010; Solanto et al., 2010):

- Sessions at the same time each week, with a reminder the day before.
- Short written summaries after each session; do not rely on the client's memory of it.
- Break homework into the smallest first action, and plan where and when it will happen.
- Expect lateness and forgotten sessions, and have a policy that does not shame (Love, 2025a).
- Treat an emotional flare in session as ADHD-typical (Shaw et al., 2014) rather than as evidence of a personality pathology.

## From oliveclinical.com

- "Time Is a Rainbow", on the now/not-now architecture of ADHD time and time optimism (${OC}/blog/time-is-a-rainbow).
- "Windows of Interest", a framework for the zone in which a neurodivergent person can genuinely engage, with hyperfocus above it and interest shutdown below (${OC}/blog/windows-of-interest).
- The ADHD Skills page: an ADHD symptom checklist (DSM-5 plus community-reported items), an Eisenhower Matrix, a Deep Work Planner, an ACT Matrix, a two-hour body-doubling video, a visual timer, and the Ologies podcast interviews with Russell Barkley (${OC}/adhd-skills).

## Videos to watch in this module

The first video is ADHD adults narrating a day, with the emotional texture a symptom list misses (O'Brien et al., 2025). The second is a plain-language explanation of ADHD medication from a prescriber (Cortese et al., 2018; Faraone et al., 2021).

## Reflection prompts

1. How many of your clients with long-standing "treatment-resistant" anxiety or depression have been screened for ADHD (Kooij et al., 2019)?
2. What is your emotional response when a client is fifteen minutes late for the third time? What would a non-shaming policy look like (Love, 2025a)?
3. A client says medication feels like cheating. How would you respond (Faraone et al., 2021)?

## References

- American Psychiatric Association. (2022). *Diagnostic and Statistical Manual of Mental Disorders* (5th ed., text rev.).
- Barkley, R. A. (1997). Behavioral inhibition, sustained attention, and executive functions: Constructing a unifying theory of ADHD. *Psychological Bulletin, 121*(1), 65–94.
- Bijlenga, D., Vollebregt, M. A., Kooij, J. J. S., & Arns, M. (2019). The role of the circadian system in the etiology and pathophysiology of ADHD: Time to redefine ADHD? *ADHD Attention Deficit and Hyperactivity Disorders, 11*(1), 5–19.
- Cortese, S., Adamo, N., Del Giovane, C., et al. (2018). Comparative efficacy and tolerability of medications for attention-deficit hyperactivity disorder in children, adolescents, and adults: A systematic review and network meta-analysis. *The Lancet Psychiatry, 5*(9), 727–738.
- Dodson, W. (2016). Emotion regulation and rejection sensitivity. *Attention* (CHADD).
- Faraone, S. V., Banaschewski, T., Coghill, D., et al. (2021). The World Federation of ADHD International Consensus Statement: 208 evidence-based conclusions about the disorder. *Neuroscience & Biobehavioral Reviews, 128*, 789–818.
- Hallowell, E. M., & Ratey, J. J. (2021). *ADHD 2.0*. Ballantine.
- Hinshaw, S. P., Owens, E. B., Zalecki, C., et al. (2012). Prospective follow-up of girls with attention-deficit/hyperactivity disorder into early adulthood. *Journal of Consulting and Clinical Psychology, 80*(6), 1041–1051.
- Kooij, J. J. S., Bijlenga, D., Salerno, L., et al. (2019). Updated European Consensus Statement on diagnosis and treatment of adult ADHD. *European Psychiatry, 56*, 14–34.
- Lee, S. S., Humphreys, K. L., Flory, K., Liu, R., & Glass, K. (2011). Prospective association of childhood attention-deficit/hyperactivity disorder (ADHD) and substance use and abuse/dependence: A meta-analytic review. *Clinical Psychology Review, 31*(3), 328–341.
- Love, M. (2025a). Time is a rainbow: ADHD and the many ways we move through time. Olive Clinical. ${OC}/blog/time-is-a-rainbow
- Love, M. (2025b). Windows of interest: Rethinking focus, motivation, and the neurodivergent mind. Olive Clinical. ${OC}/blog/windows-of-interest
- O'Brien, M., Kini-Seery, C., Kelly, C., Kilbride, K., Wrigley, M., Nearchou, F., & Bramham, J. (2025). "I felt like a burden": An exploration into the experience of romantic relationships for people with ADHD. *Journal of Marital and Family Therapy*.
- Quinn, P. O., & Madhoo, M. (2014). A review of attention-deficit/hyperactivity disorder in women and girls: Uncovering this hidden diagnosis. *The Primary Care Companion for CNS Disorders, 16*(3).
- Safren, S. A., Sprich, S., Mimiaga, M. J., et al. (2010). Cognitive behavioral therapy vs relaxation with educational support for medication-treated adults with ADHD and persistent symptoms: A randomized controlled trial. *JAMA, 304*(8), 875–880.
- Shaw, P., Stringaris, A., Nigg, J., & Leibenluft, E. (2014). Emotion dysregulation in attention deficit hyperactivity disorder. *American Journal of Psychiatry, 171*(3), 276–293.
- Solanto, M. V., Marks, D. J., Wasserstein, J., et al. (2010). Efficacy of meta-cognitive therapy for adult ADHD. *American Journal of Psychiatry, 167*(8), 958–968.
- Wymbs, B. T., Canu, W. H., Sacchetti, G. M., & Ranson, L. M. (2021). Adult ADHD and romantic relationships: What we know and what we can do to help. *Journal of Marital and Family Therapy, 47*(3), 664–681.`,
  },
  quiz: {
    title: "ADHD basics: knowledge check",
    questions: [
      {
        prompt: "The most accurate one-line description of ADHD in this module is:",
        options: [
          "A shortage of attention.",
          "A difference in self-regulation and executive functioning, in which attention is reliably available for what is interesting or urgent and unreliably available for what is merely important.",
          "A childhood disorder that resolves by adulthood.",
          "A behavioural problem caused by screens and diet.",
        ],
        correctIndex: 1,
        explanation:
          "That is Barkley's (1997) inhibition and executive-function account, joined to the interest-based description used by clinicians who work with adults (Dodson, 2016; Hallowell & Ratey, 2021).",
      },
      {
        prompt: "Why is the inattentive presentation under-recognised?",
        options: [
          "It was removed from the DSM.",
          "It is quiet: a disorganised, daydreaming, anxious child does not disrupt a classroom and is not referred.",
          "It only occurs in adults.",
          "It responds fully to medication so rarely needs diagnosis.",
        ],
        correctIndex: 1,
        explanation:
          "Referral historically depended on disruption; girls, who are more often inattentive, are diagnosed later and less often (Quinn & Madhoo, 2014).",
      },
      {
        prompt: "In adults, hyperactivity most often shows as:",
        options: [
          "Running and climbing.",
          "Internal restlessness, racing thoughts, fast speech, and an inability to relax.",
          "Sleepiness.",
          "Aggression.",
        ],
        correctIndex: 1,
        explanation:
          "Both consensus statements describe adult hyperactivity as internal restlessness (Faraone et al., 2021; Kooij et al., 2019).",
      },
      {
        prompt: "A client says taking stimulant medication feels like cheating. The neuro-affirming response is to:",
        options: [
          "Agree that medication should be a last resort.",
          "Explore the belief, noting that medication reduces core symptoms of a neurodevelopmental condition and is neither a cure nor a moral failing.",
          "Refer immediately for medication review.",
          "Explain that stimulants are addictive and should be avoided.",
        ],
        correctIndex: 1,
        explanation:
          "Stimulants are first-line with the strongest trial evidence (Cortese et al., 2018), and the misconception that ADHD treatment is a failure of willpower is one the international consensus exists to correct (Faraone et al., 2021).",
      },
      {
        prompt: "Which session practice fits ADHD best?",
        options: [
          "Assigning a full week's homework and reviewing it next time.",
          "Varying the session time to keep things fresh.",
          "A fixed weekly time, a reminder the day before, and a short written summary after each session.",
          "Ending sessions early when the client is late.",
        ],
        correctIndex: 2,
        explanation:
          "External structure and written memory support are the core of the evidence-based CBT protocols for adult ADHD (Safren et al., 2010; Solanto et al., 2010).",
      },
    ],
  },
});
