"""Phase-14 figures: E1 attitude moderation; E7 Plackett-Luce worths."""
import pandas as pd, numpy as np, os, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__)); RES = os.path.join(HERE, "results"); FIG = os.path.join(HERE, "figures")
INK, INK2, MUTED, GRID, AXIS, SURF = "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#c3c2b7", "#fcfcfb"
C = {"H": "#2a78d6", "HA": "#eb6834", "A": "#1baf7a"}; VIOLET = "#4a3aa7"
plt.rcParams.update({"font.family": ["Helvetica Neue","Helvetica","Arial","DejaVu Sans"], "font.size": 10, "axes.edgecolor": AXIS, "axes.linewidth": 0.8,
                     "axes.labelcolor": INK2, "xtick.color": MUTED, "ytick.color": MUTED, "text.color": INK, "axes.titlecolor": INK,
                     "figure.facecolor": SURF, "axes.facecolor": SURF, "savefig.facecolor": SURF, "axes.spines.top": False, "axes.spines.right": False})
W = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); L = pd.read_csv(os.path.join(HERE, "long_segments.csv"))
W["usable"] = (W.at1_pass == 1) & (W.av1_pass == 1); pids = set(W[W.usable].participant_id); L = L[L.pid.isin(pids)]
P = L.groupby(["pid","ctrl"], as_index=False)[["OH","AU1","CR1","CR2"]].mean().merge(W[["participant_id","GAAIS_pos"]], left_on="pid", right_on="participant_id")
E1 = pd.read_csv(os.path.join(RES, "e1_moderation.csv")); E1 = E1[E1.moderator == "GAAIS positive"]
# ---- Figure 8: participant means vs GAAIS_pos, human vs AI, with fitted slopes from the LMM (at mean clip/position, intercept from OLS on participant means for display)
fig, axes = plt.subplots(1, 4, figsize=(14, 3.9), sharey=True)
for ax, dv in zip(axes, ["OH","AU1","CR1","CR2"]):
    r = E1[E1.dv == dv].iloc[0]; gm = P.GAAIS_pos.mean()
    for grp, col, lab in [(1, C["H"], "human-involved (H + HA)"), (0, C["A"], "AI-only (A)")]:
        sub = P[(P.ctrl != "A") if grp == 1 else (P.ctrl == "A")]
        ax.scatter(sub.GAAIS_pos, sub[dv], s=10, color=col, alpha=0.35, linewidths=0, label=lab)
        slope = r.slope_human if grp == 1 else r.slope_AI; b0 = sub[dv].mean() - slope*(sub.GAAIS_pos.mean() - gm)   # line through the group mean, LMM slope
        xs = np.linspace(1, 7, 50); ax.plot(xs, b0 + slope*(xs - gm), color=col, lw=2)
    ax.set_title(f"{dv}   interaction p = {r.p_interaction:.3f}", fontsize=10, loc="left"); ax.set_xlim(0.8, 7.2); ax.set_ylim(0.8, 7.2)
    ax.set_xlabel("GAAIS positive attitude to AI (1–7)"); ax.grid(color=GRID, lw=0.6); ax.set_axisbelow(True); ax.tick_params(length=0)
axes[0].set_ylabel("participant mean over 3 clips (1–7)"); axes[0].legend(frameon=False, fontsize=8.5, loc="lower right")
fig.suptitle("E1 · Prior attitude to AI moderates the AI-only penalty: lines are mixed-model slopes (post-hoc)", fontsize=11, x=0.01, ha="left")
fig.tight_layout(rect=(0, 0, 1, 0.93)); fig.savefig(os.path.join(FIG, "fig8_e1_moderation.png"), dpi=160); plt.close(fig)
# ---- Figure 9: Plackett-Luce worths
PL = pd.read_csv(os.path.join(RES, "e7c_plackett_luce.csv"))
ACT = ["CTRL","AI","ORG","USER"]; ACTLAB = {"CTRL": "human operator", "AI": "AI system / provider", "ORG": "OriHime / provider", "USER": "person in the video"}
fig, axes = plt.subplots(1, 2, figsize=(11, 3.8), sharey=True)
for ax, (q, title) in zip(axes, [("responsibility","Responsibility: Plackett–Luce worth (share of 'strength')"), ("credit","Credit: Plackett–Luce worth")]):
    sub = PL[PL.question == q]
    for j, k in enumerate(["H","HA","A"]):
        s = sub[sub.ctrl == k]
        for a in ACT:
            row = s[s.actor == a]
            if row.empty: continue
            x = ACT.index(a) + (j-1)*0.26; row = row.iloc[0]
            ax.bar(x, row.worth, width=0.24, color=C[k], edgecolor=SURF, linewidth=1.5, label={"H":"H","HA":"HA","A":"A"}[k] if a == "CTRL" or (a == "AI" and k == "A") else None)
            ax.plot([x, x], [row.ci_lo, row.ci_hi], color=INK, lw=1)
            ax.text(x, row.ci_hi + 0.015, f"{row.worth:.2f}", ha="center", fontsize=7.5, color=INK2)
    ax.set_xticks(range(4)); ax.set_xticklabels([ACTLAB[a] for a in ACT], fontsize=9); ax.set_ylim(0, 0.85); ax.set_title(title, fontsize=10, loc="left")
    ax.grid(axis="y", color=GRID, lw=0.6); ax.set_axisbelow(True); ax.tick_params(length=0)
h, l = axes[0].get_legend_handles_labels(); seen = {}; hl = [(hh, ll) for hh, ll in zip(h, l) if ll and not seen.setdefault(ll, True) is None]
axes[0].legend([x[0] for x in hl], [x[1] for x in hl], frameon=False, fontsize=8.5, title="control source", title_fontsize=8.5)
axes[0].set_ylabel("worth (sums to 1 within condition)")
fig.text(0.01, 0.005, "Worths estimated from full rankings (3 clips per participant); bars = 95% participant-bootstrap interval. A missing bar = actor not offered.", fontsize=8, color=MUTED)
fig.tight_layout(rect=(0, 0.04, 1, 1)); fig.savefig(os.path.join(FIG, "fig9_plackett_luce.png"), dpi=160); plt.close(fig)
print("saved fig8, fig9")
