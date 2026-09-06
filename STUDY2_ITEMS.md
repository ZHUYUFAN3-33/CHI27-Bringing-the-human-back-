# Study 2 — item list · manipulation validation study (draft for team review)

**What it is.** A fresh sample sees exactly what Study 1's participants saw — one
of five condition descriptions, then the same three clips — and is then asked
not how they evaluate OriHime but **what they took the description to say**.
It separates "understood the manipulation, and it made no difference" from
"never encoded it, so of course it made none". Study 1 cannot separate those,
because its recall checks were removed before launch.

**Arms.** Five of Study 1's seven conditions, 30 each, balanced with the six
clip orders (5 × 6 = 30 cells, 5 per cell, **150 total**):

| arm | who controls | operator profile | what it anchors |
|---|---|---|---|
| A | AI only | — | AI-control ceiling; no-operator recognition |
| H1 | human | no mention | human-control ceiling; "no disability mentioned" control |
| HA1 | human + AI assistance | no mention | the final-say probe; whether HA is read as HA or as H |
| H2 | human | intellectual disability | intellectual-disability recognition |
| H3 | human | mobility-related disability | mobility-disability recognition |

*HA2 and HA3 are not run: Study 1 found H and HA equivalent on every outcome,
so disability recognition is tested under H alone. The Control × Disability
interaction is out of reach at this budget and is stated as an assumption.*

**No no-disclosure arm.** What the clips imply on their own (the earlier Track
A) is future work, to be run if a reviewer asks; its 28-item instrument is on
this branch as `s2-v5`.

Everything a participant reads is in English below; *italics* are notes for
the team. Ids in `code` are what the exports carry, frozen once collection
starts.

---

## Page 1 · About this study · consent (all arms)

Information sheet as `s2-v5`, with one sentence restored under **Your data**
because there is an open-text answer again:

> Your written answers may be quoted in publications; they carry no name.

**About OriHime**
> OriHime is a robot that communicates through speech, head movements, and gestures. In the clips you will see, OriHime is talking with a person in an office.

| id | item | options |
|---|---|---|
| `E1` | Are you 18 years old or older? | Yes / No |
| `E2` | I have read the study information and agree to take part. | Yes, I agree / No |
| `E3` | Can you watch a short video with sound on your current device? | Yes / No |

---

## Page 2 · About the OriHime you will see (differs by arm)

*Study 1's disclosure page, verbatim: `INTRO_TEXT`, `CONTROL_TEXT[ctrl]`, the
persona block, and for H2/H3 the profile line. Same photo, same diagram. This
text is already ethics-approved. Its dwell time is recorded, as in Study 1.*

> OriHime is a robot that communicates through speech, head movements, and gestures. You will see OriHime take part in three short interactions. Please read the information below carefully.

**Arm A**
> The OriHime here is controlled **entirely by an AI system**. There is **no human operator**. The AI system generates OriHime's responses and controls its movements in real time.
> *+ `PERSONA_AI` block (the AI-matched "About the system" lines)*

**Arm H1**
> The OriHime here is controlled in real time by a trained **human operator**. The human operator chooses what OriHime says and does. **No AI system** generates responses or makes decisions.
> *+ `PERSONA_HUMAN` block: works with OriHime a few hours most days · about a year in the role · all operators complete the same training and meet the same standard*

**Arm HA1**
> The OriHime here is controlled by a trained **human operator with AI assistance**. The AI can suggest wording or movements, but the **human operator** can accept, change, or reject suggestions and **makes the final decisions**.
> *+ `PERSONA_HUMAN` block*

**Arm H2** — *Arm H1's text, plus above the persona block:*
> The operator of this OriHime **has an intellectual disability**.

**Arm H3** — *Arm H1's text, plus:*
> The operator of this OriHime **has a mobility-related disability**.

All arms:
> Please answer from the videos and the description above — please do not look OriHime up while taking part.

| id | item | options |
|---|---|---|
| `D1` | Please confirm that you have read the description above. | I have read it |

---

## Pages 3–5 · the three clips (all arms)

Each page: Study 1's condition recap (control text and, in H2/H3, the profile
line) above the player, exactly as Study 1's clip pages carried it; the clip,
gated; then **no questions** except the two checks:

| where | id | item | options |
|---|---|---|---|
| clip shown 2nd | `{SEG}_AT1` | To show that you are reading carefully, please select "Disagree" for this item. | 7-point agreement |
| clip shown 3rd | `{SEG}_AV1` | Which of the following happened in the video you just watched? | Study 1's four options for that clip — **must be checked against the final cut** |

*Nothing is asked per clip on purpose. The validation is of the description's
mental model, which is one thing per participant, and it is asked at the same
point Study 1 asked BEL1 — after all three clips — so the two studies measure
memory of the description over the same delay.*

---

## Page 6 · About the description you were given (all arms)

*The open question comes first, before any option list, so the reconstruction
is the participant's own. Then agency, then the operator profile. Belief is
not on this page: see page 7.*

**C · Open reconstruction**

| id | item | |
|---|---|---|
| `V_OPEN` | Please describe, in your own words, what the description at the start said about who or what was controlling OriHime, and anything else you remember it saying about the operator or the system. | free text, at least 30 characters |

*Coded blind by two coders for: human operator · AI assistance · AI alone ·
mobility/physical disability · intellectual/cognitive disability · disability
without type · uncertainty or misunderstanding. One answer feeds both the
agency and the profile coding.*

**A · Agency model**

| id | item | options / scale |
|---|---|---|
| `V_CTRL_REC` | According to the description, which of these best describes how OriHime was controlled? | A human operator, with no AI involved / A human operator with AI assistance / An AI system, with no human operator / I'm not sure |
| — | *Instruction shown above the next two items:* The next two questions are separate. Your two answers do not need to add up. | |
| `V_CTRL_P` | According to the description, how much of what OriHime said and did was controlled by a human operator? | 1 None of it · 2 Very little · 3 Some · 4 About half · 5 Most · 6 Almost all · 7 All of it |
| `V_CTRL_AI` | According to the description, how much of what OriHime said and did was controlled by an AI system? | same seven points |
| `V_FINAL` | According to the description, who made the final decisions about what OriHime said and did? | A person. Even if an AI system made suggestions, the person had the last word. / An AI system. Even if a person was involved, the AI system had the last word. / A person and an AI system equally. Neither one had the last word. / I'm not sure |

*Every stem is anchored on the description: this is recognition of what was
said, not a judgement of what the videos looked like. The instruction above
the two scales keeps them unipolar — without it answers get forced to add up
and the "both high" reading of HA cannot appear. `V_FINAL` mirrors the HA
text's own words ("makes the final decisions"), and its third option says
outright that nobody had the last word: a bare "they shared it" is also what
a participant who understood HA correctly (AI suggests, the person decides)
might reach for, and then the HA1 rate could not be read.*

**B · Operator profile**

| id | item | options / scale |
|---|---|---|
| `V_PROF_REC` | Which of these best matches what the description said about who operated OriHime? | A person with a mobility-related disability / A person with an intellectual or cognitive disability / A person — no disability was mentioned / There was no human operator / I'm not sure |
| — | *Instruction shown above the next two items:* If you were told there was no human operator, choose "Not at all" for the next two questions. | |
| `V_LIM_MOB` | Based on the description, how limited did you understand the operator to be in physical movement or mobility (for example walking, or using their hands)? | 1 Not at all · 2 Very little · 3 A little · 4 Somewhat · 5 Quite a lot · 6 Very much · 7 Extremely |
| `V_LIM_COG` | Based on the description, how limited did you understand the operator to be in thinking, learning, or understanding (for example memory, reasoning, or following instructions)? | same seven points |

*"No disability was mentioned" is the correct answer for H1 and HA1: Study 1's
profile 1 says nothing, deliberately. There is no "unspecified disability"
condition and so no specificity item.*
*The two limitation items ask what the participant understood, not what the
text hinted: the construct is the operator model the label produced, which is
what a stereotype account of Study 1's null would need. `V_LIM_COG` avoids the
words "cognitive or intellectual functioning" — lay wording, same construct.
Arm A is told to answer "Not at all"; its rows are reported, not compared.*

---

## Page 7 · Belief, then a few last questions (all arms)

**Belief first** — *Study 1's BEL1, verbatim, at the top of this page. The
back button is disabled on this page.*

| id | item | scale |
|---|---|---|
| `BEL1` | How much ***DID YOU BELIEVE*** the description of the OriHime operator you were given at the beginning of the questionnaire? | 7-point agreement |

*Why here and not on page 6: "did you believe" tells the participant the
description may not have been true. On page 6 it could be read before the
recognition items were answered; here it is seen only after page 6 has been
submitted, and with back locked page 6 cannot be revised afterwards.
Recognition and belief are asked separately because they are different
things: a participant may answer `V_PROF_REC` correctly and `BEL1` = 2. That
is "understood but not believed", which Study 1's H2 (26 % at BEL1 ≤ 3) cannot
currently distinguish from "misunderstood".*

**Background**

| id | item | options |
|---|---|---|
| `BG_age` | What is your age in years? | number, 18–120 |
| `BG_gender` | What gender do you identify with? | Male / Female / Nonbinary / Prefer not to say |
| `BG_freq_ai` | How often do you use AI tools in your personal or professional life? | Never … Daily or almost daily (six) |
| `BG_freq_robot` | How often do you see or interact with a robot in your personal or professional life? | same six (Study 1's item and id) |
| `BG_freq_disability` | How often do you see or interact with people with disabilities in your personal or professional life? | same six |
| `BG_orihime_knowledge` | Before today, how much did you know about OriHime? | I had never heard of it / I had heard of it, but did not know how it is used or who operates it / I knew something about how it is used or who operates it |

---

## Page 8 · Thank you (all arms)

*Study 1's reveal, verbatim — it is the same deception:*

> In this study, the description of who or what controlled OriHime, and the description of the operator, were experimentally varied between participants, while the videos themselves were identical for everyone.
>
> The study examines how information about control and operator characteristics shapes judgments. It does not test whether any disability group is more or less capable.
>
> Your answers have been recorded against the participant number your recruitment platform gave us, and no name. If you would like them removed, send us the completion code shown on this page. Thank you for taking part.

---

## Scoring, done on the server against keys the browser never sees

| item | correct answer by arm | flag |
|---|---|---|
| `V_CTRL_REC` | A → AI system · H1, H2, H3 → human, no AI · HA1 → human with AI assistance | `ctrl_recognised` |
| `V_PROF_REC` | A → no human operator · H1, HA1 → no disability mentioned · H2 → intellectual · H3 → mobility | `profile_recognised` |
| `V_FINAL` | A → AI system · H1, H2, H3, HA1 → a person | `final_recognised` |
| `{SEG}_AT1`, `{SEG}_AV1` | as now | `attention_pass`, `comprehension_pass` |

## Predicted patterns (the validation succeeds if these hold)

- `V_CTRL_P`: H1 ≈ H2 ≈ H3 > HA1 > A
- `V_CTRL_AI`: A > HA1 > H1 ≈ H2 ≈ H3
- `V_LIM_MOB`: H3 > H1 ≈ H2 ≈ HA1 (A not asked to rate a person it was told does not exist — reported, not compared)
- `V_LIM_COG`: H2 > H1 ≈ H3 ≈ HA1
- `V_PROF_REC` correct in a clear majority of every arm; the H2 rate is the number that decides how Study 1's disability null is written
- `V_FINAL` = "a person" in a clear majority of HA1: the "makes the final decisions" clause was encoded

*Recognition items have large effects — correct versus chance is 85 % versus
20–33 % — which is why 30 per arm is enough. Between-arm differences on the
1–7 scales are expected at d > 1.*

## Count and time

| block | items |
|---|---|
| consent | 3 |
| description confirm | 1 |
| quality checks | 2 |
| open reconstruction | 1 |
| agency | 4 |
| operator profile | 3 |
| belief | 1 |
| background | 6 |
| **total** | **21** |

Estimated median completion about **9 minutes**, of which the videos are 4 min
50 s. Pay for 10.

## Still needs the team

1. Whether to disclose the true control arrangement in the debrief. As
   deployed, the debrief is Study 1's approved text with nothing added.
2. Every `AV1` option checked against the final audio.
3. Ethics: the description pages, the recap and the debrief are Study 1's
   approved text; the page-6 items and the open question are new and need
   approval.
4. Whether `V_CTRL_REC` stays alongside the two control scales and `V_FINAL`.
   It is the cleanest single recognition outcome for agency; the scales and
   final-say carry the graded picture. I would keep all four.
