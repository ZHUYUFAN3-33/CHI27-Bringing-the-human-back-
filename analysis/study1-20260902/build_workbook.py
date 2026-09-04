"""Build the Chinese analysis workbook (HTML) from the cleaned data. Every number in the page is computed here."""
import pandas as pd, numpy as np, os, base64, html, re
HERE = os.path.dirname(os.path.abspath(__file__)); FIG = os.path.join(HERE, "figures")
OUT = "/private/tmp/claude-505/-Users-Zhu-Desktop-CHI27-study1-survey/aa8bddef-a4b6-4d00-9895-5001fb83a859/scratchpad/study1-workbook.html"
w = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); L = pd.read_csv(os.path.join(HERE, "long_segments.csv")); RK = pd.read_csv(os.path.join(HERE, "ranks_long.csv"))
COND = ["H1","H2","H3","HA1","HA2","HA3","A"]
def b64(name):
    with open(os.path.join(FIG, name), "rb") as f: return "data:image/png;base64," + base64.b64encode(f.read()).decode()
def ci(x):
    x = pd.Series(x).dropna(); m = x.mean(); se = x.std(ddof=1)/np.sqrt(len(x)); return m, m-1.96*se, m+1.96*se
def table(rows, header, cls="", rowhead=True, foot=None):
    th = "".join(f"<th>{h}</th>" for h in header)
    body = ""
    for r in rows:
        cells = "".join((f"<th scope='row'>{c}</th>" if (i == 0 and rowhead) else f"<td>{c}</td>") for i, c in enumerate(r))
        body += f"<tr>{cells}</tr>"
    f = f"<tfoot><tr>{''.join(f'<td>{c}</td>' for c in foot)}</tr></tfoot>" if foot else ""
    return f"<div class='tscroll'><table class='{cls}'><thead><tr>{th}</tr></thead><tbody>{body}</tbody>{f}</table></div>"
P = L.groupby(["pid","condition","ctrl","profile_label"], as_index=False)[["OH","OH1","OH2","OH3","AU1","CR1","CR2","CR3"]].mean()
P = P.merge(w[["participant_id","PE","HM","BEL1"]], left_on="pid", right_on="participant_id")
fmt = lambda x, d=2: "–" if pd.isna(x) else f"{x:.{d}f}"

# ---- T: condition means (SD) ----
DVL = [("OH","OH 综合"),("OH1","OH1 可信"),("OH2","OH2 有用"),("OH3","OH3 愿意参与"),("AU1","AU1 真实感"),("CR1","CR1 温暖"),("CR2","CR2 能力"),("CR3","CR3 掌控"),("PE","PE 绩效期望"),("HM","HM 享乐"),("BEL1","BEL1 相信程度")]
rows = []
for c in COND:
    sub = P[P.condition == c]; r = [f"<b>{c}</b>", len(sub)]
    for dv, _ in DVL:
        x = sub[dv].dropna(); r.append("–" if len(x) == 0 else f"{x.mean():.2f} <span class='sd'>({x.std(ddof=1):.2f})</span>")
    rows.append(r)
T_cond = table(rows, ["条件","n"] + [l for _, l in DVL], cls="num")
# by ctrl with CI
rows = []
for k, lab in [("H","H 人类"),("HA","HA 人类+AI"),("A","A 仅 AI")]:
    sub = P[P.ctrl == k]; r = [f"<b>{lab}</b>", len(sub)]
    for dv, _ in DVL:
        x = sub[dv].dropna()
        if len(x) == 0: r.append("–"); continue
        m, lo, hi = ci(x); r.append(f"{m:.2f} <span class='sd'>[{lo:.2f}, {hi:.2f}]</span>")
    rows.append(r)
T_ctrl = table(rows, ["控制来源","n"] + [l for _, l in DVL], cls="num")
# by profile within H+HA
rows = []
for k, lab in [("no mention","1 不提及"),("intellectual","2 智力障碍"),("mobility","3 行动障碍")]:
    sub = P[(P.ctrl != "A") & (P.profile_label == k)]; r = [f"<b>{lab}</b>", len(sub)]
    for dv, _ in DVL:
        x = sub[dv].dropna(); m, lo, hi = ci(x); r.append(f"{m:.2f} <span class='sd'>[{lo:.2f}, {hi:.2f}]</span>")
    rows.append(r)
T_prof = table(rows, ["操作员画像（仅 H+HA）","n"] + [l for _, l in DVL], cls="num")
# clip x ctrl
rows = []
for s, slab in [("REL","REL 闲聊"),("ADV","ADV 建议"),("COL","COL 协作")]:
    for k in ["H","HA","A"]:
        sub = L[(L.segment == s) & (L.ctrl == k)]; r = [f"<b>{slab}</b> · {k}", len(sub)]
        for dv in ["OH","OH1","OH2","OH3","AU1","CR1","CR2","CR3"]:
            x = sub[dv].dropna(); r.append("–" if len(x) == 0 else f"{x.mean():.2f} <span class='sd'>({x.std(ddof=1):.2f})</span>")
        rows.append(r)
T_clip = table(rows, ["影片 · 控制来源","行数","OH 综合","OH1","OH2","OH3","AU1","CR1","CR2","CR3"], cls="num")
# position
rows = []
for pos in [1,2,3]:
    sub = L[L.pos == pos]; rows.append([f"<b>第 {pos} 段</b>"] + [f"{sub[dv].mean():.2f}" for dv in ["OH","AU1","CR1","CR2","CR3"]])
T_pos = table(rows, ["播放位置","OH 综合","AU1","CR1","CR2","CR3"], cls="num")
# ranks
ACT = [("CTRL","人类操作员"),("AI","AI 系统/提供方"),("ORG","OriHime/提供方"),("USER","影片中的人")]
rows = []
for q, ql in [("R1","责任（负面结果）"),("R2","功劳（正面结果）")]:
    for k in ["H","HA","A"]:
        sub = RK[(RK.question == q) & (RK.ctrl == k)]; r = [f"<b>{ql}</b> · {k}"]
        for a, _ in ACT:
            s = sub[sub.actor == a]["rank"]; r.append("未提供" if len(s) == 0 else f"{100*(s==1).mean():.0f}% <span class='sd'>(均次 {s.mean():.2f})</span>")
        rows.append(r)
T_rank = table(rows, ["问题 · 控制来源"] + [l for _, l in ACT], cls="num")
# H/HA by profile: human #1
sub = RK[(RK.ctrl != "A") & (RK.actor == "CTRL")]
t = sub.groupby(["question","condition"])["rank"].apply(lambda x: 100*(x==1).mean()).unstack("condition")
rows = [[f"<b>{ql}</b>"] + [f"{t.loc[q, c]:.0f}%" for c in ["H1","H2","H3","HA1","HA2","HA3"]] for q, ql in [("R1","责任：人类操作员排第 1"),("R2","功劳：人类操作员排第 1")]]
T_rank_prof = table(rows, ["","H1","H2","H3","HA1","HA2","HA3"], cls="num")
# quality: exclusion rules by condition
w["at1_lenient"] = w.at1_answer.isin([1,2]).astype(int)
rules = [("全部完成者", pd.Series(True, index=w.index)), ("AT1 严格（=2）", w.at1_pass==1), ("AT1 宽松（1 或 2）", w.at1_lenient==1),
         ("AT1 严格 + AV1", (w.at1_pass==1)&(w.av1_pass==1)), ("AT1 严格 + AV1 + 去掉三段全同分", (w.at1_pass==1)&(w.av1_pass==1)&(w.straightline_segments<3))]
rows = []
for c in COND:
    rows.append([f"<b>{c}</b>"] + [int((m & (w.condition == c)).sum()) for _, m in rules])
foot = ["<b>合计</b>"] + [int(m.sum()) for _, m in rules]
T_excl = table(rows, ["条件"] + [n for n, _ in rules], cls="num", foot=foot)
# balance
cov = [("BG_age","年龄",1),("NARS","NARS 机器人负面态度",2),("GAAIS_pos","GAAIS 正向",2),("GAAIS_neg","GAAIS 负向(反向)",2),("SCM_comp","SCM 能力",2),("SCM_warm","SCM 温暖",2),("BG_freq_ai","AI 使用频率(0–5)",2)]
rows = []
for c in COND:
    sub = w[w.condition == c]; rows.append([f"<b>{c}</b>", len(sub)] + [f"{sub[v].mean():.{d}f}" for v, _, d in cov] + [f"{100*(sub.BG_gender==1).mean():.0f}%"])
T_bal = table(rows, ["条件","n"] + [l for _, l, _ in cov] + ["女性比例"], cls="num")
# reliability
def alpha(df):
    df = df.dropna(); k = df.shape[1]; return (k/(k-1))*(1 - df.var(ddof=1).sum()/df.sum(axis=1).var(ddof=1))
rev = lambda s: 8 - s
N = w[["NARS_01","NARS_02","NARS_03","NARS_04","NARS_05","NARS_06","NARS_07","NARS_08","NARS_10","NARS_11"]].copy()
for c in ["NARS_03","NARS_05","NARS_06"]: N[c] = rev(N[c])
GP = ["GAAIS_07","GAAIS_11","GAAIS_12","GAAIS_17","GAAIS_18"]; GN = ["GAAIS_08","GAAIS_10","GAAIS_15","GAAIS_19"]
G = w[GP+GN].copy()
for c in GN: G[c] = rev(G[c])
scales = [("NARS（10 题，3/5/6 反向）", N, w.NARS, "前测 · 协变量/调节变量"), ("GAAIS 正向（5 题）", G[GP], w.GAAIS_pos, "前测 · 协变量/调节变量"), ("GAAIS 负向（4 题，反向后高=不负面）", G[GN], w.GAAIS_neg, "前测 · 协变量/调节变量"),
          ("SCM 能力（5 题）", w[["SCM_01","SCM_02","SCM_03","SCM_04","SCM_05"]], w.SCM_comp, "前测 · 协变量/调节变量"), ("SCM 温暖（4 题）", w[["SCM_06","SCM_07","SCM_08","SCM_09"]], w.SCM_warm, "前测 · 协变量/调节变量"),
          ("OH 综合（OH1–3，按影片）", L[["OH1","OH2","OH3"]], L.OH, "主要结果之一 · 影片层"), ("PE 绩效期望（4 题）", w[["PE1","PE2","PE3","PE4"]], w.PE, "次要结果 · 参与者层"), ("HM 享乐动机（3 题）", w[["HM1","HM2","HM3"]], w.HM, "次要结果 · 参与者层")]
rows = [[f"<b>{n}</b>", f"{alpha(df):.2f}", f"{x.mean():.2f}", f"{x.std(ddof=1):.2f}", f"{100*(x>=6).mean():.0f}%", role] for n, df, x, role in scales]
T_alpha = table(rows, ["量表","Cronbach α","均值","SD","≥6 的比例","角色"], cls="num")
# single items floor/ceiling
rows = []
for c, lab in [("OH1","OH1 可信"),("OH2","OH2 有用"),("OH3","OH3 愿意参与"),("AU1","AU1 真实感"),("CR1","CR1 温暖"),("CR2","CR2 能力"),("CR3","CR3 掌控")]:
    x = L[c].dropna(); rows.append([f"<b>{lab}</b>", len(x), f"{x.mean():.2f}", f"{x.std(ddof=1):.2f}", f"{100*(x==1).mean():.1f}%", f"{100*(x==7).mean():.1f}%", f"{100*(x>=6).mean():.0f}%"])
x = w.BEL1; rows.append(["<b>BEL1 相信程度</b>", len(x), f"{x.mean():.2f}", f"{x.std(ddof=1):.2f}", f"{100*(x==1).mean():.1f}%", f"{100*(x==7).mean():.1f}%", f"{100*(x>=6).mean():.0f}%"])
T_items = table(rows, ["单题","行数","均值","SD","选 1 的比例（地板）","选 7 的比例（天花板）","≥6"], cls="num")
# correlations
Pm = P.merge(w[["participant_id","NARS","GAAIS_pos","GAAIS_neg","SCM_comp","SCM_warm","BG_age","BG_freq_ai","BG_freq_disability"]], on="participant_id")
cor = Pm[["OH","AU1","CR1","CR2","CR3","PE","HM","BEL1","NARS","GAAIS_pos","GAAIS_neg","SCM_comp","SCM_warm","BG_age","BG_freq_ai","BG_freq_disability"]].corr()
rows = [[f"<b>{lab}</b>"] + [f"{cor.loc[v, d]:.2f}" for d in ["OH","AU1","CR1","CR2","CR3","PE","HM"]] for v, lab in [("GAAIS_pos","GAAIS 正向"),("GAAIS_neg","GAAIS 负向(反向)"),("NARS","NARS"),("SCM_comp","SCM 能力"),("SCM_warm","SCM 温暖"),("BG_freq_ai","AI 使用频率"),("BG_freq_disability","接触残障者频率"),("BG_age","年龄"),("BEL1","BEL1 相信程度")]]
T_cor = table(rows, ["前测/背景变量","OH 综合","AU1","CR1","CR2","CR3","PE","HM"], cls="num")
# BEL1 by condition
rows = []
for c in COND:
    x = w[w.condition == c].BEL1; rows.append([f"<b>{c}</b>", len(x), f"{x.mean():.2f}", f"{100*(x>=5).mean():.0f}%", f"{100*(x<=3).mean():.0f}%"])
T_bel = table(rows, ["条件","n","BEL1 均值","≥5（相信）","≤3（不相信）"], cls="num")

# numbers for prose
n_at1 = int(w.at1_pass.sum()); n_av1 = int(w.av1_pass.sum()); n_both = int(((w.at1_pass==1)&(w.av1_pass==1)).sum())
n_sl3 = int((w.straightline_segments==3).sum()); n_at1_near = int(((w.at1_pass==0)&(w.at1_answer==1)).sum())
dur = w.dur_min
bel_hi = 100*(w.BEL1>=5).mean(); bel_lo = 100*(w.BEL1<=3).mean()

tmpl = open(os.path.join(HERE, "workbook_template.html"), encoding="utf-8").read()
subs = {"T_COND": T_cond, "T_CTRL": T_ctrl, "T_PROF": T_prof, "T_CLIP": T_clip, "T_POS": T_pos, "T_RANK": T_rank, "T_RANK_PROF": T_rank_prof, "T_EXCL": T_excl, "T_BAL": T_bal,
        "T_ALPHA": T_alpha, "T_ITEMS": T_items, "T_COR": T_cor, "T_BEL": T_bel,
        "FIG1": b64("fig1_conditions_dots.png"), "FIG2": b64("fig2_clip_by_ctrl.png"), "FIG3": b64("fig3_bel1_by_condition.png"), "FIG4": b64("fig4_rank_top1.png"), "FIG5": b64("fig5_balance.png"),
        "N_AT1": str(n_at1), "N_AV1": str(n_av1), "N_BOTH": str(n_both), "N_SL3": str(n_sl3), "N_AT1_NEAR": str(n_at1_near),
        "DUR_MED": f"{dur.median():.1f}", "DUR_Q1": f"{dur.quantile(.25):.1f}", "DUR_Q3": f"{dur.quantile(.75):.1f}", "DUR_MIN": f"{dur.min():.1f}", "DUR_MAX": f"{dur.max():.1f}",
        "BEL_HI": f"{bel_hi:.0f}", "BEL_LO": f"{bel_lo:.0f}", "AGE_MEAN": f"{w.BG_age.mean():.1f}", "N_MOBILE": str(int(w.mobile.sum()))}
out = tmpl
for k, v in subs.items(): out = out.replace("[[" + k + "]]", v)
print("stage-1 placeholders filled")

# ============================================================ round 1 (inferential) tables
RES = os.path.join(HERE, "results")
rcsv = lambda f: pd.read_csv(os.path.join(RES, f))
MODELS, PAIRS, CTRL, CON, INT, SE, PL, RKT, ROB, BOOT, LEV = [rcsv(f) for f in ["models_primary.csv","pairwise_all.csv","pairwise_ctrl.csv","contrasts.csv","interactions.csv","simple_effects_clip.csv","participant_level_anova.csv","ranks_tests.csv","robustness.csv","bootstrap_contrasts.csv","variance_check.csv"]]
DVN = {"OH":"OH 综合","OH1":"OH1 可信","OH2":"OH2 有用","OH3":"OH3 愿意参与","AU1":"AU1 真实感","CR1":"CR1 温暖","CR2":"CR2 能力","CR3":"CR3 掌控","PE":"PE 绩效期望","HM":"HM 享乐","BEL1":"BEL1 相信"}
def pfmt(p):
    if pd.isna(p): return "–"
    s = "<.001" if p < .001 else f"{p:.3f}"
    return f"<b>{s}</b>" if p < .05 else (f"<i>{s}</i>" if p < .10 else s)
def cifmt(lo, hi): return f"<span class='sd'>[{lo:.2f}, {hi:.2f}]</span>"
# models
rows = [[f"<b>{DVN[r.dv]}</b>", int(r.n_participants), int(r.n_rows), f"{r.var_participant:.2f}", f"{r.var_residual:.2f}", f"{r.icc:.2f}", f"{r.resid_skew:.2f}", pfmt(r.p_condition_omnibus), pfmt(r.p_clip), pfmt(r.p_position)] for r in MODELS.itertuples()]
T_MODELS = table(rows, ["结果变量","人数","行数","参与者间方差","残差方差","ICC","残差偏度","条件整体 p (LRT)","影片 p","位置 p"], cls="num")
# pairwise summary + significant pairs
order = ["OH","AU1","CR1","CR2","OH1","OH2","OH3","CR3","PE","HM","BEL1"]
summ = PAIRS.groupby("dv").agg(n_pairs=("p_raw","size"), raw_sig=("p_raw", lambda p: int((p<.05).sum())), holm_sig=("p_holm", lambda p: int((p<.05).sum())), bh_sig=("p_bh", lambda p: int((p<.05).sum()))).reindex(order)
rows = [[f"<b>{DVN[d]}</b>", int(r.n_pairs), int(r.raw_sig), int(r.holm_sig), int(r.bh_sig)] for d, r in summ.iterrows()]
T_PAIR_SUMMARY = table(rows, ["结果变量","比较数","raw p &lt; .05","Holm 校正后","BH-FDR 校正后"], cls="num", foot=["合计", int(summ.n_pairs.sum()), int(summ.raw_sig.sum()), int(summ.holm_sig.sum()), int(summ.bh_sig.sum())])
sig = PAIRS[PAIRS.p_raw < .05].copy(); sig["o"] = sig.dv.map({d: i for i, d in enumerate(order)}); sig = sig.sort_values(["o","p_raw"])
rows = [[f"<b>{DVN[r.dv]}</b>", f"{r.A} vs {r.B}", f"{r.mean_A:.2f} vs {r.mean_B:.2f}", f"{int(r.n_A)} / {int(r.n_B)}", f"{r.diff:+.2f} {cifmt(r.ci_lo, r.ci_hi)}", f"{r.d:.2f} {cifmt(r.d_lo, r.d_hi)}", pfmt(r.p_raw), pfmt(r.p_holm), pfmt(r.p_bh), r.direction] for r in sig.itertuples()]
T_PAIR_SIG = table(rows, ["结果变量","比较","均值 A vs B","n","差值 [95% CI]","Cohen's d [95% CI]","raw p","Holm p","BH p","方向"], cls="num")
# control-source pairs
rows = [[f"<b>{DVN[r.dv]}</b>", f"{r.A} vs {r.B}", f"{int(r.n_A)} / {int(r.n_B)}", f"{r.mean_A:.2f} vs {r.mean_B:.2f}", f"{r.diff:+.2f} {cifmt(r.ci_lo, r.ci_hi)}", f"{r.d:.2f} {cifmt(r.d_lo, r.d_hi)}", pfmt(r.p_raw), pfmt(r.p_holm)] for r in CTRL[CTRL.dv.isin(["OH","AU1","CR1","CR2","OH1","OH2","OH3"])].itertuples()]
T_CTRL3 = table(rows, ["结果变量","比较","n","均值","差值 [95% CI]","d [95% CI]","raw p","Holm p（每个 DV 3 对）"], cls="num")
# contrasts
CN = {"C1 human-involved vs AI-only":"C1 有人参与 vs 仅 AI","C2 H vs HA":"C2 H vs HA","C3 disability disclosed vs no mention":"C3 告知残障 vs 不提及","C4 intellectual vs mobility":"C4 智力 vs 行动","C5a intellectual vs no mention":"C5a 智力 vs 不提及","C5b mobility vs no mention":"C5b 行动 vs 不提及"}
rows = []
for dv in ["OH","AU1","CR1","CR2","CR3","OH1","OH2","OH3","PE","HM","BEL1"]:
    for r in CON[CON.dv == dv].itertuples():
        rows.append([f"<b>{DVN[dv]}</b>", CN[r.contrast], f"{int(r.n_A)} / {int(r.n_B)}", f"{r.mean_A:.2f} vs {r.mean_B:.2f}", f"{r.diff:+.2f} {cifmt(r.ci_lo, r.ci_hi)}", f"{r.d:.2f} {cifmt(r.d_lo, r.d_hi)}", pfmt(r.p_raw), pfmt(r.p_holm_4dv), pfmt(r.p_bh_primary12), "主" if r.status == "primary" else "次"])
T_CON = table(rows, ["结果变量","对比","n","均值","差值 [95% CI]","d [95% CI]","raw p","Holm p（4 个主 DV）","BH p（12 个主检验）","性质"], cls="num")
# interactions pivot
IN = {"clip x control source (2x2 df=4)":"影片 × 控制来源","clip x human-vs-AI (df=2)":"影片 × 有人/仅AI","position x condition (df=12)":"位置 × 条件","control source x profile, within H/HA (df=2)":"控制来源 × 画像（H/HA 内）","clip x profile, within H/HA (df=4)":"影片 × 画像（H/HA 内）","profile main effect, within H/HA (df=2)":"画像主效应（H/HA 内）"}
piv = INT.pivot(index="dv", columns="interaction", values="p").reindex(["OH","AU1","CR1","CR2","OH1","OH2","OH3","CR3"])
cols = list(IN.keys()); rows = [[f"<b>{DVN[d]}</b>"] + [pfmt(piv.loc[d, c]) if c in piv.columns and not pd.isna(piv.loc[d, c]) else "–" for c in cols] for d in piv.index]
T_INT = table(rows, ["结果变量"] + [IN[c] for c in cols], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", r.clip, f"{r.mean_human:.2f} vs {r.mean_AI:.2f}", f"{r.diff:+.2f}", f"{r.d:.2f}", pfmt(r.p_raw)] for r in SE.itertuples()]
T_SIMPLE = table(rows, ["结果变量","影片","均值 有人 vs 仅 AI","差值","d","raw p（Welch，行级）"], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", pfmt(r.p_condition_omnibus), pfmt(r.p_ctrl_HHA), pfmt(r.p_profile), pfmt(r.p_ctrl_x_profile)] for r in PL.itertuples()]
T_PL = table(rows, ["结果变量","7 条件整体 p","H vs HA p","画像 p","控制来源 × 画像 p"], cls="num")
# ranks
TN = {"human operator ranked #1: HA vs H (odds ratio, GEE logit)":"人类操作员排第 1：HA vs H（优势比）","human operator ranked #1: disability disclosed vs no mention (OR, GEE logit)":"人类操作员排第 1：告知残障 vs 不提及（优势比）","AI ranked #1: A vs HA (OR, GEE logit)":"AI 排第 1：A vs HA（优势比）"}
rows = []
for r in RKT.itertuples():
    if r.question in ["responsibility","credit"]:
        rows.append([f"<b>{'责任' if r.question=='responsibility' else '功劳'}</b>", TN[r.test], f"{100*r.share_H:.0f}% → {100*r.share_HA:.0f}%", f"{r.estimate:.2f} {cifmt(r.ci_lo, r.ci_hi)}", pfmt(r.p_raw)])
    else:
        rows.append(["<b>责任 vs 功劳</b>", r.test.replace("#1 for responsibility minus credit (participant-level share, Wilcoxon)", "排第 1 的比例：责任 − 功劳（参与者层，Wilcoxon）"), f"{100*r.share_H:.0f}% vs {100*r.share_HA:.0f}%", f"{100*r.estimate:+.1f} 个百分点", pfmt(r.p_raw)])
T_RANKS = table(rows, ["问题","检验","比例","估计 [95% CI]","raw p"], cls="num")
# robustness pivot: p across specs for C1..C3 on primary DVs
SPEC = [("sample: primary (AT1+AV1, n=272)","主模型 LMM，n=272"),("sample: all completes (n=300)","LMM，全部 300 人"),("sample: primary minus 3x straightliners","LMM，去掉全同分者"),("adjusted for GAAIS_pos, NARS, SCM_warm, age","LMM + 协变量"),("participant means: Welch t","参与者均值 Welch t"),("participant means: Mann-Whitney","Mann–Whitney"),("participant cluster bootstrap (4000), equal-weight cell means","参与者 bootstrap"),("ordinal","有序 GEE（单题）")]
ALLR = pd.concat([ROB, BOOT], ignore_index=True)
rows = []
for dv in ["OH","AU1","CR1","CR2"]:
    for cname in ["C1 human-involved vs AI-only","C3 disability disclosed vs no mention","C2 H vs HA"]:
        r = [f"<b>{DVN[dv]}</b>", CN[cname]]
        for key, lab in SPEC:
            sub = ALLR[(ALLR.dv == dv) & (ALLR.contrast == cname) & (ALLR.spec.str.startswith(key))]
            if sub.empty: r.append("–")
            else:
                x = sub.iloc[0]
                r.append(f"{x['diff']:+.2f}<br>{pfmt(x.p_raw)}" if not key.startswith("ordinal") else f"OR {x['diff']:.2f}<br>{pfmt(x.p_raw)}")
        rows.append(r)
T_ROB = table(rows, ["结果变量","对比"] + [lab for _, lab in SPEC], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", f"{r.sd_H:.2f}", f"{r.sd_HA:.2f}", f"{r.sd_A:.2f}", pfmt(r.levene_p)] for r in LEV.itertuples()]
T_LEV = table(rows, ["结果变量","SD · H","SD · HA","SD · A","Levene p"], cls="num")
# ordinal GEE rows for single items (C1)
rows = []
for r in ROB[ROB.spec.str.startswith("ordinal")].itertuples():
    rows.append([f"<b>{DVN[r.dv]}</b>", CN[r.contrast], f"{r.diff:.2f} {cifmt(r.ci_lo, r.ci_hi)}", pfmt(r.p_raw), "全局优势比" if "global" in r.spec else "独立工作相关 + 稳健 SE"])
T_ORD = table(rows, ["单题","对比","优势比 [95% CI]","p","相关结构"], cls="num")
n_pairs_total = int(len(PAIRS)); n_raw_sig = int((PAIRS.p_raw < .05).sum())
subs2 = {"T_MODELS": T_MODELS, "T_PAIR_SUMMARY": T_PAIR_SUMMARY, "T_PAIR_SIG": T_PAIR_SIG, "T_CTRL3": T_CTRL3, "T_CON": T_CON, "T_INT": T_INT, "T_SIMPLE": T_SIMPLE, "T_PL": T_PL, "T_RANKS": T_RANKS, "T_ROB": T_ROB, "T_LEV": T_LEV, "T_ORD": T_ORD,
         "FIG6": b64("fig6_contrasts_forest.png"), "FIG7": b64("fig7_pairwise_matrix.png"), "N_PAIRS_TOTAL": str(n_pairs_total), "N_RAW_SIG": str(n_raw_sig), "N_EXPECTED": f"{0.05*n_pairs_total:.0f}"}
out2 = out
for k, v in subs2.items(): out2 = out2.replace("[[" + k + "]]", v)
print("round-1 tables injected")

# ============================================================ Phase 14 (exploration) tables
E1 = rcsv("e1_moderation.csv"); E2I = rcsv("e2_bel1_interaction.csv"); E2B = rcsv("e2_bel1.csv"); E3 = rcsv("e3_oh_items.csv"); E4 = rcsv("e4_disclosure_moderation.csv"); E5 = rcsv("e5_tost.csv")
E6A = rcsv("e6a_cr2_rel.csv"); E6B = rcsv("e6b_cr2_position.csv"); E7A = rcsv("e7a_blame_credit_clip.csv"); E7C = rcsv("e7c_plackett_luce.csv"); E7D = pd.read_csv(os.path.join(RES, "e7d_second_place.csv")); E8 = rcsv("e8_hm_disclosure.csv"); TL = rcsv("phase14_test_log.csv")
MODN = {"GAAIS positive":"GAAIS 正向态度","NARS negative-to-robots":"NARS 机器人负面态度","GAAIS negative (reversed)":"GAAIS 负向（反向）"}
rows = [[f"<b>{MODN[r.moderator]}</b>", DVN[r.dv], f"{r.slope_AI:+.2f}", f"{r.slope_human:+.2f}", f"{r.interaction:+.2f}", pfmt(r.p_interaction), f"{r.diff_at_minus1SD:+.2f} ({pfmt(r.p_minus1SD)})", f"{r.diff_at_mean:+.2f} ({pfmt(r.p_mean)})", f"{r.diff_at_plus1SD:+.2f} ({pfmt(r.p_plus1SD)})"] for r in E1.itertuples()]
T_E1 = table(rows, ["调节变量","结果变量","斜率 · 仅 AI","斜率 · 有人","交互项","交互 p (LRT)","有人 − AI @ −1 SD","@ 均值","@ +1 SD"], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", f"{r.interaction:+.2f}", pfmt(r.p), f"{r.diff_low_belief:+.2f} ({pfmt(r.p_low)})", f"{r.diff_high_belief:+.2f} ({pfmt(r.p_high)})"] for r in E2I.itertuples()]
T_E2I = table(rows, ["结果变量","有人 × BEL1 交互项","p (LRT)","有人 − AI @ 低相信（−1 SD）","@ 高相信（+1 SD）"], cls="num")
piv = E2B.pivot_table(index=["dv","contrast"], columns="sample", values=["diff","p"])
rows = []
for dv in ["OH","AU1","CR1","CR2"]:
    for cn in ["C1 human vs AI","C2 H vs HA","C3 disclosed vs none"]:
        r = [f"<b>{DVN[dv]}</b>", cn]
        for smp in ["primary n=272","believers BEL1>=5","disbelievers BEL1<=3"]:
            r.append(f"{piv.loc[(dv, cn), ('diff', smp)]:+.2f} ({pfmt(piv.loc[(dv, cn), ('p', smp)])})")
        rows.append(r)
T_E2B = table(rows, ["结果变量","对比","主样本 272","相信者 BEL1 ≥ 5（206 人，A 30）","不相信者 BEL1 ≤ 3（46 人，A 3）"], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", f"{r['diff']:+.2f}", cifmt(r.ci_lo, r.ci_hi), pfmt(r.p_boot)] for _, r in E3.iterrows()]
T_E3 = table(rows, ["OH 单题","有人 − AI","bootstrap 95% CI","bootstrap p"], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", pfmt(r.p_disab_x_clip), f"{r.diff_REL:+.2f} ({pfmt(r.p_REL)})", f"{r.diff_ADV:+.2f} ({pfmt(r.p_ADV)})", f"{r.diff_COL:+.2f} ({pfmt(r.p_COL)})", pfmt(r.p_BG_freq_disability), pfmt(r.p_SCM_warm), f"{r.disab_effect_low_SCM_warm:+.2f} ({pfmt(r.p_low_SCM_warm)})", pfmt(r.p_SCM_comp)] for r in E4.itertuples()]
T_E4 = table(rows, ["结果变量","告知 × 影片 p","告知效应 · REL","· ADV","· COL","告知 × 接触频率 p","告知 × SCM 温暖 p","告知效应 @ 低 SCM 温暖","告知 × SCM 能力 p"], cls="num")
CN2 = {"C2 H vs HA":"C2 H vs HA","C3 disclosed vs none":"C3 告知残障 vs 不提及","C4 intellectual vs mobility":"C4 智力 vs 行动"}
def verdict(r):
    if r.p_tost_035 < .05: return "等价（±0.35 SD 内）"
    if r.p_tost_050 < .05: return "等价（±0.50 SD 内）"
    return "不能宣称等价"
rows = [[f"<b>{DVN[r.dv]}</b>", CN2[r.contrast], f"{r.d:+.2f}", cifmt(r.d90_lo, r.d90_hi), pfmt(r.p_tost_035), pfmt(r.p_tost_050), verdict(r)] for r in E5.itertuples()]
T_E5 = table(rows, ["结果变量","对比","d","d 的 90% CI","TOST p，界 ±0.35","TOST p，界 ±0.50","结论"], cls="num")
rows = [[f"<b>{r.clip}</b>", f"{r.mean_human:.2f} vs {r.mean_AI:.2f}", f"{r.OR_human:.2f} {cifmt(r.or_lo, r.or_hi)}", pfmt(r.p_ordinal)] for r in E6A.itertuples()]
T_E6A = table(rows, ["影片","CR2 均值 有人 vs 仅 AI","有序 logit 优势比（有人）","p"], cls="num")
rows = [[f"<b>{r.condition}</b>", f"{r._2:.2f}", f"{r._3:.2f}", f"{r._4:.2f}"] for r in E6B.itertuples()]
T_E6B = table(rows, ["条件","第 1 段","第 2 段","第 3 段"], cls="num")
rows = [[f"<b>{r.clip}</b>", f"{100*r.share_blame:.0f}%", f"{100*r.share_credit:.0f}%", f"{int(r.blame_only)} / {int(r.credit_only)}", pfmt(r.p_mcnemar_exact)] for r in E7A.itertuples()]
T_E7A = table(rows, ["影片（HA，人类操作员）","责任排第 1","功劳排第 1","只在责任 / 只在功劳排第 1 的人数","McNemar 精确 p"], cls="num")
ACTN = {"CTRL":"人类操作员","AI":"AI 系统/提供方","ORG":"OriHime/提供方","USER":"影片中的人"}
rows = []
for q, ql in [("responsibility","责任"),("credit","功劳")]:
    for k in ["H","HA","A"]:
        sub = E7C[(E7C.question == q) & (E7C.ctrl == k)]; r = [f"<b>{ql}</b> · {k}"]
        for a in ["CTRL","AI","ORG","USER"]:
            x = sub[sub.actor == a]; r.append("未提供" if x.empty else f"{x.iloc[0].worth:.2f} {cifmt(x.iloc[0].ci_lo, x.iloc[0].ci_hi)}")
        rows.append(r)
T_E7C = table(rows, ["问题 · 控制来源"] + [ACTN[a] for a in ["CTRL","AI","ORG","USER"]], cls="num")
rows = [[f"<b>{'责任' if r.question == 'R1' else '功劳'}</b>", f"{100*r.AI:.0f}%", f"{100*r.ORG:.0f}%", f"{100*r.USER:.0f}%"] for r in E7D.itertuples()]
T_E7D = table(rows, ["HA，操作员排第 1 时谁排第 2","AI","OriHime/提供方","影片中的人"], cls="num")
SPN = {"OLS, disab + ctrl":"OLS：告知 + 控制来源","OLS + covariates (GAAIS, NARS, SCM_warm, age)":"OLS + 协变量","within H only: disclosed vs none (Welch)":"只在 H 内（Welch）","within HA only: disclosed vs none (Welch)":"只在 HA 内（Welch）","Mann-Whitney":"Mann–Whitney","participant bootstrap (equal-weight cells)":"参与者 bootstrap"}
rows = [[f"<b>{SPN[r.spec]}</b>", f"{r['diff']:+.2f}", cifmt(r.ci_lo, r.ci_hi) if not pd.isna(r.ci_lo) else "–", pfmt(r.p), int(r.n)] for _, r in E8.iterrows()]
T_E8 = table(rows, ["设定","告知 − 不提及（HM）","95% CI","p","n"], cls="num")
BK = TL.groupby("block").agg(n=("p","size"), sig=("p", lambda p: int((p < .05).sum())))
BKN = {"E1":"态度 × 控制来源","E2":"BEL1 调节与子样本","E3":"OH 单题 bootstrap","E4":"残障告知的调节","E5":"等价性 TOST","E6":"CR2 苗头","E7":"排序模型","E8":"HM 苗头"}
BKI = {"E1":"3 个交互显著，方向一致","E2":"交互不可解释（A 组不相信者仅 3 人）；相信者子样本里 C1 仍成立","E3":"OH2 有用","E4":"零个显著：没有找到调节变量","E5":"p &lt; .05 表示“等价”，是想要的结果","E6":"REL 特异的能力扣分 p = .037；位置交互分解后消失","E7":"平均名次比较受选项数影响，不计为发现；PL 与第 2 名是描述性结果","E8":"只在 HA 内显著，由 HA1 单格造成"}
rows = [[f"<b>{b}</b> {BKN[b]}", int(r.n), int(r.sig), BKI[b]] for b, r in BK.iterrows()]
T_E_BOOK = table(rows, ["模块","检验数","p &lt; .05","怎么读"], cls="num", foot=["合计", int(BK.n.sum()), int(BK.sig.sum()), f"纯随机预期约 {0.05*BK.n.sum():.0f} 个"])
subs3 = {"T_E1": T_E1, "T_E2I": T_E2I, "T_E2B": T_E2B, "T_E3": T_E3, "T_E4": T_E4, "T_E5": T_E5, "T_E6A": T_E6A, "T_E6B": T_E6B, "T_E7A": T_E7A, "T_E7C": T_E7C, "T_E7D": T_E7D, "T_E8": T_E8, "T_E_BOOK": T_E_BOOK,
         "FIG8": b64("fig8_e1_moderation.png"), "FIG9": b64("fig9_plackett_luce.png")}
def md2html(md):
    inline = lambda t: re.sub(r"`([^`]+)`", r"<code>\1</code>", re.sub(r"\*([^*]+)\*", r"<i>\1</i>", re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", html.escape(t, quote=False))))
    out, para, tbl, lst = [], [], [], []
    def flush():
        nonlocal para, tbl, lst
        if para: out.append("<p>" + inline(" ".join(para)) + "</p>"); para = []
        if tbl:
            rows = [r for r in tbl if not re.match(r"^\|?\s*-{3,}", r.strip("| "))]
            cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
            if cells:
                h = "".join(f"<th>{inline(c)}</th>" for c in cells[0]); b = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in cells[1:])
                out.append(f"<div class='tscroll'><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>")
            tbl = []
        if lst: out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in lst) + "</ul>"); lst = []
    for line in md.split("\n"):
        st = line.strip()
        if st.startswith("|"): 
            if para or lst: flush()
            tbl.append(st); continue
        if tbl and not st.startswith("|"): flush()
        if st.startswith("#"):
            flush(); lvl = len(st) - len(st.lstrip("#")); out.append(f"<h{min(lvl,3)}>{inline(st.lstrip('#').strip())}</h{min(lvl,3)}>"); continue
        if st.startswith(">"):
            flush(); out.append(f"<blockquote>{inline(st.lstrip('> ').strip())}</blockquote>"); continue
        if st.startswith("- "):
            if para: flush()
            lst.append(st[2:].strip()); continue
        if st == "": flush(); continue
        if lst: flush()
        para.append(st)
    flush(); return "\n".join(out)
PAPD = os.path.join(HERE, "paper")
rmd = lambda f: md2html(open(os.path.join(PAPD, f), encoding="utf-8").read())
pfig = lambda name: "data:image/png;base64," + base64.b64encode(open(os.path.join(PAPD, "figures", name), "rb").read()).decode()
subs3.update({"DOC_STORY": rmd("story.md"), "DOC_METHODS": rmd("methods.md"), "DOC_RESULTS": rmd("results.md"), "DOC_LIMITS": rmd("limitations.md"), "DOC_TABLES": rmd("tables.md"),
              "PFIG1": pfig("fig1_condition_means.png"), "PFIG2": pfig("fig2_contrasts.png"), "PFIG3": pfig("fig3_clip_by_control.png"), "PFIG4": pfig("fig4_attribution_worths.png"), "PFIG5": pfig("fig5_attitude_moderation.png")})
# ---- disability sweep tables
D1 = rcsv("d1_disclosure_by_position.csv"); D2 = rcsv("d2_first_clip.csv"); D4 = rcsv("d4_attribution_by_disclosure.csv"); D7 = rcsv("d7_bayes_factors.csv"); DTL = rcsv("disability_sweep_test_log.csv")
rows = [[f"<b>{DVN[r.dv]}</b>", pfmt(r.p_disab_x_pos), f"{r.eff_pos1:+.2f} ({pfmt(r.p_pos1)})", f"{r.eff_pos2:+.2f} ({pfmt(r.p_pos2)})", f"{r.eff_pos3:+.2f} ({pfmt(r.p_pos3)})"] for r in D1.itertuples()]
T_D1 = table(rows, ["结果变量","告知 × 位置 p (LRT)","告知效应 · 第 1 段","· 第 2 段","· 第 3 段"], cls="num")
Lh = L[(L.ctrl != "A") & L.pid.isin(w[(w.at1_pass==1)&(w.av1_pass==1)].participant_id)].copy(); Lh["disab"] = Lh.condition.isin(["H2","H3","HA2","HA3"]).astype(int)
pv = Lh.pivot_table(index="pos", columns="disab", values=["OH","AU1","CR1","CR2","CR3"], aggfunc="mean")
rows = [[f"<b>第 {int(pos)} 段</b>"] + [f"{pv.loc[pos, (dv, 0)]:.2f} / {pv.loc[pos, (dv, 1)]:.2f}" for dv in ["OH","AU1","CR1","CR2","CR3"]] for pos in [1,2,3]]
T_D1M = table(rows, ["位置（不提及 / 告知）","OH 综合","AU1","CR1","CR2","CR3"], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", f"{r.mean_disclosed:.2f} vs {r.mean_none:.2f}", f"{r['diff']:+.2f} {cifmt(r.ci_lo, r.ci_hi)}", f"{r.d:+.2f}", pfmt(r.p_ols_hc3), pfmt(r.p_welch)] for _, r in D2.iterrows()]
T_D2 = table(rows, ["结果变量（第一段影片）","告知 vs 不提及","差值 [95% CI]","d","p (OLS, HC3)","p (Welch)"], cls="num")
ACTN2 = {"CTRL":"人类操作员","AI":"AI","ORG":"OriHime/提供方","USER":"影片中的人"}
rows = [[f"<b>{r.ctrl}</b> · {ACTN2[r.actor]}", "责任" if r.question == "responsibility" else "功劳", f"{100*r.share_none:.0f}% → {100*r.share_disclosed:.0f}%", f"{r.OR:.2f} {cifmt(r.ci_lo, r.ci_hi)}", pfmt(r.p)] for r in D4.itertuples()]
T_D4 = table(rows, ["控制来源 · 角色","问题","排第 1：不提及 → 告知","优势比 [95% CI]","p"], cls="num")
rows = [[f"<b>{DVN[r.dv]}</b>", int(r.n_units), f"{r.BF01:.1f}", "强" if r.BF01 > 10 else ("中等" if r.BF01 > 3 else "弱"), "–" if pd.isna(r.BF01_rows) else f"{r.BF01_rows:.1f}"] for r in D7.itertuples()]
T_D7 = table(rows, ["结果变量","独立单位 n","BF01（参与者单位，支持无效应）","证据强度","BF01 按影片行（已弃用）"], cls="num")
AN = rcsv("ranks_common_anchor.csv"); ACTN3 = {"CTRL":"人类操作员","AI":"AI 系统"}
rows = [[f"<b>{ACTN3[r.actor]}</b> 排在提供方和影片中人之前", "责任" if r.question == "responsibility" else "功劳", f"{r.group_A} {100*r.share_A:.1f}% → {r.group_B} {100*r.share_B:.1f}%", f"{r.OR:.2f} {cifmt(r.ci_lo, r.ci_hi)}", pfmt(r.p)] for r in AN.itertuples()]
T_ANCHOR = table(rows, ["共同锚点指标","问题","比例","优势比 [95% CI]","p"], cls="num")
rows = [["<b>AU1 / CR1（d ≈ −.24）</b>", "236", ".11", "354 → ≈ .05；472 → ≈ .025；708 → ≈ .006", "610"], ["<b>OH（d ≈ −.10）</b>", "236", ".49", "708 → ≈ .23", "3442"], ["<b>HM（d ≈ −.26）</b>", "236", ".076", "472 → ≈ .012", "541"]]
T_D8 = table(rows, ["结果变量","现有人类格子人数","现在的 p","效应不变时加人后的 p","80% 功效所需人数（2:1 分配）"], cls="num")
bk = DTL.groupby("block").agg(n=("p","size"), sig=("p", lambda p: int((p < .05).sum())))
BN = {"D1":"告知 × 位置","D2":"只看第一段","D3":"温暖减能力","D4":"HA/H 内归因","D5":"相信程度","D6":"停留时间"}
rows = [[f"<b>{b}</b> {BN.get(b, b)}", int(r.n), int(r.sig)] for b, r in bk.iterrows()]
T_D_BOOK = table(rows, ["模块","检验数","p &lt; .05"], cls="num", foot=["合计", int(bk.n.sum()), int(bk.sig.sum())])
subs3.update({"T_ANCHOR": T_ANCHOR, "T_D1": T_D1, "T_D1M": T_D1M, "T_D2": T_D2, "T_D4": T_D4, "T_D7": T_D7, "T_D8": T_D8, "T_D_BOOK": T_D_BOOK})
out3 = out2
for k, v in subs3.items(): out3 = out3.replace("[[" + k + "]]", v)
left = re.findall(r"\[\[[A-Z0-9_]+\]\]", out3); assert not left, left
# ---- item-code tooltips: every questionnaire code in running text gets the original wording on hover
RAW = os.environ.get("STUDY1_EXPORT") or os.path.join(HERE, "..", "..", "exports", "20260902T104106Z"); CB = pd.read_csv(os.path.join(RAW, "codebook.csv"), encoding="utf-8-sig")
STEM = {r.item_id: (str(r.stem).replace("***", ""), "" if pd.isna(r.value_coding) else str(r.value_coding)) for r in CB.itertuples()}
LIK = "1 = Strongly disagree … 7 = Strongly agree"
def tipfor(code):
    """Return the tooltip text for a code, or None."""
    if code in STEM:
        st, vc = STEM[code]; seg = code.split("_")[0] if code[:3] in ("REL","ADV","COL") else None
        head = f"{code}" + (f" · clip {seg}" if seg else "")
        if "__" in code:
            actor = code.split("__")[1]; return f"{head}\n{st}\nRow ranked: {ACTOR_LABEL[actor]} · {vc}"
        return f"{head}\n{st}" + (f"\n{vc}" if vc else "")
    bare = {
        "OH1": ("In this interaction, OriHime was trustworthy for this task.", LIK), "OH2": ("In this interaction, OriHime was useful for this task.", LIK),
        "OH3": ("I would be willing to take part in an interaction like this one with OriHime.", LIK), "AU1": ("This interaction felt genuine, rather than like the execution of a program.", LIK),
        "CR1": ("The human operator of OriHime was warm. (A 条件: The AI controlling OriHime was warm.)", LIK), "CR2": ("The human operator of OriHime was competent. (A 条件: The AI controlling OriHime was competent.)", LIK),
        "CR3": ("The human operator of OriHime was in control of what OriHime said and did. (只在 H / HA 条件问)", LIK),
        "AT1": ("To show that you are reading carefully, please select “Disagree” for this item. (第二段影片；正确答案 = 2 Disagree)", LIK),
        "AV1": ("Which of the following happened in the interaction you just watched? (第一段影片；四个选项随影片不同)", "comprehension check"),
        "R1": ("Who should bear the greatest responsibility for this outcome? (先给出一个负面结果的想象情境)", "rank 1..n, 1 = greatest; rows: human operator (H/HA), AI system or its provider (HA/A), OriHime or its provider, the person in the video"),
        "R2": ("Who should receive the greatest credit for this outcome? (先给出一个正面结果的想象情境)", "rank 1..n, 1 = greatest; same rows as R1"),
        "BEL1": ("How much DID YOU BELIEVE the description of the OriHime operator you were given at the beginning of the questionnaire?", LIK),
        "OH": ("OH 综合分 = OH1、OH2、OH3 的均值（每段影片一个）", "trustworthy · useful · willing to take part"),
        "PE": ("PE 绩效期望 = PE1–PE4 的均值", "PE1 OriHime would be useful in daily life. · PE2 …increase my chances of achieving things that are important to me. · PE3 …help me accomplish things more quickly. · PE4 …increase my productivity."),
        "HM": ("HM 享乐动机 = HM1–HM3 的均值", "HM1 Conversing with OriHime seems fun. · HM2 …enjoyable. · HM3 …entertaining."),
        "NARS": ("NARS 机器人负面态度 = NARS_01–11 十题的均值（NARS_03、05、06 反向计分；高 = 更负面）", "Nomura et al. (2006), 14 题中施测 10 题"),
        "GAAIS_pos": ("GAAIS 正向分量表 = GAAIS_07、11、12、17、18 的均值（高 = 对 AI 更正面）", "Schepman & Rodway short GAAIS"),
        "GAAIS_neg": ("GAAIS 负向分量表 = GAAIS_08、10、15、19 反向计分后的均值（高 = 更不负面）", "Schepman & Rodway short GAAIS"),
        "GAAIS": ("GAAIS 对 AI 的总体态度量表：正向 5 题 + 负向 4 题（负向反向计分）", "Schepman & Rodway short GAAIS; 作者建议分两个分量表报告"),
        "SCM_comp": ("SCM 能力 = SCM_01–05 的均值：I think people with disabilities are competent / confident / independent / competitive / intelligent.", LIK),
        "SCM_warm": ("SCM 温暖 = SCM_06–09 的均值：I think people with disabilities are tolerant / warm / good natured / sincere.", LIK),
        "SCM": ("SCM 刻板印象内容量表（对残障者）：能力 5 题 + 温暖 4 题", LIK),
        "FU1": ("Would you be willing to be contacted about a paid follow-up interview?", "0 = Yes | 1 = No"),
        "IMP": ("Study 2 · What does the interaction in this video look like to you? Please describe it in your own words.", "open text, 10–2000 characters"),
        "WHO": ("Study 2 · Who do you think is controlling OriHime in this video?", "A human operator, with no AI involved | A human operator with AI assistance | An AI system, with no human operator | I can’t tell"),
        "DIS": ("Study 2 · If a person is involved in controlling OriHime in this video, do you think that person has a disability?", "Yes | No | I can’t tell | I don’t think a person is involved"),
    }
    if code in bare:
        st, vc = bare[code]; return f"{code}\n{st}\n{vc}"
    m = re.match(r"^R([12])_(CTRL|AI|ORG|USER)$", code)
    if m:
        st, vc = bare["R" + m.group(1)]; return f"{code}\n{st}\nRow: {ACTOR_LABEL[m.group(2)]} · rank 1 = greatest"
    return None
ACTOR_LABEL = {"CTRL": "The human operator of OriHime", "AI": "The AI system or its provider", "ORG": "The OriHime or its provider", "USER": "The person in the video who talked with OriHime"}
CODE_RE = re.compile(r"(?<![A-Za-z0-9_])((?:REL|ADV|COL)_(?:OH[123]|AU1|CR[123]|AT1|AV1|R[12](?:__(?:CTRL|AI|ORG|USER))?)|R[12]_(?:CTRL|AI|ORG|USER)|(?:NARS|GAAIS|SCM)_\d{2}|BG_(?:freq_disability|freq_robot|freq_ai|education|country|gender|income|age)|GAAIS_pos|GAAIS_neg|SCM_comp|SCM_warm|OH[123]|AU1|CR[123]|AT1|AV1|BEL1|PE[1-4]|HM[1-3]|FU1|R[12]|IMP|WHO|DIS|NARS|GAAIS|SCM|OH|PE|HM)(?![A-Za-z0-9_])")
def wrap_item_codes(doc):
    parts = re.split(r"(<[^>]+>)", doc); skip = 0; n = 0
    for i, p in enumerate(parts):
        if i % 2 == 1:
            tag = p.lower()
            if re.match(r"<(script|style|title)\b", tag): skip += 1
            elif re.match(r"</(script|style|title)\b", tag): skip = max(0, skip - 1)
            continue
        if skip or not p.strip(): continue
        def sub(m):
            nonlocal n
            code = m.group(1); tip = tipfor(code)
            if tip is None: return code
            n += 1; return f'<span class="ic" tabindex="0" data-tip="{html.escape(tip, quote=True)}">{code}</span>'
        parts[i] = CODE_RE.sub(sub, p)
    return "".join(parts), n

# ============================================================ bilingual assembly
import json
from en_labels import LABELS
ALL = {}; ALL.update(subs); ALL.update(subs2); ALL.update(subs3)
FIGKEYS = [k for k in ALL if re.match(r"^P?FIG\d+$", k)]
FIGSTORE = {k: ALL[k] for k in FIGKEYS}
def fill(t):
    t = re.sub(r'src="\[\[(P?FIG\d+)\]\]"', r'data-fig="\1"', t)
    for k, v in ALL.items():
        if k in FIGKEYS: continue
        t = t.replace("[[" + k + "]]", v)
    left = re.findall(r"\[\[[A-Z0-9_]+\]\]", t); assert not left, left
    return t
zh_full = tmpl
head, rest = zh_full.split('<div class="wrap">', 1)
k = rest.index("\n<script>"); wrap_zh = '<div class="wrap" data-lang="zh">' + rest[:k]; tail = rest[k:]
en_tmpl = open(os.path.join(HERE, "workbook_template_en.html"), encoding="utf-8").read()
wrap_en = en_tmpl.replace('<div class="wrap">', '<div class="wrap" data-lang="en" hidden>', 1)
wrap_zh = fill(wrap_zh); wrap_en = fill(wrap_en)
wrap_en = re.sub(r'\bid="([^"]+)"', r'id="\1-en"', wrap_en); wrap_en = re.sub(r'href="#([^"]+)"', r'href="#\1-en"', wrap_en)
def translate(t):
    for zh_s, en_s in sorted(LABELS.items(), key=lambda kv: -len(kv[0])): t = t.replace(zh_s, en_s)
    return t
wrap_en = translate(wrap_en)
figstore = '<script type="application/json" id="figstore">' + json.dumps(FIGSTORE) + '</script>'
doc = head + wrap_zh + "\n" + wrap_en + "\n" + figstore + tail
doc, n_wrapped = wrap_item_codes(doc)
a = doc.index('<div class="wrap" data-lang="en"'); b = doc.index('<script type="application/json" id="figstore">')
doc = doc[:a] + translate(doc[a:b]) + doc[b:]
open(OUT, "w", encoding="utf-8").write(doc)
open(os.path.join(HERE, "workbook.html"), "w", encoding="utf-8").write('<meta charset="utf-8">\n' + doc)
leftover = sorted(set(re.findall(r"[\u4e00-\u9fff][^<>\"]*", doc[a:b])))
print("bilingual workbook written:", OUT, len(doc)//1024, "KB; item codes wrapped:", n_wrapped, "; CJK leftovers in EN block:", len(leftover))
for x in leftover[:60]: print("   ", x[:90])
