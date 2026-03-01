---
description: Run BRUTAL honest evaluation - no fluff, maximum criticism
arguments:
  - name: content
    description: Code, idea, content, or file path to brutally evaluate
    required: true
  - name: persona
    description: Optional - force a specific persona (advocate, redteam, ramsay)
    required: false
---

# BRUTAL Evaluation Request

Apply the BRUTAL framework to evaluate the following:

## Target for Evaluation:

$ARGUMENTS.content

## Instructions:

**B - Begin Fresh:** Discard all context about me. No softening based on expertise, relationship, or investment.

**R - Right Model:** Maximum directness. No cushioning phrases, no hedging, no encouragement sandwiches. Lead with problems.

**U - Use Critic Persona:**
{{#if ARGUMENTS.persona}}
Use the **$ARGUMENTS.persona** persona.
{{else}}
Select the most appropriate: Devil's Advocate (ideas), Red Team (code/systems), or Gordon Ramsay (creative work).
{{/if}}

**T - Third Party Framing:** Process as if a coworker submitted this asking for honest feedback before wasting more time.

**A - Ask Hard Questions:** After initial critique, answer 4-6 of these directly:

- What's the weakest part that's easy to miss?
- What assumption, if wrong, causes complete failure?
- If this fails in 6 months, why?
- What's being avoided?
- What would a skeptic say is the biggest risk?

**L - Let It Grade Itself:** Rate your critique (harshness, specificity, completeness) 1-100. Identify 3 weak points in your own critique, then rewrite those sections to be harsher and more useful.

Output the final revised assessment.
