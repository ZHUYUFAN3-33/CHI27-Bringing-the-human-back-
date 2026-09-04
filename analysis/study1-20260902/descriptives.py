"""Descriptive statistics for Study 1 (no inferential tests): means, SDs, medians, 95% CIs by condition and clip."""
import pandas as pd, numpy as np, os
HERE = os.path.dirname(os.path.abspath(__file__))
pd.set_option("display.width", 240); pd.set_option("display.max_columns", 80); pd.set_option("display.max_rows", 400)
w = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); L = pd.read_csv(os.path.join(HERE, "long_segments.csv")); RK = pd.read_csv(os.path.join(HERE, "ranks_long.csv"))
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]
def desc(x):
    x = pd.Series(x).dropna(); n = len(x); m = x.mean(); sd = x.std(ddof=1); se = sd/np.sqrt(n) if n > 1 else np.nan
    return pd.Series({"n": n, "mean": round(m,2), "sd": round(sd,2), "median": x.median(), "ci_lo": round(m-1.96*se,2), "ci_hi": round(m+1.96*se,2)})

P = L.groupby(["pid","condition","ctrl","profile_label","human"], as_index=False)[["OH","OH1","OH2","OH3","AU1","CR1","CR2","CR3"]].mean()
P = P.merge(w[["participant_id","PE","HM","BEL1","at1_pass","av1_pass"]], left_on="pid", right_on="participant_id")

print("=== A. PARTICIPANT-LEVEL DVs (mean over 3 clips) BY THE 7 CONDITIONS ===")
for dv in ["OH","OH1","OH2","OH3","AU1","CR1","CR2","CR3","PE","HM","BEL1"]:
    t = P.groupby("condition")[dv].apply(desc).unstack().reindex(COND)
    print(f"\n--- {dv} ---"); print(t.to_string())

print("\n=== B. BY CONTROL SOURCE (H / HA / A), participant-level ===")
for dv in ["OH","OH1","OH2","OH3","AU1","CR1","CR2","CR3","PE","HM","BEL1"]:
    t = P.groupby("ctrl")[dv].apply(desc).unstack().reindex(["H","HA","A"])
    print(f"\n--- {dv} ---"); print(t.to_string())

print("\n=== C. BY OPERATOR PROFILE (within H+HA only) ===")
PH = P[P.ctrl != "A"]
for dv in ["OH","AU1","CR1","CR2","CR3","PE","HM","BEL1"]:
    t = PH.groupby("profile_label")[dv].apply(desc).unstack().reindex(["no mention","intellectual","mobility"])
    print(f"\n--- {dv} ---"); print(t.to_string())

print("\n=== D. CLIP x CONTROL SOURCE (segment-level rows, 1 per participant x clip) ===")
for dv in ["OH","AU1","CR1","CR2","CR3"]:
    t = L.groupby(["segment","ctrl"])[dv].agg(["count","mean","std","median"]).round(2).unstack("ctrl")
    print(f"\n--- {dv} ---"); print(t.reindex(["REL","ADV","COL"]).to_string())

print("\n=== E. CLIP main pattern (all conditions pooled) ===")
print(L.groupby("segment")[["OH1","OH2","OH3","OH","AU1","CR1","CR2","CR3"]].mean().round(2).reindex(["REL","ADV","COL"]).to_string())
print("\n=== F. POSITION (1st/2nd/3rd clip shown), all pooled ===")
print(L.groupby("pos")[["OH","AU1","CR1","CR2","CR3"]].mean().round(2).to_string())

print("\n=== G. RESPONSIBILITY (R1) AND CREDIT (R2) RANKS: share ranked #1 and mean rank, by ctrl (pooled over clips) ===")
for q, lab in [("R1","blame / responsibility"), ("R2","credit")]:
    sub = RK[RK.question == q]
    t1 = sub.groupby(["ctrl","actor"])["rank"].agg(top1=lambda x: round(100*(x==1).mean(),1), mean_rank=lambda x: round(x.mean(),2), n="count").unstack("actor")
    print(f"\n--- {lab} ---"); print(t1.reindex(["H","HA","A"]).to_string())
print("\n--- HA only: share #1 by clip ---")
sub = RK[(RK.ctrl=="HA")]
print(sub.groupby(["question","segment","actor"])["rank"].apply(lambda x: round(100*(x==1).mean(),1)).unstack("actor").to_string())
print("\n--- H/HA by profile: share ranking the HUMAN OPERATOR #1 ---")
sub = RK[(RK.ctrl!="A") & (RK.actor=="CTRL")]
print(sub.groupby(["question","condition"])["rank"].apply(lambda x: round(100*(x==1).mean(),1)).unstack("condition").to_string())

print("\n=== H. ITEM-LEVEL DISTRIBUTIONS (segment items pooled over clips, counts of 1..7) by ctrl ===")
for c in ["OH1","OH2","OH3","AU1","CR1","CR2","CR3"]:
    print(f"\n{c}:"); print(pd.crosstab(L.ctrl, L[c]).reindex(["H","HA","A"]).to_string())
print("\nBEL1 by condition (counts 1..7):"); print(pd.crosstab(w.condition, w.BEL1).reindex(COND).to_string())

print("\n=== I. PRE-MEASURE CORRELATIONS WITH DVs (participant level, Pearson r) ===")
Pm = P.merge(w[["participant_id","NARS","GAAIS_pos","GAAIS_neg","SCM_comp","SCM_warm","BG_age","BG_freq_ai","BG_freq_robot","BG_freq_disability"]], on="participant_id")
print(Pm[["OH","AU1","CR1","CR2","CR3","PE","HM","BEL1","NARS","GAAIS_pos","GAAIS_neg","SCM_comp","SCM_warm","BG_age","BG_freq_ai","BG_freq_robot","BG_freq_disability"]].corr().round(2).loc[["NARS","GAAIS_pos","GAAIS_neg","SCM_comp","SCM_warm","BG_age","BG_freq_ai","BG_freq_robot","BG_freq_disability","BEL1"], ["OH","AU1","CR1","CR2","CR3","PE","HM","BEL1"]].to_string())

print("\n=== J. DEMOGRAPHICS ===")
print("age:", w.BG_age.describe().round(1).to_dict())
print("gender (0 M,1 F,2 NB,3 PNS):", w.BG_gender.value_counts().sort_index().to_dict())
print("education:", w.BG_education.value_counts().sort_index().to_dict())
print("income:", w.BG_income.value_counts().sort_index().to_dict())
print("freq_ai:", w.BG_freq_ai.value_counts().sort_index().to_dict(), "| freq_robot:", w.BG_freq_robot.value_counts().sort_index().to_dict(), "| freq_disability:", w.BG_freq_disability.value_counts().sort_index().to_dict())
print("country:", w.BG_country.value_counts().to_dict())
print("FU1 yes (0):", int((w.FU1==0).sum()), "/", int(w.FU1.notna().sum()))
