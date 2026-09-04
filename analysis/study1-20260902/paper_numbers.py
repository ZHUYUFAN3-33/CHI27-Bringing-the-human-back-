"""Numbers sheet + Markdown tables for the manuscript drafts (trial storyline). Reads results/*.csv; computes nothing new except sample descriptives."""
import pandas as pd, numpy as np, os
HERE = os.path.dirname(os.path.abspath(__file__)); RES = os.path.join(HERE, "results"); PAP = os.path.join(HERE, "paper")
r = lambda f: pd.read_csv(os.path.join(RES, f))
W = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); L = pd.read_csv(os.path.join(HERE, "long_segments.csv"))
W["usable"] = (W.at1_pass == 1) & (W.av1_pass == 1); w = W[W.usable]; pids = set(w.participant_id); Lu = L[L.pid.isin(pids)]
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]
def p(x): return "< .001" if x < .001 else f"= {x:.3f}".replace("= 0.", "= .")
def pf(x): return "<.001" if x < .001 else f"{x:.3f}".lstrip("0")
out = []
say = lambda s: out.append(s)
say("# Numbers sheet (primary sample unless stated)\n")
say(f"completes 300; AT1 fail {int((W.at1_pass==0).sum())}; AV1 fail {int((W.av1_pass==0).sum())}; both fail {int(((W.at1_pass==0)&(W.av1_pass==0)).sum())}; primary n = {len(w)}")
say("per condition: " + ", ".join(f"{c} {int((w.condition==c).sum())}" for c in COND))
say(f"age M = {w.BG_age.mean():.1f}, SD = {w.BG_age.std():.1f}, range {int(w.BG_age.min())}-{int(w.BG_age.max())}; women {100*(w.BG_gender==1).mean():.0f}%; country US {int((w.BG_country=='US').sum())}, CA {int((w.BG_country=='CA').sum())}, GB {int((w.BG_country=='GB').sum())}, IE {int((w.BG_country=='IE').sum())}")
say(f"duration median {w.dur_min.median():.1f} min (IQR {w.dur_min.quantile(.25):.1f}-{w.dur_min.quantile(.75):.1f}); mobile {int(w.mobile.sum())}")
say(f"BEL1 M = {w.BEL1.mean():.2f}, SD = {w.BEL1.std():.2f}; >=5: {100*(w.BEL1>=5).mean():.0f}%; <=3: {100*(w.BEL1<=3).mean():.0f}%")
# reliability on primary sample
def alpha(df):
    df = df.dropna(); k = df.shape[1]; return (k/(k-1))*(1 - df.var(ddof=1).sum()/df.sum(axis=1).var(ddof=1))
say(f"alpha OH1-3 pooled rows = {alpha(Lu[['OH1','OH2','OH3']]):.2f}; PE = {alpha(w[['PE1','PE2','PE3','PE4']]):.2f}; HM = {alpha(w[['HM1','HM2','HM3']]):.2f}")
rev = lambda s: 8 - s
N = w[["NARS_01","NARS_02","NARS_03","NARS_04","NARS_05","NARS_06","NARS_07","NARS_08","NARS_10","NARS_11"]].copy()
for c in ["NARS_03","NARS_05","NARS_06"]: N[c] = rev(N[c])
GP = ["GAAIS_07","GAAIS_11","GAAIS_12","GAAIS_17","GAAIS_18"]; GN = ["GAAIS_08","GAAIS_10","GAAIS_15","GAAIS_19"]; G = w[GP+GN].copy()
for c in GN: G[c] = rev(G[c])
say(f"alpha NARS(10) = {alpha(N):.2f}; GAAIS pos = {alpha(G[GP]):.2f}; GAAIS neg = {alpha(G[GN]):.2f}; SCM comp = {alpha(w[['SCM_01','SCM_02','SCM_03','SCM_04','SCM_05']]):.2f}; SCM warm = {alpha(w[['SCM_06','SCM_07','SCM_08','SCM_09']]):.2f}")
# Table 1 descriptives
P = Lu.groupby(["pid","condition","ctrl"], as_index=False)[["OH","OH1","OH2","OH3","AU1","CR1","CR2","CR3"]].mean().merge(w[["participant_id","PE","HM","BEL1"]], left_on="pid", right_on="participant_id")
DV = [("OH","OriHime evaluation (OH1–3)"),("OH1","  trustworthy"),("OH2","  useful"),("OH3","  willing to take part"),("AU1","Felt genuine"),("CR1","Controller warm"),("CR2","Controller competent"),("CR3","Operator in control"),("PE","Performance expectancy"),("HM","Hedonic motivation"),("BEL1","Believed the description")]
t1 = ["| Measure | " + " | ".join(f"{c} (n={int((P.condition==c).sum())})" for c in COND) + " |", "|---|" + "---|"*7]
for dv, lab in DV:
    cells = []
    for c in COND:
        x = P[P.condition == c][dv].dropna(); cells.append("–" if len(x) == 0 else f"{x.mean():.2f} ({x.std(ddof=1):.2f})")
    t1.append(f"| {lab} | " + " | ".join(cells) + " |")
T1 = "\n".join(t1)
# Table 2 contrasts
CON = r("contrasts.csv"); CTRL = r("pairwise_ctrl.csv"); MOD = r("models_primary.csv"); ROB = r("robustness.csv"); BOOT = r("bootstrap_contrasts.csv"); LEV = r("variance_check.csv"); E5 = r("e5_tost.csv"); RK = r("ranks_tests.csv"); PL = r("e7c_plackett_luce.csv"); E1 = r("e1_moderation.csv"); E3 = r("e3_oh_items.csv"); PAIRS = r("pairwise_all.csv"); INT = r("interactions.csv"); E6A = r("e6a_cr2_rel.csv")
DVN = {"OH":"OriHime evaluation","AU1":"Felt genuine","CR1":"Controller warm","CR2":"Controller competent","CR3":"Operator in control","OH1":"Trustworthy","OH2":"Useful","OH3":"Willing","PE":"Performance expectancy","HM":"Hedonic motivation","BEL1":"Believed description"}
CN = {"C1 human-involved vs AI-only":"C1 human-involved − AI-only","C2 H vs HA":"C2 human − human+AI","C3 disability disclosed vs no mention":"C3 disability disclosed − no mention","C4 intellectual vs mobility":"C4 intellectual − mobility"}
t2 = ["| Outcome | Contrast | Δ (95% CI) | d (95% CI) | p | p Holm (4 DVs) |", "|---|---|---|---|---|---|"]
for dv in ["OH","AU1","CR1","CR2","CR3"]:
    for cn in CN:
        s = CON[(CON.dv == dv) & (CON.contrast == cn)]
        if s.empty: continue
        s = s.iloc[0]; hol = "" if pd.isna(s.p_holm_4dv) else pf(s.p_holm_4dv)
        t2.append(f"| {DVN[dv]} | {CN[cn]} | {s['diff']:+.2f} [{s.ci_lo:+.2f}, {s.ci_hi:+.2f}] | {s.d:+.2f} [{s.d_lo:+.2f}, {s.d_hi:+.2f}] | {pf(s.p_raw)} | {hol} |")
T2 = "\n".join(t2)
# Table 3 robustness of C1
SPEC = [("sample: primary (AT1+AV1, n=272)","LMM (primary)"),("sample: all completes (n=300)","LMM, all 300"),("sample: primary minus 3x straightliners","LMM, no straightliners"),("adjusted for GAAIS_pos, NARS, SCM_warm, age","LMM + covariates"),("participant means: Welch t","Welch t"),("participant means: Mann-Whitney","Mann–Whitney"),("participant cluster bootstrap (4000), equal-weight cell means","Cluster bootstrap"),("ordinal GEE","Ordinal GEE (OR)")]
ALLR = pd.concat([ROB, BOOT], ignore_index=True)
t3 = ["| Outcome | " + " | ".join(l for _, l in SPEC) + " |", "|---|" + "---|"*len(SPEC)]
for dv in ["OH","AU1","CR1","CR2"]:
    cells = []
    for key, lab in SPEC:
        s = ALLR[(ALLR.dv == dv) & (ALLR.contrast == "C1 human-involved vs AI-only") & (ALLR.spec.str.startswith(key))]
        if s.empty: cells.append("–")
        else:
            x = s.iloc[0]; cells.append((f"OR {x['diff']:.2f}, p {pf(x.p_raw)}") if key.startswith("ordinal") else f"{x['diff']:+.2f}, p {pf(x.p_raw)}")
    t3.append(f"| {DVN[dv]} | " + " | ".join(cells) + " |")
T3 = "\n".join(t3)
# Table 4 equivalence
t4 = ["| Outcome | Contrast | d (90% CI) | TOST p (±0.35 SD) | TOST p (±0.50 SD) |", "|---|---|---|---|---|"]
CN2 = {"C2 H vs HA":"human vs human+AI","C3 disclosed vs none":"disability disclosed vs no mention","C4 intellectual vs mobility":"intellectual vs mobility"}
for dv in ["OH","AU1","CR1","CR2","PE","HM"]:
    for cn in CN2:
        s = E5[(E5.dv == dv) & (E5.contrast == cn)].iloc[0]
        t4.append(f"| {DVN[dv]} | {CN2[cn]} | {s.d:+.2f} [{s.d90_lo:+.2f}, {s.d90_hi:+.2f}] | {pf(s.p_tost_035)} | {pf(s.p_tost_050)} |")
T4 = "\n".join(t4)
# Table 5 attribution
t5 = ["| Question | Comparison | Share ranked #1 | OR (95% CI) | p |", "|---|---|---|---|---|"]
for s in RK[RK.question.isin(["responsibility","credit"])].itertuples():
    t5.append(f"| {s.question} | {s.test.split(' (')[0]} | {100*s.share_H:.0f}% → {100*s.share_HA:.0f}% | {s.estimate:.2f} [{s.ci_lo:.2f}, {s.ci_hi:.2f}] | {pf(s.p_raw)} |")
T5 = "\n".join(t5)
t6 = ["| Question | Control source | Operator | AI | OriHime/provider | Person in video |", "|---|---|---|---|---|---|"]
for q in ["responsibility","credit"]:
    for k in ["H","HA","A"]:
        s = PL[(PL.question == q) & (PL.ctrl == k)]; cells = []
        for a in ["CTRL","AI","ORG","USER"]:
            x = s[s.actor == a]; cells.append("–" if x.empty else f"{x.iloc[0].worth:.2f} [{x.iloc[0].ci_lo:.2f}, {x.iloc[0].ci_hi:.2f}]")
        t6.append(f"| {q} | {k} | " + " | ".join(cells) + " |")
T6 = "\n".join(t6)
# key sentences
say("\n## Models"); 
for s in MOD.itertuples(): say(f"{s.dv}: ICC {s.icc:.2f}; omnibus condition LRT p {p(s.p_condition_omnibus)}; clip p {p(s.p_clip)}; position p {p(s.p_position)}")
say("\n## Pairwise"); prim = PAIRS[PAIRS.dv.isin(["OH","AU1","CR1","CR2"])]
say(f"primary-DV pairs {len(prim)}, raw sig {int((prim.p_raw<.05).sum())}, all involve A: {bool(prim[prim.p_raw<.05].apply(lambda x: 'A' in [x.A, x.B], axis=1).all())}; Holm survivors: {prim[prim.p_holm<.05][['dv','A','B','p_holm']].to_dict('records')}")
say(f"all 11 DVs: {len(PAIRS)} pairs, raw sig {int((PAIRS.p_raw<.05).sum())}")
say("\n## Control-source pairs")
for s in CTRL[CTRL.dv.isin(["OH","AU1","CR1","CR2"])].itertuples(): say(f"{s.dv} {s.A} vs {s.B}: Δ {s['diff'] if False else s.diff:+.2f} [{s.ci_lo:+.2f}, {s.ci_hi:+.2f}], d {s.d:+.2f}, p {pf(s.p_raw)}, Holm {pf(s.p_holm)}")
say("\n## Levene"); 
for s in LEV.itertuples(): say(f"{s.dv}: SD H {s.sd_H:.2f}, HA {s.sd_HA:.2f}, A {s.sd_A:.2f}, p {pf(s.levene_p)}")
say("\n## Interactions (LRT)")
for s in INT[INT.dv.isin(["OH","AU1","CR1","CR2"])].itertuples(): say(f"{s.dv} | {s.interaction}: p {pf(s.p)}")
say("\n## CR3"); s = CON[(CON.dv=="CR3")&(CON.contrast=="C2 H vs HA")].iloc[0]; say(f"H vs HA Δ {s['diff']:+.2f} [{s.ci_lo:+.2f}, {s.ci_hi:+.2f}], d {s.d:.2f}, p {pf(s.p_raw)}; means {s.mean_A:.2f} vs {s.mean_B:.2f}")
say("\n## BEL1 / PE / HM by condition (ANOVA p)"); PLV = r("participant_level_anova.csv")
for s in PLV.itertuples(): say(f"{s.dv}: omnibus p {pf(s.p_condition_omnibus)}; ctrl(H/HA) {pf(s.p_ctrl_HHA)}; profile {pf(s.p_profile)}; interaction {pf(s.p_ctrl_x_profile)}")
say("\n## Blame vs credit"); 
for s in RK[RK.question=="blame vs credit"].itertuples(): say(f"{s.test}: Δ {100*s.estimate:+.1f} pts, p {pf(s.p_raw)}")
say("\n## E1 moderation (GAAIS pos)")
for s in E1[E1.moderator=="GAAIS positive"].itertuples(): say(f"{s.dv}: slope A {s.slope_AI:.2f}, human {s.slope_human:.2f}, interaction {s.interaction:+.2f}, p {pf(s.p_interaction)}; Δ at −1SD {s.diff_at_minus1SD:+.2f} (p {pf(s.p_minus1SD)}), mean {s.diff_at_mean:+.2f} (p {pf(s.p_mean)}), +1SD {s.diff_at_plus1SD:+.2f} (p {pf(s.p_plus1SD)})")
say("\n## E3 OH items bootstrap"); 
for _, s in E3.iterrows(): say(f"{s.dv}: Δ {s['diff']:+.2f} [{s.ci_lo:+.2f}, {s.ci_hi:+.2f}], p {pf(s.p_boot)}")
say("\n## E6 CR2 REL"); 
for s in E6A.itertuples(): say(f"{s.clip}: human {s.mean_human:.2f} vs AI {s.mean_AI:.2f}, OR {s.OR_human:.2f} [{s.or_lo:.2f}, {s.or_hi:.2f}], p {pf(s.p_ordinal)}")
TL = r("phase14_test_log.csv"); say(f"\nexploratory tests: {len(TL)}, p<.05: {int((TL.p<.05).sum())}")
open(os.path.join(PAP, "numbers_sheet.md"), "w", encoding="utf-8").write("\n".join(out))
tables = "# Tables (trial storyline draft)\n\n**Table 1.** Means (SD) of participant-level scores by condition, primary sample (each participant's mean over the three clips for clip-level measures). H = human operator, HA = human operator with AI assistance, A = AI only; 1–3 = operator profile (no mention / intellectual disability / mobility disability).\n\n" + T1 + \
 "\n\n**Table 2.** Pre-specified contrasts from the linear mixed models (clip-level outcomes; equal-weight cell means; Δ in scale points; d standardised on the pooled SD of participant-level means; Holm across the four primary outcomes within each contrast).\n\n" + T2 + \
 "\n\n**Table 3.** Robustness of contrast C1 (human-involved − AI-only) across analytic specifications.\n\n" + T3 + \
 "\n\n**Table 4.** Equivalence tests (TOST, Welch) for the null contrasts; participant-level means; bounds ±0.35 and ±0.50 SD.\n\n" + T4 + \
 "\n\n**Table 5.** Attribution: share of participant × clip rankings placing the actor first, and GEE logistic odds ratios (participant clusters, clip as covariate).\n\n" + T5 + \
 "\n\n**Table 6.** Plackett–Luce worths (sum to 1 within condition) with participant-bootstrap 95% intervals.\n\n" + T6 + "\n"
open(os.path.join(PAP, "tables.md"), "w", encoding="utf-8").write(tables)
print("\n".join(out)); print("\nwrote numbers_sheet.md and tables.md")
