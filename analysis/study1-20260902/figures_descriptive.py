"""Descriptive figures for Study 1 (raw distributions, means with 95% CI). No inferential tests."""
import pandas as pd, numpy as np, os, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
HERE = os.path.dirname(os.path.abspath(__file__)); FIG = os.path.join(HERE, "figures"); os.makedirs(FIG, exist_ok=True)
w = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); L = pd.read_csv(os.path.join(HERE, "long_segments.csv")); RK = pd.read_csv(os.path.join(HERE, "ranks_long.csv"))
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]
# palette: categorical slots 1-3 by control source; ink/grid from the reference palette (light mode)
C = {"H": "#2a78d6", "HA": "#eb6834", "A": "#1baf7a"}
INK, INK2, MUTED, GRID, AXIS, SURF = "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#c3c2b7", "#fcfcfb"
SEQ = ["#86b6ef","#6da7ec","#5598e7","#3987e5","#2a78d6","#1c5cab","#0d366b"]   # ordinal ramp, step 250 -> 700
plt.rcParams.update({"font.family": ["Helvetica Neue","Helvetica","Arial","DejaVu Sans"], "font.size": 10, "axes.edgecolor": AXIS, "axes.linewidth": 0.8,
                     "axes.labelcolor": INK2, "xtick.color": MUTED, "ytick.color": MUTED, "text.color": INK, "axes.titlecolor": INK,
                     "figure.facecolor": SURF, "axes.facecolor": SURF, "savefig.facecolor": SURF, "axes.spines.top": False, "axes.spines.right": False})
def ci(x):
    x = pd.Series(x).dropna(); m = x.mean(); se = x.std(ddof=1)/np.sqrt(len(x)); return m, 1.96*se
def style(ax):
    ax.grid(axis="y", color=GRID, linewidth=0.6); ax.set_axisbelow(True); ax.tick_params(length=0)
    for s in ["left","bottom"]: ax.spines[s].set_color(AXIS)

P = L.groupby(["pid","condition","ctrl"], as_index=False)[["OH","AU1","CR1","CR2","CR3"]].mean()
P = P.merge(w[["participant_id","BEL1","PE","HM"]], left_on="pid", right_on="participant_id")

# ---- Figure 1: raw points + mean/95% CI by the 7 conditions, participant-level DVs ----
DVS = [("OH","OriHime: trust / useful / willing (OH1-3 mean)"), ("AU1","Interaction felt genuine (AU1)"), ("CR1","Controller was warm (CR1)"),
       ("CR2","Controller was competent (CR2)"), ("CR3","Operator was in control (CR3; not asked in A)"), ("PE","OriHime useful in daily life (PE1-4 mean)")]
fig, axes = plt.subplots(2, 3, figsize=(13, 7.2), sharey=True)
rng = np.random.default_rng(1)
for ax, (dv, title) in zip(axes.flat, DVS):
    for i, c in enumerate(COND):
        x = P.loc[P.condition == c, dv].dropna()
        if len(x) == 0: continue
        col = C[c.rstrip("123")]
        ax.scatter(i + rng.uniform(-0.22, 0.22, len(x)), x + rng.uniform(-0.08, 0.08, len(x)), s=9, color=col, alpha=0.35, linewidths=0)
        m, h = ci(x); ax.errorbar(i, m, yerr=h, fmt="o", color=INK, ms=4.5, capsize=3, elinewidth=1.2, zorder=5)
        ax.text(i, 7.35, f"{m:.2f}", ha="center", va="bottom", fontsize=8.5, color=INK2)
    ax.set_xticks(range(7)); ax.set_xticklabels(COND); ax.set_ylim(0.6, 7.9); ax.set_yticks(range(1, 8)); ax.set_title(title, fontsize=10, loc="left", pad=14); style(ax)
axes[0,0].set_ylabel("1 = strongly disagree … 7 = strongly agree"); axes[1,0].set_ylabel("1 = strongly disagree … 7 = strongly agree")
handles = [plt.Line2D([], [], marker="o", ls="", color=C[k], alpha=0.6, label=lab) for k, lab in [("H","H: human operator"),("HA","HA: human + AI assistance"),("A","A: AI only")]]
handles.append(plt.Line2D([], [], marker="o", ls="", color=INK, label="mean ± 95% CI (number above = mean)"))
fig.legend(handles=handles, loc="lower center", ncol=4, frameon=False, fontsize=9, bbox_to_anchor=(0.5, -0.01))
fig.suptitle("Participant-level outcomes by condition (each dot = one participant, averaged over the 3 clips; n = 41–45 per condition)", fontsize=11, x=0.01, ha="left")
fig.tight_layout(rect=(0, 0.04, 1, 0.97)); fig.savefig(os.path.join(FIG, "fig1_conditions_dots.png"), dpi=160); plt.close(fig)

# ---- Figure 2: clip x control source, mean ± 95% CI (small multiples) ----
DV2 = [("OH","OriHime trust/useful/willing"), ("AU1","Felt genuine"), ("CR1","Controller warm"), ("CR2","Controller competent"), ("CR3","Operator in control")]
fig, axes = plt.subplots(1, 5, figsize=(14, 3.6), sharey=True)
SEGS = ["REL","ADV","COL"]; SEGLAB = {"REL": "REL\nrelational", "ADV": "ADV\nadvice", "COL": "COL\ncollaboration"}
for ax, (dv, title) in zip(axes, DV2):
    for j, k in enumerate(["H","HA","A"]):
        ms, hs = zip(*[ci(L.loc[(L.segment == s) & (L.ctrl == k), dv]) for s in SEGS]) if not (dv == "CR3" and k == "A") else (None, None)
        if ms is None: continue
        xs = np.arange(3) + (j - 1) * 0.16
        ax.errorbar(xs, ms, yerr=hs, fmt="o-", color=C[k], ms=5, lw=1.6, capsize=2.5, elinewidth=1, label={"H":"H human","HA":"HA human+AI","A":"A AI only"}[k])
    ax.set_xticks(range(3)); ax.set_xticklabels([SEGLAB[s] for s in SEGS]); ax.set_title(title, fontsize=10, loc="left"); style(ax); ax.set_ylim(3.9, 6.6)
axes[0].set_ylabel("mean (1–7) ± 95% CI"); axes[0].legend(frameon=False, fontsize=8.5, loc="lower left")
fig.suptitle("Clip × control source (one row per participant × clip; n = 128 / 128 / 44 rows per point)", fontsize=11, x=0.01, ha="left")
fig.tight_layout(rect=(0, 0, 1, 0.94)); fig.savefig(os.path.join(FIG, "fig2_clip_by_ctrl.png"), dpi=160); plt.close(fig)

# ---- Figure 3: BEL1 distribution by condition (100% stacked, ordinal ramp) ----
fig, ax = plt.subplots(figsize=(9, 3.8))
tab = pd.crosstab(w.condition, w.BEL1).reindex(COND).reindex(columns=range(1, 8), fill_value=0)
share = tab.div(tab.sum(axis=1), axis=0) * 100
left = np.zeros(len(COND))
for k in range(1, 8):
    vals = share[k].values
    ax.barh(range(len(COND)), vals, left=left, color=SEQ[k-1], height=0.62, edgecolor=SURF, linewidth=2, label=str(k))
    for i, (v, l) in enumerate(zip(vals, left)):
        if v >= 9: ax.text(l + v/2, i, f"{v:.0f}%", ha="center", va="center", fontsize=8, color="#ffffff" if k >= 4 else INK)
    left += vals
ax.set_yticks(range(len(COND))); ax.set_yticklabels([f"{c}  (mean {w.loc[w.condition==c,'BEL1'].mean():.2f})" for c in COND]); ax.invert_yaxis()
ax.set_xlim(0, 100); ax.set_xlabel("% of participants"); ax.xaxis.grid(color=GRID, lw=0.6); ax.set_axisbelow(True); ax.tick_params(length=0)
ax.spines["left"].set_visible(False)
ax.legend(title="BEL1: 1 = did not believe … 7 = fully believed", ncol=7, frameon=False, fontsize=8.5, title_fontsize=8.5, loc="upper center", bbox_to_anchor=(0.5, -0.2))
ax.set_title("How much participants believed the operator description (BEL1), by condition", fontsize=11, loc="left")
fig.tight_layout(); fig.savefig(os.path.join(FIG, "fig3_bel1_by_condition.png"), dpi=160); plt.close(fig)

# ---- Figure 4: who is ranked #1 for blame / credit, by control source ----
fig, axes = plt.subplots(1, 2, figsize=(11, 3.8), sharey=True)
ACT = ["CTRL","AI","ORG","USER"]; ACTLAB = {"CTRL": "human operator", "AI": "AI system / provider", "ORG": "OriHime / provider", "USER": "person in the video"}
for ax, (q, title) in zip(axes, [("R1","Ranked #1 for RESPONSIBILITY (negative outcome)"), ("R2","Ranked #1 for CREDIT (positive outcome)")]):
    sub = RK[RK.question == q]
    for j, k in enumerate(["H","HA","A"]):
        s = sub[sub.ctrl == k]
        vals = [100 * (s[s.actor == a]["rank"] == 1).mean() if (s.actor == a).any() else np.nan for a in ACT]
        xs = np.arange(4) + (j - 1) * 0.26
        bars = ax.bar(xs, vals, width=0.24, color=C[k], edgecolor=SURF, linewidth=1.5, label={"H":"H human","HA":"HA human+AI","A":"A AI only"}[k])
        for x, v in zip(xs, vals):
            if not np.isnan(v): ax.text(x, v + 1.5, f"{v:.0f}", ha="center", fontsize=8, color=INK2)
    ax.set_xticks(range(4)); ax.set_xticklabels([ACTLAB[a] for a in ACT], fontsize=9); ax.set_ylim(0, 85); ax.set_title(title, fontsize=10, loc="left"); style(ax)
axes[0].set_ylabel("% of participant × clip rows"); axes[0].legend(frameon=False, fontsize=8.5)
fig.text(0.01, 0.005, "Rows shown to each participant: H = operator/OriHime/person; HA = all four; A = AI/OriHime/person. Missing bar = actor not offered in that condition.", fontsize=8, color=MUTED)
fig.tight_layout(rect=(0, 0.04, 1, 1)); fig.savefig(os.path.join(FIG, "fig4_rank_top1.png"), dpi=160); plt.close(fig)

# ---- Figure 5: covariate balance — age and GAAIS_pos by condition ----
fig, axes = plt.subplots(1, 2, figsize=(11, 3.6))
for ax, (v, title, lo, hi) in zip(axes, [("BG_age","Age (years)", 15, 82), ("GAAIS_pos","Positive attitude to AI (GAAIS pos, 1–7)", 0.6, 7.6)]):
    for i, c in enumerate(COND):
        x = w.loc[w.condition == c, v].dropna(); col = C[c.rstrip("123")]
        ax.scatter(i + rng.uniform(-0.22, 0.22, len(x)), x, s=9, color=col, alpha=0.35, linewidths=0)
        m, h = ci(x); ax.errorbar(i, m, yerr=h, fmt="o", color=INK, ms=4.5, capsize=3, elinewidth=1.2, zorder=5)
        ax.text(i, hi - (hi-lo)*0.04, f"{m:.1f}", ha="center", va="top", fontsize=8.5, color=INK2)
    ax.set_xticks(range(7)); ax.set_xticklabels(COND); ax.set_ylim(lo, hi); ax.set_title(title, fontsize=10, loc="left"); style(ax)
fig.suptitle("Pre-existing differences between randomised groups (each dot = one participant; number = group mean)", fontsize=11, x=0.01, ha="left")
fig.tight_layout(rect=(0, 0, 1, 0.93)); fig.savefig(os.path.join(FIG, "fig5_balance.png"), dpi=160); plt.close(fig)
print("saved:", sorted(os.listdir(FIG)))
