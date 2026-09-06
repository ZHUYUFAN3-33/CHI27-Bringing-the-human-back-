# Study 2 — item list, three-arm design (draft for team review)

Three arms, one questionnaire. Only page 2 differs. Participants are assigned
one arm at random, balanced with the six clip orders (3 × 6 = 18 cells).
Target allocation: no-disclosure 90 · H 30 · HA 30.

Everything a participant reads is in English below. Notes in *italics* are for
the team and are not shown.

Item ids in `code` are what the exports will carry. Ids frozen once collection
starts.

---

## Page 1 · About this study · consent (all arms)

Information sheet — as `s2-v5`, with one sentence restored under **Your data**,
because open-text answers are back:

> Your written answers may be quoted in publications; they carry no name.

**About OriHime**
> OriHime is a robot that communicates through speech, head movements, and gestures. In the clips you will see, OriHime is talking with a person in an office.

Consent and eligibility — *unchanged from Study 1*:

| id | item | options |
|---|---|---|
| `E1` | Are you 18 years old or older? | Yes / No |
| `E2` | I have read the study information and agree to take part. | Yes, I agree / No |
| `E3` | Can you watch a short video with sound on your current device? | Yes / No |

---

## Page 2 · About the OriHime you will see (differs by arm)

*Its own page in every arm, so that page count and dwell time are comparable
across arms — Study 1 used dwell on this page as evidence the text was read.*

### Arm N — no disclosure
> **We will not tell you how OriHime is controlled in the videos you are about to see.** The videos may use the same control arrangement or different arrangements, and the number of videos does not correspond to any number of control methods.
>
> There are no right or wrong answers: we are interested in your own impression of what you see and hear. **Please answer from the videos themselves — please do not look OriHime up while taking part.**

### Arm H — human operator
*Study 1's `CONTROL_TEXT.H` and `PERSONA_HUMAN`, verbatim:*
> The OriHime here is controlled in real time by a trained **human operator**. The human operator chooses what OriHime says and does. **No AI system** generates responses or makes decisions.
>
> **About the operator**
> This operator works with OriHime for a few hours on most days.
> This operator has been doing this work for about a year.
> All operators complete the same training and meet the same standard before they start this work.
>
> Please answer from the videos themselves — please do not look OriHime up while taking part.

### Arm HA — human operator with AI assistance
*Study 1's `CONTROL_TEXT.HA` and `PERSONA_HUMAN`, verbatim:*
> The OriHime here is controlled by a trained **human operator with AI assistance**. The AI can suggest wording or movements, but the **human operator** can accept, change, or reject suggestions and **makes the final decisions**.
>
> **About the operator** — *same three lines as Arm H*
>
> Please answer from the videos themselves — please do not look OriHime up while taking part.

| id | item | options |
|---|---|---|
| `D1` | Please confirm that you have read the description above. | I have read it |

*No profile line (disability) in any arm: this study has no H2/H3 conditions.*

---

## Pages 3–5 · the three clips (all arms, same items)

Each page: the clip (gated), then the items below in this order.

*In arms H and HA, the page carries Study 1's condition recap above the
questions — the control text restated, as Study 1's clip pages did. In arm N
the recap is the anti-matching sentence: "We have not said how OriHime is
controlled in this video. It may be the same arrangement as in the other
videos, or a different one."*

*The open question comes first, before any option list, so the wording is the
participant's own. Everything after it is closed.*

| # | id | item | options / scale |
|---|---|---|---|
| 1 | `{SEG}_OPEN` | In your own words: who or what do you think was behind what OriHime said and did in this video, and what made you think so? | free text, at least 30 characters |
| 2 | `{SEG}_WHO` | Who do you think was mainly deciding what OriHime said and did in this video? | A person / A person and an AI system together / An AI system / I can't tell |
| 3 | `{SEG}_CTRL_P` | How much of what OriHime said and did in this video was controlled by a person? | 1 None of it · 2 Very little · 3 Some · 4 About half · 5 Most · 6 Almost all · 7 All of it |
| 4 | `{SEG}_CTRL_AI` | How much of what OriHime said and did in this video was controlled by an AI system? | same seven points |
| 5 | `{SEG}_FINAL` | Who do you think had the final say over what OriHime said and did in this video? | A person / An AI system / They shared it / I can't tell |
| 6 | `{SEG}_DIS` | If a person was involved in controlling OriHime in this video, do you think that person has a disability? | Yes / No / I can't tell / I don't think a person was involved |

*Wording notes against Sol's draft:*
- *"A person", never "the human operator": the H arm is told there is no AI and the N arm is told nothing, so "the AI" or "the operator" would presuppose an answer.*
- *Items 3 and 4 are two unipolar scales rather than one bipolar "human ↔ autonomous" scale: a participant who thinks control was shared can score both high, which is exactly the HA reading we want to be able to see. Sol's "How autonomous was OriHime" is dropped for that reason and because "autonomous" is jargon.*
- *Item 5 is the HA-specific probe: the HA text says the operator "makes the final decisions". In arm HA, "A person" here means that clause was encoded; "They shared it" or "An AI system" means it was not.*
- *Items 2 and 5 are kept distinct on purpose — "mainly deciding" (ongoing) versus "final say" (veto). If the team judges participants will not distinguish them, drop 2 and keep 5.*

Quality checks, one each, fixed position:

| where | id | item | options |
|---|---|---|---|
| clip shown 2nd, after item 6 | `{SEG}_AT1` | To show that you are reading carefully, please select "Disagree" for this item. | 7-point agreement scale |
| clip shown 3rd, after item 6 | `{SEG}_AV1` | Which of the following happened in the video you just watched? | Study 1's four options for that clip — **must be checked against the final cut** |

---

## Page 6 · A few last questions (all arms)

| id | item | options |
|---|---|---|
| `BG_age` | What is your age in years? | number, 18–120 |
| `BG_gender` | What gender do you identify with? | Male / Female / Nonbinary / Prefer not to say |
| `BG_freq_ai` | How often do you use AI tools in your personal or professional life? | Never / Less than once a year / Once a year or more / Once a month or more / Once a week or more / Daily or almost daily |
| `BG_freq_disability` | How often do you see or interact with people with disabilities in your personal or professional life? | same six |
| `BG_orihime_knowledge` | Before today, how much did you know about OriHime? | I had never heard of it / I had heard of it, but did not know how it is used or who operates it / I knew something about how it is used or who operates it |

---

## Page 7 · Thank you (all arms; text differs by arm)

Arm N:
> We did not say how OriHime was controlled in the videos, because we wanted to learn what impression the interaction itself gives.

Arms H and HA — *Study 1's reveal, adapted*:
> The description of who or what controlled OriHime was assigned to you at random and given to different participants in different forms, while the videos themselves were identical for everyone. The study examines how such a description shapes what people see.

All arms:
> **How OriHime was actually controlled.** [TO BE COMPLETED BY THE RESEARCH TEAM]
>
> Your answers have been recorded against the participant number your recruitment platform gave us, and no name. If you would like them removed, send us the completion code shown on this page. Thank you for taking part.

---

## Count

| block | items |
|---|---|
| consent | 3 |
| description confirm | 1 |
| per clip 6 × 3 | 18 (of which 3 open text) |
| quality checks | 2 |
| background | 5 |
| **total** | **29** |

Estimated median completion: about 11 minutes in arm N, 11.5 in H and HA, of
which the videos are 4 min 50 s.

## Optional additions, not in the count above

- `{SEG}_AU1` "This interaction felt genuine, rather than like the execution of a program." — one 7-point item per clip, Study 1's wording. Would let the H and HA arms be set beside Study 1's genuineness result. +3 items, about +20 s.
- A confidence item after `{SEG}_WHO`. The two control scales already carry gradedness, so this is lower value than in the earlier design. +3 items.

## Still needs the team

1. The true control arrangement for the debrief.
2. Every `AV1` option checked against the final audio.
3. Ethics approval for the new arm-N text, the open question, and the adapted debrief. The H and HA description texts are Study 1's and already approved.
4. Whether item 2 stays alongside item 5 (see wording notes).
