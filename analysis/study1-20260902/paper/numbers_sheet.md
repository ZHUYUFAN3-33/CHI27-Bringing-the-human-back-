# Numbers sheet (primary sample unless stated)

completes 300; AT1 fail 21; AV1 fail 8; both fail 1; primary n = 272
per condition: H1 39, H2 39, H3 40, HA1 38, HA2 39, HA3 41, A 36
age M = 41.2, SD = 13.8, range 18-78; women 50%; country US 239, CA 27, GB 5, IE 1
duration median 15.3 min (IQR 12.7-19.7); mobile 23
BEL1 M = 5.20, SD = 1.52; >=5: 76%; <=3: 17%
alpha OH1-3 pooled rows = 0.79; PE = 0.96; HM = 0.97
alpha NARS(10) = 0.86; GAAIS pos = 0.92; GAAIS neg = 0.85; SCM comp = 0.85; SCM warm = 0.92

## Models
OH: ICC 0.66; omnibus condition LRT p = .326; clip p < .001; position p = .645
AU1: ICC 0.69; omnibus condition LRT p = .004; clip p < .001; position p < .001
CR1: ICC 0.70; omnibus condition LRT p = .075; clip p < .001; position p < .001
CR2: ICC 0.56; omnibus condition LRT p = .572; clip p = .074; position p = .652
OH1: ICC 0.49; omnibus condition LRT p = .738; clip p < .001; position p = .691
OH2: ICC 0.40; omnibus condition LRT p = .322; clip p < .001; position p = .276
OH3: ICC 0.78; omnibus condition LRT p = .316; clip p < .001; position p = .956
CR3: ICC 0.65; omnibus condition LRT p = .041; clip p = .181; position p < .001

## Pairwise
primary-DV pairs 84, raw sig 10, all involve A: True; Holm survivors: [{'dv': 'AU1', 'A': 'H1', 'B': 'A', 'p_holm': 0.0371111860471449}, {'dv': 'AU1', 'A': 'H3', 'B': 'A', 'p_holm': 0.0060592328323343}, {'dv': 'AU1', 'A': 'HA1', 'B': 'A', 'p_holm': 0.0083397895212063}]
all 11 DVs: 225 pairs, raw sig 21

## Control-source pairs
OH H vs HA: Δ -0.08 [-0.32, +0.17], d -0.08, p .539, Holm .539
OH H vs A: Δ +0.36 [+0.00, +0.71], d +0.35, p .048, Holm .097
OH HA vs A: Δ +0.43 [+0.08, +0.79], d +0.46, p .017, Holm .050
AU1 H vs HA: Δ +0.15 [-0.18, +0.48], d +0.12, p .377, Holm .377
AU1 H vs A: Δ +0.89 [+0.40, +1.38], d +0.64, p <.001, Holm .001
AU1 HA vs A: Δ +0.74 [+0.25, +1.22], d +0.53, p .003, Holm .006
CR1 H vs HA: Δ +0.01 [-0.23, +0.26], d +0.02, p .912, Holm .912
CR1 H vs A: Δ +0.51 [+0.15, +0.87], d +0.46, p .006, Holm .017
CR1 HA vs A: Δ +0.50 [+0.13, +0.86], d +0.51, p .007, Holm .017
CR2 H vs HA: Δ -0.14 [-0.35, +0.08], d -0.17, p .209, Holm .419
CR2 H vs A: Δ +0.16 [-0.16, +0.47], d +0.17, p .330, Holm .419
CR2 HA vs A: Δ +0.29 [-0.02, +0.60], d +0.38, p .067, Holm .201

## Levene
OH: SD H 0.94, HA 0.86, A 1.22, p .014
AU1: SD H 1.19, HA 1.22, A 1.88, p .002
CR1: SD H 0.97, HA 0.75, A 1.47, p <.001
CR2: SD H 0.90, HA 0.67, A 1.06, p .002

## Interactions (LRT)
OH | clip x control source (2x2 df=4): p .387
OH | clip x human-vs-AI (df=2): p .132
OH | position x condition (df=12): p .066
OH | control source x profile, within H/HA (df=2): p .724
OH | clip x profile, within H/HA (df=4): p .384
OH | profile main effect, within H/HA (df=2): p .726
AU1 | clip x control source (2x2 df=4): p .702
AU1 | clip x human-vs-AI (df=2): p .658
AU1 | position x condition (df=12): p .320
AU1 | control source x profile, within H/HA (df=2): p .180
AU1 | clip x profile, within H/HA (df=4): p .851
AU1 | profile main effect, within H/HA (df=2): p .124
CR1 | clip x control source (2x2 df=4): p .415
CR1 | clip x human-vs-AI (df=2): p .674
CR1 | position x condition (df=12): p .562
CR1 | control source x profile, within H/HA (df=2): p .773
CR1 | clip x profile, within H/HA (df=4): p .112
CR1 | profile main effect, within H/HA (df=2): p .191
CR2 | clip x control source (2x2 df=4): p .183
CR2 | clip x human-vs-AI (df=2): p .051
CR2 | position x condition (df=12): p .012
CR2 | control source x profile, within H/HA (df=2): p .984
CR2 | clip x profile, within H/HA (df=4): p .153
CR2 | profile main effect, within H/HA (df=2): p .601

## CR3
H vs HA Δ +0.40 [+0.14, +0.66], d 0.40, p .002; means 6.14 vs 5.73

## BEL1 / PE / HM by condition (ANOVA p)
PE: omnibus p .610; ctrl(H/HA) .197; profile .569; interaction .549
HM: omnibus p .395; ctrl(H/HA) .757; profile .173; interaction .413
BEL1: omnibus p .451; ctrl(H/HA) .773; profile .348; interaction .313

## Blame vs credit
HA: CTRL #1 for responsibility minus credit (participant-level share, Wilcoxon): Δ +4.8 pts, p .024
H: CTRL #1 for responsibility minus credit (participant-level share, Wilcoxon): Δ +1.1 pts, p .536
A: AI #1 for responsibility minus credit (participant-level share, Wilcoxon): Δ -2.8 pts, p .433
HA: AI #1 for responsibility minus credit (participant-level share, Wilcoxon): Δ -1.7 pts, p .491

## E1 moderation (GAAIS pos)
OH: slope A 0.50, human 0.28, interaction -0.22, p .019; Δ at −1SD +0.44 (p .014), mean +0.12 (p .430), +1SD -0.20 (p .393)
AU1: slope A 0.48, human 0.23, interaction -0.25, p .083; Δ at −1SD +0.91 (p <.001), mean +0.55 (p .018), +1SD +0.20 (p .576)
CR1: slope A 0.28, human 0.10, interaction -0.18, p .093; Δ at −1SD +0.62 (p .003), mean +0.35 (p .045), +1SD +0.09 (p .728)
CR2: slope A 0.38, human 0.10, interaction -0.27, p .003; Δ at −1SD +0.42 (p .015), mean +0.03 (p .861), +1SD -0.36 (p .101)

## E3 OH items bootstrap
OH1: Δ +0.25 [-0.09, +0.58], p .145
OH2: Δ +0.38 [+0.03, +0.76], p .036
OH3: Δ +0.56 [-0.06, +1.18], p .085
OH: Δ +0.40 [-0.02, +0.83], p .060

## E6 CR2 REL
REL: human 5.83 vs AI 5.39, OR 1.78 [0.88, 3.58], p .108
ADV: human 5.92 vs AI 5.75, OR 1.16 [0.59, 2.30], p .665
COL: human 5.83 vs AI 5.78, OR 1.17 [0.59, 2.30], p .657

exploratory tests: 113, p<.05: 37