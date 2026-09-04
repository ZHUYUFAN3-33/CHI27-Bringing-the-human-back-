"""Publication figures (trial storyline): PNG 300 dpi + PDF. Titles omitted (captions live in the text)."""
import pandas as pd, numpy as np, os, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__)); RES = os.path.join(HERE, "results"); FIG = os.path.join(HERE, "paper", "figures")
INK, INK2, MUTED, GRID, AXIS = "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#c3c2b7"
C = {"H": "#2a78d6", "HA": "#eb6834", "A": "#1baf7a"}; VIOLET = "#4a3aa7"
plt.rcParams.update({"font.family": ["Helvetica Neue","Helvetica","Arial","DejaVu Sans"], "font.size": 9, "axes.edgecolor": AXIS, "axes.linewidth": 0.7, "axes.labelcolor": INK2,
                     "xtick.color": INK2, "ytick.color": INK2, "text.color": INK, "axes.titlecolor": INK, "figure.facecolor": "white", "axes.facecolor": "white", "savefig.facecolor": "white",
                     "axes.spines.top": False, "axes.spines.right": False, "pdf.fonttype": 42})
def save(fig, name):
    fig.savefig(os.path.join(FIG, name + ".png"), dpi=300, bbox_inches="tight"); fig.savefig(os.path.join(FIG, name + ".pdf"), bbox_inches="tight"); plt.close(fig)
W = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); L = pd.read_csv(os.path.join(HERE, "long_segments.csv"))
W["usable"] = (W.at1_pass == 1) & (W.av1_pass == 1); pids = set(W[W.usable].participant_id); L = L[L.pid.isin(pids)]
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]; CC = {c: C[c.rstrip("123")] for c in COND}
P = L.groupby(["pid","condition","ctrl"], as_index=False)[["OH","OH1","OH2","OH3","AU1","CR1","CR2","CR3"]].mean()

# ---- Figure 1: condition means with 95% CI, 4 primary outcomes + CR3
DVS = [("OH","OriHime evaluation\n(trust / useful / willing)"),("AU1","Felt genuine"),("CR1","Controller warm"),("CR2","Controller competent"),("CR3","Operator in control\n(not asked in A)")]
fig, axes = plt.subplots(1, 5, figsize=(11, 3.0), sharey=True)
for ax, (dv, lab) in zip(axes, DVS):
    for i, c in enumerate(COND):
        x = P[P.condition == c][dv].dropna()
        if len(x) == 0: continue
        m = x.mean(); se = x.std(ddof=1)/np.sqrt(len(x))
        ax.plot([i, i], [m-1.96*se, m+1.96*se], color=CC[c], lw=1.4); ax.plot(i, m, "o", color=CC[c], ms=5)
    ax.set_xticks(range(7)); ax.set_xticklabels(COND, fontsize=8); ax.set_title(lab, fontsize=9, loc="left"); ax.set_ylim(4.4, 6.6)
    ax.grid(axis="y", color=GRID, lw=0.5); ax.set_axisbelow(True); ax.tick_params(length=0)
axes[0].set_ylabel("mean of participant scores (1–7), 95% CI")
save(fig, "fig1_condition_means")

# ---- Figure 2: forest plot of C1-C3 across outcomes (paper version)
CON = pd.read_csv(os.path.join(RES, "contrasts.csv"))
OUTS = [("OH","OriHime evaluation"),("OH2","  useful"),("OH1","  trustworthy"),("OH3","  willing"),("AU1","Felt genuine"),("CR1","Controller warm"),("CR2","Controller competent"),("CR3","Operator in control"),("PE","Performance expectancy"),("HM","Hedonic motivation")]
CS = [("C1 human-involved vs AI-only","C1  human-involved − AI-only"),("C2 H vs HA","C2  human − human+AI"),("C3 disability disclosed vs no mention","C3  disability disclosed − no mention")]
fig, axes = plt.subplots(1, 3, figsize=(10.5, 4.2), sharey=True)
for ax, (cname, ctitle) in zip(axes, CS):
    for i, (dv, dlab) in enumerate(OUTS):
        r = CON[(CON.dv == dv) & (CON.contrast == cname)]
        if r.empty: continue
        r = r.iloc[0]; y = len(OUTS) - i; col = VIOLET if r.p_raw < .05 else MUTED
        ax.plot([r.ci_lo, r.ci_hi], [y, y], color=col, lw=1.6, solid_capstyle="round"); ax.plot(r["diff"], y, "o", color=col, ms=4.5)
        ax.text(1.03, y, f"{r['diff']:+.2f}", transform=ax.get_yaxis_transform(), va="center", fontsize=7.5, color=INK2)
    ax.axvline(0, color=AXIS, lw=0.9); ax.set_yticks([len(OUTS)-i for i in range(len(OUTS))]); ax.set_yticklabels([d for _, d in OUTS], fontsize=8.5)
    ax.set_xlim(-1.0, 1.2); ax.set_title(ctitle, fontsize=9, loc="left"); ax.grid(axis="x", color=GRID, lw=0.5); ax.set_axisbelow(True); ax.tick_params(length=0)
    ax.set_xlabel("difference in scale points (95% CI)", fontsize=8.5)
save(fig, "fig2_contrasts")

# ---- Figure 3: clip x control source
fig, axes = plt.subplots(1, 4, figsize=(10.5, 2.9), sharey=True)
for ax, (dv, lab) in zip(axes, DVS[:4]):
    for k in ["H","HA","A"]:
        ms, lo, hi = [], [], []
        for s in ["REL","ADV","COL"]:
            x = L[(L.segment == s) & (L.ctrl == k)][dv].dropna(); m = x.mean(); se = x.std(ddof=1)/np.sqrt(len(x)); ms.append(m); lo.append(m-1.96*se); hi.append(m+1.96*se)
        xs = np.arange(3) + {"H": -0.12, "HA": 0, "A": 0.12}[k]
        ax.errorbar(xs, ms, yerr=[np.array(ms)-np.array(lo), np.array(hi)-np.array(ms)], color=C[k], fmt="o-", ms=4, lw=1.3, capsize=0, label={"H":"human","HA":"human + AI","A":"AI only"}[k])
    ax.set_xticks(range(3)); ax.set_xticklabels(["relational","advice","collaboration"], fontsize=8); ax.set_title(lab.replace("\n", " "), fontsize=9, loc="left"); ax.set_ylim(4.2, 6.5)
    ax.grid(axis="y", color=GRID, lw=0.5); ax.set_axisbelow(True); ax.tick_params(length=0)
axes[0].set_ylabel("mean (1–7), 95% CI"); axes[0].legend(frameon=False, fontsize=7.5, loc="lower left")
save(fig, "fig3_clip_by_control")

# ---- Figure 4: Plackett-Luce worths
PL = pd.read_csv(os.path.join(RES, "e7c_plackett_luce.csv")); ACT = ["CTRL","AI","ORG","USER"]; ACTLAB = {"CTRL": "human\noperator", "AI": "AI system /\nprovider", "ORG": "OriHime /\nprovider", "USER": "person in\nthe video"}
fig, axes = plt.subplots(1, 2, figsize=(9, 3.2), sharey=True)
for ax, (q, title) in zip(axes, [("responsibility","Responsibility for a negative outcome"), ("credit","Credit for a positive outcome")]):
    sub = PL[PL.question == q]
    for j, k in enumerate(["H","HA","A"]):
        s = sub[sub.ctrl == k]
        for a in ACT:
            row = s[s.actor == a]
            if row.empty: continue
            x = ACT.index(a) + (j-1)*0.26; row = row.iloc[0]
            ax.bar(x, row.worth, width=0.24, color=C[k], edgecolor="white", linewidth=1.2); ax.plot([x, x], [row.ci_lo, row.ci_hi], color=INK, lw=0.9)
    ax.set_xticks(range(4)); ax.set_xticklabels([ACTLAB[a] for a in ACT], fontsize=8); ax.set_ylim(0, 0.85); ax.set_title(title, fontsize=9, loc="left")
    ax.grid(axis="y", color=GRID, lw=0.5); ax.set_axisbelow(True); ax.tick_params(length=0)
from matplotlib.patches import Patch
axes[0].legend([Patch(color=C[k]) for k in ["H","HA","A"]], ["human", "human + AI", "AI only"], frameon=False, fontsize=8, loc="upper right")
axes[0].set_ylabel("Plackett–Luce worth (sums to 1)")
save(fig, "fig4_attribution_worths")

# ---- Figure 5: moderation by prior AI attitude (exploratory)
E1 = pd.read_csv(os.path.join(RES, "e1_moderation.csv")); E1 = E1[E1.moderator == "GAAIS positive"]
Pm = P.merge(W[["participant_id","GAAIS_pos"]], left_on="pid", right_on="participant_id")
fig, axes = plt.subplots(1, 4, figsize=(10.5, 3.0), sharey=True)
for ax, (dv, lab) in zip(axes, DVS[:4]):
    r = E1[E1.dv == dv].iloc[0]; gm = Pm.GAAIS_pos.mean()
    for grp, col, lab2 in [(1, C["H"], "human-involved"), (0, C["A"], "AI only")]:
        sub = Pm[(Pm.ctrl != "A")] if grp == 1 else Pm[Pm.ctrl == "A"]
        ax.scatter(sub.GAAIS_pos, sub[dv], s=7, color=col, alpha=0.3, linewidths=0, label=lab2)
        slope = r.slope_human if grp == 1 else r.slope_AI; b0 = sub[dv].mean() - slope*(sub.GAAIS_pos.mean() - gm)
        xs = np.linspace(1, 7, 50); ax.plot(xs, b0 + slope*(xs - gm), color=col, lw=1.8)
    ax.set_title(f"{lab.replace(chr(10), ' ')}\ninteraction p = {r.p_interaction:.3f}".replace("p = 0.", "p = ."), fontsize=8.5, loc="left"); ax.set_xlim(0.8, 7.2); ax.set_ylim(0.8, 7.2)
    ax.set_xlabel("positive attitude to AI (GAAIS, 1–7)", fontsize=8); ax.grid(color=GRID, lw=0.5); ax.set_axisbelow(True); ax.tick_params(length=0)
axes[0].set_ylabel("participant mean (1–7)"); axes[0].legend(frameon=False, fontsize=7.5, loc="lower right")
save(fig, "fig5_attitude_moderation")
print("saved paper figures:", sorted(os.listdir(FIG)))
