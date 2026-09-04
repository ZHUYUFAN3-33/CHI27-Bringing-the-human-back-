"""Last sweep on the disability-profile factor (D1-D8). Exploratory / diagnostic; primary sample; within the six human cells unless stated."""
import pandas as pd, numpy as np, os, warnings
from scipy import stats
import statsmodels.api as sm, statsmodels.formula.api as smf
from statsmodels.genmod.generalized_estimating_equations import GEE
from statsmodels.genmod.cov_struct import Exchangeable
warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "results"); RAW = os.environ.get("STUDY1_EXPORT") or os.path.join(HERE, "..", "..", "exports", "20260902T104106Z")
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 60)
W = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); LL = pd.read_csv(os.path.join(HERE, "long_segments.csv")); RK = pd.read_csv(os.path.join(HERE, "ranks_long.csv"))
PT = pd.read_csv(os.path.join(RAW, "page_times.csv"), encoding="utf-8-sig")
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]; DIS = ["H2","H3","HA2","HA3"]; NOM = ["H1","HA1"]
W["usable"] = (W.at1_pass == 1) & (W.av1_pass == 1); PRIM = set(W[W.usable].participant_id); w = W[W.usable].copy()
L = LL[LL.pid.isin(PRIM)].copy(); L["pos"] = L.pos.astype(int); L["disab"] = L.condition.isin(DIS).astype(int); L["is_HA"] = (L.ctrl == "HA").astype(int); L["gap"] = L.CR1 - L.CR2
LH = L[L.ctrl != "A"].copy(); wh = w[w.ctrl != "A"].copy(); wh["disab"] = wh.condition.isin(DIS).astype(int)
def lmm(df, dv, rhs, reml=True):
    d = df.dropna(subset=[dv]); return smf.mixedlm(f"{dv} ~ {rhs}", d, groups=d["pid"]).fit(reml=reml, method=["lbfgs"])
def lrt(full, red, k): return 1 - stats.chi2.cdf(2*(full.llf - red.llf), k)
def pf(p): return "<.001" if p < .001 else f"{p:.3f}"
tests = []
def log(block, dv, what, p, est=None): tests.append(dict(block=block, dv=dv, test=what, estimate=est, p=p))
print("human cells, primary sample:", wh.shape[0], "participants;", LH.shape[0], "rows; disclosed", int(wh.disab.sum()), "no mention", int((wh.disab==0).sum()))

print("\n=== D1: does the disclosure effect fade across presentation positions? (disab x position, within H/HA) ===")
d1 = []
for dv in ["OH","AU1","CR1","CR2","CR3"]:
    full = lmm(LH, dv, "disab*C(pos) + is_HA + C(segment)", reml=False); red = lmm(LH, dv, "disab + C(pos) + is_HA + C(segment)", reml=False); p_int = lrt(full, red, 2)
    r = lmm(LH, dv, "disab*C(pos) + is_HA + C(segment)")
    eff = {}
    for pos in [1,2,3]:
        v = pd.Series(0.0, index=r.fe_params.index); v["disab"] = 1.0
        if pos > 1: v[f"disab:C(pos)[T.{pos}]"] = 1.0
        t = r.t_test(v.values.reshape(1, -1)); eff[pos] = (float(t.effect), float(t.pvalue))
    d1.append(dict(dv=dv, p_disab_x_pos=p_int, eff_pos1=eff[1][0], p_pos1=eff[1][1], eff_pos2=eff[2][0], p_pos2=eff[2][1], eff_pos3=eff[3][0], p_pos3=eff[3][1]))
    log("D1", dv, "disab x position (LRT df=2)", p_int)
D1 = pd.DataFrame(d1); D1.to_csv(os.path.join(OUT, "d1_disclosure_by_position.csv"), index=False); print(D1.round(3).to_string(index=False))

print("\n=== D2: first clip only (one row per participant, right after the disclosure) ===")
d2 = []
first = LH[LH.pos == 1]
for dv in ["OH","AU1","CR1","CR2","CR3"]:
    m = smf.ols(f"{dv} ~ disab + is_HA + C(segment)", first.dropna(subset=[dv])).fit(cov_type="HC3")
    a = first[first.disab==1][dv]; b = first[first.disab==0][dv]; t = stats.ttest_ind(a, b, equal_var=False)
    sd = np.sqrt(((len(a)-1)*a.var()+(len(b)-1)*b.var())/(len(a)+len(b)-2))
    d2.append(dict(dv=dv, mean_disclosed=a.mean(), mean_none=b.mean(), diff=m.params["disab"], ci_lo=m.conf_int().loc["disab",0], ci_hi=m.conf_int().loc["disab",1], d=(a.mean()-b.mean())/sd, p_ols_hc3=m.pvalues["disab"], p_welch=t.pvalue))
    log("D2", dv, "first clip: disclosed vs none (OLS HC3)", m.pvalues["disab"], m.params["disab"])
D2 = pd.DataFrame(d2); D2.to_csv(os.path.join(OUT, "d2_first_clip.csv"), index=False); print(D2.round(3).to_string(index=False))

print("\n=== D3: warmth minus competence gap (SCM 'paternalistic' pattern would predict a LARGER gap after disclosure) ===")
full = lmm(LH, "gap", "disab + is_HA + C(segment) + C(pos)", reml=False); red = lmm(LH, "gap", "is_HA + C(segment) + C(pos)", reml=False)
r = lmm(LH, "gap", "disab + is_HA + C(segment) + C(pos)")
print(f"  gap (CR1-CR2): disclosed {LH[LH.disab==1].gap.mean():+.2f} vs none {LH[LH.disab==0].gap.mean():+.2f}; disab effect {r.fe_params['disab']:+.3f} [{r.conf_int().loc['disab',0]:+.2f}, {r.conf_int().loc['disab',1]:+.2f}], LRT p = {pf(lrt(full, red, 1))}")
log("D3", "CR1-CR2", "disclosure effect on warmth-competence gap", lrt(full, red, 1), r.fe_params["disab"])
for prof, lab in [(2,"intellectual"),(3,"mobility")]:
    sub = LH[LH.profile.isin([1, prof])].copy(); sub["d"] = (sub.profile == prof).astype(int)
    r2 = lmm(sub, "gap", "d + is_HA + C(segment) + C(pos)"); print(f"  {lab} vs none: gap effect {r2.fe_params['d']:+.3f}, p = {pf(r2.pvalues['d'])}")

print("\n=== D4: attribution within HA and within H separately, by disclosure (GEE logit, participant clusters) ===")
RKu = RK[RK.pid.isin(PRIM)].copy(); RKu["top1"] = (RKu["rank"] == 1).astype(int); RKu["disab"] = RKu.condition.isin(DIS).astype(int)
d4 = []
for ctrl in ["H","HA"]:
    for actor in (["CTRL","AI","ORG","USER"] if ctrl == "HA" else ["CTRL","ORG","USER"]):
        for q in ["R1","R2"]:
            sub = RKu[(RKu.ctrl == ctrl) & (RKu.actor == actor) & (RKu.question == q)]
            m = GEE.from_formula("top1 ~ disab + C(segment)", groups="pid", data=sub, family=sm.families.Binomial(), cov_struct=Exchangeable()).fit()
            d4.append(dict(ctrl=ctrl, actor=actor, question="responsibility" if q == "R1" else "credit", share_none=sub[sub.disab==0].top1.mean(), share_disclosed=sub[sub.disab==1].top1.mean(), OR=np.exp(m.params["disab"]), ci_lo=np.exp(m.conf_int().loc["disab",0]), ci_hi=np.exp(m.conf_int().loc["disab",1]), p=m.pvalues["disab"]))
            log("D4", f"{ctrl}/{actor}/{q}", "top1 by disclosure (GEE)", m.pvalues["disab"], np.exp(m.params["disab"]))
D4 = pd.DataFrame(d4); D4.to_csv(os.path.join(OUT, "d4_attribution_by_disclosure.csv"), index=False); print(D4.round(3).to_string(index=False))
# intellectual vs mobility within HA, operator credit
sub = RKu[(RKu.ctrl == "HA") & (RKu.actor == "CTRL") & (RKu.question == "R2")]
print("  HA operator credit #1 by profile:", sub.groupby("condition").top1.mean().round(3).to_dict())

print("\n=== D5: belief in the description by profile (was 'intellectual disability' harder to believe?) ===")
print("BEL1 by condition:", w.groupby("condition").BEL1.mean().round(2).reindex(COND).to_dict())
m = smf.ols("BEL1 ~ C(profile) + C(ctrl)", wh).fit(); a = sm.stats.anova_lm(m, typ=2); print(f"  profile effect on BEL1 within H/HA: p = {pf(a.loc['C(profile)','PR(>F)'])}")
h2 = w[w.condition == "H2"].BEL1; rest = wh[wh.condition != "H2"].BEL1; t = stats.ttest_ind(h2, rest, equal_var=False)
print(f"  H2 ({h2.mean():.2f}) vs other human cells ({rest.mean():.2f}): Welch p = {pf(t.pvalue)}  [post-hoc, 1 of 6 cells]")
log("D5", "BEL1", "profile effect (ANOVA within H/HA)", a.loc["C(profile)","PR(>F)"]); log("D5", "BEL1", "H2 vs other human cells (post-hoc)", t.pvalue, h2.mean()-rest.mean())
intel = wh[wh.profile == 2].BEL1; oth = wh[wh.profile != 2].BEL1; t2 = stats.ttest_ind(intel, oth, equal_var=False); print(f"  intellectual ({intel.mean():.2f}) vs other human cells ({oth.mean():.2f}): p = {pf(t2.pvalue)}"); log("D5", "BEL1", "intellectual vs other human cells", t2.pvalue, intel.mean()-oth.mean())
print("  share BEL1 <= 3 by condition:", w.groupby("condition").BEL1.apply(lambda x: round(100*(x<=3).mean(),1)).reindex(COND).to_dict())

print("\n=== D6: dwell time on the disclosure page by condition (was the profile sentence read?) ===")
dw = PT[(PT.page_key == "disclosure") & (PT.participant_id.isin(PRIM))].groupby("participant_id").dwell_ms.sum()/1000
w["dwell_disclosure_s"] = w.participant_id.map(dw)
print(w.groupby("condition").dwell_disclosure_s.median().round(1).reindex(COND).to_dict(), "(median seconds)")
wh["dwell"] = wh.participant_id.map(dw); kw = stats.kruskal(*[g.dwell.dropna() for _, g in wh.groupby("condition")]); print(f"  Kruskal-Wallis across the 6 human cells: p = {pf(kw.pvalue)}; disclosed median {wh[wh.disab==1].dwell.median():.1f}s vs none {wh[wh.disab==0].dwell.median():.1f}s, Mann-Whitney p = {pf(stats.mannwhitneyu(wh[wh.disab==1].dwell.dropna(), wh[wh.disab==0].dwell.dropna()).pvalue)}")
log("D6", "dwell", "disclosure-page dwell, disclosed vs none (MW)", stats.mannwhitneyu(wh[wh.disab==1].dwell.dropna(), wh[wh.disab==0].dwell.dropna()).pvalue)
# does the disclosure effect depend on reading time? (dwell as moderator)
LH["dwell_c"] = np.log(LH.pid.map(dw)) - np.log(LH.pid.map(dw)).mean()
for dv in ["AU1","CR1"]:
    full = lmm(LH, dv, "disab*dwell_c + is_HA + C(segment) + C(pos)", reml=False); red = lmm(LH, dv, "disab + dwell_c + is_HA + C(segment) + C(pos)", reml=False)
    print(f"  {dv}: disab x log(dwell) interaction p = {pf(lrt(full, red, 1))}"); log("D6", dv, "disab x log dwell (LRT)", lrt(full, red, 1))

print("\n=== D7: how much evidence FOR the null? BIC-approximate Bayes factors (BF01) for the pooled disclosure effect ===")
# Unit correction after the 2026-09-04 cross-review: disclosure is a between-participant variable, so the independent
# information units are the 236 participants, not the 708 clip rows. BF01 is computed on participant-level means
# (OLS, disab + control source vs control source only); the clip-row LMM version is kept as BF01_rows for the record.
d7 = []
Pm = LH.groupby(["pid","condition","ctrl"], as_index=False)[["OH","AU1","CR1","CR2","CR3"]].mean(); Pm["disab"] = Pm.condition.isin(DIS).astype(int)
for dv in ["OH","AU1","CR1","CR2","CR3","PE","HM"]:
    if dv in ["PE","HM"]:
        d = wh; m1 = smf.ols(f"{dv} ~ disab + C(ctrl)", d).fit(); m0 = smf.ols(f"{dv} ~ C(ctrl)", d).fit(); bf_rows = np.nan
    else:
        d = Pm.dropna(subset=[dv]); m1 = smf.ols(f"{dv} ~ disab + C(ctrl)", d).fit(); m0 = smf.ols(f"{dv} ~ C(ctrl)", d).fit()
        r1 = lmm(LH, dv, "disab + is_HA + C(segment) + C(pos)", reml=False); r0 = lmm(LH, dv, "is_HA + C(segment) + C(pos)", reml=False); bf_rows = np.exp((r1.bic - r0.bic)/2)
    d7.append(dict(dv=dv, n_units=int(m1.nobs), BF01=np.exp((m1.bic - m0.bic)/2), BF01_rows=bf_rows))
D7 = pd.DataFrame(d7); D7.to_csv(os.path.join(OUT, "d7_bayes_factors.csv"), index=False); print(D7.round(2).to_string(index=False))
print("  (BF01 = evidence for 'no disclosure effect' vs 'some effect', participant units; 3-10 moderate, >10 strong; BIC approximation = unit-information prior. BF01_rows = the superseded clip-row version.)")

print("\n=== D8: what would more participants do? ===")
CON = pd.read_csv(os.path.join(OUT, "contrasts.csv"))
for dv in ["OH","AU1","CR1","CR2","HM"]:
    s = CON[(CON.dv == dv) & (CON.contrast == "C3 disability disclosed vs no mention")].iloc[0]
    z = s.z; n_now = 236
    print(f"  {dv}: observed d = {s.d:+.2f}, z = {z:+.2f}, p = {pf(s.p_raw)}")
    for mult in [1.5, 2, 3]:
        zz = z*np.sqrt(mult); pp = 2*(1 - stats.norm.cdf(abs(zz))); print(f"      if the SAME effect held with {mult}x the human-cell sample (n = {int(n_now*mult)}): p ~ {pf(pp)}")
    # required n for 80% power at the observed d, 2:1 allocation (disclosed:none), and at d = .35
    for d in [abs(s.d), 0.35]:
        if d == 0: continue
        n_none = (1 + 1/2) * ((1.96 + 0.8416)/d)**2; print(f"      80% power at d = {d:.2f} with 2:1 allocation needs {int(np.ceil(n_none))} no-mention + {int(np.ceil(2*n_none))} disclosed = {int(np.ceil(3*n_none))} human-cell participants (have 236)")
TL = pd.DataFrame(tests); TL.to_csv(os.path.join(OUT, "disability_sweep_test_log.csv"), index=False)
print(f"\nsweep tests: {len(TL)}, p<.05: {int((TL.p<.05).sum())}, expected by chance ~ {0.05*len(TL):.1f}")
print(TL[TL.p < .05].round(3).to_string(index=False))
