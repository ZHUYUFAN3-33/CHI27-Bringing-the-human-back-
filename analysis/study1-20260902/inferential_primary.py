"""Round 1 inferential analysis for Study 1.

Decisions fixed BEFORE any p-value was computed (2026-09-04, with the user):
  primary sample  = completed AND attention check (AT1 == 2) AND comprehension check (AV1 correct)  -> n = 272
  primary DVs     = OH composite, AU1, CR1, CR2 (clip level); CR3 within H/HA only
  secondary DVs   = OH1, OH2, OH3 (components), PE, HM (participant level), BEL1 (credibility check)
  primary model   = linear mixed model  DV ~ condition + clip + position + (1 | participant), REML
  primary contrasts = C1 human-involved (6 cells) vs A; C2 H vs HA; C3 disability disclosed (H2,H3,HA2,HA3) vs no mention (H1,HA1); C4 intellectual vs mobility
  first look      = ALL 21 pairwise condition differences per DV with raw p; corrections (Holm, BH) reported alongside, never instead.
Everything else in this file is labelled exploratory / robustness in the output.
"""
import pandas as pd, numpy as np, os, json, warnings, itertools
from scipy import stats
import statsmodels.api as sm, statsmodels.formula.api as smf
from statsmodels.stats.multitest import multipletests
from statsmodels.genmod.generalized_estimating_equations import GEE, OrdinalGEE
from statsmodels.genmod.cov_struct import Exchangeable, GlobalOddsRatio
warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "results"); os.makedirs(OUT, exist_ok=True)
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 60); pd.set_option("display.max_rows", 500)
W = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); LL = pd.read_csv(os.path.join(HERE, "long_segments.csv")); RK = pd.read_csv(os.path.join(HERE, "ranks_long.csv"))
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]
W["usable"] = (W.at1_pass == 1) & (W.av1_pass == 1)
SAMPLES = {"primary (AT1+AV1, n=272)": set(W[W.usable].participant_id), "all completes (n=300)": set(W.participant_id),
           "primary minus 3x straightliners": set(W[W.usable & (W.straightline_segments < 3)].participant_id)}
PRIMARY = SAMPLES["primary (AT1+AV1, n=272)"]
def frame(pids):
    L = LL[LL.pid.isin(pids)].copy(); L["pos"] = L.pos.astype(int); L["profile"] = L.profile.fillna(0).astype(int)
    L["human"] = (L.ctrl != "A").astype(int); L["disab"] = L.profile.isin([2,3]).astype(int)
    w = W[W.participant_id.isin(pids)].copy()
    return L, w
L, w = frame(PRIMARY)
print("primary sample:", w.shape[0], "participants,", L.shape[0], "clip rows; by condition:", w.condition.value_counts().reindex(COND).to_dict())

# ---------------------------------------------------------------- helpers
def fit_lmm(df, dv, rhs="C(condition, Treatment('H1')) + C(segment, Treatment('REL')) + C(pos, Treatment(1))", reml=True):
    d = df.dropna(subset=[dv])
    return smf.mixedlm(f"{dv} ~ {rhs}", d, groups=d["pid"]).fit(reml=reml, method=["lbfgs"])
def cond_coef_name(c): return f"C(condition, Treatment('H1'))[T.{c}]"
def cell_vector(res, cells, weights=None):
    """Vector v such that v @ params = weighted mean of the cell means (at reference clip/position)."""
    idx = res.fe_params.index if hasattr(res, "fe_params") else res.params.index
    v = pd.Series(0.0, index=idx); weights = weights or [1/len(cells)]*len(cells)
    v["Intercept"] += sum(weights)
    for c, wt in zip(cells, weights):
        if c != "H1": v[cond_coef_name(c)] += wt
    return v
def contrast(res, cells_a, cells_b, sd_ref=None):
    v = cell_vector(res, cells_a) - cell_vector(res, cells_b)
    t = res.t_test(v.values.reshape(1, -1))
    est, se, z, p = float(t.effect), float(t.sd), float(t.tvalue), float(t.pvalue); lo, hi = est-1.96*se, est+1.96*se
    d = est/sd_ref if sd_ref else np.nan
    return dict(est=est, se=se, z=z, p=p, lo=lo, hi=hi, d=d)
def participant_means(df, dv): return df.groupby(["pid","condition","ctrl","profile"], as_index=False)[dv].mean()
def pooled_sd(pm, dv, groups_a, groups_b):
    a = pm[pm.condition.isin(groups_a)][dv].dropna(); b = pm[pm.condition.isin(groups_b)][dv].dropna()
    return np.sqrt(((len(a)-1)*a.var(ddof=1) + (len(b)-1)*b.var(ddof=1))/(len(a)+len(b)-2)), len(a), len(b)
def d_ci(d, n1, n2):
    se = np.sqrt((n1+n2)/(n1*n2) + d*d/(2*(n1+n2))); return d-1.96*se, d+1.96*se
def stars(p): return "***" if p < .001 else "**" if p < .01 else "*" if p < .05 else ("†" if p < .10 else "")

PRIMARY_DVS = ["OH","AU1","CR1","CR2"]; SECONDARY_DVS = ["OH1","OH2","OH3"]
CLIP_DVS = PRIMARY_DVS + SECONDARY_DVS

# ---------------------------------------------------------------- 1. primary models + assumption summary
models, model_rows = {}, []
for dv in CLIP_DVS + ["CR3"]:
    df = L if dv != "CR3" else L[L.ctrl != "A"]
    res = fit_lmm(df, dv); models[dv] = res
    vg = float(res.cov_re.iloc[0,0]); ve = float(res.scale); icc = vg/(vg+ve)
    resid = res.resid; sk = stats.skew(resid); ku = stats.kurtosis(resid)
    # LRTs (ML fits) for the whole condition factor, clip, position
    base = fit_lmm(df, dv, reml=False)
    no_cond = fit_lmm(df, dv, rhs="C(segment, Treatment('REL')) + C(pos, Treatment(1))", reml=False)
    no_clip = fit_lmm(df, dv, rhs="C(condition, Treatment('H1')) + C(pos, Treatment(1))", reml=False)
    no_pos  = fit_lmm(df, dv, rhs="C(condition, Treatment('H1')) + C(segment, Treatment('REL'))", reml=False)
    lrt = lambda full, red, k: 1 - stats.chi2.cdf(2*(full.llf - red.llf), k)
    kcond = 6 if dv != "CR3" else 5
    model_rows.append(dict(dv=dv, n_rows=int(res.nobs), n_participants=int(df.dropna(subset=[dv]).pid.nunique()), var_participant=vg, var_residual=ve, icc=icc,
                           resid_skew=sk, resid_kurtosis=ku, p_condition_omnibus=lrt(base, no_cond, kcond), p_clip=lrt(base, no_clip, 2), p_position=lrt(base, no_pos, 2)))
MODELS = pd.DataFrame(model_rows); MODELS.to_csv(os.path.join(OUT, "models_primary.csv"), index=False)
print("\n=== PRIMARY LMMs: variance components, ICC, omnibus LRTs ==="); print(MODELS.round(3).to_string(index=False))
# full fixed-effect table for OH (teaching example)
oh = models["OH"]; fe = pd.DataFrame({"estimate": oh.params, "se": oh.bse, "z": oh.tvalues, "p": oh.pvalues, "ci_lo": oh.conf_int()[0], "ci_hi": oh.conf_int()[1]})
fe.to_csv(os.path.join(OUT, "fixed_effects_OH.csv")); print("\n--- fixed effects, OH composite ---"); print(fe.round(3).to_string())

# ---------------------------------------------------------------- 2. ALL pairwise condition comparisons (raw p first)
pair_rows = []
for dv in CLIP_DVS + ["CR3"]:
    res = models[dv]; df = L if dv != "CR3" else L[L.ctrl != "A"]; pm = participant_means(df, dv)
    cells = COND if dv != "CR3" else [c for c in COND if c != "A"]
    for a, b in itertools.combinations(cells, 2):
        sd, n1, n2 = pooled_sd(pm, dv, [a], [b]); c = contrast(res, [a], [b], sd_ref=sd)
        dlo, dhi = d_ci(c["d"], n1, n2)
        pair_rows.append(dict(dv=dv, family="clip-level", A=a, B=b, mean_A=pm[pm.condition==a][dv].mean(), mean_B=pm[pm.condition==b][dv].mean(), n_A=n1, n_B=n2,
                              diff=c["est"], se=c["se"], ci_lo=c["lo"], ci_hi=c["hi"], z=c["z"], p_raw=c["p"], d=c["d"], d_lo=dlo, d_hi=dhi,
                              direction=(f"{a} > {b}" if c["est"] > 0 else f"{b} > {a}") if c["p"] < .05 else "—"))
# participant-level DVs: OLS with the same contrasts
def fit_ols(dv, df): return smf.ols(f"{dv} ~ C(condition, Treatment('H1'))", df.dropna(subset=[dv])).fit()
ols_models = {dv: fit_ols(dv, w) for dv in ["PE","HM","BEL1"]}
for dv, res in ols_models.items():
    for a, b in itertools.combinations(COND, 2):
        pm = w[["participant_id","condition",dv]].rename(columns={"participant_id":"pid"})
        sd, n1, n2 = pooled_sd(pm, dv, [a], [b]); c = contrast(res, [a], [b], sd_ref=sd); dlo, dhi = d_ci(c["d"], n1, n2)
        pair_rows.append(dict(dv=dv, family="participant-level", A=a, B=b, mean_A=pm[pm.condition==a][dv].mean(), mean_B=pm[pm.condition==b][dv].mean(), n_A=n1, n_B=n2,
                              diff=c["est"], se=c["se"], ci_lo=c["lo"], ci_hi=c["hi"], z=c["z"], p_raw=c["p"], d=c["d"], d_lo=dlo, d_hi=dhi,
                              direction=(f"{a} > {b}" if c["est"] > 0 else f"{b} > {a}") if c["p"] < .05 else "—"))
PAIRS = pd.DataFrame(pair_rows)
# corrections within each DV's 21-pair family (Holm and Benjamini-Hochberg)
PAIRS["p_holm"] = np.nan; PAIRS["p_bh"] = np.nan
for dv, idx in PAIRS.groupby("dv").groups.items():
    PAIRS.loc[idx, "p_holm"] = multipletests(PAIRS.loc[idx, "p_raw"], method="holm")[1]
    PAIRS.loc[idx, "p_bh"] = multipletests(PAIRS.loc[idx, "p_raw"], method="fdr_bh")[1]
PAIRS.to_csv(os.path.join(OUT, "pairwise_all.csv"), index=False)
print("\n=== PAIRWISE MAP: number of comparisons and raw p<.05 per DV ===")
summ = PAIRS.groupby("dv").agg(n_pairs=("p_raw","size"), raw_sig=("p_raw", lambda p: int((p<.05).sum())), holm_sig=("p_holm", lambda p: int((p<.05).sum())), bh_sig=("p_bh", lambda p: int((p<.05).sum())))
print(summ.to_string()); print("total comparisons:", len(PAIRS), "| raw p<.05:", int((PAIRS.p_raw<.05).sum()), "| expected by chance at 5%:", round(0.05*len(PAIRS),1))
print("\n--- all pairs with raw p < .05 ---")
print(PAIRS[PAIRS.p_raw < .05].sort_values(["dv","p_raw"])[["dv","A","B","mean_A","mean_B","diff","ci_lo","ci_hi","d","p_raw","p_holm","p_bh","direction"]].round(3).to_string(index=False))

# ---------------------------------------------------------------- 3. control-source level pairs (H, HA, A)
ctrl_rows = []
for dv in CLIP_DVS:
    res = models[dv]; pm = participant_means(L, dv)
    for (la, ga), (lb, gb) in itertools.combinations([("H",["H1","H2","H3"]),("HA",["HA1","HA2","HA3"]),("A",["A"])], 2):
        sd, n1, n2 = pooled_sd(pm, dv, ga, gb); c = contrast(res, ga, gb, sd_ref=sd); dlo, dhi = d_ci(c["d"], n1, n2)
        ctrl_rows.append(dict(dv=dv, A=la, B=lb, n_A=n1, n_B=n2, mean_A=pm[pm.condition.isin(ga)][dv].mean(), mean_B=pm[pm.condition.isin(gb)][dv].mean(), diff=c["est"], ci_lo=c["lo"], ci_hi=c["hi"], d=c["d"], d_lo=dlo, d_hi=dhi, p_raw=c["p"]))
CTRL = pd.DataFrame(ctrl_rows); CTRL["p_holm"] = np.nan
for dv, idx in CTRL.groupby("dv").groups.items(): CTRL.loc[idx, "p_holm"] = multipletests(CTRL.loc[idx, "p_raw"], method="holm")[1]
CTRL.to_csv(os.path.join(OUT, "pairwise_ctrl.csv"), index=False)
print("\n=== CONTROL-SOURCE PAIRS (3 per DV) ==="); print(CTRL.round(3).to_string(index=False))

# ---------------------------------------------------------------- 4. theory-driven contrasts (pre-specified) + profile contrasts
HUMAN = ["H1","H2","H3","HA1","HA2","HA3"]; DIS = ["H2","H3","HA2","HA3"]; NOM = ["H1","HA1"]; INT = ["H2","HA2"]; MOB = ["H3","HA3"]
CONTRASTS = [("C1 human-involved vs AI-only", HUMAN, ["A"]), ("C2 H vs HA", ["H1","H2","H3"], ["HA1","HA2","HA3"]),
             ("C3 disability disclosed vs no mention", DIS, NOM), ("C4 intellectual vs mobility", INT, MOB),
             ("C5a intellectual vs no mention", INT, NOM), ("C5b mobility vs no mention", MOB, NOM)]
con_rows = []
for dv in CLIP_DVS + ["CR3"] + ["PE","HM","BEL1"]:
    if dv in ["PE","HM","BEL1"]:
        res = ols_models[dv]; pm = w[["participant_id","condition",dv]].rename(columns={"participant_id":"pid"})
    else:
        res = models[dv]; pm = participant_means(L if dv != "CR3" else L[L.ctrl != "A"], dv)
    for name, ga, gb in CONTRASTS:
        if dv == "CR3" and name.startswith("C1"): continue
        sd, n1, n2 = pooled_sd(pm, dv, ga, gb); c = contrast(res, ga, gb, sd_ref=sd); dlo, dhi = d_ci(c["d"], n1, n2)
        con_rows.append(dict(dv=dv, contrast=name, n_A=n1, n_B=n2, mean_A=pm[pm.condition.isin(ga)][dv].mean(), mean_B=pm[pm.condition.isin(gb)][dv].mean(), diff=c["est"], se=c["se"], ci_lo=c["lo"], ci_hi=c["hi"], z=c["z"], p_raw=c["p"], d=c["d"], d_lo=dlo, d_hi=dhi,
                             status="primary" if (dv in PRIMARY_DVS and name[:2] in ["C1","C2","C3"]) else "secondary"))
CON = pd.DataFrame(con_rows)
# Holm within each contrast across the 4 primary DVs (one family per contrast), BH across the 12 primary tests
CON["p_holm_4dv"] = np.nan
for name, idx in CON[CON.dv.isin(PRIMARY_DVS)].groupby("contrast").groups.items(): CON.loc[idx, "p_holm_4dv"] = multipletests(CON.loc[idx, "p_raw"], method="holm")[1]
prim = CON[CON.status == "primary"].index; CON["p_bh_primary12"] = np.nan; CON.loc[prim, "p_bh_primary12"] = multipletests(CON.loc[prim, "p_raw"], method="fdr_bh")[1]
CON.to_csv(os.path.join(OUT, "contrasts.csv"), index=False)
print("\n=== THEORY-DRIVEN CONTRASTS ==="); print(CON.round(3)[["dv","contrast","n_A","n_B","mean_A","mean_B","diff","ci_lo","ci_hi","d","p_raw","p_holm_4dv","p_bh_primary12","status"]].to_string(index=False))

# ---------------------------------------------------------------- 5. interactions (LRT, ML fits)
int_rows = []
LH = L[L.ctrl != "A"].copy()
for dv in CLIP_DVS + ["CR3"]:
    df = L if dv != "CR3" else LH
    if dv != "CR3":
        full = fit_lmm(df, dv, rhs="C(ctrl)*C(segment) + C(pos)", reml=False); red = fit_lmm(df, dv, rhs="C(ctrl) + C(segment) + C(pos)", reml=False)
        int_rows.append(dict(dv=dv, interaction="clip x control source (2x2 df=4)", p=1-stats.chi2.cdf(2*(full.llf-red.llf), 4), chi2=2*(full.llf-red.llf), df=4))
        full = fit_lmm(df, dv, rhs="C(human)*C(segment) + C(pos)", reml=False); red = fit_lmm(df, dv, rhs="C(human) + C(segment) + C(pos)", reml=False)
        int_rows.append(dict(dv=dv, interaction="clip x human-vs-AI (df=2)", p=1-stats.chi2.cdf(2*(full.llf-red.llf), 2), chi2=2*(full.llf-red.llf), df=2))
        full = fit_lmm(df, dv, rhs="C(condition)*C(pos) + C(segment)", reml=False); red = fit_lmm(df, dv, rhs="C(condition) + C(pos) + C(segment)", reml=False)
        int_rows.append(dict(dv=dv, interaction="position x condition (df=12)", p=1-stats.chi2.cdf(2*(full.llf-red.llf), 12), chi2=2*(full.llf-red.llf), df=12))
    full = fit_lmm(LH, dv, rhs="C(ctrl)*C(profile) + C(segment) + C(pos)", reml=False); red = fit_lmm(LH, dv, rhs="C(ctrl) + C(profile) + C(segment) + C(pos)", reml=False)
    int_rows.append(dict(dv=dv, interaction="control source x profile, within H/HA (df=2)", p=1-stats.chi2.cdf(2*(full.llf-red.llf), 2), chi2=2*(full.llf-red.llf), df=2))
    full = fit_lmm(LH, dv, rhs="C(profile)*C(segment) + C(ctrl) + C(pos)", reml=False); red = fit_lmm(LH, dv, rhs="C(profile) + C(segment) + C(ctrl) + C(pos)", reml=False)
    int_rows.append(dict(dv=dv, interaction="clip x profile, within H/HA (df=4)", p=1-stats.chi2.cdf(2*(full.llf-red.llf), 4), chi2=2*(full.llf-red.llf), df=4))
    red2 = fit_lmm(LH, dv, rhs="C(ctrl) + C(segment) + C(pos)", reml=False); red1 = fit_lmm(LH, dv, rhs="C(ctrl) + C(profile) + C(segment) + C(pos)", reml=False)
    int_rows.append(dict(dv=dv, interaction="profile main effect, within H/HA (df=2)", p=1-stats.chi2.cdf(2*(red1.llf-red2.llf), 2), chi2=2*(red1.llf-red2.llf), df=2))
INT = pd.DataFrame(int_rows); INT.to_csv(os.path.join(OUT, "interactions.csv"), index=False)
print("\n=== INTERACTIONS (likelihood-ratio tests) ==="); print(INT.round(3).to_string(index=False))
# simple effects of human vs AI within each clip (for the clip x human interaction pattern)
se_rows = []
for dv in PRIMARY_DVS:
    for s in ["REL","ADV","COL"]:
        sub = L[L.segment == s].dropna(subset=[dv]); a = sub[sub.human==1][dv]; b = sub[sub.human==0][dv]
        t = stats.ttest_ind(a, b, equal_var=False); sd = np.sqrt(((len(a)-1)*a.var()+(len(b)-1)*b.var())/(len(a)+len(b)-2))
        se_rows.append(dict(dv=dv, clip=s, mean_human=a.mean(), mean_AI=b.mean(), diff=a.mean()-b.mean(), d=(a.mean()-b.mean())/sd, p_raw=t.pvalue, n_human=len(a), n_AI=len(b)))
SE = pd.DataFrame(se_rows); SE.to_csv(os.path.join(OUT, "simple_effects_clip.csv"), index=False)
print("\n--- simple effects: human vs AI within each clip (Welch t on rows; exploratory follow-up of the interaction test) ---"); print(SE.round(3).to_string(index=False))

# ---------------------------------------------------------------- 6. participant-level DVs: 2x3 within H/HA and omnibus
pl_rows = []
for dv in ["PE","HM","BEL1"]:
    m7 = ols_models[dv]; a7 = sm.stats.anova_lm(m7, typ=2)
    mh = smf.ols(f"{dv} ~ C(ctrl)*C(profile)", w[w.ctrl != "A"].dropna(subset=[dv])).fit(); ah = sm.stats.anova_lm(mh, typ=2)
    pl_rows.append(dict(dv=dv, p_condition_omnibus=a7.loc["C(condition, Treatment('H1'))","PR(>F)"], p_ctrl_HHA=ah.loc["C(ctrl)","PR(>F)"], p_profile=ah.loc["C(profile)","PR(>F)"], p_ctrl_x_profile=ah.loc["C(ctrl):C(profile)","PR(>F)"]))
PL = pd.DataFrame(pl_rows); PL.to_csv(os.path.join(OUT, "participant_level_anova.csv"), index=False)
print("\n=== PARTICIPANT-LEVEL DVs (OLS/ANOVA) ==="); print(PL.round(3).to_string(index=False))
print("BEL1 by condition (credibility check; should NOT differ):", w.groupby("condition").BEL1.mean().round(2).reindex(COND).to_dict())

# ---------------------------------------------------------------- 7. attribution ranks (RQ4): GEE logistic, cluster = participant
rk_rows = []
RKu = RK[RK.pid.isin(PRIMARY)].copy(); RKu["top1"] = (RKu["rank"] == 1).astype(int)
def gee_binary(df, formula):
    m = GEE.from_formula(formula, groups="pid", data=df, family=sm.families.Binomial(), cov_struct=Exchangeable()).fit()
    return m
for q, ql in [("R1","responsibility"),("R2","credit")]:
    sub = RKu[(RKu.question == q) & (RKu.actor == "CTRL")].copy(); sub["ctrl"] = pd.Categorical(sub.ctrl, ["H","HA"])
    m = gee_binary(sub, "top1 ~ C(ctrl) + C(segment)"); k = [i for i in m.params.index if "ctrl" in i][0]
    orr = np.exp(m.params[k]); lo, hi = np.exp(m.conf_int().loc[k]); rk_rows.append(dict(question=ql, test="human operator ranked #1: HA vs H (odds ratio, GEE logit)", estimate=orr, ci_lo=lo, ci_hi=hi, p_raw=m.pvalues[k], share_H=sub[sub.ctrl=="H"].top1.mean(), share_HA=sub[sub.ctrl=="HA"].top1.mean()))
    sub["disab"] = sub.condition.isin(DIS).astype(int); m = gee_binary(sub, "top1 ~ C(disab) + C(ctrl) + C(segment)"); k = "C(disab)[T.1]"
    orr = np.exp(m.params[k]); lo, hi = np.exp(m.conf_int().loc[k]); rk_rows.append(dict(question=ql, test="human operator ranked #1: disability disclosed vs no mention (OR, GEE logit)", estimate=orr, ci_lo=lo, ci_hi=hi, p_raw=m.pvalues[k], share_H=sub[sub.disab==0].top1.mean(), share_HA=sub[sub.disab==1].top1.mean()))
    subA = RKu[(RKu.question == q) & (RKu.actor == "AI") & (RKu.ctrl.isin(["HA","A"]))].copy(); subA["ctrl"] = pd.Categorical(subA.ctrl, ["HA","A"])
    m = gee_binary(subA, "top1 ~ C(ctrl) + C(segment)"); k = [i for i in m.params.index if "ctrl" in i][0]
    orr = np.exp(m.params[k]); lo, hi = np.exp(m.conf_int().loc[k]); rk_rows.append(dict(question=ql, test="AI ranked #1: A vs HA (OR, GEE logit)", estimate=orr, ci_lo=lo, ci_hi=hi, p_raw=m.pvalues[k], share_H=subA[subA.ctrl=="HA"].top1.mean(), share_HA=subA[subA.ctrl=="A"].top1.mean()))
# blame vs credit asymmetry, participant level (share of clips with actor #1 for R1 minus R2), Wilcoxon signed-rank
for ctrl, actor in [("HA","CTRL"),("H","CTRL"),("A","AI"),("HA","AI")]:
    sub = RKu[(RKu.ctrl == ctrl) & (RKu.actor == actor)]
    pp = sub.pivot_table(index="pid", columns="question", values="top1", aggfunc="mean")
    diff = pp["R1"] - pp["R2"]; nz = diff[diff != 0]
    p = stats.wilcoxon(nz).pvalue if len(nz) > 0 else np.nan
    rk_rows.append(dict(question="blame vs credit", test=f"{ctrl}: {actor} #1 for responsibility minus credit (participant-level share, Wilcoxon)", estimate=diff.mean(), ci_lo=np.nan, ci_hi=np.nan, p_raw=p, share_H=pp["R1"].mean(), share_HA=pp["R2"].mean()))
RKT = pd.DataFrame(rk_rows); RKT.to_csv(os.path.join(OUT, "ranks_tests.csv"), index=False)
print("\n=== ATTRIBUTION RANKS (RQ4) ==="); print(RKT.round(3).to_string(index=False))

# ---------------------------------------------------------------- 8. robustness of the primary contrasts
rob_rows = []
def key_contrasts(df, dv, res, pm, label):
    for name, ga, gb in CONTRASTS[:4]:
        sd, n1, n2 = pooled_sd(pm, dv, ga, gb); c = contrast(res, ga, gb, sd_ref=sd)
        rob_rows.append(dict(dv=dv, contrast=name, spec=label, diff=c["est"], ci_lo=c["lo"], ci_hi=c["hi"], d=c["d"], p_raw=c["p"], n=int(pm.pid.nunique())))
for dv in PRIMARY_DVS:
    # (a) sample definitions
    for lab, pids in SAMPLES.items():
        Ls, ws = frame(pids); res = fit_lmm(Ls, dv); key_contrasts(Ls, dv, res, participant_means(Ls, dv), f"sample: {lab}")
    # (b) covariate adjustment (pre-treatment covariates, centred); one participant lacks age -> dropped here
    Lc = L.dropna(subset=["BG_age"]).copy()
    for v in ["GAAIS_pos","NARS","SCM_warm","BG_age"]: Lc[v+"_c"] = Lc[v] - Lc[v].mean()
    res = fit_lmm(Lc, dv, rhs="C(condition, Treatment('H1')) + C(segment, Treatment('REL')) + C(pos, Treatment(1)) + GAAIS_pos_c + NARS_c + SCM_warm_c + BG_age_c")
    key_contrasts(Lc, dv, res, participant_means(Lc, dv), "adjusted for GAAIS_pos, NARS, SCM_warm, age")
    # (c) participant-means Welch t-test / Mann-Whitney (no model)
    pm = participant_means(L, dv)
    for name, ga, gb in CONTRASTS[:4]:
        a = pm[pm.condition.isin(ga)][dv]; b = pm[pm.condition.isin(gb)][dv]
        rob_rows.append(dict(dv=dv, contrast=name, spec="participant means: Welch t", diff=a.mean()-b.mean(), ci_lo=np.nan, ci_hi=np.nan, d=np.nan, p_raw=stats.ttest_ind(a, b, equal_var=False).pvalue, n=len(pm)))
        rob_rows.append(dict(dv=dv, contrast=name, spec="participant means: Mann-Whitney", diff=a.median()-b.median(), ci_lo=np.nan, ci_hi=np.nan, d=np.nan, p_raw=stats.mannwhitneyu(a, b).pvalue, n=len(pm)))
# (d) ordinal GEE on the single items (population-averaged proportional-odds model, participant clusters)
from statsmodels.genmod.cov_struct import Independence
def ordinal_gee(df, dv, xcols):
    d = df.dropna(subset=[dv]).copy(); endog = d[dv].astype(int)
    X = pd.DataFrame({c: d[c] for c in xcols}, index=d.index)
    try:
        m = OrdinalGEE(endog, X, groups=d["pid"], cov_struct=GlobalOddsRatio("ordinal")).fit()
        if not np.all(np.isfinite(m.bse)): raise ValueError("non-finite SE")
        m._spec = "global odds ratio"
    except Exception:
        m = OrdinalGEE(endog, X, groups=d["pid"], cov_struct=Independence()).fit()
        m._spec = "independence working correlation, cluster-robust SE"
    return m
for dv in ["AU1","CR1","CR2","OH1","OH2","OH3"]:
    d = L.copy(); d["human"] = (d.ctrl != "A").astype(int); d["seg_ADV"] = (d.segment=="ADV").astype(int); d["seg_COL"] = (d.segment=="COL").astype(int); d["pos2"] = (d.pos==2).astype(int); d["pos3"] = (d.pos==3).astype(int)
    d["disab"] = d.condition.isin(DIS).astype(int); d["is_HA"] = (d.ctrl=="HA").astype(int); d["is_A"] = (d.ctrl=="A").astype(int)
    try:
        m = ordinal_gee(d, dv, ["human","seg_ADV","seg_COL","pos2","pos3"]); k = "human"
        rob_rows.append(dict(dv=dv, contrast="C1 human-involved vs AI-only", spec=f"ordinal GEE, {m._spec} (odds ratio of higher rating)", diff=np.exp(m.params[k]), ci_lo=np.exp(m.conf_int().loc[k,0]), ci_hi=np.exp(m.conf_int().loc[k,1]), d=np.nan, p_raw=m.pvalues[k], n=int(d.pid.nunique())))
        dh = d[d.ctrl != "A"]; m = ordinal_gee(dh, dv, ["disab","is_HA","seg_ADV","seg_COL","pos2","pos3"])
        rob_rows.append(dict(dv=dv, contrast="C3 disability disclosed vs no mention", spec=f"ordinal GEE, {m._spec} (odds ratio of higher rating)", diff=np.exp(m.params["disab"]), ci_lo=np.exp(m.conf_int().loc["disab",0]), ci_hi=np.exp(m.conf_int().loc["disab",1]), d=np.nan, p_raw=m.pvalues["disab"], n=int(dh.pid.nunique())))
        rob_rows.append(dict(dv=dv, contrast="C2 H vs HA", spec=f"ordinal GEE, {m._spec} (odds ratio of higher rating, HA vs H)", diff=np.exp(m.params["is_HA"]), ci_lo=np.exp(m.conf_int().loc["is_HA",0]), ci_hi=np.exp(m.conf_int().loc["is_HA",1]), d=np.nan, p_raw=m.pvalues["is_HA"], n=int(dh.pid.nunique())))
    except Exception as e:
        print("ordinal GEE failed for", dv, e)
ROB = pd.DataFrame(rob_rows); ROB.to_csv(os.path.join(OUT, "robustness.csv"), index=False)
lev_rows = []
for dv in PRIMARY_DVS:
    pm = participant_means(L, dv); g = {k: pm[pm.ctrl == k][dv] for k in ["H","HA","A"]}
    lev_rows.append(dict(dv=dv, sd_H=g["H"].std(ddof=1), sd_HA=g["HA"].std(ddof=1), sd_A=g["A"].std(ddof=1), levene_p=stats.levene(g["H"], g["HA"], g["A"], center="median").pvalue))
LEV = pd.DataFrame(lev_rows); LEV.to_csv(os.path.join(OUT, "variance_check.csv"), index=False)
print("\n=== VARIANCE HETEROGENEITY (participant means, Levene on medians) ==="); print(LEV.round(3).to_string(index=False))
print("\n=== ROBUSTNESS OF THE KEY CONTRASTS ==="); print(ROB.round(3).to_string(index=False))
print("\ndone; results in", OUT)

# ---------------------------------------------------------------- 9. variance-robust check: participant cluster bootstrap of the key contrasts
# Motivation (data-informed, robustness): A's participant-level SD is 1.3-1.5x that of H/HA (Levene p <= .014). The LMM assumes one residual
# variance for everyone, so its SE for contrasts involving A can be too small. Resampling participants within condition makes no such assumption.
rng = np.random.default_rng(20260904); B = 4000
boot_rows = []
for dv in PRIMARY_DVS:
    pm = participant_means(L, dv)
    groups = {c: pm[pm.condition == c][dv].values for c in COND}
    for name, ga, gb in CONTRASTS[:3]:
        def stat(gs): return np.mean([gs[c].mean() for c in ga]) - np.mean([gs[c].mean() for c in gb])
        obs = stat(groups); draws = np.empty(B)
        for b in range(B):
            gs = {c: rng.choice(v, size=len(v), replace=True) for c, v in groups.items()}; draws[b] = stat(gs)
        lo, hi = np.percentile(draws, [2.5, 97.5]); p_boot = 2*min((draws <= 0).mean(), (draws >= 0).mean())   # percentile-interval two-sided p
        boot_rows.append(dict(dv=dv, contrast=name, spec="participant cluster bootstrap (4000), equal-weight cell means", diff=obs, ci_lo=lo, ci_hi=hi, d=np.nan, p_raw=p_boot, n=int(pm.pid.nunique())))
BOOT = pd.DataFrame(boot_rows); BOOT.to_csv(os.path.join(OUT, "bootstrap_contrasts.csv"), index=False)
print("\n=== BOOTSTRAP (variance-robust) CHECK OF THE KEY CONTRASTS ==="); print(BOOT.round(3).to_string(index=False))
