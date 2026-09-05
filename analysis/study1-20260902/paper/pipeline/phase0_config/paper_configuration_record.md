# Paper Configuration Record — unified storyline (confirmed 2026-09-05)

> Phase 0 of the `academic-paper` pipeline. The user confirmed on 2026-09-05 that one paper will combine the control-source evaluation, responsibility-and-credit, disability-disclosure and exploratory AI-attitude stories under one frame. At the Phase 2 checkpoint the user selected the first title, rejected `Study 2` as a manuscript label, moved Design Implications into the Discussion, excluded the exploratory AI-attitude moderation from the abstract, and left authorship/funding/ethics identifiers as placeholders.

| Field | Value |
|---|---|
| Selected title | Bringing the Human Back? How Disclosing Who Controls an Avatar Robot Shapes Judgments of Genuineness, Warmth and Responsibility |
| Paper type | Empirical research paper, CHI style (Introduction · Related Work · Method · Results · Discussion, including Design Implications · Limitations · Conclusion) |
| Discipline | Human–computer interaction / human–robot interaction; accessibility |
| Target venue | ACM CHI 2027, Papers track |
| Citation format | ACM Reference Format (numbered); IEEE as the nearest style supported inside the skill, converted at formatting |
| Output format | Markdown draft first; LaTeX (acmart, `sigconf`) at formatting; DOCX via Pandoc on request |
| Language | English; the skill's bilingual abstract kept as a by-product |
| Word count | 8,000 ± 10% excluding references |
| Domain evidence profile | cs_ml-adjacent HCI: peer-reviewed venues (ACM DL, IEEE, journals) plus arXiv preprints admissible where peer-reviewed equivalents are absent |
| Citation verification level | Strict — every reference verified (DOI / publisher page); none invented |
| Existing materials | Primary experiment (internal project label `Study 1`): Statistical Methods, Results, Limitations + reviewer rationale drafts; Tables 1–8; numbers sheet; five publication figures; analysis workbook; four briefs on control-source evaluation, responsibility and credit, disability disclosure and AI-attitude heterogeneity. Independent no-disclosure baseline (internal branch/item label `study2` / `S2_`): fresh-cohort instrument, data not yet collected |
| Material Passport | `experiments_declared` — see `../material_passport.md` |
| Co-authors / funding / ethics | Placeholders retained pending user-supplied author list, CRediT roles, funding and ethics approval identifier; Keio University Graduate School of Media Design; CloudResearch Connect; consent recorded; data retained to 2036-08-31 |
| Style calibration | none |

## Storyline frame (the user's structure, adopted)
1. **Why the problem matters** — remote operation and telepresence can create access to work, social participation and identity expression, including for people with disabilities. As AI assistance enters the OriHime control loop, however, the human contribution may become difficult for customers and coworkers to see. A short disclosure can therefore affect evaluation, recognition, responsibility and credit, and an operator's control over disability self-presentation.
2. **What prior work establishes and misses** — avatar-work studies document operator-side benefits and identity work; AI-disclosure studies show label effects mainly in text, voice and chat; attribution studies show that automation redistributes blame or credit but rarely examine both; disability research documents stereotypes and disclosure effects without holding competent avatar-mediated performance fixed. Within the documented 83-record corpus, these pieces have not been integrated in a randomised identical-behaviour experiment with a physically embodied avatar robot. Each Related Work subsection follows **known → missing → why it matters**.
3. **Questions** — does being told who controls the robot change how the interaction is judged; who is held responsible and credited when AI is involved; does disclosing the operator's disability change judgments; and, exploratorily, for whom does the AI-only label matter.
4. **Method** — primary-experiment design, materials, measures and pre-specified analysis plan. Do not publicly number it `Study 1` when no public `Study 2` is planned.
5. **Results** — disclosed control source and evaluation first, responsibility and credit second, disability disclosure third, and AI-attitude heterogeneity as an explicitly exploratory subsection. Disability disclosure is presented as an encouraging but bounded result: disclosure and favourable evaluation coexisted without a detectable evaluation or attribution penalty in this setting. This supports more inclusive avatar-mediated work as a design implication while not claiming that stigma is absent or workplaces are already inclusive.
6. **Conditional evidence module** — the internally named `Study 2` is publicly an **independent no-disclosure baseline**, never a replication or causal robustness test. Its full report belongs in supplementary material. Main-text placement and wording are selected only after results, using `../phase2_outline/no_disclosure_baseline_integration.md`; no standalone top-level section is reserved now.
7. **Discussion** — presence over profile; accountability shift; disability disclosure without an observable penalty as a positive but bounded inclusion-related result; who pays the AI-only penalty; conditional interpretation of default impressions.
8. **Design implications** — a Discussion subsection, not a standalone top-level section: disclosure formats that keep the human visible; crediting the operator when AI assists; disability disclosure as the operator's choice; tailoring disclosure to AI-sceptical audiences (tentative).
9. **Limitations, ethics/positionality, conclusion.** The exploratory AI-attitude moderation remains outside the abstract. Authorship, funding and ethics-number fields remain placeholders.

## Checkpoints
1. ✔ Configuration confirmed by the user (2026-09-05).
2. Phase 1 literature report — user may add/remove sources.
3. Phase 2 outline — partially decided; approval of the outcome-contingent baseline integration plan is still required before Phase 3/drafting.
4. Draft → citation audit + abstract → peer review (max 2 loops) → formatting.
