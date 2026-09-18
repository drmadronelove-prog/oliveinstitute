import { defineModule, OC } from "./module";

export const module03 = defineModule({
  number: 3,
  title: "Basics of autism",
  lecture: "Autism from the inside: monotropism, sensory life, and communication",
  watch: [
    "Autistic adults describe a day in their sensory world",
    "Masking: what it is, what it costs, and how to notice it in session",
  ],
  handout: {
    title: "Autism for clinicians, updated",
    body: `## What this module covers

Most clinicians learned autism as a list: differences in social communication, restricted and repetitive behaviour, onset in early development (American Psychiatric Association, 2022). That list is written from the observer's side. This handout pairs it with the account from the inside, drawn from autistic-led theory and from studies that asked autistic adults directly, because the inside account is what predicts how a client will experience your sessions.

## Learning objectives

- Describe the DSM-5-TR criteria for autism and explain their limitations.
- Explain monotropism and use it to make sense of intense interests, transitions, and shutdown.
- Distinguish masking from social skill, and describe its costs.
- Recognise presentations that older criteria missed, especially in women, gender-diverse people, and adults.

## The criteria, and their limits

DSM-5-TR requires persistent differences in social communication and interaction across contexts, plus at least two of: repetitive movements or speech, insistence on sameness, highly focused interests, and sensory hyper- or hypo-reactivity; traits must be present from early development, though they "may not become fully manifest until social demands exceed limited capacities" (American Psychiatric Association, 2022). That last clause matters for adults (Lai & Baron-Cohen, 2015).

Three limitations to hold in mind:

1. The criteria describe what a non-autistic observer sees; autistic adults describe the same behaviours as regulation, as aversion, or as thinking (Kapp et al., 2019; Milton, 2012).
2. Sensory experience is listed last, yet questionnaire studies find atypical sensory perception in over ninety per cent of autistic people, and autistic adults describe it as central (Tavassoli et al., 2014; Crane et al., 2009; Robertson & Baron-Cohen, 2017).
3. The evidence base behind the criteria skews toward boys diagnosed in childhood; the adult, female, and masked presentations were largely missed (Lai & Baron-Cohen, 2015; Loomes et al., 2017; Hull, Petrides, & Mandy, 2020).

## Monotropism: a theory from the inside

Murray, Lesser, and Lawson (2005) proposed that autistic attention tends to be pulled into fewer channels at greater depth, where non-autistic attention is spread more widely across more channels. Much of autism follows from that one difference, on their account:

- **Intense interests** are what deep attention looks like when it is allowed to run (Murray et al., 2005); autistic adults describe them as sources of joy, regulation, and expertise (Kapp et al., 2019).
- **Transitions are costly**, because moving attention out of a deep channel takes effort and time (Murray et al., 2005).
- **Processing may be slower in conversation**, not from lower ability but because each incoming stream is attended to fully (Murray et al., 2005).
- **Shutdown and meltdown** are overload responses when demands exceed what a narrowly focused system can process; autistic young people describe them as involuntary and as made worse by pressure from adults (Phung et al., 2021).

The clinical use of monotropism is that it predicts what will help: fewer simultaneous demands, warning before transitions, one question at a time, and interest-led work, which is also what the practitioner Delphi consensus recommends (Spain & Happé, 2020).

## Sensory life

Sensory differences are near-universal and highly individual: a person can be hypersensitive in one channel and hyposensitive in another, and this varies with state (Robertson & Baron-Cohen, 2017; Crane et al., 2009). Interoception, the sensing of hunger, thirst, pain, and the bodily signals of emotion, is often reduced, and reduced interoceptive accuracy in autistic adults is associated with anxiety (Garfinkel et al., 2016). Alexithymia, difficulty identifying and describing feelings, is present in roughly half of autistic people against about five per cent of non-autistic people (Kinnaird, Stewart, & Tchanturia, 2019); Module 9 takes this up.

In the room: ask about the space. Sensory overload consumes capacity before you have said a word (Crane et al., 2009; Nicolaidis et al., 2016).

## Communication

Autistic communication is different, not deficient (Milton, 2012; Crompton et al., 2020). Common features reported by autistic adults include a preference for direct, explicit language; sharing knowledge about an interest as a way of connecting; reduced or atypical eye contact; and scripts or echoed phrases as tools for producing speech under load (Kapp et al., 2019; Hull et al., 2017). Speech can become unavailable under stress while language is intact; offering a typed or written channel is a basic accommodation, and is among the adaptations autistic adults ask for in healthcare (Nicolaidis et al., 2016).

## Masking

Camouflaging, or masking, is the effortful suppression of autistic traits and performance of non-autistic ones: forcing eye contact, rehearsing conversation, hiding stims (Hull et al., 2017). Autistic adults describe it as learned early in response to bullying and correction, and describe its consequences as exhaustion, threats to self-perception, and worse mental health (Hull et al., 2017; Bradley et al., 2021). Camouflaging is a risk marker for suicidality unique to autistic adults (Cassidy et al., 2018). It is why many adults reach midlife before anyone suggests autism (Bargiela et al., 2016; Leedham et al., 2020), and why "you don't seem autistic" is a comment about the mask. The Camouflaging Autistic Traits Questionnaire measures it directly (Hull et al., 2019).

In therapy, masking can look like a highly engaged, articulate client who never gets better. If a client seems to be performing the session, name it gently and make explicit that they do not have to (Bradley et al., 2021).

## Presentations the old picture missed

- **Women and girls**, who camouflage more and are more likely to be diagnosed with anxiety, eating disorders, or a personality disorder first (Bargiela et al., 2016; Milner et al., 2019; Kentrou et al., 2024).
- **Transgender and gender-diverse people**, who are three to six times more likely to be autistic than cisgender people (Warrier et al., 2020); Module 13 takes this up.
- **Verbally fluent adults**, whose difficulties are in energy, sensory life, and executive functioning rather than speech (Lai & Baron-Cohen, 2015).

## From oliveclinical.com

- The Neuroinclusive Assessments library includes the AQ-50, the AQ-10, the RAADS-R, the CAT-Q for camouflaging, the RBQ-3 for repetitive behaviour, and the GSQ for sensory processing, each with its source study (${OC}/tests).
- The ASD Skills page: a Dysregulation Log, a fillable Meltdown Workbook, and the Regulation Station game (${OC}/asd-skills).
- "Autistic Culture is Flourishing", on the systems-thinking aesthetic many autistic clients recognise as home (${OC}/blog/autistic-culture-is-flourishing).

## Videos to watch in this module

The first video follows autistic adults through an ordinary day and lets them narrate its sensory texture: the commute, an open-plan office, a supermarket (Crane et al., 2009; Robertson & Baron-Cohen, 2017). The second is autistic adults and a clinician explaining masking and how to notice it in session (Hull et al., 2017; Bradley et al., 2021).

## Reflection prompts

1. Take a client you suspect may be autistic. Re-describe their presentation using monotropism (Murray et al., 2005) rather than the DSM criteria. What does it predict about what will help?
2. What does your consulting room sound, look, and smell like to someone hypersensitive in each channel?
3. Have you ever praised a client for something that was, in retrospect, masking (Hull et al., 2017)?

## References

- American Psychiatric Association. (2022). *Diagnostic and Statistical Manual of Mental Disorders* (5th ed., text rev.).
- Bargiela, S., Steward, R., & Mandy, W. (2016). The experiences of late-diagnosed women with autism spectrum conditions. *Journal of Autism and Developmental Disorders, 46*(10), 3281–3294.
- Bradley, L., Shaw, R., Baron-Cohen, S., & Cassidy, S. (2021). Autistic adults' experiences of camouflaging and its perceived impact on mental health. *Autism in Adulthood, 3*(4), 320–329.
- Cassidy, S., Bradley, L., Shaw, R., & Baron-Cohen, S. (2018). Risk markers for suicidality in autistic adults. *Molecular Autism, 9*, 42.
- Crane, L., Goddard, L., & Pring, L. (2009). Sensory processing in adults with autism spectrum disorders. *Autism, 13*(3), 215–228.
- Crompton, C. J., Ropar, D., Evans-Williams, C. V. M., Flynn, E. G., & Fletcher-Watson, S. (2020). Autistic peer-to-peer information transfer is highly effective. *Autism, 24*(7), 1704–1712.
- Garfinkel, S. N., Tiley, C., O'Keeffe, S., Harrison, N. A., Seth, A. K., & Critchley, H. D. (2016). Discrepancies between dimensions of interoception in autism: Implications for emotion and anxiety. *Biological Psychology, 114*, 117–126.
- Hull, L., Petrides, K. V., Allison, C., et al. (2017). "Putting on my best normal": Social camouflaging in adults with autism spectrum conditions. *Journal of Autism and Developmental Disorders, 47*(8), 2519–2534.
- Hull, L., Mandy, W., Lai, M.-C., et al. (2019). Development and validation of the Camouflaging Autistic Traits Questionnaire (CAT-Q). *Journal of Autism and Developmental Disorders, 49*(3), 819–833.
- Hull, L., Petrides, K. V., & Mandy, W. (2020). The female autism phenotype and camouflaging: A narrative review. *Review Journal of Autism and Developmental Disorders, 7*, 306–317.
- Kapp, S. K., Steward, R., Crane, L., et al. (2019). "People should be allowed to do what they like": Autistic adults' views and experiences of stimming. *Autism, 23*(7), 1782–1792.
- Kentrou, V., Livingston, L. A., Grove, R., Hoekstra, R. A., & Begeer, S. (2024). Perceived misdiagnosis of psychiatric conditions in autistic adults. *eClinicalMedicine, 71*, 102586.
- Kinnaird, E., Stewart, C., & Tchanturia, K. (2019). Investigating alexithymia in autism: A systematic review and meta-analysis. *European Psychiatry, 55*, 80–89.
- Lai, M.-C., & Baron-Cohen, S. (2015). Identifying the lost generation of adults with autism spectrum conditions. *The Lancet Psychiatry, 2*(11), 1013–1027.
- Leedham, A., Thompson, A. R., Smith, R., & Freeth, M. (2020). "I was exhausted trying to figure it out": The experiences of females receiving an autism diagnosis in middle to late adulthood. *Autism, 24*(1), 135–146.
- Loomes, R., Hull, L., & Mandy, W. P. L. (2017). What is the male-to-female ratio in autism spectrum disorder? *Journal of the American Academy of Child & Adolescent Psychiatry, 56*(6), 466–474.
- Love, M. (2025). Autistic culture is flourishing. Olive Clinical. ${OC}/blog/autistic-culture-is-flourishing
- Milner, V., McIntosh, H., Colvert, E., & Happé, F. (2019). A qualitative exploration of the female experience of autism spectrum disorder (ASD). *Journal of Autism and Developmental Disorders, 49*(6), 2389–2402.
- Milton, D. E. M. (2012). On the ontological status of autism: The "double empathy problem". *Disability & Society, 27*(6), 883–887.
- Murray, D., Lesser, M., & Lawson, W. (2005). Attention, monotropism and the diagnostic criteria for autism. *Autism, 9*(2), 139–156.
- Nicolaidis, C., Raymaker, D., McDonald, K., et al. (2016). The development and evaluation of an online healthcare toolkit for autistic adults and their primary care providers. *Journal of General Internal Medicine, 31*(10), 1180–1189.
- Phung, J., Penner, M., Pirlot, C., & Welch, C. (2021). What I wish you knew: Insights on burnout, inertia, meltdown, and shutdown from autistic youth. *Frontiers in Psychology, 12*, 741421.
- Robertson, C. E., & Baron-Cohen, S. (2017). Sensory perception in autism. *Nature Reviews Neuroscience, 18*(11), 671–684.
- Spain, D., & Happé, F. (2020). How to optimise cognitive behaviour therapy (CBT) for people with autism spectrum disorders (ASD): A Delphi study. *Journal of Rational-Emotive & Cognitive-Behavior Therapy, 38*, 184–208.
- Tavassoli, T., Hoekstra, R. A., & Baron-Cohen, S. (2014). The Sensory Perception Quotient (SPQ). *Molecular Autism, 5*, 29.
- Warrier, V., Greenberg, D. M., Weir, E., et al. (2020). Elevated rates of autism, other neurodevelopmental and psychiatric diagnoses, and autistic traits in transgender and gender-diverse individuals. *Nature Communications, 11*, 3959.`,
  },
  quiz: {
    title: "Autism basics: knowledge check",
    questions: [
      {
        prompt: "Monotropism proposes that autistic attention tends to be:",
        options: [
          "Spread thinly across many channels at once.",
          "Pulled into fewer channels at greater depth.",
          "Unable to sustain focus on any task.",
          "Identical to non-autistic attention but slower.",
        ],
        correctIndex: 1,
        explanation:
          "Murray, Lesser, and Lawson (2005) proposed deep, narrow attention as the difference that accounts for intense interests, costly transitions, and overload.",
      },
      {
        prompt: "A client pauses for several seconds before answering each question. The most neuro-affirming interpretation is:",
        options: [
          "Resistance to the therapeutic process.",
          "Low verbal ability.",
          "Processing time, with each question being attended to fully, so the pause should be allowed rather than filled.",
          "Dissociation that should be interrupted.",
        ],
        correctIndex: 2,
        explanation:
          "Slower conversational processing is predicted by monotropism (Murray et al., 2005), and a slower pace is a core practitioner-consensus adaptation (Spain & Happé, 2020).",
      },
      {
        prompt: "Masking is best described as:",
        options: [
          "A social skill that indicates good outcomes.",
          "The effortful suppression of autistic traits and performance of non-autistic ones, linked to exhaustion, threats to identity, and suicidality.",
          "A rare behaviour seen mainly in children.",
          "Evidence that a person is not autistic.",
        ],
        correctIndex: 1,
        explanation:
          "Hull et al. (2017) describe its motivations and costs; Cassidy et al. (2018) identify it as a risk marker for suicidality unique to autistic adults.",
      },
      {
        prompt: "Which of these is an accommodation for situational speech loss?",
        options: [
          "Waiting silently until the client speaks.",
          "Ending the session early.",
          "Offering a typed or written way to respond.",
          "Asking simpler questions more loudly.",
        ],
        correctIndex: 2,
        explanation:
          "Alternative communication channels are among the accommodations autistic adults ask for in healthcare settings (Nicolaidis et al., 2016).",
      },
      {
        prompt: "Which group did the traditional autism profile most reliably capture?",
        options: [
          "Adults with high verbal ability.",
          "Women and girls.",
          "Boys diagnosed in childhood.",
          "Transgender and gender-diverse adults.",
        ],
        correctIndex: 2,
        explanation:
          "The research base skews toward boys diagnosed young; women, verbal adults, and gender-diverse people make up the lost generation of late diagnoses (Lai & Baron-Cohen, 2015; Loomes et al., 2017; Warrier et al., 2020).",
      },
    ],
  },
});
