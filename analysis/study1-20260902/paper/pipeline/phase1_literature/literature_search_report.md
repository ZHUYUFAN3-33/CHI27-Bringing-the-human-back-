# Literature Search Report — Phase 1

Paper: *Bringing the Human Back? How Disclosing Who Controls an Avatar Robot Shapes Judgments of Genuineness, Warmth and Responsibility* (CHI 2027 Papers track; empirical, IMRaD).
Prepared 2026-09-05 by the literature_strategist_agent. Companion files: `references.bib` (35 included keys) and `verification_audit.md` (record-level audit trail).

Verification rule applied: every included source was checked against a publisher or DOI record, or against an authoritative scholarly index/institutional or author-hosted copy when the publisher blocked automated access. The re-audit covered title, authors, year, venue, DOI and, where applicable, volume/issue/pages/article number. The ACM Digital Library returned HTTP 403 to direct page fetches, so ACM metadata was triangulated with author-hosted PDFs carrying the ACM reference-format line, institutional repositories, DBLP/CiNii and DOI records. The exact record class and result are logged in `verification_audit.md`. This is a bibliographic-integrity audit, not a systematic-review risk-of-bias assessment.

---

## 1. Search Strategy

### 1.1 Databases and access routes

| Database / route | Themes | How it was used in this pass |
|---|---|---|
| ACM Digital Library (CHI, HRI, CSCW, SIGGRAPH, JHRI/THRI) | 1, 2, 3, 6 | Record pages located through web search; DOIs confirmed through doi.org redirects (direct fetch blocked) |
| IEEE Xplore (RO-MAN, HRI pre-2011 volumes) | 1, 3 | Record page for Kim & Hinds 2006 (document 4107789) |
| Scopus / Google Scholar equivalents (general web search resolving to publisher records: SAGE, Elsevier, Springer, T&F, APA, Nature, INFORMS, OUP, Wiley, Project Euclid, John Benjamins, JSTOR) | all | Primary discovery and verification route |
| PubMed | 4, 5 (stigma, disability, statistics in psychology) | PMIDs recorded where found (Dietvorst 25401381; Scior 21798712; Lyons 28414472; Fiske 12051578; Awad 31659321; Epstein 32920489; Furlough 31613644; Wagenmakers 18087943; Schepman 34235291) |
| arXiv | 1 | Takeuchi et al. 2020 (2003.12569) with journal reference and DOI |
| Semantic Scholar Graph API | 1, 6 | Abstract and DOI records for Baba 2020, Liu 2022, Karinshak 2023 |
| JST Moonshot programme site | 1 | Programme page for Goal 1 / Ishiguro project (grey literature, cited as URL only) |

### 1.2 Search strings per theme

Strings were run as phrase searches combining author, title fragment and venue (the verification style used throughout) and as topic searches for discovery. Boolean form is given for reuse in ACM DL / Scopus.

**Theme 1 — Telepresence and avatar robots, OriHime, avatar work, Moonshot**
`("OriHime" OR "OriHime-D" OR "avatar robot cafe" OR "DAWN ver") AND (disabilit* OR "avatar work" OR telework)`;
`("cybernetic avatar" OR "avatar-symbiotic") AND (Moonshot OR Ishiguro)`;
`("telepresence robot" OR "mobile remote presence" OR "robotic telepresence") AND (workplace OR office OR "remote work")`;
`("telepresence robot*") AND (disabilit* OR "special needs" OR "bed-bound") AND review`;
`(teleoperat* OR "remote-controlled") AND robot AND (autonomous OR "acting autonomous") AND (customer OR service)`.

**Theme 2 — Teleoperated vs autonomous perception, AI/automation disclosure**
`"Wizard of Oz" AND (HRI OR "human-robot interaction") AND (review OR guidelines)`;
`"mind perception" AND (agency OR experience) AND (robot OR machine)`;
`(chatbot OR bot OR "artificial intelligence") AND disclos* AND (purchase OR trust OR cooperation)`;
`"transparency-efficiency" OR ("transparency" AND "human-machine cooperation")`;
`"algorithm aversion" OR "algorithm appreciation"`;
`"AI-mediated communication" AND (trust OR perception OR label*)`.

**Theme 3 — Responsibility, blame and credit in human–AI teams**
`"moral crumple zone"`;
`(blame OR credit OR responsibility) AND robot AND (autonomy OR autonomous) AND attribution`;
`(blame OR responsibility) AND ("shared control" OR "automated vehicle" OR "human-AI team")`;
`credit AND ("AI-generated" OR "artificial intelligence") AND (art OR work OR authorship)`.

**Theme 4 — Disability disclosure and stigma**
`"stereotype content model" OR ("warmth" AND "competence" AND stereotyp*)`;
`(disabilit*) AND (warmth OR competence) AND (implicit OR stereotyp*)`;
`(disabilit*) AND disclos* AND (workplace OR hiring OR employment)`;
`"intellectual disability" AND (attitude* OR stigma) AND (review OR public)`;
`"intergroup contact" AND meta-analy*`;
`(telepresence OR "assistive technology") AND disabilit* AND (perception OR stigma OR accessibility)`.

**Theme 5 — Methods**
`"equivalence test*" AND (TOST OR "two one-sided")`;
`("Bayes factor" AND BIC) OR "practical solution to the pervasive problems of p values"`;
`"Plackett-Luce" OR "analysis of permutations" OR ("MM algorithm*" AND "Bradley-Terry")`;
`"General Attitudes towards Artificial Intelligence Scale" OR GAAIS`;
`"Negative Attitudes toward Robots Scale" OR NARS`;
`UTAUT2 OR ("unified theory of acceptance and use of technology" AND consumer)`;
`"mixed-effects" AND ("random effects structure" OR "keep it maximal")`.

**Theme 6 — Design implications for AI disclosure and accountability**
`"guidelines for human-AI interaction"`;
`(label* OR disclos*) AND ("AI-generated" OR "AI-written" OR "AI-mediated") AND (trust OR preference OR evaluation)`;
`("AI-mediated communication") AND (ethic* OR norm* OR disclosure)`.

### 1.3 Inclusion and exclusion criteria

Included: (a) peer-reviewed journal articles, archival ACM/IEEE proceedings papers, or ACM extended abstracts/companion papers when they are the only archival source on OriHime or on teleoperated-robot disclosure; (b) English language; (c) a resolvable DOI or publisher record confirmed in this session; (d) relevance to at least one theme; (e) foundational works admitted regardless of date when the paper's constructs or estimators derive from them (SCM 2002, contact meta-analysis 2006, mind perception 2007, Plackett 1975, Hunter 2004, Wagenmakers 2007, NARS 2006, UTAUT2 2012, WoZ review 2012, CHI 2011 telepresence).

Excluded: records that could not be verified in this session; preprints without an archival version unless they are the only source on a required topic (none included); duplicates of the same study across venues; sources whose relevance is only lexical; software papers for tools the analysis did not use (lme4, the R PlackettLuce package — verified but excluded because the analysis ran in Python 3.12 / statsmodels 0.14).

Date range: core window 2014–2026 (last ~12 years); seminal works outside the window admitted under (e). Included years span 1975–2024; 22 of 35 (63%) are 2014 or later.

### 1.4 Screening counts

| Stage | Count |
|---|---|
| Candidates identified from theme prompts, backward/forward chaining and search listings | 83 |
| Screened for relevance on title/abstract | 83 |
| Verification attempted (author + title + venue search; DOI resolution where needed) | 50 |
| Verified as real with DOI/URL | 50 (0 failures) |
| Included in annotated bibliography (cap 35, ≥3 per theme) | 35 |
| Verified but set aside for scope (available to swap in; see 1.5) | 15 |
| Not verified in this pass — excluded (Section 6) | 33 |

Per-theme verified counts (primary assignment; several sources serve two themes): T1 = 6, T2 = 8, T3 = 5 (+1 shared), T4 = 5 (+1 shared), T5 = 8, T6 = 3 (+3 shared).

### 1.5 Verified but set aside for scope (swap-in pool)

All checked in this session; DOIs confirmed unless noted. They may be substituted for included items without further verification of existence, but findings should be re-read before citing.

| Source | Theme | DOI / URL | Reason set aside |
|---|---|---|---|
| Yamazaki, Y., Yamada, ?, Nomura, ?, Hosoda, ?, Kawamura, ?, et al. (2022). Meta Avatar Robot Cafe: Linking Physical and Virtual Cybernetic Avatars to Provide Physical Augmentation for People with Disabilities. SIGGRAPH '22 Emerging Technologies. | 1 | 10.1145/3532721.3546117 | Demo abstract; DAWN covered by Takeuchi 2020 and Hatada 2024. Full author list not captured — confirm before citing |
| Kristoffersson, A., Coradeschi, S., & Loutfi, A. (2013). A Review of Mobile Robotic Telepresence. Advances in Human-Computer Interaction. | 1 | 10.1155/2013/902316 | Older review; Zhang & Hansen 2022 preferred |
| Baba, J., Song, S., Nakanishi, J., Yoshikawa, Y., & Ishiguro, H. (2021). Local vs. Avatar Robot: Performance and Perceived Workload of Service Encounters in Public Space. Frontiers in Robotics and AI, 8, 778753. | 1 | 10.3389/frobt.2021.778753 | Operator-side workload; Baba 2020 more relevant |
| Logg, J. M., Minson, J. A., & Moore, D. A. (2019). Algorithm appreciation. OBHDP, 151, 90–103. | 2 | 10.1016/j.obhdp.2018.12.005 | Counterpoint to Dietvorst; useful if Discussion needs both directions |
| Mozafari, N., Weiger, W. H., & Hammerschmidt, M. (2022). Trust me, I'm a bot. Journal of Service Management, 33(2), 221–245. | 2, 6 | 10.1108/JOSM-10-2020-0380 | Service-context moderators of disclosure; swap for Luo if design implications need context effects |
| Groom, V., Chen, J., Johnson, T., Kara, F. A., & Nass, C. (2010). Critic, compatriot, or chump? HRI '10, 211–218. | 3 | https://dl.acm.org/doi/10.5555/1734454.1734545 (ACM DL uses a 10.5555 identifier; a 10.1145 DOI reported by one listing was not confirmed) | Robot blaming humans — tangential |
| Malle, B. F., Scheutz, M., Arnold, T., Voiklis, J., & Cusimano, C. (2015). Sacrifice One for the Good of Many? HRI '15, 117–124. | 3 | 10.1145/2696454.2696458 | Moral dilemmas rather than work attribution |
| Lima, G., Grgić-Hlača, N., & Cha, M. (2021). Human Perceptions on Moral Responsibility of AI. CHI '21. | 3 | 10.1145/3411764.3445260 | Strong CHI precedent on responsibility notions; swap for Furlough if a CHI citation is preferred |
| Arntz, A., Eimler, S. C., Straßmann, C., & Hoppe, H. U. (2021). On the Influence of Autonomy and Transparency on Blame and Credit in Flawed Human-Robot Collaboration. HRI '21 Companion. | 3 | 10.1145/3434074.3447196 | Late-breaking report; replicates Kim & Hinds |
| Santuzzi, A. M., Waltz, P. R., Finkelstein, L. M., & Rupp, D. E. (2014). Invisible Disabilities. Industrial and Organizational Psychology, 7(2), 204–219. | 4 | 10.1111/iops.12134 | Conceptual; Lyons 2017 gives experimental disclosure evidence |
| Werner, S., Corrigan, P., Ditchman, N., & Sokol, K. (2012). Stigma and intellectual disability: A review of related measures. RIDD, 33(2), 748–765. | 4 | https://www.sciencedirect.com/science/article/abs/pii/S089142221100388X (PMID 22115915; DOI string not captured) | Measurement review; Scior 2011 covers attitudes |
| Shinohara, K., & Wobbrock, J. O. (2011). In the shadow of misperception. CHI '11, 705–714. | 4 | 10.1145/1978942.1979044 | Assistive-technology stigma; swap in if RW theme 4 needs a CHI anchor |
| Carpinella, C. M., Wyman, A. B., Perez, M. A., & Stroessner, S. J. (2017). The Robotic Social Attributes Scale (RoSAS). HRI '17, 254–262. | 5 | 10.1145/2909824.3020208 | Robot-directed warmth/competence scale; cite if the OriHime evaluation items derive from it |
| Turner, H. L., van Etten, J., Firth, D., & Kosmidis, I. (2020). Modelling rankings in R: the PlackettLuce package. Computational Statistics, 35, 1027–1057. | 5 | 10.1007/s00180-020-00959-3 | R package not used |
| Bates, D., Mächler, M., Bolker, B., & Walker, S. (2015). Fitting Linear Mixed-Effects Models Using lme4. JSS, 67(1), 1–48. | 5 | 10.18637/jss.v067.i01 | R package not used |

### 1.6 Re-audit outcome (2026-09-05)

- Included records: 35; unique BibTeX keys: 35; unique DOIs: 35.
- Core bibliographic metadata matched for all 35 records. No unresolved, duplicate or DOI-free record remains in the included set.
- Seven ACM entries were additionally checked against author/institutional copies or curated indexes because direct ACM DL retrieval was blocked. Confirmed page/article metadata was added to `references.bib`; in particular, Hatada et al. is Article 61 (13 pages), Liu et al. is Article 474 (13 pages), and Karinshak et al. is Article 116 (29 pages).
- Absence and novelty statements below are scoped to the 83-record search corpus rather than asserted as universal facts.

---

## 2. Annotated Bibliography

Ordered by theme (1 → 6). "Theme" tags name the primary theme first.

### Takeuchi, K., Yamazaki, Y., & Yoshifuji, K. (2020). Avatar Work: Telework for Disabled People Unable to Go Outside by Using Avatar Robots "OriHime-D" and Its Verification. Companion of the 2020 ACM/IEEE International Conference on Human-Robot Interaction (HRI '20 Companion), ACM.
- **Type**: Peer-reviewed companion paper (late-breaking report), developer-authored (OryLab).
- **Method**: Concept proposal plus field verification: a two-week limited avatar robot café in which ten pilots with disabilities operated OriHime-D by mouse or gaze input according to their impairment; self-reported fulfilment and workload.
- **Key Findings**: Pilots reported mental fulfilment from avatar work; workload could be tailored to individual capacity; café customer service was judged suitable for people with a variety of disabilities seeking social participation.
- **Relevance**: Primary source for OriHime-D, the term "avatar work" and the pilot café that became DAWN ver.β. Defines the operator population our disability-profile manipulation describes. Customer-side evaluations were not measured; within the searched corpus, this leaves a perceiver-side gap addressed by the present paper.
- **Quality**: First-hand developer account; n = 10, no comparison condition, descriptive self-report; 8-page companion format.
- **Potential Use**: Introduction; Related Work theme 1; Discussion (deployment context). Themes: 1, 4.
- **DOI/URL**: https://doi.org/10.1145/3371382.3380737 ; arXiv:2003.12569
- **Verified via**: WebFetch of the arXiv abstract page (title, authors, journal reference "HRI '20 Companion", DOI, abstract) and WebSearch listings (ResearchGate, ACM).

### Hatada, Y., Barbareschi, G., Takeuchi, K., Kato, H., Yoshifuji, K., Minamizawa, K., & Narumi, T. (2024). People with Disabilities Redefining Identity through Robotic and Virtual Avatars: A Case Study in Avatar Robot Cafe. Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems (CHI '24), ACM.
- **Type**: CHI full paper; qualitative case study.
- **Method**: Seven disabled pilots working at the Avatar Robot Cafe co-developed personalised virtual avatars displayed on a large in-situ screen alongside the physical OriHime robots (a hybrid cyber-physical space); longitudinal semi-structured interviews.
- **Key Findings**: Pilots used avatar customisation to renegotiate identity and self-presentation, including what to reveal about themselves; the hybrid setting changed how they related to customers and to their own bodies.
- **Relevance**: Most recent archival account of DAWN ver.β. Frames disclosure of the operator's identity and disability as a pilot-controlled choice; our study measures the customer-side consequence of that choice. Shares our institutional context (Keio).
- **Quality**: Rich longitudinal data; n = 7, single site, no perceiver data.
- **Potential Use**: Introduction; Related Work themes 1 and 4; Discussion. Themes: 1, 4.
- **DOI/URL**: https://doi.org/10.1145/3613904.3642189
- **Verified via**: WebSearch (ACM DL record, doi.org link, Keio Pure record listing the seven authors).

### Ishiguro, H. (2021). The realisation of an avatar-symbiotic society where everyone can perform active roles without constraint. Advanced Robotics, 35(11), 650–656.
- **Type**: Journal programme paper (JST Moonshot Goal 1 project overview).
- **Method**: Conceptual; sets out the cybernetic avatar (CA) research programme, the hospitality-dialogue teleoperation scenario and milestones to 2050.
- **Key Findings**: Defines CAs as teleoperated avatars that transmit the user's actions and intentions, with increasing autonomous support, enabling participation in work, education and care regardless of body, brain, space and time; funded under JST Moonshot JPMJPS2011.
- **Relevance**: The policy and technology backdrop for the HA condition (human operator with AI assistance). Shows that disclosure of control source will become a live design question as CAs blend teleoperation and autonomy.
- **Quality**: Authoritative programme statement; single-author, non-empirical.
- **Potential Use**: Introduction; Related Work theme 1; Design implications. Themes: 1, 6.
- **DOI/URL**: https://doi.org/10.1080/01691864.2021.1928548 ; programme page https://www.jst.go.jp/moonshot/en/program/goal1/11_ishiguro.html
- **Verified via**: WebSearch (Taylor & Francis record via doi.org with volume, issue and pages; JST project page).

### Lee, M. K., & Takayama, L. (2011). "Now, I have a body": Uses and social norms for mobile remote presence in the workplace. Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '11), 33–42, ACM.
- **Type**: CHI full paper; field study.
- **Method**: Interviews, observations and surveys with remote pilots (2–18 months of mobile remote presence use) and their local colleagues in one organisation.
- **Key Findings**: Remotely controlled mobility let remote workers live and work with local colleagues almost as if physically present; new social norms formed around the robot body, and the robot came to be treated as the pilot.
- **Relevance**: Foundational for workplace telepresence and for the assumption that the robot body is read as its human pilot — the assumption our control-source disclosure disrupts.
- **Quality**: Seminal; qualitative; single site; pre-AI era.
- **Potential Use**: Related Work theme 1. Themes: 1.
- **DOI/URL**: https://doi.org/10.1145/1978942.1978950
- **Verified via**: WebSearch (multiple listings with pages 33–42) and WebFetch of doi.org, which resolved (302) to the ACM DL record.

### Baba, J., Song, S., Nakanishi, J., Kuramoto, I., Ogawa, K., Yoshikawa, Y., & Ishiguro, H. (2020). Teleoperated Robot Acting Autonomous for Better Customer Satisfaction. Extended Abstracts of the 2020 CHI Conference on Human Factors in Computing Systems (CHI EA '20), ACM.
- **Type**: CHI extended abstract (late-breaking work); field study.
- **Method**: A teleoperated service robot presented to customers as autonomous; service ratings compared between customers who did and did not realise it was teleoperated.
- **Key Findings**: Customers who did not realise the robot was teleoperated rated the service higher than those who did.
- **Relevance**: The closest existing evidence on how believed control source changes evaluation of the same robot — the inverse of our manipulation. Realisation was not randomised and behaviour was not held constant; our identical-clip design removes both confounds.
- **Quality**: Field realism from the Ishiguro group; self-selected "realisation", short format.
- **Potential Use**: Related Work themes 1 and 2; Discussion. Themes: 1, 2.
- **DOI/URL**: https://doi.org/10.1145/3334480.3375212
- **Verified via**: WebSearch (ACM DL record) and WebFetch of the Semantic Scholar API record (title, authors, abstract, DOI).

### Zhang, G., & Hansen, J. P. (2022). Telepresence Robots for People with Special Needs: A Systematic Review. International Journal of Human–Computer Interaction, 38(17), 1651–1667.
- **Type**: PRISMA systematic review.
- **Method**: 871 records screened, 42 studies (2009–2019) included; coded by user condition, use case and accessibility.
- **Key Findings**: Telepresence robots can raise quality of life for bed-bound and other users through remote social interaction, but interface accessibility barriers persist; gaps include use cases, universal accessibility, safety and privacy, autonomy, evaluation methods and training.
- **Relevance**: Maps the disability–telepresence literature and shows that its included studies are predominantly operator-side; supports the narrower observation that the searched corpus did not contain a controlled third-party evaluation of a disabled operator's robot-mediated work.
- **Quality**: Rigorous search; coverage ends 2019; heterogeneous small studies.
- **Potential Use**: Related Work themes 1 and 4; gap statement. Themes: 1, 4.
- **DOI/URL**: https://doi.org/10.1080/10447318.2021.2009673
- **Verified via**: WebSearch (Taylor & Francis record) and WebFetch of the DTU Orbit record (authors, journal, volume, issue, pages, DOI, abstract).

### Riek, L. D. (2012). Wizard of Oz Studies in HRI: A Systematic Review and New Reporting Guidelines. Journal of Human-Robot Interaction, 1(1), 119–136.
- **Type**: Systematic review with methodological guidelines.
- **Method**: Review of 54 Wizard-of-Oz experiments (2001–2011) in primary HRI venues; coding of what was wizarded and how it was reported.
- **Key Findings**: WoZ is widespread but under-reported (wizard training, error rates, deception and debriefing); proposes reporting guidelines.
- **Relevance**: Frames the perceptual and ethical stakes of concealed human control — the mirror of our AI-only condition, in which a human-operated robot is described as autonomous. Supports transparent reporting of what participants were told and how they were debriefed.
- **Quality**: Authoritative; coverage now dated.
- **Potential Use**: Related Work theme 2; Methods (deception and debriefing). Themes: 2.
- **DOI/URL**: https://doi.org/10.5898/JHRI.1.1.Riek
- **Verified via**: WebSearch (ACM DL PDF record and journal site).

### Gray, H. M., Gray, K., & Wegner, D. M. (2007). Dimensions of Mind Perception. Science, 315(5812), 619.
- **Type**: Brief empirical report.
- **Method**: Online surveys (about 2,400 respondents) comparing 13 characters, including a robot, on 18 mental capacities; factor analysis.
- **Key Findings**: Mind is perceived on two dimensions, Agency and Experience; robots score moderate on agency and low on experience; the dimensions predict different moral judgments (agency to responsibility, experience to moral patiency).
- **Relevance**: Theoretical basis for both main effects: describing the controller as an AI lowers attributed experience (genuineness, warmth) and re-routes agency-linked responsibility.
- **Quality**: Foundational and widely replicated; the character set is dated.
- **Potential Use**: Related Work themes 2 and 3; Discussion. Themes: 2, 3.
- **DOI/URL**: https://doi.org/10.1126/science.1134475
- **Verified via**: WebSearch (Science record, PhilPapers, author page).

### Luo, X., Tong, S., Fang, Z., & Qu, Z. (2019). Frontiers: Machines vs. Humans: The Impact of Artificial Intelligence Chatbot Disclosure on Customer Purchases. Marketing Science, 38(6), 937–947.
- **Type**: Field experiment.
- **Method**: More than 6,200 customers randomised to structured outbound sales calls by chatbot or by human workers, with chatbot identity disclosed at different points.
- **Key Findings**: Undisclosed chatbots matched proficient human workers; disclosure before the conversation reduced purchases by 79.7%, mediated by perceptions of the bot as less knowledgeable and less empathetic.
- **Relevance**: Strongest causal evidence of a disclosure penalty; our genuineness and warmth penalty is the embodied analogue, obtained with behaviour held constant.
- **Quality**: Large randomised field study; one firm and country; voice chatbot, not a robot.
- **Potential Use**: Related Work theme 2; Discussion. Themes: 2.
- **DOI/URL**: https://doi.org/10.1287/mksc.2019.1192
- **Verified via**: WebSearch (INFORMS record, EconPapers, SSRN).

### Dietvorst, B. J., Simmons, J. P., & Massey, C. (2015). Algorithm Aversion: People Erroneously Avoid Algorithms After Seeing Them Err. Journal of Experimental Psychology: General, 144(1), 114–126.
- **Type**: Five incentive-compatible experiments.
- **Method**: Forecasting tasks in which participants saw an algorithm, a human, both or neither perform, then chose whose forecasts to be paid on.
- **Key Findings**: People lose confidence in algorithms faster than in humans after seeing identical errors and avoid algorithms even when they outperform humans.
- **Relevance**: Names the mechanism behind the AI-only penalty; our exploratory result that the penalty concentrates among participants with less positive AI attitudes links to individual differences in aversion.
- **Quality**: Foundational; decision-aid context rather than social interaction.
- **Potential Use**: Related Work theme 2; Discussion (exploratory moderation). Themes: 2.
- **DOI/URL**: https://doi.org/10.1037/xge0000033
- **Verified via**: WebSearch (PubMed 25401381, APA/Ovid record).

### Jakesch, M., French, M., Ma, X., Hancock, J. T., & Naaman, M. (2019). AI-Mediated Communication: How the Perception that Profile Text was Written by AI Affects Trustworthiness. Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems (CHI '19), ACM.
- **Type**: CHI full paper; online experiments.
- **Method**: Participants rated Airbnb host profiles believing them human-written, AI-written or a mix.
- **Key Findings**: A "Replicant Effect": in mixed sets, hosts whose profiles were suspected to be AI-written were trusted less; when all profiles were labelled AI-written, no penalty emerged.
- **Relevance**: Shows the penalty attaches to the human behind AI-assisted communication and depends on uncertainty. Our HA condition, equivalent to H within ±0.35 SD, is consistent with uniform, explicit labelling of assistance avoiding the penalty.
- **Quality**: Well-designed multi-study paper; text-only stimuli.
- **Potential Use**: Related Work theme 2; Design implications. Themes: 2, 6.
- **DOI/URL**: https://doi.org/10.1145/3290605.3300469
- **Verified via**: WebSearch (ACM DL record, Stanford Social Media Lab page, project GitHub with full ACM citation).

### Ishowo-Oloko, F., Bonnefon, J.-F., Soroye, Z., Crandall, J., Rahwan, I., & Rahwan, T. (2019). Behavioural evidence for a transparency–efficiency tradeoff in human–machine cooperation. Nature Machine Intelligence, 1(11), 517–521.
- **Type**: Online behavioural experiment.
- **Method**: Iterated prisoner's dilemma with human or bot partners whose nature was truthfully disclosed or misrepresented.
- **Key Findings**: Bots elicited more cooperation than humans only while believed to be human; disclosing the bot removed the advantage, establishing a transparency–efficiency tradeoff.
- **Relevance**: The tradeoff our results reproduce for embodied social interaction: identical behaviour, lower warmth and genuineness once the controller is labelled AI.
- **Quality**: Clean manipulation; economic game rather than conversation.
- **Potential Use**: Related Work theme 2; Discussion; Design implications. Themes: 2, 6.
- **DOI/URL**: https://doi.org/10.1038/s42256-019-0113-5
- **Verified via**: WebSearch (Nature record, MPG PuRe, NYU Scholars).

### Hancock, J. T., Naaman, M., & Levy, K. (2020). AI-Mediated Communication: Definition, Research Agenda, and Ethical Considerations. Journal of Computer-Mediated Communication, 25(1), 89–100.
- **Type**: Conceptual agenda paper.
- **Method**: Defines AI-mediated communication (an intelligent agent modifies, augments or generates messages on behalf of a communicator); proposes dimensions (magnitude, media, optimisation goal, autonomy, role) and ethical issues including disclosure.
- **Key Findings**: Sets the research agenda for how AI involvement changes self-presentation, trust and attribution; flags disclosure norms as an open ethical question.
- **Relevance**: The HA condition is AI-MC embodied in a robot; provides the vocabulary for "operator with AI assistance" and for disclosure ethics in the Discussion.
- **Quality**: Highly cited; conceptual only.
- **Potential Use**: Introduction; Related Work theme 2; Design implications. Themes: 2, 6.
- **DOI/URL**: https://doi.org/10.1093/jcmc/zmz022
- **Verified via**: WebSearch (Oxford Academic record, NSF Public Access Repository).

### Hohenstein, J., & Jung, M. (2020). AI as a moral crumple zone: The effects of AI-mediated communication on attribution and trust. Computers in Human Behavior, 106, 106190.
- **Type**: Online experiments.
- **Method**: Text chats with or without algorithmic smart replies, in conversations that went well or badly; attribution and trust measures.
- **Key Findings**: Smart replies raised interpersonal trust; when a conversation failed, blame shifted to the AI, lowering the responsibility assigned to the human partner — the AI functioned as a moral crumple zone.
- **Relevance**: Direct precedent for our finding that AI involvement shifts responsibility, and by extension credit, away from the human operator.
- **Quality**: Controlled; text chat; short interactions.
- **Potential Use**: Related Work themes 2 and 3; Discussion. Themes: 3, 2, 6.
- **DOI/URL**: https://doi.org/10.1016/j.chb.2019.106190
- **Verified via**: WebSearch (ScienceDirect record, ACM DL journal record, NSF PAR copy).

### Elish, M. C. (2019). Moral Crumple Zones: Cautionary Tales in Human-Robot Interaction. Engaging Science, Technology, and Society, 5, 40–60.
- **Type**: Conceptual STS analysis.
- **Method**: Historical case analysis (Three Mile Island, Air France 447, autonomous vehicles).
- **Key Findings**: Responsibility for an automated system's behaviour is misattributed to the human who had limited control — the human absorbs blame like a crumple zone.
- **Relevance**: Theoretical lens for responsibility in human-plus-AI teleoperation. Our data show the opposite direction (the AI absorbs responsibility and credit from the operator), so the concept frames both possibilities.
- **Quality**: Influential; non-empirical.
- **Potential Use**: Related Work theme 3; Discussion. Themes: 3.
- **DOI/URL**: https://doi.org/10.17351/ests2019.260
- **Verified via**: WebSearch (journal record, SSRN preprint, syllabus listings).

### Kim, T., & Hinds, P. (2006). Who Should I Blame? Effects of Autonomy and Transparency on Attributions in Human-Robot Interaction. ROMAN 2006 — The 15th IEEE International Symposium on Robot and Human Interactive Communication, 80–85, IEEE.
- **Type**: Laboratory experiment.
- **Method**: Team task with a robot whose autonomy and transparency (explaining its behaviour) were manipulated; credit and blame attributions.
- **Key Findings**: Greater robot autonomy increased credit and blame assigned to the robot and reduced attributions to self and others; transparency reduced blame to other participants but not to the robot.
- **Relevance**: Earliest evidence that perceived autonomy governs both credit and blame, matching our shift of responsibility and credit rankings toward the AI. Our manipulation is described autonomy only.
- **Quality**: Foundational; small lab sample; early robot.
- **Potential Use**: Related Work theme 3. Themes: 3.
- **DOI/URL**: https://doi.org/10.1109/ROMAN.2006.314398
- **Verified via**: WebSearch (IEEE Xplore document 4107789, ResearchGate).

### Awad, E., Levine, S., Kleiman-Weiner, M., Dsouza, S., Tenenbaum, J. B., Shariff, A., Bonnefon, J.-F., & Rahwan, I. (2020). Drivers are blamed more than their automated cars when both make mistakes. Nature Human Behaviour, 4(2), 134–143.
- **Type**: Large online vignette experiments.
- **Method**: Shared-control crash scenarios varying which driver (human or machine, primary or secondary) erred; blame allocated to each.
- **Key Findings**: When only one driver errs, that driver is blamed regardless of type; when both err in shared control, blame to the machine is reduced and the human is blamed more.
- **Relevance**: Shared control is the HA condition; the asymmetry warns that human operators may carry residual blame even with AI assistance — a reading to check against our HA rankings.
- **Quality**: Large samples; hypothetical harms; driving rather than communication.
- **Potential Use**: Related Work theme 3; Discussion. Themes: 3.
- **DOI/URL**: https://doi.org/10.1038/s41562-019-0762-8
- **Verified via**: WebSearch (Nature record, PubMed 31659321).

### Epstein, Z., Levine, S., Rand, D. G., & Rahwan, I. (2020). Who Gets Credit for AI-Generated Art? iScience, 23(9), 101515.
- **Type**: Online experiments.
- **Method**: Vignettes of AI-generated art with the AI framed as tool or agent; credit and responsibility allocated among artist, programmer, AI and others.
- **Key Findings**: Perceiving the AI as more agentic shifts credit toward the AI and away from humans; language framing manipulates the allocation.
- **Relevance**: One of few studies of credit rather than blame; our credit rankings shifting to the AI parallel this, and our disclosure text is itself a framing manipulation.
- **Quality**: Well-designed; art domain; hypothetical.
- **Potential Use**: Related Work theme 3; Discussion. Themes: 3.
- **DOI/URL**: https://doi.org/10.1016/j.isci.2020.101515
- **Verified via**: WebSearch (ScienceDirect, PubMed 32920489, MIT DSpace copy).

### Furlough, C., Stokes, T., & Gillan, D. J. (2021). Attributing Blame to Robots: I. The Influence of Robot Autonomy. Human Factors, 63(4), 592–602.
- **Type**: Vignette experiments.
- **Method**: Scenarios of human–robot team failures emphasising the human, the robot or the environment, with the robot described as autonomous or non-autonomous; blame allocated among the three.
- **Key Findings**: A blame hierarchy human > robot > environment; a non-autonomous robot received almost as little blame as the environment, an autonomous robot almost as much as the human.
- **Relevance**: Predicts that a robot described as teleoperated should attract little responsibility relative to its operator and an "AI system" much more — the pattern in our ranking shift.
- **Quality**: Journal article with clear manipulations; hypothetical scenarios.
- **Potential Use**: Related Work theme 3. Themes: 3.
- **DOI/URL**: https://doi.org/10.1177/0018720819880641
- **Verified via**: WebSearch (SAGE record, PubMed 31613644).

### Fiske, S. T., Cuddy, A. J. C., Glick, P., & Xu, J. (2002). A model of (often mixed) stereotype content: Competence and warmth respectively follow from perceived status and competition. Journal of Personality and Social Psychology, 82(6), 878–902.
- **Type**: Theory paper with multiple survey samples.
- **Method**: Ratings of 23 societal groups on warmth and competence across nine US samples; status and competition as predictors.
- **Key Findings**: Stereotypes organise on warmth and competence, often mixed; disabled people (with elderly people) fall in the paternalised high-warmth/low-competence quadrant.
- **Relevance**: Source of the warmth and competence measures for the controller, and of the hypothesis that disclosing a disability raises warmth and lowers competence — the effect our data bound within ±0.5 SD.
- **Quality**: Foundational; US samples; group-level judgments.
- **Potential Use**: Related Work theme 4; Methods (measures). Themes: 4, 5.
- **DOI/URL**: https://doi.org/10.1037/0022-3514.82.6.878
- **Verified via**: WebSearch (PubMed 12051578, Princeton record).

### Rohmer, O., & Louvet, E. (2018). Implicit stereotyping against people with disability. Group Processes & Intergroup Relations, 21(1), 127–140.
- **Type**: Three priming experiments.
- **Method**: Conceptual priming (Study 1) and evaluative priming (Studies 2–3), with work versus control context added in Study 3.
- **Key Findings**: People with disability were implicitly associated with less warmth than people without, and with less competence when a work context was primed.
- **Relevance**: Predicts that disclosing a worker's disability in a work setting (our café conversation) should lower judged competence; the bounded null suggests the robot body or the disclosure format buffers this.
- **Quality**: Implicit measures; French student samples; disability type unspecified.
- **Potential Use**: Related Work theme 4; Discussion. Themes: 4.
- **DOI/URL**: https://doi.org/10.1177/1368430216638536
- **Verified via**: WebSearch (SAGE record).

### Lyons, B. J., Volpone, S. D., Wessel, J. L., & Alonso, N. M. (2017). Disclosing a disability: Do strategy type and onset controllability make a difference? Journal of Applied Psychology, 102(9), 1375–1383.
- **Type**: Two experiments.
- **Method**: Hiring vignettes crossing disclosure strategy (embrace versus de-emphasise) with onset controllability; hiring intentions and pity.
- **Key Findings**: When the applicant is seen as responsible for the disability, de-emphasising strategies lowered hiring intentions by raising pity; strategy effectiveness depends on onset controllability.
- **Relevance**: Disclosure format matters. Our neutral third-party description is one format; the design implication is that how an operator's disability is disclosed may matter more than whether.
- **Quality**: Controlled; hypothetical hiring; US samples.
- **Potential Use**: Related Work theme 4; Design implications. Themes: 4, 6.
- **DOI/URL**: https://doi.org/10.1037/apl0000230
- **Verified via**: WebSearch (PubMed 28414472, Wikidata) and WebFetch of doi.org, which resolved (302) to the APA record.

### Scior, K. (2011). Public awareness, attitudes and beliefs regarding intellectual disability: A systematic review. Research in Developmental Disabilities, 32(6), 2164–2182.
- **Type**: Systematic review.
- **Method**: PsycINFO and Web of Science search plus hand search, 1990–mid-2011; 75 articles reporting 68 studies.
- **Key Findings**: Attitudes toward intellectual disability are predicted by age, education and prior contact; public knowledge is limited; well-designed anti-stigma interventions are scarce.
- **Relevance**: Grounds the intellectual-disability operator profile and the contact moderator we tested; identifies competence-focused stigma specific to this group.
- **Quality**: Thorough; dated; mostly descriptive surveys.
- **Potential Use**: Related Work theme 4. Themes: 4.
- **DOI/URL**: https://doi.org/10.1016/j.ridd.2011.07.005
- **Verified via**: WebSearch (PubMed 21798712, ScienceDirect record, ERIC).

### Pettigrew, T. F., & Tropp, L. R. (2006). A meta-analytic test of intergroup contact theory. Journal of Personality and Social Psychology, 90(5), 751–783.
- **Type**: Meta-analysis.
- **Method**: 515 studies, 713 independent samples.
- **Key Findings**: Intergroup contact reliably reduces prejudice (mean r about −.21); effects generalise beyond the contact situation and are larger in more rigorous studies; not explained by selection or publication bias.
- **Relevance**: Justifies measuring participants' contact with people with disabilities as a moderator, and frames avatar work itself as mediated contact.
- **Quality**: Definitive; correlational core.
- **Potential Use**: Related Work theme 4; Discussion. Themes: 4.
- **DOI/URL**: https://doi.org/10.1037/0022-3514.90.5.751
- **Verified via**: WebSearch (APA citation across ProQuest, Semantic Scholar, ResearchGate).

### Lakens, D. (2017). Equivalence Tests: A Practical Primer for t Tests, Correlations, and Meta-Analyses. Social Psychological and Personality Science, 8(4), 355–362.
- **Type**: Methods tutorial.
- **Method**: Two one-sided tests (TOST) with equivalence bounds set from smallest effect sizes of interest; spreadsheet and R implementation.
- **Key Findings**: Equivalence testing lets researchers reject effects as large as the bound, turning "no significant difference" into an interpretable claim.
- **Relevance**: Basis for our ±0.35 SD and ±0.50 SD bounds on contrasts C2–C4 (H vs HA; disability disclosure).
- **Quality**: Standard reference; frequentist.
- **Potential Use**: Methods. Themes: 5.
- **DOI/URL**: https://doi.org/10.1177/1948550617697177
- **Verified via**: WebSearch (SAGE record, TOSTER package citation).

### Wagenmakers, E.-J. (2007). A practical solution to the pervasive problems of p values. Psychonomic Bulletin & Review, 14(5), 779–804.
- **Type**: Methods and theory.
- **Method**: Critique of p values and derivation of BIC-based approximations to Bayes factors (unit-information prior).
- **Key Findings**: BIC differences yield approximate Bayes factors that quantify evidence for a null as well as an alternative.
- **Relevance**: Basis of our BIC-approximated Bayes factors for the disclosure null on participant-level means.
- **Quality**: Standard reference; approximation quality depends on sample size and prior.
- **Potential Use**: Methods. Themes: 5.
- **DOI/URL**: https://doi.org/10.3758/BF03194105
- **Verified via**: WebSearch (PubMed 18087943, author PDF, APA PsycNet record).

### Plackett, R. L. (1975). The Analysis of Permutations. Journal of the Royal Statistical Society: Series C (Applied Statistics), 24(2), 193–202.
- **Type**: Statistical theory.
- **Method**: Defines a probability distribution over the r! permutations of r objects, with estimation and testing; applied to voting data.
- **Key Findings**: The sequential choice model now known as the Plackett–Luce model.
- **Relevance**: Model for our full responsibility and credit rankings over three or four actors, with worths summing to one within condition.
- **Quality**: Foundational.
- **Potential Use**: Methods. Themes: 5.
- **DOI/URL**: https://doi.org/10.2307/2346567
- **Verified via**: WebSearch (Oxford Academic JRSS-C record, Wiley record).

### Hunter, D. R. (2004). MM algorithms for generalized Bradley–Terry models. The Annals of Statistics, 32(1), 384–406.
- **Type**: Statistical methodology.
- **Method**: Minorisation–maximisation algorithms for maximum-likelihood estimation of Bradley–Terry generalisations including the Plackett–Luce model; convergence conditions.
- **Key Findings**: Simple, provably convergent iterative estimators for ranking models.
- **Relevance**: Our Plackett–Luce worths are estimated by MM.
- **Quality**: Standard reference.
- **Potential Use**: Methods. Themes: 5.
- **DOI/URL**: https://doi.org/10.1214/aos/1079120141
- **Verified via**: WebSearch (Project Euclid record, Penn State record).

### Schepman, A., & Rodway, P. (2020). Initial validation of the General Attitudes towards Artificial Intelligence Scale. Computers in Human Behavior Reports, 1, 100014.
- **Type**: Scale development.
- **Method**: Exploratory factor analysis on a UK sample; convergent and discriminant validity against existing measures.
- **Key Findings**: Positive and negative subscales; the positive subscale reflects societal and personal utility, the negative subscale concerns; good psychometric indices.
- **Relevance**: Our pre-disclosure AI-attitude covariate and the exploratory moderator (the AI-only penalty concentrated among participants with less positive attitudes).
- **Quality**: Initial validation; UK sample; later confirmed by the authors.
- **Potential Use**: Methods; Discussion (exploratory). Themes: 5.
- **DOI/URL**: https://doi.org/10.1016/j.chbr.2020.100014
- **Verified via**: WebSearch (PubMed 34235291, ResearchGate, figshare item).

### Nomura, T., Suzuki, T., Kanda, T., & Kato, K. (2006). Measurement of negative attitudes toward robots. Interaction Studies, 7(3), 437–454.
- **Type**: Scale development.
- **Method**: 263 Japanese university students; development of the Negative Attitudes toward Robots Scale with three subscales.
- **Key Findings**: A reliable three-factor scale (negative attitudes toward interaction situations, social influence of robots, and emotions in interaction).
- **Relevance**: Our NARS covariate; the scale's Japanese origin matches the robot under study.
- **Quality**: Widely used; student sample; 2006 conception of robots.
- **Potential Use**: Methods. Themes: 5.
- **DOI/URL**: https://doi.org/10.1075/is.7.3.14nom
- **Verified via**: WebSearch (John Benjamins record, PhilPapers).

### Venkatesh, V., Thong, J. Y. L., & Xu, X. (2012). Consumer Acceptance and Use of Information Technology: Extending the Unified Theory of Acceptance and Use of Technology. MIS Quarterly, 36(1), 157–178.
- **Type**: Theory extension with a two-stage survey.
- **Method**: 1,512 mobile-internet consumers; adds hedonic motivation, price value and habit to UTAUT.
- **Key Findings**: UTAUT2 raised explained variance in behavioural intention from 56% to 74% and in use from 40% to 52%.
- **Relevance**: Source of the usefulness and acceptance items in the OriHime evaluation.
- **Quality**: Standard reference; consumer survey.
- **Potential Use**: Methods. Themes: 5.
- **DOI/URL**: https://doi.org/10.2307/41410412
- **Verified via**: WebSearch (AIS eLibrary record, SSRN).

### Barr, D. J., Levy, R., Scheepers, C., & Tily, H. J. (2013). Random effects structure for confirmatory hypothesis testing: Keep it maximal. Journal of Memory and Language, 68(3), 255–278.
- **Type**: Simulation-based methods paper.
- **Method**: Monte Carlo comparison of random-effects specifications in linear mixed-effects models for designs with repeated measures.
- **Key Findings**: Omitting random slopes justified by the design inflates Type I error; the random-effects structure should be maximal for the design.
- **Relevance**: Justifies participant random effects (and clip terms) in our mixed models for three ratings per participant; note our models were fitted in Python 3.12 with statsmodels 0.14.
- **Quality**: Standard reference; psycholinguistics framing.
- **Potential Use**: Methods. Themes: 5.
- **DOI/URL**: https://doi.org/10.1016/j.jml.2012.11.001
- **Verified via**: WebSearch (ScienceDirect record).

### Amershi, S., Weld, D., Vorvoreanu, M., Fourney, A., Nushi, B., Collisson, P., Suh, J., Iqbal, S., Bennett, P. N., Inkpen, K., Teevan, J., Kikin-Gil, R., & Horvitz, E. (2019). Guidelines for Human-AI Interaction. Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems (CHI '19), ACM.
- **Type**: CHI full paper; design guidelines with evaluation.
- **Method**: Synthesis of more than 150 recommendations into 18 guidelines; validated with 49 design practitioners across 20 AI products.
- **Key Findings**: Guidelines including "make clear what the system can do" and "make clear how well the system can do what it can do", plus time- and context-appropriate disclosure.
- **Relevance**: Framework for our design implications on disclosing control source and AI assistance in telepresence robots.
- **Quality**: Industry-grounded; product interfaces rather than social robots.
- **Potential Use**: Design implications. Themes: 6.
- **DOI/URL**: https://doi.org/10.1145/3290605.3300233
- **Verified via**: WebSearch (ACM DL record, Microsoft Research camera-ready PDF).

### Liu, Y., Mittal, A., Yang, D., & Bruckman, A. (2022). Will AI Console Me when I Lose my Pet? Understanding Perceptions of AI-Mediated Email Writing. Proceedings of the 2022 CHI Conference on Human Factors in Computing Systems (CHI '22), ACM.
- **Type**: CHI full paper; mixed methods.
- **Method**: Large-scale surveys and in-depth interviews on trust in email writers under varying AI involvement and message type.
- **Key Findings**: Trust in email writers decreased when people were told AI was involved; unexpectedly, trust increased when AI was used for interpersonal rather than transactional emails.
- **Relevance**: The AI-involvement penalty attaches to the human sender and is moderated by message type; informs why a coworker conversation (interpersonal) may be sensitive to an AI-only label and why the AI-assisted human was not penalised.
- **Quality**: CHI full paper; email domain; US participants.
- **Potential Use**: Related Work theme 2; Design implications. Themes: 6, 2.
- **DOI/URL**: https://doi.org/10.1145/3491102.3517731
- **Verified via**: WebFetch of the author-hosted PDF (ACM reference-format line with DOI), WebFetch of the Semantic Scholar API record, WebSearch (ACM DL record).

### Karinshak, E., Liu, S. X., Park, J. S., & Hancock, J. T. (2023). Working with AI to persuade: Examining a large language model's ability to generate pro-vaccination messages. Proceedings of the ACM on Human-Computer Interaction, 7(CSCW1), Article 116.
- **Type**: CSCW journal-track paper; three studies.
- **Method**: Systematic evaluation of GPT-3 messages (Study 1); perception experiment against CDC messages (Study 2); source-label experiment (Study 3).
- **Key Findings**: GPT-3 messages were rated more effective and stronger than CDC messages, yet participants dispreferred messages labelled AI-generated — a source-label penalty independent of content.
- **Relevance**: A label-induced penalty with content held constant, paralleling our identical-clip design; supports the recommendation that disclosure be paired with information about human oversight.
- **Quality**: Multi-study; public-health messages; US participants.
- **Potential Use**: Related Work theme 2; Design implications. Themes: 6, 2.
- **DOI/URL**: https://doi.org/10.1145/3579592
- **Verified via**: WebFetch of the author-hosted PDF (ACM reference-format line: vol. 7, CSCW1, Article 116, DOI), WebFetch of the Semantic Scholar API record.

---

## 3. Literature Matrix

● primary theme, ○ secondary theme. Quality: H = high (journal or CHI/HRI full paper, sound design, well cited), M = medium (extended abstract/companion, small n, or dated), F = foundational (seminal, outside the date window).

| # | Source | T1 | T2 | T3 | T4 | T5 | T6 | Method | Quality |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Takeuchi et al. 2020 | ● | | | ○ | | | Field pilot, n = 10 | M |
| 2 | Hatada et al. 2024 | ● | | | ○ | | | Longitudinal qualitative, n = 7 | H |
| 3 | Ishiguro 2021 | ● | | | | | ○ | Programme/conceptual | M |
| 4 | Lee & Takayama 2011 | ● | | | | | | Field study (interviews, survey) | F |
| 5 | Baba et al. 2020 | ● | ○ | | | | | Field study, non-random disclosure | M |
| 6 | Zhang & Hansen 2022 | ● | | | ○ | | | Systematic review (42 studies) | H |
| 7 | Riek 2012 | | ● | | | ○ | | Systematic review (54 studies) | F |
| 8 | Gray, Gray & Wegner 2007 | | ● | ○ | | | | Survey + factor analysis | F |
| 9 | Luo et al. 2019 | | ● | | | | ○ | Field RCT, n > 6,200 | H |
| 10 | Dietvorst et al. 2015 | | ● | | | | | Lab experiments (5) | H |
| 11 | Jakesch et al. 2019 | | ● | | | | ○ | Online experiments | H |
| 12 | Ishowo-Oloko et al. 2019 | | ● | | | | ○ | Online behavioural experiment | H |
| 13 | Hancock, Naaman & Levy 2020 | | ● | | | | ○ | Conceptual | H |
| 14 | Hohenstein & Jung 2020 | | ○ | ● | | | ○ | Online experiments | H |
| 15 | Elish 2019 | | | ● | | | ○ | Conceptual case analysis | H |
| 16 | Kim & Hinds 2006 | | ○ | ● | | | | Lab experiment | F |
| 17 | Awad et al. 2020 | | | ● | | | | Online vignette experiments | H |
| 18 | Epstein et al. 2020 | | | ● | | | | Online experiments | H |
| 19 | Furlough et al. 2021 | | | ● | | | | Vignette experiments | H |
| 20 | Fiske et al. 2002 | | | | ● | ○ | | Theory + surveys | F |
| 21 | Rohmer & Louvet 2018 | | | | ● | | | Priming experiments (3) | H |
| 22 | Lyons et al. 2017 | | | | ● | | ○ | Experiments (2) | H |
| 23 | Scior 2011 | | | | ● | | | Systematic review (68 studies) | H |
| 24 | Pettigrew & Tropp 2006 | | | | ● | | | Meta-analysis (515 studies) | F |
| 25 | Lakens 2017 | | | | | ● | | Methods tutorial | H |
| 26 | Wagenmakers 2007 | | | | | ● | | Methods/theory | F |
| 27 | Plackett 1975 | | | | | ● | | Statistical theory | F |
| 28 | Hunter 2004 | | | | | ● | | Statistical methodology | F |
| 29 | Schepman & Rodway 2020 | | ○ | | | ● | | Scale development | H |
| 30 | Nomura et al. 2006 | | ○ | | | ● | | Scale development | F |
| 31 | Venkatesh, Thong & Xu 2012 | | | | | ● | | Theory + survey, n = 1,512 | F |
| 32 | Barr et al. 2013 | | | | | ● | | Simulation study | H |
| 33 | Amershi et al. 2019 | | | | | | ● | Guideline synthesis + practitioner study | H |
| 34 | Liu et al. 2022 | | ○ | | | | ● | Mixed methods | H |
| 35 | Karinshak et al. 2023 | | ○ | | | | ● | Experiments (3) | H |

Theme coverage including secondary marks: T1 = 6; T2 = 15; T3 = 7; T4 = 9; T5 = 10; T6 = 12. Primary-only: T1 = 6, T2 = 7, T3 = 6, T4 = 5, T5 = 8, T6 = 3.

---

## 4. Research Gap Identification

**Under-researched areas**
- Within the 83-record search corpus, we found no experiment that manipulated the *described* control source of a physically embodied avatar robot (human / human with AI assistance / AI alone) while holding the observed behaviour constant. The nearest disclosure evidence comes from text and voice bots (Luo 2019; Ishowo-Oloko 2019; Jakesch 2019; Liu 2022; Karinshak 2023) or from a field setting where realisation of teleoperation was not randomised and behaviour was not experimentally fixed (Baba 2020). This paper supplies an identical-clip test and quantifies the penalty (genuineness d = .62, warmth d = .52).
- The "AI-assisted human" as a third category was uncommon in the searched corpus; most included designs contrast human with AI. Jakesch (2019) shows that the penalty depends on uncertainty about who wrote what. Our H-versus-HA equivalence within ±0.35 SD appears to be the first bounded estimate for embodied telepresence among the records screened here.
- Credit is less represented than blame in the included attribution literature (Kim & Hinds 2006 and Epstein 2020 are the closest exceptions). We found no screened study that ranked responsibility and credit jointly across the same multi-actor set (operator, AI, robot provider, interlocutor). Our Plackett–Luce analysis addresses that corpus-level gap.

**Methodological gaps**
- In the HRI disclosure and disability-stigma studies included here, null results were generally not bounded with equivalence tests or Bayes factors. This paper reports TOST bounds (±0.35, ±0.50 SD) and BIC-approximated Bayes factors for the disclosure and H-versus-HA contrasts.
- Ranking data in attribution studies are typically reduced to single-target Likert items; Plackett–Luce modelling with participant-bootstrap intervals and a common-anchor measure handles unequal actor sets across conditions.
- Pre-specified contrasts with a full exploratory ledger (113 tests listed) make multiplicity visible in a way not present in most of the screened vignette reports.

**Population gaps**
- The included OriHime studies are operator-side, qualitative and small (n = 7–10; Takeuchi 2020; Hatada 2024), while Zhang & Hansen (2022) describe a telepresence–disability field centred on users with special needs. The searched corpus contained no large controlled study of third-party perceivers (customers or coworkers) evaluating a disabled operator's robot-mediated work. This paper contributes N = 272 perceiver ratings. The remaining gap is Japanese perceivers, since our sample is a North American online panel judging a Japanese robot.
- Intellectual disability is under-represented in disclosure research, which focuses on physical and concealable conditions (Lyons 2017; Rohmer & Louvet 2018). Our design includes an intellectual-disability profile and finds no detectable penalty, a result that needs replication with Japanese and in-person samples.

**Temporal gaps**
- The disclosure literature predates or straddles the arrival of large language models (2019–2022); attitudes to AI are shifting and heterogeneous. Our GAAIS moderation result (penalty concentrated among less positive attitudes) suggests earlier average effects may not generalise. The planned independent no-disclosure baseline (who viewers assume controls the robot; whether they infer a disability) is designed to provide a current prior-belief anchor, but it cannot support any claim until its data have been collected and analysed.
- Cybernetic-avatar policy (Moonshot Goal 1, Ishiguro 2021) anticipates blended teleoperation and autonomy by 2030–2050; the programme paper itself supplies no perceiver-side disclosure evidence.

**Geographical gaps**
- Avatar-work deployments in the included corpus are Japanese (OryLab, DAWN, Moonshot), whereas the perception, attribution and stigma evidence is predominantly North American and Western European (see Section 5). The transfer to Japanese perceivers was not tested in the included records. This paper offers one cross-context observation (Western perceivers, Japanese robot) and should state the limitation explicitly.

---

## 5. Distributional Skew Advisory

Threshold: ≥70% of included sources in one value of a dimension.

| Dimension | Distribution (n = 35) | ≥70%? | Advisory |
|---|---|---|---|
| Time | 1975–2013: 13 (37%); 2014–2024: 22 (63%); 2019–2020 alone: 12 (34%) | No | Balanced by design (seminal + recent). The 2019–2020 cluster reflects when AI-disclosure research peaked; add 2023–2026 items in revision if reviewers ask for post-LLM evidence (swap-in pool has none; a fresh search on "AI disclosure" 2024–2026 is recommended before camera-ready). |
| Geography (first-author affiliation) | USA 20 (57%); Europe 8 (23%); Japan 5 (14%); Canada 1; UAE 1 | No, but North America + Europe = 83% | Japan appears only in Theme 1 and the NARS scale. Perception and stigma evidence is Western; state this in Limitations and consider Japanese-language sources on OriHime reception (none verified here). |
| Method | Primary empirical (experiment, survey, field, qualitative) 23 (66%); reviews/meta-analyses 4 (11%); conceptual 3 (9%); statistical methods 5 (14%) | No | Within the empirical set, hypothetical online vignettes dominate (about 12 of 23); Baba 2020, Luo 2019 and Lee & Takayama 2011 are the only field studies. Frame our online video-clip design against this base honestly. |
| Venue type | Non-ACM journals 25 (71%); ACM proceedings/journals 9 (26%); IEEE 1 (3%) | **Yes (71% non-ACM journals)** | Acceptable for a CHI paper whose constructs come from social psychology, marketing and statistics, but Related Work should lean on the CHI/HRI/CSCW items (Lee & Takayama; Baba; Hatada; Jakesch; Amershi; Liu; Karinshak; Riek; Takeuchi). To raise ACM share, swap in Shinohara & Wobbrock 2011 (CHI), Lima et al. 2021 (CHI), Arntz et al. 2021 (HRI) or Carpinella et al. 2017 (HRI) from Section 1.5. |
| Discipline | HCI/HRI 13 (37%); social/organisational psychology 10 (29%); statistics/methods 6 (17%); marketing/IS/communication 5 (14%); STS 1 | No | None. |

---

## 6. Candidates Not Verified (Excluded)

These were considered from theme prompts or surfaced in search listings but were **not** verified in this pass (no title/author/venue/DOI check completed). They must not be cited from this report. Where a DOI or title surfaced incidentally it is given so a later pass can verify quickly; bibliographic details below are recollection or listing text, not confirmed facts.

**Theme 1**
- "Human Being, Robot Body: Hybrid Identity Expression in Teleoperated Robots", ACM Transactions on Human-Robot Interaction — DOI 10.1145/3844722 surfaced in a listing; authors and year not captured.
- "Interaction in Remote Peddling Using Avatar Robot by People with Disabilities", HAI 2022 — DOI 10.1145/3527188.3563915 surfaced; authors not captured.
- "Public Evaluation on Potential Social Impacts of Fully Autonomous Cybernetic Avatars … Avatar Land", arXiv 2507.12741 — preprint; authors and archival status not checked.
- Song, S., et al. (2020?). "Mind the Voice!" CHI EA — not searched.
- Nishio, S., et al. (2012?). Ultimatum-game study of teleoperated vs autonomous robot attitudes, RO-MAN — not searched.
- Newhart, V. A., Warschauer, M., & Sender, L. (2016?). Virtual inclusion via telepresence robots in the classroom — not searched.
- Tsui, K. M., et al. (2015?). Accessible human-robot interaction for telepresence robots, Paladyn — not searched.
- Rae, I., Mutlu, B., & Takayama, L. (2014?). Bodies in motion, CHI — not searched.

**Theme 2**
- Glikson, E., & Woolley, A. W. (2020?). Human trust in AI review, Academy of Management Annals — not searched.
- Castelo, N., Bos, M. W., & Lehmann, D. R. (2019?). Task-dependent algorithm aversion, JMR — not searched.
- Longoni, C., Bonezzi, A., & Morewedge, C. K. (2019?). Resistance to medical AI, JCR — not searched.
- Waytz, A., Heafner, J., & Epley, N. (2014?). The mind in the machine, JESP — not searched.
- Mieczkowski, H., et al. (2021?). AI-MC language use, CSCW — not searched.
- Hohenstein, J., et al. (2023?). AI in communication impacts language and social relationships, Scientific Reports — not searched.
- Purcell, Z. A., et al. (2023?). Fears about AI-mediated communication — not searched.
- Kadoma, K., Metaxa, D., & Naaman, M. (2024?). Inclusion, control and ownership in workplace AI-MC, CHI — not searched.

**Theme 3**
- Hidalgo, C. A., et al. (2021?). How Humans Judge Machines, MIT Press — not searched.
- Shank, D. B., & DeSanti, A. (2018?). Attributions of morality and mind to AI after real-world moral violations, CHB — not searched.
- Kneer, M., & Stuart, M. T. (2021?). Playing the blame game with robots, HRI Companion — not searched.
- Tolmeijer, S., et al. (2022). Capable but amoral?, CHI — DOI 10.1145/3491102.3517732 surfaced in a listing; not verified.
- Horvitz, E. (1999?). Principles of mixed-initiative user interfaces, CHI — not searched.

**Theme 4**
- Cuddy, A. J. C., Fiske, S. T., & Glick, P. (2007?). The BIAS map, JPSP — not searched.
- Fiske, S. T. (2018?). Stereotype content: Warmth and competence endure, CDPS — a PDF surfaced in a listing; not verified.
- Louvet, E. (2007?). Social judgment toward job applicants with disabilities, Rehabilitation Psychology — not searched.
- Lindsay, S., Cagliostro, E., & Carafa, G. (2018?). Workplace disclosure among youth with disabilities, Disability and Rehabilitation — not searched.
- Granjon, M., et al. (2024). Disability stereotyping is shaped by stigma characteristics, GPIR — surfaced in a listing; not verified.

**Theme 5**
- Seabold, S., & Perktold, J. (2010?). statsmodels: Econometric and statistical modeling with Python, SciPy 2010 — **should be verified and cited in Methods as the software actually used**.
- Liang, K.-Y., & Zeger, S. L. (1986?). Longitudinal data analysis using generalized linear models, Biometrika — GEE reference for the attribution models; not searched.
- Lakens, D., Scheel, A. M., & Isager, P. M. (2018?). Equivalence testing tutorial, AMPPS — not searched.
- Schepman, A., & Rodway, P. (2023?). GAAIS confirmatory validation, IJHCI — not searched.
- Nomura, T., Kanda, T., & Suzuki, T. (2006?). Negative attitudes and HRI, AI & Society — not searched.
- Abele, A. E., et al. (2021?). Integrated framework for evaluating self, individuals and groups, Psychological Review — not searched.

**Theme 6**
- Regulation (EU) 2024/1689 (AI Act), Article 50 transparency obligations — not fetched from EUR-Lex; verify before citing as a regulatory anchor.
