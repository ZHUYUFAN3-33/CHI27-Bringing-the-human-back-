# Paper Outline and Evidence Map — Phase 2 (structure_architect)

> Draft for the **outline-approval checkpoint**. Nothing downstream (argument blueprint, drafting) starts until the PI approves or restructures this outline. Literature sources are referenced by theme code (T1–T6) until the Phase 1 report is final; concrete citation keys are then substituted in place. Study 1 evidence is referenced by the existing tables (T = `paper/tables.md`) and figures (F = `paper/figures/`).

## Structure selection
CHI empirical paper, IMRaD with two studies: Introduction → Related Work → Study 1 (Method, Results) → Study 2 (Method, Results) → Discussion → Design Implications → Limitations → Conclusion. Chosen because (a) the PI's frame runs background → questions → literature → method → results → Study 2 → discussion → implications, which is this order; (b) Study 2 is a supplement whose role is interpretive, so it sits between the Study 1 results and the Discussion that uses it; (c) CHI reviewers expect explicit design implications and a limitations section.

Target 8,000 words ± 10 % excluding references, abstract ≤ 150 words, 5 figures, 5–6 tables in the body, remaining tables in supplementary material.

## Section plan

### 0 Abstract (≤150 words) + CCS concepts + keywords
- **Content**: context (avatar robots operated by people with disabilities; AI entering the loop), question (does a one-line disclosure change judgments of an identical interaction), design (N = 300, 7 descriptions × 3 clips), findings A, B, C with effect sizes, Study 2 in one clause, implication in one sentence.
- **Sources**: none.

### 1 Introduction (≈900 words)
- **1.1 Background (≈350)** — Purpose: establish the deployment reality. Content: telepresence for remote work; OriHime and avatar work in Japan (DAWN café, hospitals, offices); the labour-shortage and disability-employment context; AI assistance (speech support, shared autonomy) entering the same loop, so the audience is told, rather than shown, who is behind the robot. Sources: T1, T2 (AI-assisted teleoperation). Transition: "The people who meet an avatar robot therefore judge it from what they see plus a sentence about who controls it."
- **1.2 Why these questions (≈300)** — Purpose: motivate RQ-A/B/C without pre-empting the literature. Content: the three things a sentence can disclose (control source, implied accountability, operator profile); why each may matter (mind perception and algorithm aversion; moral crumple zone; stigma and the warm-but-incompetent stereotype); the practical stake for operators and providers. Sources: T2, T3, T4 (one anchor each). Transition to RQs.
- **1.3 RQs and contributions (≈250)** — RQ-A, RQ-B, RQ-C, RQ-D (exploratory); five contribution bullets (from `stories/story_unified.md`); one sentence placing Study 2. Transition: "We first review what is known about each question."

### 2 Related Work (≈1,300 words)
- **2.1 Avatar robots and avatar work (≈300)** — telepresence robots at work; OriHime deployments and studies; the operator's invisibility as a design property. Sources: T1.
- **2.2 Disclosing automation and the perception of an interaction (≈350)** — Wizard-of-Oz and perceived agency; mind perception; disclosure of bots/AI lowering warmth, trust or cooperation; algorithm aversion; "AI-assisted human" labels. Sources: T2. Gap: no study holds behaviour constant while varying only the description of a *teleoperated* robot with three levels including AI-assisted.
- **2.3 Responsibility and credit in human–AI teams (≈300)** — moral crumple zone; blame attribution to robots and autonomous systems; credit for AI-assisted outputs; shared autonomy. Sources: T3. Gap: credit and blame for a *human operator* whose work is AI-assisted.
- **2.4 Disability disclosure, stigma and stereotype content (≈300)** — SCM and the disability stereotype; disclosure decisions at work; intellectual vs physical disability stereotypes; contact effects. Sources: T4. Gap: third-party judgments of a mediated interaction when the operator's disability is disclosed and behaviour is fixed.
- **2.5 Summary of gaps (≈50)** — one paragraph mapping 2.2→RQ-A, 2.3→RQ-B, 2.4→RQ-C. Transition: "Study 1 addresses the three questions in one experiment."

### 3 Study 1: Method (≈1,300 words)
- **3.1 Design (≈200)** — 3 × 2 + 1 between-subjects (control source H/HA/A × operator profile no mention/intellectual/mobility; A single cell), three clips within, six orders, server-side randomisation to 42 cells. Sources: `methods.md`.
- **3.2 Participants (≈200)** — CloudResearch Connect; N = 300; exclusions (AT1 21, AV1 8, both 1) → n = 272; demographics (Table 1 header row; numbers sheet). Ethics statement pointer.
- **3.3 Materials (≈250)** — OriHime; three clips (REL 70 s, ADV 105 s, COL 115 s) with identical footage across conditions; the seven descriptions verbatim (supplementary), including the equal-training sentence; disclosure page.
- **3.4 Measures (≈300)** — OH1–3 composite (α .79), AU1 genuineness, CR1 warmth, CR2 competence, CR3 (manipulation evidence), BEL1 credibility; responsibility and credit rankings and actor sets (3 vs 4 actors); GAAIS (α .92/.85), NARS (.86), SCM (.85/.92), contact, demographics; item wording in supplementary.
- **3.5 Analysis plan (≈350)** — pre-specified before inference, not preregistered; LMM (REML) with participant random intercept, clip and position fixed; omnibus LRTs (ML); equal-weight cell contrasts C1–C5; Holm within families; TOST bounds at the design MDE (±.35 SD OH, ±.50 others) and why they are MDEs, not SESOIs; participant-unit BIC Bayes factors; cluster bootstrap after Levene; GEE logistic and Plackett–Luce for rankings; common-anchor measure; exploratory bookkeeping (113 tests). Software: Python 3.12, statsmodels; code and data availability. Sources: T5 (LMM, TOST, BF, PL, scales). Transition: "We report checks first, then the three questions in order."

### 4 Study 1: Results (≈1,700 words)
- **4.1 Checks (≈200)** — exclusions; BEL1 equal across conditions (p .451, M 5.20); CR3 H > HA (d .40, p .002) as evidence the control description was read; disclosure page dwell +5.5 s; ICCs .40–.78 justify the multilevel model. Evidence: numbers sheet; Table 1.
- **4.2 RQ-A: control source (≈550)** — omnibus (AU1 p .004; CR1 .075; OH .326; CR2 .572); C1 human vs AI (AU1 Δ .81, d .62, Holm .002; CR1 d .52; OH via OH2 d .38; CR2 n.s.); robustness list (Table 3); C2 H vs HA TOST equivalent (Table 4); pairwise pattern rule 10/84, all vs A, 0/60 among human cells (Figure 1); Holm survivors named; clip does not moderate (Figure 3); heteroscedastic A cell, bootstrap agrees. Evidence: Tables 2–4, Figures 1–3. Tags: [pre-specified].
- **4.3 RQ-B: attribution (≈450)** — operator ranked first 72 %/71 % under H, 55 %/51 % under HA (OR .47/.42); common anchor 72.3→60.7 %, 71.2→60.2 % (OR .59/.61); PL worths .68→.45 for the operator, AI .28, provider and interlocutor flat (Figure 4, Table 6); blame > credit asymmetry in HA (+4.8 pts, p .024); AI-only: AI first 57 %/60 %, but common anchor similar to HA (OR 1.24/1.60 n.s.), so the raw OR mainly reflects the missing human; disability does not change attribution (OR .89/.80). Evidence: Tables 5–7, Figure 4. Tags: [pre-specified], [added after cross-review] for Table 7.
- **4.4 RQ-C: disability disclosure (≈350)** — C3 all four DVs n.s. (p ≥ .11), Δ small negative, d to −.24; TOST excludes |d| ≥ .50; BF01 3–12 (Table 8); C4 intellectual = mobility; C5 pooled same; moderator sweep D1–D8 null (clip, contact, SCM, position; 20 tests); uptake evidence; PE/HM/BEL1 flat by profile. Framing per `story_unified.md` rules 1–4. Evidence: Tables 2, 4, 8. Tags: [pre-specified] for C3–C5; [exploratory] for the sweep.
- **4.5 Exploratory (≈150)** — E1 attitude moderation (slopes .50 vs .28 OH, interaction p .019; CR2 p .003; simple slopes at ±1 SD; Figure 5); OH2 usefulness; REL-clip CR2 hint (OR 1.78, p .108); "113 exploratory tests, 37 at p < .05, none promoted; all listed in Supplementary Table S2". Tags: [exploratory].

### 5 Study 2: Default impressions of the same clips (≈800 words)
- **5.1 Purpose and design (≈400)** — why Study 1 needs it (disclosure agreeing with, cutting against or filling a blank in the default reading); Track A supplementary no-disclosure perception study, instrument s2-v4; fresh sample excluding Study 1 participants, ~300 usable; same three clips, neutral introduction, AU1 then WHO (four options) then DIS, each with confidence; comprehension and instructed-response checks; prior OriHime familiarity; estimands P(human involved), P(AI only), P(can't tell) with Wilson intervals, joint WHO × DIS table, GEE by clip; pre-specified interpretation rules W1–W3 / Da–Dc (from `story_unified.md`). Sources: `STUDY2_PLAN.md` on branch study2.
- **5.2 Results (≈400)** — `[PLACEHOLDER: data not collected as of 2026-09-05. To be written only from the exported Study 2 data; the paragraph structure is fixed now: (i) sample and checks, (ii) P1 per clip, (iii) WHO × DIS table, (iv) consistency across clips, (v) AU1–WHO association reported as association, (vi) which scenario obtained.]`
- Transition: "Read together, the two studies say the following."

### 6 Discussion (≈1,000 words)
- **6.1 Presence, not profile (≈250)** — the human label buys genuineness and warmth; AI assistance costs nothing perceptible; who the human is changes nothing detectable. Ties to T2 (mind perception, algorithm aversion) and T1.
- **6.2 Accountability migrates before perception does (≈250)** — HA looked like H but was credited like A; blame sticks to the human more than credit does; moral crumple zone read from the observer's side. Ties to T3.
- **6.3 What the disability null does and does not license (≈250)** — "no observable cost of disclosure in this setting"; boundary conditions (textual, competent behaviour, equal-training sentence); what inclusion would actually require to be claimed; how Study 2's Da/Db/Dc changes the sentence. Ties to T4.
- **6.4 Who pays the AI-only penalty (≈150)** — exploratory; sceptics; consistent with attitude-dependent algorithm aversion; needs replication.
- **6.5 Reading Study 1 through Study 2 (≈100)** — `[conditional on 5.2]`.

### 7 Design Implications (≈500 words)
Five implications (story_unified.md §7): human-visible disclosure wording; credit protocols for assisted work; disability disclosure as the operator's choice; audience-aware disclosure (tentative); reporting bounded nulls in HRI. Each: what to do, which finding supports it, its evidence strength. Sources: T6.

### 8 Limitations (≈350 words)
Single-sentence manipulations and no disability-specific belief check; A cell n = 36 with larger variance; fixed, non-neutral clips (Study 2 partially addresses); hypothetical outcomes for attribution; US/CA sample judging a Japanese deployment; BEL1 post-treatment; not preregistered; Study 1 and Study 2 are separate cohorts; 41 % power at d = .24 for C3.

### 9 Conclusion (≈150 words)

### Mandatory statements (not counted)
Data availability (anonymised participant-level data, code, materials); Ethics (Keio University Graduate School of Media Design approval, consent, retention to 2036-08-31); CRediT; Conflicts of interest; Funding; AI-use disclosure (analysis and drafting assistance; all analyses re-run and verified by the authors).

## Word-count allocation

| Section | Words | Share |
|---|---:|---:|
| 1 Introduction | 900 | 11 % |
| 2 Related Work | 1,300 | 16 % |
| 3 Study 1 Method | 1,300 | 16 % |
| 4 Study 1 Results | 1,700 | 21 % |
| 5 Study 2 | 800 | 10 % |
| 6 Discussion | 1,000 | 13 % |
| 7 Design Implications | 500 | 6 % |
| 8 Limitations | 350 | 4 % |
| 9 Conclusion | 150 | 2 % |
| **Total** | **8,000** | 100 % |

## Evidence map (claim → evidence → literature anchor → section)

| # | Claim | Study 1 evidence | Literature | Section | Tag |
|---|---|---|---|---|---|
| 1 | Describing the controller as AI-only lowers perceived genuineness | AU1 Δ .81 [.35, 1.27], d .62, Holm .002; robust in 8 specifications (T2, T3; F2) | T2 | 4.2, 6.1 | pre-specified |
| 2 | …and controller warmth; usefulness carries the OriHime composite | CR1 d .52; OH2 Δ .38 p .036; OH d .35 p .048 (T2; F1) | T2 | 4.2 | pre-specified / exploratory (OH2) |
| 3 | Human and human+AI operation are judged equivalently | C2 TOST within ±.35/±.50 SD; d −.08 to .12 (T4) | T2, T3 | 4.2, 6.1 | pre-specified |
| 4 | Every significant pairwise difference involves the AI-only cell | 10/84 raw p < .05, all human > A, 0/60 among human cells; Holm survivors AU1 H1/H3/HA1 > A (F1; Supp S1) | — | 4.2 | pre-specified rule |
| 5 | Clip does not moderate the human-vs-AI contrast | LRT p ≥ .13; within-clip AU1 p ≤ .047 (F3) | — | 4.2 | pre-specified |
| 6 | AI involvement lowers the odds that the operator is ranked first for responsibility and credit | OR .47/.42 raw; .59/.61 common anchor (T5, T7) | T3 | 4.3, 6.2 | pre-specified (+ cross-review) |
| 7 | The lost share goes to the AI, not to the provider or interlocutor | PL worths operator .68→.45, AI .28, provider .19→.18, interlocutor .13→.09 (T6; F4) | T3 | 4.3 | pre-specified |
| 8 | Blame sticks to the human more than credit does under AI assistance | HA Δ +4.8 pts, Wilcoxon p .024; H and A n.s. | T3 | 4.3, 6.2 | secondary |
| 9 | Disclosing the operator's disability has no detectable effect on any evaluation | C3 p ≥ .11; d to −.24; TOST excludes |d| ≥ .50; BF01 3–12 (T2, T4, T8) | T4 | 4.4, 6.3 | pre-specified |
| 10 | Intellectual and mobility disclosures do not differ; pooled contrast same | C4, C5 n.s. (T2) | T4 | 4.4 | pre-specified |
| 11 | No moderator of the disability null | D1–D8 sweep, 20 tests n.s. | T4 | 4.4 | exploratory |
| 12 | Disability disclosure does not change attribution | OR .89/.80 n.s. (T5) | T3, T4 | 4.3/4.4 | pre-specified |
| 13 | The descriptions were read and believed | BEL1 flat (p .451); CR3 H > HA d .40; dwell +5.5 s | — | 4.1 | check |
| 14 | The AI-only penalty is concentrated among AI-sceptical participants | E1 interaction p .019 (OH), .003 (CR2); Δ at −1 SD .44–.91 vs n.s. at +1 SD (F5) | T2 | 4.5, 6.4 | exploratory |
| 15 | What the clips imply with no disclosure | Study 2 P1, S1 | T1, T2 | 5, 6.5 | placeholder |

## Figures and tables in the body
Figures: F1 condition means (pairwise map), F2 contrasts forest, F3 clip × control source, F4 attribution worths, F5 attitude moderation. Body tables: Table 1 descriptives, Table 2 contrasts, Table 4 equivalence, Table 5/7 attribution (merge into one), Table 6 PL worths. Supplementary: Table 3 robustness, Table 8 BF, S1 pairwise map, S2 exploratory test log, descriptions verbatim, item wording, Study 2 instrument.

## Decisions for the PI at this checkpoint
1. Title: choose among the three candidates in `stories/story_unified.md` or supply one.
2. Keep Study 2 as its own Section 5 (recommended) or fold its Method into 3 and Results into 4.
3. Design Implications as its own section (recommended for CHI) or as 6.6.
4. Include RQ-D (attitude moderation) in the abstract? Recommended: no; Discussion only.
5. Author list, CRediT roles, funding and ethics approval number for the mandatory statements.

**Checkpoint: approval or restructuring required before Phase 3 (argument blueprint) and Phase 4 (drafting).**
