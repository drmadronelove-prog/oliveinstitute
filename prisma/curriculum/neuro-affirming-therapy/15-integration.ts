import { defineModule, OC } from "./module";

export const module15 = defineModule({
  number: 15,
  title: "Integration and capstone",
  lecture: "Putting it together: a neurodivergence-informed formulation",
  watch: [
    "Three clinicians present a neurodivergence-informed formulation and get feedback from neurodivergent reviewers",
    "Autistic and ADHD adults on what they would tell a clinician finishing this certificate",
  ],
  handout: {
    title: "The capstone: a neurodivergence-informed formulation",
    body: `## What this module covers

Fourteen modules have covered the stance, the history, the two neurotypes, assessment, co-occurrence, demand avoidance, executive functioning, emotion, sensory life and burnout, relationships, families, gender and sexuality, and community. This final module asks you to put them together in the form that clinical work actually takes: a formulation of one client, written so that a neurodivergent reviewer would recognise themselves in it. Chapman and Botha (2023) call the result neurodivergence-informed therapy: therapy that treats neurodivergence as part of human diversity, takes the double empathy problem seriously, and aims at the construction of environments a person can thrive in rather than at normalisation.

## Learning objectives

- Write a neurodivergence-informed formulation of a client using the template below.
- Audit an existing treatment plan for normalising goals, masking rewards, and unaccommodated environments.
- State, in a sentence each, the core evidence behind each of the certificate's commitments.

## The commitments, and their evidence

1. **Neurodivergence is variation, and much distress is produced by mismatch and stigma.** The neurodiversity paradigm (Walker, 2021; Singer, 2017); the minority-stress model applied to autism (Botha & Frost, 2020); the field's own review of the shift from normal science to neurodiversity (Pellicano & den Houting, 2022).
2. **Communication difficulty is mutual.** The double empathy problem (Milton, 2012), supported experimentally (Crompton et al., 2020; Morrison et al., 2020).
3. **Behaviour makes sense until proven otherwise.** Stimming as regulation (Kapp et al., 2019); monotropism (Murray et al., 2005); meltdown and shutdown as overload (Phung et al., 2021).
4. **Masking is costly and must not be rewarded.** Its consequences (Hull et al., 2017; Bradley et al., 2021) and its link to suicidality (Cassidy et al., 2018).
5. **Adapt the process, not the modality.** Practitioner consensus (Spain & Happé, 2020); accommodations autistic adults ask for (Nicolaidis et al., 2016).
6. **Assessment is a whole picture, and the client's account is primary.** Adult diagnosis (Lai & Baron-Cohen, 2015; Huang et al., 2020); misdiagnosis (Kentrou et al., 2024); camouflaging measures (Hull et al., 2019).
7. **Co-occurrence is expected; misdiagnosis is common.** Prevalence (Lai et al., 2019); differential thinking (Dudas et al., 2017; Ruzzano et al., 2015); the downstream test (Botha & Frost, 2020).
8. **Executive functioning responds to scaffolding, not shame.** Barkley (1997); Safren et al. (2010); solution-focused practice (de Shazer et al., 2007).
9. **Regulation starts in the body.** Alexithymia and interoception (Kinnaird et al., 2019; Shah et al., 2016); DBT adapted (Bemmouna et al., 2022).
10. **Burnout needs subtraction.** Its definition and recovery (Raymaker et al., 2020; Higgins et al., 2021; Arnold et al., 2023).
11. **Relationships hold two nervous systems.** Love (2025a); O'Brien et al. (2025); explanation locates, does not license (Love, 2026).
12. **Families are usually neurodivergent too.** Heritability (Tick et al., 2016; Faraone et al., 2021); collaborative problem-solving (Greene, 2014).
13. **Gender and sexuality are adapted for, not doubted.** Warrier et al. (2020); Strang et al. (2018); Cooper et al. (2022).
14. **Most support lives outside the clinic.** Identity and community (Cooper et al., 2017; Botha et al., 2022); work (Romualdez et al., 2021).
15. **Language matters.** Ableist terms to retire (Bottema-Beutel et al., 2021); ask what the person uses (Kenny et al., 2016).

## The formulation template

Write one to two pages on a client (anonymised), under these headings. Each heading names the module that informs it.

1. **Neurotype and how it was identified** (Modules 3, 4, 5). Diagnosed, self-identified, or suspected; by whom, when, with what tools; what the client's own account says. What was missed, and what was misdiagnosed (Kentrou et al., 2024).
2. **How this person's attention, sensory life, and communication work** (Modules 3, 9, 10). Monotropic or interest-based; the sensory map by modality; interoception and alexithymia; preferred channels. Written from their side, not the observer's (Murray et al., 2005; MacLennan et al., 2022).
3. **Masking and its cost** (Modules 3, 10). Where and with whom they mask; what it costs; whether burnout is present now or has been (Hull et al., 2017; Raymaker et al., 2020).
4. **Co-occurring conditions and the downstream test** (Module 6). Which are co-occurring, which downstream, which mistaken (Lai et al., 2019; Botha & Frost, 2020).
5. **Demands, capacity, and drivers** (Modules 7, 8). Which drivers of avoidance operate where; executive-function scaffolding in place and missing (Love, 2026; Barkley, 1997).
6. **Relationships and family** (Modules 11, 12). The nervous systems in their closest relationships; parentification or its opposite; the family's neurotypes and history (Love, 2025a; Tick et al., 2016).
7. **Identity: gender, sexuality, community** (Modules 13, 14). Stated in the client's own terms; community connection present or absent (Cooper et al., 2022; Botha et al., 2022).
8. **The environment audit** (Modules 1, 10, 14). Home, work, healthcare: what fits, what does not, what can change (Doyle, 2020; Nicolaidis et al., 2016).
9. **Goals, in the client's words** (Module 1). Not one goal that amounts to looking more typical (Leadbitter et al., 2021; Kapp et al., 2019).
10. **Plan** (all modules). Process adaptations; subtraction before addition; scaffolding; what happens outside the clinic; what you will do in a meltdown or shutdown (Spain & Happé, 2020; Phung et al., 2021).

## The plan audit

Take an existing treatment plan for a neurodivergent client and mark every item that:

- Would count as success if the client looked more typical (Lovaas, 1987, is the ancestor of every such item).
- Rewards masking or asks for suppression of regulation (Kapp et al., 2019; Cassidy et al., 2018).
- Uses exposure for a sensory or capacity limit rather than a disproportionate fear (Spain et al., 2018).
- Relies on the client's working memory rather than an external record (Barkley, 1997).
- Adds load to a client in or near burnout (Raymaker et al., 2020).
- Uses language the field now identifies as ableist (Bottema-Beutel et al., 2021).

Rewrite each one.

## Where this certificate stops

This is education, not a licence to diagnose where your jurisdiction does not permit it, and not continuing education approved by a professional body. Neurodivergent people die earlier than the general population from many causes, including suicide (Hirvikoski et al., 2016), and the risk markers are the ones this certificate has taught you to see: camouflaging, unmet support needs, late diagnosis (Cassidy et al., 2018). The people best placed to check your formulation are neurodivergent people; the field's own review literature says the same about its research (Pellicano & den Houting, 2022). Find some, and ask.

## From oliveclinical.com

- The practice's assessment page, which describes the neuroinclusive process this certificate has been teaching from the client's side (${OC}/assessments).
- The Neurodivergent Maps, for checking a formulation against the mechanisms a client's conditions share (${OC}/neurodiversity).
- The full tools and games libraries, for the "outside the clinic" section of the plan (${OC}/tools; ${OC}/brain-games).

## Videos to watch in this module

The first video is three clinicians presenting a formulation and receiving feedback from neurodivergent reviewers (Chapman & Botha, 2023; Milton, 2012). The second is autistic and ADHD adults saying what they would tell a clinician finishing this certificate (Kapp, 2020).

## Capstone task

Write the formulation and the plan audit for one client. Share it, anonymised, with a neurodivergent colleague or peer group and record what they change. That record, not the formulation, is the deliverable.

## References

- Arnold, S. R. C., Higgins, J. M., Weise, J., Desai, A., Pellicano, E., & Trollor, J. N. (2023). Confirming the nature of autistic burnout. *Autism, 27*(7), 1906–1918.
- Barkley, R. A. (1997). Behavioral inhibition, sustained attention, and executive functions. *Psychological Bulletin, 121*(1), 65–94.
- Bemmouna, D., Coutelle, R., Weibel, S., & Weiner, L. (2022). Feasibility, acceptability and preliminary efficacy of dialectical behavior therapy for autistic adults without intellectual disability. *Journal of Autism and Developmental Disorders, 52*, 4337–4354.
- Botha, M., & Frost, D. M. (2020). Extending the minority stress model to understand mental health problems experienced by the autistic population. *Society and Mental Health, 10*(1), 20–34.
- Botha, M., Dibb, B., & Frost, D. M. (2022). A qualitative investigation of autistic community connectedness. *Autism, 26*(8), 2151–2164.
- Bottema-Beutel, K., Kapp, S. K., Lester, J. N., Sasson, N. J., & Hand, B. N. (2021). Avoiding ableist language. *Autism in Adulthood, 3*(1), 18–29.
- Bradley, L., Shaw, R., Baron-Cohen, S., & Cassidy, S. (2021). Autistic adults' experiences of camouflaging and its perceived impact on mental health. *Autism in Adulthood, 3*(4), 320–329.
- Cassidy, S., Bradley, L., Shaw, R., & Baron-Cohen, S. (2018). Risk markers for suicidality in autistic adults. *Molecular Autism, 9*, 42.
- Chapman, R., & Botha, M. (2023). Neurodivergence-informed therapy. *Developmental Medicine & Child Neurology, 65*(3), 310–317.
- Cooper, K., Smith, L. G. E., & Russell, A. (2017). Social identity, self-esteem, and mental health in autism. *European Journal of Social Psychology, 47*(7), 844–854.
- Cooper, K., Mandy, W., Butler, C., & Russell, A. (2022). The lived experience of gender dysphoria in autistic adults. *Autism, 26*(4), 963–974.
- Crompton, C. J., Ropar, D., Evans-Williams, C. V. M., Flynn, E. G., & Fletcher-Watson, S. (2020). Autistic peer-to-peer information transfer is highly effective. *Autism, 24*(7), 1704–1712.
- de Shazer, S., Dolan, Y., Korman, H., Trepper, T., McCollum, E., & Berg, I. K. (2007). *More Than Miracles*. Haworth.
- Doyle, N. (2020). Neurodiversity at work. *British Medical Bulletin, 135*(1), 108–125.
- Dudas, R. B., Lovejoy, C., Cassidy, S., Allison, C., Smith, P., & Baron-Cohen, S. (2017). The overlap between autistic spectrum conditions and borderline personality disorder. *PLoS ONE, 12*(9), e0184447.
- Faraone, S. V., Banaschewski, T., Coghill, D., et al. (2021). The World Federation of ADHD International Consensus Statement. *Neuroscience & Biobehavioral Reviews, 128*, 789–818.
- Greene, R. W. (2014). *The Explosive Child* (5th ed.). Harper.
- Higgins, J. M., Arnold, S. R. C., Weise, J., Pellicano, E., & Trollor, J. N. (2021). Defining autistic burnout through experts by lived experience. *Autism, 25*(8), 2356–2369.
- Hirvikoski, T., Mittendorfer-Rutz, E., Boman, M., Larsson, H., Lichtenstein, P., & Bölte, S. (2016). Premature mortality in autism spectrum disorder. *British Journal of Psychiatry, 208*(3), 232–238.
- Huang, Y., Arnold, S. R. C., Foley, K.-R., & Trollor, J. N. (2020). Diagnosis of autism in adulthood: A scoping review. *Autism, 24*(6), 1311–1327.
- Hull, L., Petrides, K. V., Allison, C., et al. (2017). "Putting on my best normal". *Journal of Autism and Developmental Disorders, 47*(8), 2519–2534.
- Hull, L., Mandy, W., Lai, M.-C., et al. (2019). Development and validation of the Camouflaging Autistic Traits Questionnaire (CAT-Q). *Journal of Autism and Developmental Disorders, 49*(3), 819–833.
- Kapp, S. K. (Ed.). (2020). *Autistic Community and the Neurodiversity Movement*. Palgrave Macmillan.
- Kapp, S. K., Steward, R., Crane, L., et al. (2019). "People should be allowed to do what they like". *Autism, 23*(7), 1782–1792.
- Kenny, L., Hattersley, C., Molins, B., Buckley, C., Povey, C., & Pellicano, E. (2016). Which terms should be used to describe autism? *Autism, 20*(4), 442–462.
- Kentrou, V., Livingston, L. A., Grove, R., Hoekstra, R. A., & Begeer, S. (2024). Perceived misdiagnosis of psychiatric conditions in autistic adults. *eClinicalMedicine, 71*, 102586.
- Kinnaird, E., Stewart, C., & Tchanturia, K. (2019). Investigating alexithymia in autism. *European Psychiatry, 55*, 80–89.
- Lai, M.-C., & Baron-Cohen, S. (2015). Identifying the lost generation of adults with autism spectrum conditions. *The Lancet Psychiatry, 2*(11), 1013–1027.
- Lai, M.-C., Kassee, C., Besney, R., et al. (2019). Prevalence of co-occurring mental health diagnoses in the autism population. *The Lancet Psychiatry, 6*(10), 819–829.
- Leadbitter, K., Buckle, K. L., Ellis, C., & Dekker, M. (2021). Autistic self-advocacy and the neurodiversity movement. *Frontiers in Psychology, 12*, 635690.
- Love, M. (2025a). Loving across the wiring. Olive Clinical. ${OC}/blog/loving-across-the-wiring
- Love, M. (2026). What kind of demand avoidance is this? Olive Clinical. ${OC}/blog/what-kind-of-demand-avoidance-is-this
- Lovaas, O. I. (1987). Behavioral treatment and normal educational and intellectual functioning in young autistic children. *Journal of Consulting and Clinical Psychology, 55*(1), 3–9.
- MacLennan, K., O'Brien, S., & Tavassoli, T. (2022). In our own words. *Journal of Autism and Developmental Disorders, 52*, 3061–3075.
- Milton, D. E. M. (2012). On the ontological status of autism: The "double empathy problem". *Disability & Society, 27*(6), 883–887.
- Morrison, K. E., DeBrabander, K. M., Jones, D. R., Faso, D. J., Ackerman, R. A., & Sasson, N. J. (2020). Outcomes of real-world social interaction for autistic adults paired with autistic compared to typically developing partners. *Autism, 24*(5), 1067–1080.
- Murray, D., Lesser, M., & Lawson, W. (2005). Attention, monotropism and the diagnostic criteria for autism. *Autism, 9*(2), 139–156.
- Nicolaidis, C., Raymaker, D., McDonald, K., et al. (2016). The development and evaluation of an online healthcare toolkit for autistic adults and their primary care providers. *Journal of General Internal Medicine, 31*(10), 1180–1189.
- O'Brien, M., Kini-Seery, C., Kelly, C., et al. (2025). "I felt like a burden". *Journal of Marital and Family Therapy*.
- Pellicano, E., & den Houting, J. (2022). Annual Research Review: Shifting from "normal science" to neurodiversity in autism science. *Journal of Child Psychology and Psychiatry, 63*(4), 381–396.
- Phung, J., Penner, M., Pirlot, C., & Welch, C. (2021). What I wish you knew. *Frontiers in Psychology, 12*, 741421.
- Raymaker, D. M., Teo, A. R., Steckler, N. A., et al. (2020). Defining autistic burnout. *Autism in Adulthood, 2*(2), 132–143.
- Romualdez, A. M., Heasman, B., Walker, Z., Davies, J., & Remington, A. (2021). "People might understand me better". *Autism in Adulthood, 3*(2), 157–167.
- Ruzzano, L., Borsboom, D., & Geurts, H. M. (2015). Repetitive behaviors in autism and obsessive-compulsive disorder. *Journal of Autism and Developmental Disorders, 45*, 192–202.
- Safren, S. A., Sprich, S., Mimiaga, M. J., et al. (2010). Cognitive behavioral therapy vs relaxation with educational support for medication-treated adults with ADHD and persistent symptoms. *JAMA, 304*(8), 875–880.
- Shah, P., Hall, R., Catmur, C., & Bird, G. (2016). Alexithymia, not autism, is associated with impaired interoception. *Cortex, 81*, 215–220.
- Singer, J. (2017). *NeuroDiversity: The Birth of an Idea*. Self-published.
- Spain, D., & Happé, F. (2020). How to optimise cognitive behaviour therapy (CBT) for people with autism spectrum disorders (ASD): A Delphi study. *Journal of Rational-Emotive & Cognitive-Behavior Therapy, 38*, 184–208.
- Spain, D., Sin, J., Linder, K. B., McMahon, J., & Happé, F. (2018). Social anxiety in autism spectrum disorder: A systematic review. *Research in Autism Spectrum Disorders, 52*, 51–68.
- Strang, J. F., Meagher, H., Kenworthy, L., et al. (2018). Initial clinical guidelines for co-occurring autism spectrum disorder and gender dysphoria or incongruence in adolescents. *Journal of Clinical Child & Adolescent Psychology, 47*(1), 105–115.
- Tick, B., Bolton, P., Happé, F., Rutter, M., & Rijsdijk, F. (2016). Heritability of autism spectrum disorders: A meta-analysis of twin studies. *Journal of Child Psychology and Psychiatry, 57*(5), 585–595.
- Walker, N. (2021). *Neuroqueer Heresies*. Autonomous Press.
- Warrier, V., Greenberg, D. M., Weir, E., et al. (2020). Elevated rates of autism, other neurodevelopmental and psychiatric diagnoses, and autistic traits in transgender and gender-diverse individuals. *Nature Communications, 11*, 3959.`,
  },
  quiz: {
    title: "Integration: knowledge check",
    questions: [
      {
        prompt: "Chapman and Botha's (2023) neurodivergence-informed therapy aims at:",
        options: [
          "Normalising neurodivergent behaviour through skills training.",
          "Treating neurodivergence as part of human diversity, taking the double empathy problem seriously, and building environments a person can thrive in.",
          "Replacing all existing modalities.",
          "Diagnosing more adults.",
        ],
        correctIndex: 1,
        explanation:
          "The paper reconceptualises neurodiversity as part of biodiversity and argues for constructing ecological niches rather than normalising (Chapman & Botha, 2023).",
      },
      {
        prompt: "In a neurodivergence-informed formulation, the client's attention, sensory life, and communication should be written:",
        options: [
          "From the observer's side, using DSM language.",
          "From the client's side, using monotropism and their own sensory map.",
          "Only if a formal diagnosis exists.",
          "By a parent or partner.",
        ],
        correctIndex: 1,
        explanation:
          "Autistic-led theory (Murray et al., 2005) and autistic adults' own sensory accounts (MacLennan et al., 2022) are the frame; the criteria describe the outside view.",
      },
      {
        prompt: "Which treatment-plan item should be rewritten under the plan audit?",
        options: [
          "Send a written summary after each session.",
          "Offer a choice of seating and lighting.",
          "\"Increase eye contact during sessions to 50% of the time.\"",
          "Ask the client what language they use for their neurotype.",
        ],
        correctIndex: 2,
        explanation:
          "It counts success as looking more typical, the Lovaas (1987) criterion, and asks the client to mask, which is linked to exhaustion and suicidality (Hull et al., 2017; Cassidy et al., 2018).",
      },
      {
        prompt: "The evidence behind \"burnout needs subtraction\" is:",
        options: [
          "A single case report.",
          "The community-partnered definition of autistic burnout and its recovery factors (reduced load, acceptance, unmasking), confirmed in later studies.",
          "Occupational-burnout research only.",
          "None; it is a slogan.",
        ],
        correctIndex: 1,
        explanation:
          "Raymaker et al. (2020) defined burnout and its recovery factors; Higgins et al. (2021) and Arnold et al. (2023) confirmed the definition with autistic adults.",
      },
      {
        prompt: "The deliverable of the capstone task is:",
        options: [
          "The formulation itself.",
          "The record of what a neurodivergent colleague or peer group changed in your formulation.",
          "A diagnosis.",
          "A treatment contract.",
        ],
        correctIndex: 1,
        explanation:
          "Neurodivergent people are best placed to check the formulation, the same principle the field applies to its research (Pellicano & den Houting, 2022).",
      },
    ],
  },
});
