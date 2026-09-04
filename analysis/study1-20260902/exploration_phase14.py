"""Phase 14 — significance-oriented exploration E1-E8, approved by the user on 2026-09-04.
Every analysis here is EXPLORATORY, POST-HOC or SENSITIVITY (labelled in the output). Primary sample n = 272 unless stated.
"""
import pandas as pd, numpy as np, os, warnings, itertools
from scipy import stats
import statsmodels.api as sm, statsmodels.formula.api as smf
from statsmodels.stats.weightstats import ttost_ind
from statsmodels.genmod.generalized_estimating_equations import GEE, OrdinalGEE
from statsmodels.genmod.cov_struct import Exchangeable, Independence
from statsmodels.miscmodels.ordinal_model import OrderedModel
warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "results"); os.makedirs(OUT, exist_ok=True)
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 60); pd.set_option("display.max_rows", 500)
W = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); LL = pd.read_csv(os.path.join(HERE, "long_segments.csv")); RK = pd.read_csv(os.path.join(HERE, "ranks_long.csv"))
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]; DIS = ["H2","H3","HA2","HA3"]; NOM = ["H1","HA1"]
W["usable"] = (W.at1_pass == 1) & (W.av1_pass == 1); PRIMARY = set(W[W.usable].participant_id)
L = LL[LL.pid.isin(PRIMARY)].copy(); w = W[W.usable].copy()
L["pos"] = L.pos.astype(int); L["human"] = (L.ctrl != "A").astype(int); L["disab"] = L.condition.isin(DIS).astype(int); L["is_HA"] = (L.ctrl == "HA").astype(int)
for v in ["GAAIS_pos","GAAIS_neg","NARS","SCM_warm","SCM_comp","BEL1","BG_freq_disability","BG_age"]:
    L[v + "_c"] = L[v] - L[v].mean(); w[v + "_c"] = w[v] - w[v].mean()
sd_of = {v: w[v].std(ddof=1) for v in ["GAAIS_pos","GAAIS_neg","NARS","SCM_warm","SCM_comp","BEL1","BG_freq_disability"]}
PRIM = ["OH","AU1","CR1","CR2"]
def lmm(df, dv, rhs, reml=True):
    d = df.dropna(subset=[dv]); return smf.mixedlm(f"{dv} ~ {rhs}", d, groups=d["pid"]).fit(reml=reml, method=["lbfgs"])
def lrt(full, red, k): return 1 - stats.chi2.cdf(2*(full.llf - red.llf), k)
def pm_means(df, dv): return df.groupby(["pid","condition","ctrl"], as_index=False)[dv].mean()
def vec(res, terms):
    v = pd.Series(0.0, index=res.fe_params.index)
    for k, val in terms.items(): v[k] += val
    return v
def tt(res, v):
    t = res.t_test(v.values.reshape(1, -1)); return float(t.effect), float(t.sd), float(t.pvalue)
tests = []   # bookkeeping of every exploratory p-value
def log(block, dv, what, p, est=None, note=""): tests.append(dict(block=block, dv=dv, test=what, estimate=est, p=p, note=note))
print("primary sample:", w.shape[0], "participants")

# ============================================================ E1: attitude x control-source moderation (post-hoc)
print("\n=== E1: pre-measured attitude x human-vs-AI moderation (LMM with interaction; post-hoc) ===")
e1 = []
for mod, lab in [("GAAIS_pos","GAAIS positive"),("NARS","NARS negative-to-robots"),("GAAIS_neg","GAAIS negative (reversed)")]:
    for dv in PRIM:
        full = lmm(L, dv, f"human*{mod}_c + C(segment) + C(pos)", reml=False); red = lmm(L, dv, f"human + {mod}_c + C(segment) + C(pos)", reml=False)
        p_int = lrt(full, red, 1); r = lmm(L, dv, f"human*{mod}_c + C(segment) + C(pos)")
        k_int = f"human:{mod}_c"; slope_A = r.fe_params[f"{mod}_c"]; slope_H = slope_A + r.fe_params[k_int]
        # human - AI difference at -1 SD, mean, +1 SD of the moderator
        diffs = {}
        for lab2, x in [("-1SD", -sd_of[mod]), ("mean", 0.0), ("+1SD", sd_of[mod])]:
            est, se, p = tt(r, vec(r, {"human": 1.0, k_int: x})); diffs[lab2] = (est, p)
        e1.append(dict(moderator=lab, dv=dv, slope_AI=slope_A, slope_human=slope_H, interaction=r.fe_params[k_int], p_interaction=p_int,
                       diff_at_minus1SD=diffs["-1SD"][0], p_minus1SD=diffs["-1SD"][1], diff_at_mean=diffs["mean"][0], p_mean=diffs["mean"][1], diff_at_plus1SD=diffs["+1SD"][0], p_plus1SD=diffs["+1SD"][1]))
        log("E1", dv, f"{mod} x human interaction (LRT)", p_int, r.fe_params[k_int], "post-hoc (seen in 09-02 report)")
E1 = pd.DataFrame(e1); E1.to_csv(os.path.join(OUT, "e1_moderation.csv"), index=False); print(E1.round(3).to_string(index=False))
# 3-level version for the strongest one, to see whether HA behaves like H
for dv in ["OH","AU1"]:
    full = lmm(L, dv, "C(ctrl)*GAAIS_pos_c + C(segment) + C(pos)", reml=False); red = lmm(L, dv, "C(ctrl) + GAAIS_pos_c + C(segment) + C(pos)", reml=False)
    r = lmm(L, dv, "C(ctrl, Treatment('A'))*GAAIS_pos_c + C(segment) + C(pos)")
    kH = "C(ctrl, Treatment('A'))[T.H]:GAAIS_pos_c"; kHA = "C(ctrl, Treatment('A'))[T.HA]:GAAIS_pos_c"
    sA = r.fe_params["GAAIS_pos_c"]; sH = sA + r.fe_params[kH]; sHA = sA + r.fe_params[kHA]
    print(f"  {dv}: ctrl(3) x GAAIS_pos LRT p = {lrt(full, red, 2):.3f}; slope A = {sA:.2f}, H = {sH:.2f}, HA = {sHA:.2f}")
    log("E1", dv, "ctrl(3) x GAAIS_pos (LRT df=2)", lrt(full, red, 2), None, "post-hoc")

# ============================================================ E2: BEL1 moderation / believers-only sensitivity
print("\n=== E2: BEL1 (post-treatment) moderation and believers-only sensitivity ===")
e2 = []
for dv in PRIM:
    full = lmm(L, dv, "human*BEL1_c + C(segment) + C(pos)", reml=False); red = lmm(L, dv, "human + BEL1_c + C(segment) + C(pos)", reml=False)
    r = lmm(L, dv, "human*BEL1_c + C(segment) + C(pos)"); p_int = lrt(full, red, 1)
    lo = tt(r, vec(r, {"human": 1.0, "human:BEL1_c": -sd_of["BEL1"]})); hi = tt(r, vec(r, {"human": 1.0, "human:BEL1_c": sd_of["BEL1"]}))
    e2.append(dict(dv=dv, analysis="human x BEL1 interaction", interaction=r.fe_params["human:BEL1_c"], p=p_int, diff_low_belief=lo[0], p_low=lo[2], diff_high_belief=hi[0], p_high=hi[2]))
    log("E2", dv, "human x BEL1 interaction (LRT)", p_int, r.fe_params["human:BEL1_c"], "sensitivity; BEL1 post-treatment")
E2 = pd.DataFrame(e2); print(E2.round(3).to_string(index=False))
# believers-only contrasts (BEL1 >= 5) vs full primary
e2b = []
for sub_lab, pids in [("primary n=272", PRIMARY), ("believers BEL1>=5", set(w[w.BEL1 >= 5].participant_id)), ("disbelievers BEL1<=3", set(w[w.BEL1 <= 3].participant_id))]:
    d = L[L.pid.isin(pids)]
    for dv in PRIM:
        r = lmm(d, dv, "C(condition, Treatment('H1')) + C(segment) + C(pos)")
        def cellv(cells):
            v = pd.Series(0.0, index=r.fe_params.index); v["Intercept"] = 1.0
            for c in cells:
                if c != "H1": v[f"C(condition, Treatment('H1'))[T.{c}]"] += 1/len(cells)
            return v
        for name, ga, gb in [("C1 human vs AI", COND[:6], ["A"]), ("C2 H vs HA", ["H1","H2","H3"], ["HA1","HA2","HA3"]), ("C3 disclosed vs none", DIS, NOM)]:
            if sub_lab.startswith("disbelievers") and d[d.ctrl == "A"].pid.nunique() < 5: 
                pass
            est, se, p = tt(r, cellv(ga) - cellv(gb)); e2b.append(dict(sample=sub_lab, n=int(d.pid.nunique()), dv=dv, contrast=name, diff=est, se=se, p=p))
            if sub_lab != "primary n=272": log("E2", dv, f"{name} in {sub_lab}", p, est, "sensitivity")
E2B = pd.DataFrame(e2b); E2B.to_csv(os.path.join(OUT, "e2_bel1.csv"), index=False); E2.to_csv(os.path.join(OUT, "e2_bel1_interaction.csv"), index=False)
print(E2B.pivot_table(index=["dv","contrast"], columns="sample", values=["diff","p"]).round(3).to_string())
print("n by sample:", E2B.groupby("sample").n.first().to_dict(), "| A in believers:", w[(w.BEL1>=5)&(w.ctrl=="A")].shape[0], "| A in disbelievers:", w[(w.BEL1<=3)&(w.ctrl=="A")].shape[0])

# ============================================================ E3: OH single items, C1 with bootstrap (complements round 1)
print("\n=== E3: OH1/OH2/OH3 C1 human vs AI, participant bootstrap (variance-robust) ===")
rng = np.random.default_rng(14); B = 4000; e3 = []
for dv in ["OH1","OH2","OH3","OH"]:
    pm = pm_means(L, dv); groups = {c: pm[pm.condition == c][dv].values for c in COND}
    stat = lambda gs: np.mean([gs[c].mean() for c in COND[:6]]) - gs["A"].mean()
    obs = stat(groups); draws = np.array([stat({c: rng.choice(v, len(v), replace=True) for c, v in groups.items()}) for _ in range(B)])
    lo, hi = np.percentile(draws, [2.5, 97.5]); p = 2*min((draws <= 0).mean(), (draws >= 0).mean())
    e3.append(dict(dv=dv, diff=obs, ci_lo=lo, ci_hi=hi, p_boot=p)); log("E3", dv, "C1 bootstrap", p, obs, "secondary")
E3 = pd.DataFrame(e3); E3.to_csv(os.path.join(OUT, "e3_oh_items.csv"), index=False); print(E3.round(3).to_string(index=False))

# ============================================================ E4: disclosure x clip; disclosure x contact frequency / stereotype
print("\n=== E4: disability disclosure x clip, x contact frequency, x SCM (within H/HA; exploratory) ===")
LH = L[L.ctrl != "A"].copy(); e4 = []
for dv in PRIM + ["CR3"]:
    full = lmm(LH, dv, "disab*C(segment) + is_HA + C(pos)", reml=False); red = lmm(LH, dv, "disab + C(segment) + is_HA + C(pos)", reml=False)
    p_int = lrt(full, red, 2); log("E4", dv, "disab x clip (LRT df=2)", p_int, None, "exploratory")
    row = dict(dv=dv, p_disab_x_clip=p_int)
    for s in ["REL","ADV","COL"]:
        sub = LH[LH.segment == s].dropna(subset=[dv]); a = sub[sub.disab==1][dv]; b = sub[sub.disab==0][dv]
        t = stats.ttest_ind(a, b, equal_var=False); row[f"diff_{s}"] = a.mean()-b.mean(); row[f"p_{s}"] = t.pvalue
    for mod in ["BG_freq_disability","SCM_warm","SCM_comp"]:
        full = lmm(LH, dv, f"disab*{mod}_c + is_HA + C(segment) + C(pos)", reml=False); red = lmm(LH, dv, f"disab + {mod}_c + is_HA + C(segment) + C(pos)", reml=False)
        r = lmm(LH, dv, f"disab*{mod}_c + is_HA + C(segment) + C(pos)"); p_m = lrt(full, red, 1)
        row[f"int_{mod}"] = r.fe_params[f"disab:{mod}_c"]; row[f"p_{mod}"] = p_m
        lo = tt(r, vec(r, {"disab": 1.0, f"disab:{mod}_c": -sd_of[mod]})); hi = tt(r, vec(r, {"disab": 1.0, f"disab:{mod}_c": sd_of[mod]}))
        row[f"disab_effect_low_{mod}"] = lo[0]; row[f"p_low_{mod}"] = lo[2]; row[f"disab_effect_high_{mod}"] = hi[0]; row[f"p_high_{mod}"] = hi[2]
        log("E4", dv, f"disab x {mod} (LRT)", p_m, r.fe_params[f"disab:{mod}_c"], "exploratory")
    e4.append(row)
E4 = pd.DataFrame(e4); E4.to_csv(os.path.join(OUT, "e4_disclosure_moderation.csv"), index=False); print(E4.round(3).to_string(index=False))

# ============================================================ E5: equivalence tests (TOST) for the null contrasts
print("\n=== E5: TOST equivalence, participant-level means, bounds = +/- 0.35 SD (and 0.50 SD) ===")
e5 = []
for dv in PRIM + ["PE","HM","CR3"]:
    if dv in ["PE","HM"]: pm = w[["participant_id","condition","ctrl",dv]].rename(columns={"participant_id":"pid"})
    else: pm = pm_means(L, dv)
    for name, ga, gb in [("C2 H vs HA", ["H1","H2","H3"], ["HA1","HA2","HA3"]), ("C3 disclosed vs none", DIS, NOM), ("C4 intellectual vs mobility", ["H2","HA2"], ["H3","HA3"])]:
        a = pm[pm.condition.isin(ga)][dv].dropna(); b = pm[pm.condition.isin(gb)][dv].dropna()
        sd = np.sqrt(((len(a)-1)*a.var(ddof=1)+(len(b)-1)*b.var(ddof=1))/(len(a)+len(b)-2)); d = (a.mean()-b.mean())/sd
        res = {}
        for bound in [0.35, 0.50]:
            p, (t1, p1, df1), (t2, p2, df2) = ttost_ind(a, b, -bound*sd, bound*sd, usevar="unequal"); res[bound] = p
        # 90% CI of d (approx)
        se_d = np.sqrt((len(a)+len(b))/(len(a)*len(b)) + d*d/(2*(len(a)+len(b))))
        e5.append(dict(dv=dv, contrast=name, n_A=len(a), n_B=len(b), d=d, d90_lo=d-1.645*se_d, d90_hi=d+1.645*se_d, p_tost_035=res[0.35], p_tost_050=res[0.50]))
        log("E5", dv, f"TOST {name} bound .35", res[0.35], d, "secondary")
E5 = pd.DataFrame(e5); E5.to_csv(os.path.join(OUT, "e5_tost.csv"), index=False); print(E5.round(3).to_string(index=False))

# ============================================================ E6: CR2 hints — REL-only competence penalty; position x condition
print("\n=== E6a: CR2, is the AI competence penalty specific to the REL clip? ===")
L["rel"] = (L.segment == "REL").astype(int)
full = lmm(L, "CR2", "human*rel + C(segment) + C(pos)", reml=False); red = lmm(L, "CR2", "human + C(segment) + C(pos)", reml=False)
r = lmm(L, "CR2", "human*rel + C(segment) + C(pos)")
print(f"  human x REL-vs-other interaction: coef = {r.fe_params['human:rel']:.3f}, LRT p = {lrt(full, red, 1):.3f}")
log("E6", "CR2", "human x REL-vs-others (LRT df=1)", lrt(full, red, 1), r.fe_params["human:rel"], "post-hoc")
e6a = []
for s in ["REL","ADV","COL"]:
    sub = L[L.segment == s].dropna(subset=["CR2"]).copy()
    X = pd.DataFrame({"human": sub.human.values}, index=sub.index)
    om = OrderedModel(sub.CR2.astype(int).values, X.values, distr="logit").fit(method="bfgs", disp=False)
    orr = np.exp(om.params[0]); se = om.bse[0]; p = om.pvalues[0]
    e6a.append(dict(clip=s, mean_human=sub[sub.human==1].CR2.mean(), mean_AI=sub[sub.human==0].CR2.mean(), OR_human=orr, or_lo=np.exp(om.params[0]-1.96*se), or_hi=np.exp(om.params[0]+1.96*se), p_ordinal=p))
    log("E6", "CR2", f"ordinal logit human vs AI within {s}", p, orr, "post-hoc simple effect")
E6A = pd.DataFrame(e6a); E6A.to_csv(os.path.join(OUT, "e6a_cr2_rel.csv"), index=False); print(E6A.round(3).to_string(index=False))
print("\n=== E6b: CR2 position x condition — what does the p = .012 look like? ===")
cell = L.pivot_table(index="condition", columns="pos", values="CR2", aggfunc="mean").reindex(COND).round(2); print(cell.to_string())
full = lmm(L, "CR2", "human*C(pos) + C(segment)", reml=False); red = lmm(L, "CR2", "human + C(pos) + C(segment)", reml=False); p1 = lrt(full, red, 2)
full = lmm(L, "CR2", "C(ctrl)*C(pos) + C(segment)", reml=False); red = lmm(L, "CR2", "C(ctrl) + C(pos) + C(segment)", reml=False); p2 = lrt(full, red, 4)
LHh = L[L.ctrl != "A"]; full = lmm(LHh, "CR2", "C(profile)*C(pos) + C(ctrl) + C(segment)", reml=False); red = lmm(LHh, "CR2", "C(profile) + C(pos) + C(ctrl) + C(segment)", reml=False); p3 = lrt(full, red, 4)
print(f"  human x pos LRT p = {p1:.3f}; ctrl(3) x pos p = {p2:.3f}; profile x pos (H/HA) p = {p3:.3f}")
for nm, pv in [("human x pos", p1), ("ctrl x pos", p2), ("profile x pos", p3)]: log("E6", "CR2", nm + " (LRT)", pv, None, "post-hoc")
E6B = cell.reset_index(); E6B["p_human_x_pos"] = p1; E6B["p_ctrl_x_pos"] = p2; E6B["p_profile_x_pos"] = p3; E6B.to_csv(os.path.join(OUT, "e6b_cr2_position.csv"), index=False)
# same for AU1/CR1 position effects: is the rise with position equal across conditions? (already tested in round 1: n.s.)

# ============================================================ E7: full rank models
print("\n=== E7a: blame vs credit x clip (HA, human operator), GEE with question and clip ===")
RKu = RK[RK.pid.isin(PRIMARY)].copy(); RKu["top1"] = (RKu["rank"] == 1).astype(int)
sub = RKu[(RKu.ctrl == "HA") & (RKu.actor == "CTRL")].copy(); sub["blame"] = (sub.question == "R1").astype(int)
m = GEE.from_formula("top1 ~ blame + C(segment)", groups="pid", data=sub, family=sm.families.Binomial(), cov_struct=Exchangeable()).fit()
m2 = GEE.from_formula("top1 ~ blame*C(segment)", groups="pid", data=sub, family=sm.families.Binomial(), cov_struct=Exchangeable()).fit()
print(f"  HA human #1: blame vs credit OR = {np.exp(m.params['blame']):.2f}, p = {m.pvalues['blame']:.3f}; blame x clip interaction p (Wald) = {m2.wald_test_terms().table.loc['blame:C(segment)','pvalue'] if 'blame:C(segment)' in m2.wald_test_terms().table.index else float('nan'):.3f}")
log("E7", "ranks", "HA human #1 blame vs credit (GEE)", m.pvalues["blame"], np.exp(m.params["blame"]), "secondary")
e7a = []
for s in ["REL","ADV","COL"]:
    ss = sub[sub.segment == s]; pp = ss.pivot_table(index="pid", columns="question", values="top1")
    b, c = pp["R1"].mean(), pp["R2"].mean(); disc = pp[pp.R1 != pp.R2]; n10 = int((disc.R1 == 1).sum()); n01 = int((disc.R2 == 1).sum())
    p = stats.binomtest(n10, n10+n01).pvalue if n10+n01 > 0 else np.nan
    e7a.append(dict(clip=s, share_blame=b, share_credit=c, blame_only=n10, credit_only=n01, p_mcnemar_exact=p))
E7A = pd.DataFrame(e7a); E7A.to_csv(os.path.join(OUT, "e7a_blame_credit_clip.csv"), index=False); print(E7A.round(3).to_string(index=False))
print("\n=== E7b: mean rank of each actor by control source (participant-level mean rank, Mann-Whitney) ===")
e7b = []
for q in ["R1","R2"]:
    for actor, ga, gb in [("CTRL","H","HA"),("ORG","H","HA"),("USER","H","HA"),("AI","HA","A"),("ORG","HA","A"),("USER","HA","A")]:
        s = RKu[(RKu.question == q) & (RKu.actor == actor)]; pmr = s.groupby(["pid","ctrl"], as_index=False)["rank"].mean()
        a = pmr[pmr.ctrl == ga]["rank"]; b = pmr[pmr.ctrl == gb]["rank"]; p = stats.mannwhitneyu(a, b).pvalue
        e7b.append(dict(question="responsibility" if q == "R1" else "credit", actor=actor, group_A=ga, group_B=gb, mean_rank_A=a.mean(), mean_rank_B=b.mean(), p_mw=p))
        log("E7", "ranks", f"{q} {actor} mean rank {ga} vs {gb} (MW)", p, a.mean()-b.mean(), "secondary")
E7B = pd.DataFrame(e7b); E7B.to_csv(os.path.join(OUT, "e7b_mean_ranks.csv"), index=False); print(E7B.round(3).to_string(index=False))
print("\n=== E7c: Plackett-Luce worths per control source and question (participant bootstrap 95% CI) ===")
def plackett_luce(rankings, items, iters=200):
    wv = {i: 1.0 for i in items}
    wins = {i: 0 for i in items}
    for rk in rankings:
        for t in range(len(rk)-1): wins[rk[t]] += 1
    for _ in range(iters):
        denom = {i: 0.0 for i in items}
        for rk in rankings:
            for t in range(len(rk)-1):
                S = rk[t:]; tot = sum(wv[j] for j in S)
                for j in S: denom[j] += 1.0/tot
        new = {i: (wins[i]/denom[i] if denom[i] > 0 else 1e-9) for i in items}; s = sum(new.values()); wv = {i: v/s for i, v in new.items()}
    return wv
e7c = []
for q in ["R1","R2"]:
    for ctrl in ["H","HA","A"]:
        s = RKu[(RKu.question == q) & (RKu.ctrl == ctrl)]
        items = sorted(s.actor.unique(), key=lambda a: ["CTRL","AI","ORG","USER"].index(a))
        by = {k: g.sort_values("rank").actor.tolist() for k, g in s.groupby(["pid","segment"])}
        pids = sorted(set(k[0] for k in by)); rankings = list(by.values())
        wv = plackett_luce(rankings, items)
        boots = {i: [] for i in items}
        for _ in range(300):
            samp = rng.choice(pids, len(pids), replace=True); rk = [by[(p, s_)] for p in samp for s_ in ["REL","ADV","COL"] if (p, s_) in by]
            wb = plackett_luce(rk, items, iters=60)
            for i in items: boots[i].append(wb[i])
        for i in items:
            e7c.append(dict(question="responsibility" if q == "R1" else "credit", ctrl=ctrl, actor=i, worth=wv[i], ci_lo=np.percentile(boots[i], 2.5), ci_hi=np.percentile(boots[i], 97.5), n_rankings=len(rankings)))
E7C = pd.DataFrame(e7c); E7C.to_csv(os.path.join(OUT, "e7c_plackett_luce.csv"), index=False); print(E7C.round(3).to_string(index=False))
print("\n=== E7d: who is #2 when the human operator is #1 (HA) ===")
s = RKu[(RKu.ctrl == "HA")]; tops = s[(s.actor == "CTRL") & (s["rank"] == 1)][["pid","segment","question"]]
sec = s.merge(tops, on=["pid","segment","question"]); sec = sec[sec["rank"] == 2]
E7D = sec.groupby(["question","actor"]).size().unstack(fill_value=0); E7D = E7D.div(E7D.sum(axis=1), axis=0).round(3); print(E7D.to_string()); E7D.to_csv(os.path.join(OUT, "e7d_second_place.csv"))

# ============================================================ E8: HM disclosure hint
print("\n=== E8: HM (fun to converse) and disability disclosure — is it real, and is HA1 driving it? ===")
e8 = []
wh = w[w.ctrl != "A"].copy(); wh["disab"] = wh.condition.isin(DIS).astype(int)
m0 = smf.ols("HM ~ disab + C(ctrl)", wh).fit(); m1 = smf.ols("HM ~ disab + C(ctrl) + GAAIS_pos_c + NARS_c + SCM_warm_c + BG_age_c", wh.dropna(subset=["BG_age"])).fit()
e8.append(dict(spec="OLS, disab + ctrl", diff=m0.params["disab"], ci_lo=m0.conf_int().loc["disab",0], ci_hi=m0.conf_int().loc["disab",1], p=m0.pvalues["disab"], n=int(m0.nobs)))
e8.append(dict(spec="OLS + covariates (GAAIS, NARS, SCM_warm, age)", diff=m1.params["disab"], ci_lo=m1.conf_int().loc["disab",0], ci_hi=m1.conf_int().loc["disab",1], p=m1.pvalues["disab"], n=int(m1.nobs)))
for ctrl in ["H","HA"]:
    sub = wh[wh.ctrl == ctrl]; a = sub[sub.disab==1].HM; b = sub[sub.disab==0].HM; t = stats.ttest_ind(a, b, equal_var=False)
    e8.append(dict(spec=f"within {ctrl} only: disclosed vs none (Welch)", diff=a.mean()-b.mean(), ci_lo=np.nan, ci_hi=np.nan, p=t.pvalue, n=len(sub)))
a = wh[wh.disab==1].HM; b = wh[wh.disab==0].HM; e8.append(dict(spec="Mann-Whitney", diff=a.median()-b.median(), ci_lo=np.nan, ci_hi=np.nan, p=stats.mannwhitneyu(a, b).pvalue, n=len(wh)))
groups = {c: wh[wh.condition == c].HM.values for c in COND[:6]}
stat = lambda gs: np.mean([gs[c].mean() for c in DIS]) - np.mean([gs[c].mean() for c in NOM])
draws = np.array([stat({c: rng.choice(v, len(v), replace=True) for c, v in groups.items()}) for _ in range(4000)])
e8.append(dict(spec="participant bootstrap (equal-weight cells)", diff=stat(groups), ci_lo=np.percentile(draws, 2.5), ci_hi=np.percentile(draws, 97.5), p=2*min((draws<=0).mean(), (draws>=0).mean()), n=len(wh)))
E8 = pd.DataFrame(e8); E8.to_csv(os.path.join(OUT, "e8_hm_disclosure.csv"), index=False); print(E8.round(3).to_string(index=False))
for r_ in E8.itertuples(): log("E8", "HM", r_.spec, r_.p, r_.diff, "exploratory")
print("HM by condition:", wh.groupby("condition").HM.mean().round(2).reindex(COND[:6]).to_dict())

# ============================================================ bookkeeping
TESTS = pd.DataFrame(tests); TESTS.to_csv(os.path.join(OUT, "phase14_test_log.csv"), index=False)
print("\n=== PHASE 14 BOOKKEEPING ===")
print(TESTS.groupby("block").agg(n_tests=("p","size"), n_sig=("p", lambda p: int((p < .05).sum()))).to_string())
print("total exploratory tests:", len(TESTS), "| p<.05:", int((TESTS.p < .05).sum()), "| expected by chance:", round(0.05*len(TESTS), 1))
print("\n--- exploratory tests with p < .05 ---"); print(TESTS[TESTS.p < .05].round(3).to_string(index=False))
