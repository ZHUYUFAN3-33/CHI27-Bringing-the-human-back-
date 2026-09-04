"""Round-1 figures: forest plot of the theory-driven contrasts; pairwise difference matrices with raw p shading."""
import pandas as pd, numpy as np, os, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__)); RES = os.path.join(HERE, "results"); FIG = os.path.join(HERE, "figures")
INK, INK2, MUTED, GRID, AXIS, SURF = "#0b0b0b", "#52514e", "#898781", "#e1e0d9", "#c3c2b7", "#fcfcfb"
BLUE, ORANGE, AQUA, VIOLET = "#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7"
plt.rcParams.update({"font.family": ["Helvetica Neue","Helvetica","Arial","DejaVu Sans"], "font.size": 10, "axes.edgecolor": AXIS, "axes.linewidth": 0.8,
                     "axes.labelcolor": INK2, "xtick.color": MUTED, "ytick.color": MUTED, "text.color": INK, "axes.titlecolor": INK,
                     "figure.facecolor": SURF, "axes.facecolor": SURF, "savefig.facecolor": SURF, "axes.spines.top": False, "axes.spines.right": False})
CON = pd.read_csv(os.path.join(RES, "contrasts.csv")); PAIRS = pd.read_csv(os.path.join(RES, "pairwise_all.csv"))
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]

# ---- Figure 6: forest plot of contrasts C1-C4 across DVs (LMM estimate, 95% CI) ----
DVS = [("OH","OriHime trust/useful/willing"),("AU1","Felt genuine"),("CR1","Controller warm"),("CR2","Controller competent"),("CR3","Operator in control"),("PE","Useful in daily life"),("HM","Fun to converse")]
CS = [("C1 human-involved vs AI-only","C1  human-involved − AI-only"),("C2 H vs HA","C2  H − HA"),("C3 disability disclosed vs no mention","C3  disability disclosed − no mention"),("C4 intellectual vs mobility","C4  intellectual − mobility")]
fig, axes = plt.subplots(1, 4, figsize=(14, 4.4), sharey=True)
for ax, (cname, ctitle) in zip(axes, CS):
    ys = []
    for i, (dv, dlab) in enumerate(DVS):
        r = CON[(CON.dv == dv) & (CON.contrast == cname)]
        if r.empty: continue
        r = r.iloc[0]; y = len(DVS) - i
        col = VIOLET if r.p_raw < .05 else MUTED
        ax.plot([r.ci_lo, r.ci_hi], [y, y], color=col, lw=1.8, solid_capstyle="round")
        ax.plot(r["diff"], y, "o", color=col, ms=6)
        ax.text(1.02, y, f"{r['diff']:+.2f}  p={r.p_raw:.3f}", transform=ax.get_yaxis_transform(), va="center", fontsize=8.5, color=INK2 if r.p_raw < .05 else MUTED)
    ax.axvline(0, color=AXIS, lw=1)
    ax.set_yticks([len(DVS)-i for i in range(len(DVS))]); ax.set_yticklabels([d for _, d in DVS])
    ax.set_xlim(-1.05, 1.05); ax.set_title(ctitle, fontsize=10, loc="left"); ax.grid(axis="x", color=GRID, lw=0.6); ax.set_axisbelow(True); ax.tick_params(length=0)
    ax.set_xlabel("difference in 1–7 points (95% CI)")
fig.suptitle("Theory-driven contrasts, primary sample n = 272 (mixed model; violet = raw p < .05, grey = not)", fontsize=11, x=0.01, ha="left")
fig.tight_layout(rect=(0, 0, 0.98, 0.93)); fig.savefig(os.path.join(FIG, "fig6_contrasts_forest.png"), dpi=160); plt.close(fig)

# ---- Figure 7: pairwise matrices (lower triangle) for the 4 primary DVs ----
fig, axes = plt.subplots(1, 4, figsize=(14, 4.2))
for ax, (dv, dlab) in zip(axes, DVS[:4]):
    sub = PAIRS[PAIRS.dv == dv]
    M = np.full((7,7), np.nan); Pm = np.full((7,7), np.nan)
    for _, r in sub.iterrows():
        i, j = COND.index(r.A), COND.index(r.B)
        M[j, i] = r.mean_B - r.mean_A if False else -(r["diff"])   # row minus column: row j (later) minus column i (earlier)
        Pm[j, i] = r.p_raw
    ax.set_xlim(-0.5, 6.5); ax.set_ylim(6.5, -0.5); ax.set_aspect("equal")
    for j in range(7):
        for i in range(7):
            if j <= i: continue
            p = Pm[j, i]; v = M[j, i]
            face = "#d9c9f5" if p < .05 else ("#efe9fb" if p < .10 else SURF)
            ax.add_patch(plt.Rectangle((i-0.5, j-0.5), 1, 1, facecolor=face, edgecolor=SURF, lw=2))
            ax.text(i, j-0.12, f"{v:+.2f}", ha="center", va="center", fontsize=8.5, color=INK, fontweight="bold" if p < .05 else "normal")
            ax.text(i, j+0.25, f"p={p:.2f}" if p >= .005 else "p<.005", ha="center", va="center", fontsize=7, color=INK2 if p < .05 else MUTED)
    ax.set_xticks(range(6)); ax.set_xticklabels(COND[:6]); ax.set_yticks(range(1,7)); ax.set_yticklabels(COND[1:]); ax.tick_params(length=0)
    for s in ["left","bottom"]: ax.spines[s].set_visible(False)
    ax.set_title(dlab, fontsize=10, loc="left")
fig.suptitle("All 21 pairwise differences per outcome: row condition minus column condition (participant-level means), raw p from the mixed model; shaded = raw p < .05, light = p < .10", fontsize=10.5, x=0.01, ha="left")
fig.tight_layout(rect=(0, 0, 1, 0.93)); fig.savefig(os.path.join(FIG, "fig7_pairwise_matrix.png"), dpi=160); plt.close(fig)
print("saved fig6, fig7")
