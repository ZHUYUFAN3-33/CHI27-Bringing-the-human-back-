"""Attribution with a common anchor (added after the 2026-09-04 cross-review).

H offers 3 actors and HA 4, so 'ranked first' odds fall mechanically when an option is added. Anchor on the two actors
present in every condition: is the actor ranked ahead of BOTH 'OriHime or its provider' and 'the person in the video'?
Compared across H vs HA (human operator) and HA vs A (AI system) with GEE logistic regression, participant clusters.
"""
import pandas as pd, numpy as np, os, warnings
import statsmodels.api as sm
from statsmodels.genmod.generalized_estimating_equations import GEE
from statsmodels.genmod.cov_struct import Exchangeable
warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "results")
W = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); RK = pd.read_csv(os.path.join(HERE, "ranks_long.csv"))
W["usable"] = (W.at1_pass == 1) & (W.av1_pass == 1); pids = set(W[W.usable].participant_id)
R = RK[RK.pid.isin(pids)]
piv = R.pivot_table(index=["pid","ctrl","segment","question"], columns="actor", values="rank").reset_index()
rows = []
for actor, ga, gb in [("CTRL","H","HA"), ("AI","HA","A")]:
    sub = piv[piv.ctrl.isin([ga, gb])].copy(); sub["ahead"] = ((sub[actor] < sub.ORG) & (sub[actor] < sub.USER)).astype(int); sub["ctrl"] = pd.Categorical(sub.ctrl, [ga, gb])
    for q, ql in [("R1","responsibility"), ("R2","credit")]:
        s = sub[sub.question == q]; sh = s.groupby("ctrl", observed=True).ahead.mean()
        m = GEE.from_formula("ahead ~ C(ctrl) + C(segment)", groups="pid", data=s, family=sm.families.Binomial(), cov_struct=Exchangeable()).fit()
        k = [i for i in m.params.index if "ctrl" in i][0]
        rows.append(dict(actor=actor, question=ql, group_A=ga, group_B=gb, share_A=sh[ga], share_B=sh[gb], OR=np.exp(m.params[k]), ci_lo=np.exp(m.conf_int().loc[k,0]), ci_hi=np.exp(m.conf_int().loc[k,1]), p=m.pvalues[k]))
T = pd.DataFrame(rows); T.to_csv(os.path.join(OUT, "ranks_common_anchor.csv"), index=False)
pd.set_option("display.width", 200); print(T.round(3).to_string(index=False))
