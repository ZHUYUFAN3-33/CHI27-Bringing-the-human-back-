# Paper Configuration Record — unified storyline (confirmed 2026-09-05)

> Phase 0 of the `academic-paper` pipeline. The user confirmed on 2026-09-05 that one paper will carry storylines A–D under one frame and asked for the pipeline to be run once with this configuration. Defaults below were offered on 2026-09-05 and not contested; any item can still be changed at the next checkpoint.

| Field | Value |
|---|---|
| Paper type | Empirical research paper, CHI style (Introduction · Related Work · Study 1 Method · Results · Study 2 · Discussion · Design Implications · Limitations · Conclusion) |
| Discipline | Human–computer interaction / human–robot interaction; accessibility |
| Target venue | ACM CHI 2027, Papers track |
| Citation format | ACM Reference Format (numbered); IEEE as the nearest style supported inside the skill, converted at formatting |
| Output format | Markdown draft first; LaTeX (acmart, `sigconf`) at formatting; DOCX via Pandoc on request |
| Language | English; the skill's bilingual abstract kept as a by-product |
| Word count | 8,000 ± 10% excluding references |
| Domain evidence profile | cs_ml-adjacent HCI: peer-reviewed venues (ACM DL, IEEE, journals) plus arXiv preprints admissible where peer-reviewed equivalents are absent |
| Citation verification level | Strict — every reference verified (DOI / publisher page); none invented |
| Existing materials | Study 1: Statistical Methods, Results, Limitations + reviewer rationale drafts; Tables 1–8; numbers sheet; five publication figures; analysis workbook; four storyline briefs (A–D). Study 2: instrument on branch `study2` (three rated questions with confidence, Track A supplement), data not yet collected |
| Material Passport | `experiments_declared` — see `../material_passport.md` |
| Co-authors / funding / ethics | To be supplied by the user; Keio University Graduate School of Media Design; CloudResearch Connect; consent recorded; data retained to 2036-08-31 |
| Style calibration | none |

## Storyline frame (the user's structure, adopted)
1. **Background** — remote operation and telepresence; OriHime as a means of remote work, especially in Japan (severe disabilities, labour shortage, avatar work); AI assistance entering the loop.
2. **Why these questions** — A: does being told who controls the robot change how the interaction is judged; B: who is held responsible and credited when AI is involved; C: does disclosing the operator's disability change judgments; D (exploratory): for whom does the AI-only label matter.
3. **Related work** — themes 1–6 of the literature search.
4. **Method (Study 1)** — design, materials, measures, pre-specified analysis plan.
5. **Results (Study 1)** — A, B, C in that order, D as an exploratory subsection; C's null presented as a *bounded* result with its positive reading (no observable cost of disclosure in this setting) and its boundary conditions.
6. **Study 2** — default impressions of the same clips with no disclosure; joint interpretation with Study 1 (scenario rules pre-specified). Data pending: Method drafted now, Results marked as placeholder, Discussion written conditionally.
7. **Discussion** — presence over profile; accountability shift; what the disability null does and does not license; who pays the AI-only penalty.
8. **Design implications** — disclosure formats that keep the human visible; crediting the operator when AI assists; disclosure of disability as optional with no observed cost; tailoring disclosure to AI-sceptical audiences (tentative).
9. **Limitations, ethics/positionality, conclusion.**

## Checkpoints
1. ✔ Configuration confirmed by the user (2026-09-05).
2. Phase 1 literature report — user may add/remove sources.
3. Phase 2 outline — **user approval required before drafting**.
4. Draft → citation audit + abstract → peer review (max 2 loops) → formatting.
