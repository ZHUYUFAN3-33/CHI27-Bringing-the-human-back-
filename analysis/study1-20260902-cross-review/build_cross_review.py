"""Build an independent, read-only cross-review of the Study 1 workbook.

The script reads the original raw/derived data and results, performs a small set
of independent checks, and writes only inside this sibling cross-review folder.
It never imports or executes the original analysis scripts.
"""

from __future__ import annotations

from html import escape
from pathlib import Path
import math

import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.api as sm
import statsmodels.formula.api as smf
from statsmodels.genmod.cov_struct import Exchangeable
from statsmodels.genmod.generalized_estimating_equations import GEE


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ORIGINAL = HERE.parent / "study1-20260902"
RAW = ROOT / "exports" / "20260902T104106Z"
RESULTS = ORIGINAL / "results"

OUTCOMES = ["OH", "AU1", "CR1", "CR2"]
LABELS = {
    "OH": "OriHime 综合评价",
    "AU1": "互动真实感",
    "CR1": "操作员温暖",
    "CR2": "操作员能力",
    "CR3": "操作员掌控",
    "PE": "绩效期望",
    "HM": "享乐动机",
}


def fmt_p(p: float) -> str:
    if pd.isna(p):
        return "—"
    if p < 0.001:
        return "&lt;.001"
    return f"{p:.3f}".lstrip("0")


def fmt_num(x: float, digits: int = 2, plus: bool = False) -> str:
    if pd.isna(x):
        return "—"
    return f"{x:+.{digits}f}" if plus else f"{x:.{digits}f}"


def severity(level: str, title: str, body: str) -> str:
    return (
        f'<article class="flag {level}"><div class="flag-head">'
        f'<span class="signal">{escape(level.upper())}</span><h3>{title}</h3></div>'
        f'<div class="flag-body">{body}</div></article>'
    )


def equal_cell_weights(ctrl: np.ndarray, profile: np.ndarray) -> np.ndarray:
    """Weights for mean(H2,H3,HA2,HA3) - mean(H1,HA1)."""
    weights = np.zeros(len(profile), dtype=float)
    for source in ("H", "HA"):
        for prof in (1, 2, 3):
            idx = (ctrl == source) & (profile == prof)
            weights[idx] = (-0.5 if prof == 1 else 0.25) / idx.sum()
    return weights


def randomization_pvalues(pm: pd.DataFrame, variables: list[str], draws: int = 50_000) -> dict[str, float]:
    """Shuffle profile within H and HA, preserving observed cell sizes."""
    x = pm[variables].to_numpy(float)
    ctrl = pm["ctrl"].to_numpy()
    profile = pm["profile"].to_numpy(int)
    observed = equal_cell_weights(ctrl, profile) @ x
    counts = np.zeros(len(variables), dtype=int)
    groups = [np.flatnonzero(ctrl == source) for source in ("H", "HA")]
    rng = np.random.default_rng(20260904)
    for _ in range(draws):
        perm = profile.copy()
        for idx in groups:
            perm[idx] = rng.permutation(perm[idx])
        simulated = equal_cell_weights(ctrl, perm) @ x
        counts += np.abs(simulated) >= np.abs(observed)
    return {v: (int(c) + 1) / (draws + 1) for v, c in zip(variables, counts)}


def forest_row(dv: str, estimate: float, lo: float, hi: float) -> str:
    axis_lo, axis_hi = -0.60, 0.30
    pct = lambda value: 100 * (value - axis_lo) / (axis_hi - axis_lo)
    left = max(0.0, min(100.0, pct(lo)))
    right = max(0.0, min(100.0, pct(hi)))
    point = max(0.0, min(100.0, pct(estimate)))
    zero = pct(0.0)
    return f"""
      <div class="forest-row">
        <div><b>{LABELS[dv]}</b><small>{dv}</small></div>
        <div class="track" aria-label="d {estimate:+.2f}, 95% CI {lo:+.2f} to {hi:+.2f}">
          <span class="zero" style="left:{zero:.2f}%"></span>
          <span class="ci" style="left:{left:.2f}%;width:{right-left:.2f}%"></span>
          <span class="dot" style="left:{point:.2f}%"></span>
        </div>
        <div class="mono">{estimate:+.2f} [{lo:+.2f}, {hi:+.2f}]</div>
      </div>"""


def build() -> None:
    # Inputs. The original directory is read only from this script's perspective.
    w_all = pd.read_csv(ORIGINAL / "participants_clean.csv")
    long_all = pd.read_csv(ORIGINAL / "long_segments.csv")
    ranks_all = pd.read_csv(ORIGINAL / "ranks_long.csv")
    raw_wide = pd.read_csv(RAW / "wide.csv", encoding="utf-8-sig")

    w_all["usable"] = (w_all["at1_pass"] == 1) & (w_all["av1_pass"] == 1)
    primary_ids = set(w_all.loc[w_all["usable"], "participant_id"])
    w = w_all[w_all["usable"]].copy()
    long = long_all[long_all["pid"].isin(primary_ids)].copy()
    human_long = long[long["ctrl"] != "A"].copy()
    human_w = w[w["ctrl"] != "A"].copy()
    human_w["disab"] = human_w["profile"].isin([2, 3]).astype(int)

    pm = (
        human_long.groupby(["pid", "condition", "ctrl", "profile"], as_index=False)
        [["OH", "AU1", "CR1", "CR2", "CR3"]]
        .mean()
    )
    pm["profile"] = pm["profile"].astype(int)
    pm["disab"] = pm["profile"].isin([2, 3]).astype(int)

    # Raw -> derived integrity checks, independently recomputed.
    raw_complete = raw_wide[raw_wide["status"] == "completed"].copy()
    id_match = set(raw_complete["participant_id"]) == set(w_all["participant_id"])
    meta = raw_complete.set_index("participant_id")[["condition", "ctrl", "profile"]]
    derived_meta = w_all.set_index("participant_id")[["condition", "ctrl", "profile"]]
    metadata_match = meta.sort_index().fillna(-1).equals(derived_meta.sort_index().fillna(-1))
    max_oh_error = 0.0
    for segment in ("REL", "ADV", "COL"):
        raw_oh = raw_complete.set_index("participant_id")[[f"{segment}_OH1", f"{segment}_OH2", f"{segment}_OH3"]].mean(axis=1)
        derived_oh = long_all[long_all["segment"] == segment].set_index("pid")["OH"]
        max_oh_error = max(max_oh_error, float((raw_oh.sort_index() - derived_oh.sort_index()).abs().max()))
    pe_raw = raw_complete[["PE1", "PE2", "PE3", "PE4"]].mean(axis=1).to_numpy()
    hm_raw = raw_complete[["HM1", "HM2", "HM3"]].mean(axis=1).to_numpy()
    max_scale_error = max(
        float(np.max(np.abs(pe_raw - raw_complete["participant_id"].map(w_all.set_index("participant_id")["PE"]).to_numpy()))),
        float(np.max(np.abs(hm_raw - raw_complete["participant_id"].map(w_all.set_index("participant_id")["HM"]).to_numpy()))),
    )

    checks = [
        ("原始完成者 ↔ 清洗表 ID", id_match, f"300 ↔ {len(w_all)}"),
        ("condition / ctrl / profile", metadata_match, "逐行一致" if metadata_match else "发现差异"),
        ("每人三段影片", len(long_all) == 3 * len(w_all) and long_all.groupby("pid").size().eq(3).all(), f"{len(long_all)} 行"),
        ("OH1–3 → OH", max_oh_error < 1e-12, f"最大绝对误差 {max_oh_error:.1e}"),
        ("PE / HM 合成分", max_scale_error < 1e-12, f"最大绝对误差 {max_scale_error:.1e}"),
        ("主样本规则", len(primary_ids) == 272, f"AT1 + AV1：{len(primary_ids)} 人"),
    ]

    # Original results plus independent participant-level checks.
    contrasts = pd.read_csv(RESULTS / "contrasts.csv")
    c3 = contrasts[
        contrasts["contrast"].eq("C3 disability disclosed vs no mention")
        & contrasts["dv"].isin(OUTCOMES)
    ].set_index("dv")
    robustness = pd.read_csv(RESULTS / "robustness.csv")
    bootstrap = pd.read_csv(RESULTS / "bootstrap_contrasts.csv")
    tost = pd.read_csv(RESULTS / "e5_tost.csv")

    # Refit the primary models without importing the original pipeline.
    # C3 is the equal-weight mean of H2/H3/HA2/HA3 minus H1/HA1.
    refit_rows = []
    for dv in OUTCOMES + ["CR3"]:
        model_data = long if dv != "CR3" else human_long
        model = smf.mixedlm(
            f"{dv} ~ C(condition, Treatment('H1')) + C(segment, Treatment('REL')) + C(pos, Treatment(1))",
            model_data.dropna(subset=[dv]),
            groups=model_data.dropna(subset=[dv])["pid"],
        ).fit(reml=True, method=["lbfgs"])
        vector = pd.Series(0.0, index=model.fe_params.index)
        for condition, weight in {
            "H1": -0.5,
            "H2": 0.25,
            "H3": 0.25,
            "HA1": -0.5,
            "HA2": 0.25,
            "HA3": 0.25,
        }.items():
            if condition != "H1":
                vector[f"C(condition, Treatment('H1'))[T.{condition}]"] += weight
        test = model.t_test(vector.to_numpy().reshape(1, -1))
        refit_rows.append({
            "dv": dv,
            "estimate": float(np.asarray(test.effect).item()),
            "p": float(np.asarray(test.pvalue).item()),
            "converged": bool(model.converged),
        })
    refit = pd.DataFrame(refit_rows).set_index("dv")
    max_c3_estimate_delta = float((refit.loc[OUTCOMES, "estimate"] - c3.loc[OUTCOMES, "diff"]).abs().max())
    max_c3_p_delta = float((refit.loc[OUTCOMES, "p"] - c3.loc[OUTCOMES, "p_raw"]).abs().max())
    checks.append((
        "主 LMM / C3 独立重拟合",
        bool(refit["converged"].all() and max_c3_estimate_delta < 1e-9 and max_c3_p_delta < 1e-9),
        f"5 个模型收敛；最大 Δ 差 {max_c3_estimate_delta:.1e}，最大 p 差 {max_c3_p_delta:.1e}",
    ))

    independent_rows: list[dict[str, float | str]] = []
    for dv in OUTCOMES:
        model = smf.ols(f"{dv} ~ disab + C(ctrl)", pm).fit(cov_type="HC3")
        full = pm.merge(
            human_w[["participant_id", "BG_age", "GAAIS_pos", "NARS", "SCM_warm"]],
            left_on="pid",
            right_on="participant_id",
            how="left",
        ).dropna(subset=["BG_age"])
        adjusted = smf.ols(
            f"{dv} ~ disab + C(ctrl) + BG_age + GAAIS_pos + NARS + SCM_warm", full
        ).fit(cov_type="HC3")
        boot = bootstrap[(bootstrap["dv"] == dv) & bootstrap["contrast"].str.startswith("C3")].iloc[0]
        adj_lmm = robustness[
            (robustness["dv"] == dv)
            & robustness["contrast"].str.startswith("C3")
            & robustness["spec"].str.startswith("adjusted")
        ].iloc[0]
        independent_rows.append({
            "dv": dv,
            "participant_hc3_est": model.params["disab"],
            "participant_hc3_p": model.pvalues["disab"],
            "independent_adjusted_est": adjusted.params["disab"],
            "independent_adjusted_p": adjusted.pvalues["disab"],
            "bootstrap_p": boot["p_raw"],
            "original_adjusted_est": adj_lmm["diff"],
            "original_adjusted_p": adj_lmm["p_raw"],
        })
    independent = pd.DataFrame(independent_rows).set_index("dv")
    perm_p = randomization_pvalues(pm, OUTCOMES)

    # Participant-level BIC approximation: appropriate independent-unit count for a between-person effect.
    bf_original = pd.read_csv(RESULTS / "d7_bayes_factors.csv").set_index("dv")
    bf_rows = []
    for dv in ["OH", "AU1", "CR1", "CR2", "CR3"]:
        m1 = smf.ols(f"{dv} ~ disab + C(ctrl)", pm).fit()
        m0 = smf.ols(f"{dv} ~ C(ctrl)", pm).fit()
        bf_rows.append({
            "dv": dv,
            "original_BF01": bf_original.loc[dv, "BF01"],
            "participant_BF01": math.exp((m1.bic - m0.bic) / 2),
        })
    for dv in ["PE", "HM"]:
        bf_rows.append({
            "dv": dv,
            "original_BF01": bf_original.loc[dv, "BF01"],
            "participant_BF01": bf_original.loc[dv, "BF01"],
        })
    bf = pd.DataFrame(bf_rows)

    # C3 power and chance imbalance.
    n_dis = int((pm["disab"] == 1).sum())
    n_nom = int((pm["disab"] == 0).sum())
    mde_80 = (stats.norm.ppf(0.975) + stats.norm.ppf(0.80)) * math.sqrt(1 / n_dis + 1 / n_nom)
    power_d24 = stats.norm.cdf(-1.96 - 0.24 / math.sqrt(1 / n_dis + 1 / n_nom)) + 1 - stats.norm.cdf(1.96 - 0.24 / math.sqrt(1 / n_dis + 1 / n_nom))
    balance_rows = []
    for variable in ["BG_age", "GAAIS_pos", "NARS", "SCM_comp", "SCM_warm"]:
        a = human_w.loc[human_w["disab"] == 1, variable].dropna()
        b = human_w.loc[human_w["disab"] == 0, variable].dropna()
        pooled_sd = math.sqrt(((len(a) - 1) * a.var() + (len(b) - 1) * b.var()) / (len(a) + len(b) - 2))
        balance_rows.append({
            "variable": variable,
            "disclosed": a.mean(),
            "not_mentioned": b.mean(),
            "smd": (a.mean() - b.mean()) / pooled_sd,
            "welch_p": stats.ttest_ind(a, b, equal_var=False).pvalue,
        })
    balance = pd.DataFrame(balance_rows)

    all_human = w_all[w_all["ctrl"] != "A"].copy()
    all_human["disab"] = all_human["profile"].isin([2, 3]).astype(int)
    pass_table = pd.crosstab(all_human["disab"], all_human["usable"])
    pass_fisher_p = stats.fisher_exact(pass_table.to_numpy()).pvalue
    ceiling_share = float((human_long["CR2"] >= 6).mean())

    # Rank comparison against actors common to H and HA, to expose choice-set sensitivity.
    rank = ranks_all[ranks_all["pid"].isin(primary_ids) & ranks_all["ctrl"].isin(["H", "HA"])]
    rank_wide = rank.pivot_table(
        index=["pid", "ctrl", "segment", "question"], columns="actor", values="rank"
    ).reset_index()
    rank_wide["operator_best_common"] = (
        rank_wide["CTRL"] < rank_wide[["ORG", "USER"]].min(axis=1)
    ).astype(int)
    anchor_rows = []
    for question in ["R1", "R2"]:
        frame = rank_wide[rank_wide["question"] == question].copy()
        frame["is_HA"] = (frame["ctrl"] == "HA").astype(int)
        gee = GEE.from_formula(
            "operator_best_common ~ is_HA + C(segment)",
            groups="pid",
            data=frame,
            family=sm.families.Binomial(),
            cov_struct=Exchangeable(),
        ).fit()
        anchor_rows.append({
            "question": question,
            "share_H": frame.loc[frame["ctrl"] == "H", "operator_best_common"].mean(),
            "share_HA": frame.loc[frame["ctrl"] == "HA", "operator_best_common"].mean(),
            "odds_ratio": math.exp(gee.params["is_HA"]),
            "p": gee.pvalues["is_HA"],
        })
    anchors = pd.DataFrame(anchor_rows)

    # Machine-readable audit table kept next to the HTML.
    review_results = c3[["diff", "ci_lo", "ci_hi", "d", "d_lo", "d_hi", "p_raw", "p_holm_4dv"]].join(independent)
    review_results["randomization_p"] = pd.Series(perm_p)
    review_results = review_results.join(refit.loc[OUTCOMES, ["estimate", "p", "converged"]].add_prefix("refit_lmm_"))
    review_results.to_csv(HERE / "review_results.csv")

    checks_html = "".join(
        f'<tr><td>{escape(name)}</td><td><span class="pill {"pass" if ok else "fail"}">{"通过" if ok else "需查"}</span></td><td>{escape(detail)}</td></tr>'
        for name, ok, detail in checks
    )

    effects_rows = []
    for dv in OUTCOMES:
        row = c3.loc[dv]
        ind = independent.loc[dv]
        effects_rows.append(
            "<tr>"
            f"<th>{LABELS[dv]} <code>{dv}</code></th>"
            f"<td>{fmt_num(row['diff'], plus=True)} [{fmt_num(row['ci_lo'], plus=True)}, {fmt_num(row['ci_hi'], plus=True)}]</td>"
            f"<td>{fmt_num(row['d'], plus=True)} [{fmt_num(row['d_lo'], plus=True)}, {fmt_num(row['d_hi'], plus=True)}]</td>"
            f"<td>{fmt_p(row['p_raw'])}</td>"
            f"<td>{fmt_p(ind['participant_hc3_p'])}</td>"
            f"<td>{fmt_p(ind['bootstrap_p'])}</td>"
            f"<td>{fmt_p(perm_p[dv])}</td>"
            f"<td>{fmt_num(ind['original_adjusted_est'], plus=True)} / {fmt_p(ind['original_adjusted_p'])}</td>"
            "</tr>"
        )
    effects_html = "".join(effects_rows)
    forest_html = "".join(
        forest_row(dv, c3.loc[dv, "d"], c3.loc[dv, "d_lo"], c3.loc[dv, "d_hi"])
        for dv in OUTCOMES
    )

    tost_rows = []
    for dv in OUTCOMES:
        row = tost[(tost["dv"] == dv) & tost["contrast"].str.startswith("C3")].iloc[0]
        verdict_035 = "通过" if row["p_tost_035"] < 0.05 else "未通过"
        verdict_050 = "通过" if row["p_tost_050"] < 0.05 else "未通过"
        tost_rows.append(
            f"<tr><th>{LABELS[dv]}</th><td>{row['d']:+.2f} [{row['d90_lo']:+.2f}, {row['d90_hi']:+.2f}]</td>"
            f"<td>{fmt_p(row['p_tost_035'])} · <b>{verdict_035}</b></td>"
            f"<td>{fmt_p(row['p_tost_050'])} · <b>{verdict_050}</b></td></tr>"
        )
    tost_html = "".join(tost_rows)

    bf_html = "".join(
        f"<tr><th>{LABELS[row.dv]}</th><td>{row.original_BF01:.1f}</td><td>{row.participant_BF01:.1f}</td><td>{row.original_BF01/row.participant_BF01:.2f}×</td></tr>"
        for row in bf.itertuples()
    )

    balance_html = "".join(
        f"<tr><th>{escape(row.variable)}</th><td>{row.disclosed:.2f}</td><td>{row.not_mentioned:.2f}</td><td>{row.smd:+.2f}</td><td>{fmt_p(row.welch_p)}</td></tr>"
        for row in balance.itertuples()
    )

    anchor_html = "".join(
        f"<tr><th>{'责任' if row.question == 'R1' else '功劳'}</th><td>{100*row.share_H:.1f}%</td><td>{100*row.share_HA:.1f}%</td><td>{row.odds_ratio:.2f}</td><td>{fmt_p(row.p)}</td></tr>"
        for row in anchors.itertuples()
    )

    flags = [
        severity(
            "high",
            "C3 的处理变量是“显式告知 vs 不提及”，不是“残障 vs 无残障”",
            "<p>H1/HA1 从未说操作员没有残障。参与者完全可能把“不提及”理解为未知，甚至因为前一页刚回答了 9 个残障刻板印象题而主动想到残障。可识别的因果结论只到：<b>在这套材料中，多加一句残障标签的平均增量效应</b>。</p>",
        ),
        severity(
            "high",
            "“被读到、被相信”没有被直接测量",
            "<p>D1 只有一个强制选项“I have read it”；停留时间是整页时长，而且告知组本来就多一句话；BEL1 问的是对整段 operator description 的总体相信程度，并没有让参与者回忆 disability 内容。三者都不能证明残障标签被注意、记住并相信。</p>",
        ),
        severity(
            "high",
            "材料本身会主动削弱残障标签效应",
            "<p>披露前先问“people with disabilities”的 9 个 SCM 题；披露句后又立即说明“所有操作员完成同样训练并达到同样标准”；之后观看的是流畅、相同的影片。人类条件 CR2 有 <b>%.1f%%</b> 的评分 ≥ 6。这个 null 更像是<b>弱标签 + 强反刻板能力保证 + 高能力行为证据</b>的联合结果。</p>" % (100 * ceiling_share),
        ),
        severity(
            "high",
            "D1/D2 不能排除“标签在第一段影片内就被覆盖”",
            "<p>第一次因变量测量发生在完整观看 70–115 秒影片之后，没有披露后、影片前的基线。第一段结果接近零只能说明<b>看完第一段时</b>没有差异，不能证明标签从未即时起效，也不能靠位置轨迹否定快速覆盖机制。</p>",
        ),
        severity(
            "medium",
            "AU1 与 CR1 仍兼容小到中等负效应",
            "<p>主模型 p 分别为 .112、.114；但参与者均值 HC3 为 .074、.066，原报告 bootstrap 为 .066、.064。两者 d≈−.24/−.25，95% CI 下界约 −.51/−.52。它们确实没有越过 .05，但也不是精确的零。</p>",
        ),
        severity(
            "medium",
            "等价界限来自可检测效应，不是实质性最小重要差异",
            "<p>±0.35 SD 只有 OH 通过；其余主要结果只能在较宽的 ±0.50 SD 界内通过。把研究的 MDE 直接当 SESOI 会让“设备能看见多大”替代“多大才重要”。论文应先给出领域依据，再决定是否用“等价”这个词。</p>",
        ),
        severity(
            "medium",
            "BIC Bayes factor 把 708 行当成了 708 个信息单位",
            "<p>残障是人际变量，独立随机化单位是 236 人。原 MixedLM BIC 使用 clip rows 作为 n；在参与者均值上重算后，AU1/CR1 的 BF01 从约 6 降到约 3，CR2/CR3 从“强”降到“中等”。它仍偏向 null，但不足以无条件“升级”为无效应。</p>",
        ),
        severity(
            "medium",
            "基线年龄失衡很大，调整结果与未调整结果应并列",
            "<p>告知组平均 %.1f 岁，不提及组 %.1f 岁，SMD=%.2f（Welch p%s）。GAAIS 正向态度也有 SMD≈−.24。协变量调整使估计缩小，但它是事后选择的敏感性分析；不能据此宣布原始差异“就是”失衡造成。</p>" % (
                balance.loc[balance.variable == "BG_age", "disclosed"].iloc[0],
                balance.loc[balance.variable == "BG_age", "not_mentioned"].iloc[0],
                balance.loc[balance.variable == "BG_age", "smd"].iloc[0],
                fmt_p(balance.loc[balance.variable == "BG_age", "welch_p"].iloc[0]),
            ),
        ),
    ]

    html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Study 1 交叉复核版 · 2026-09-04</title>
  <style>
    :root{{--ink:#17211d;--muted:#5d6a64;--paper:#f6f2e8;--card:#fffdf7;--line:#d9d3c5;--green:#167a58;--green-bg:#e9f6ef;--amber:#9a6500;--amber-bg:#fff4d7;--red:#b23b32;--red-bg:#fff0ed;--blue:#285f93;--blue-bg:#eef6ff;--shadow:0 18px 48px rgba(42,48,43,.09)}}
    *{{box-sizing:border-box}} html{{scroll-behavior:smooth}} body{{margin:0;background:linear-gradient(180deg,#ece8dc 0,#f7f3e9 20rem);color:var(--ink);font:16px/1.7 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Noto Sans CJK SC",sans-serif}}
    a{{color:var(--blue)}} code,.mono{{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}} code{{font-size:.9em;background:#eee8da;border-radius:5px;padding:.08rem .3rem}}
    .hero{{padding:4.5rem max(1.2rem,calc((100vw - 1180px)/2)) 3rem;background:radial-gradient(circle at 78% 15%,rgba(255,255,255,.20),transparent 32%),#173f35;color:#fff}}
    .kicker{{font-size:.75rem;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:#bfe4d5}} h1{{font:700 clamp(2.1rem,5vw,4.6rem)/1.05 ui-serif,Georgia,"Noto Serif CJK SC",serif;margin:.7rem 0 1rem;max-width:950px}} .hero p{{max-width:850px;color:#e1eee8;font-size:1.08rem}}
    .badges{{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.5rem}} .badge{{border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:.34rem .75rem;background:rgba(255,255,255,.08);font-size:.86rem}}
    nav{{position:sticky;top:0;z-index:10;display:flex;gap:.3rem;overflow:auto;padding:.62rem max(1rem,calc((100vw - 1180px)/2));background:rgba(255,253,247,.93);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}} nav a{{white-space:nowrap;text-decoration:none;color:var(--ink);font-size:.86rem;padding:.35rem .65rem;border-radius:7px}} nav a:hover{{background:#e9e4d8}}
    main{{max-width:1180px;margin:0 auto;padding:2.3rem 1.2rem 5rem}} section{{margin:0 0 3.6rem}} h2{{font:700 2rem/1.2 ui-serif,Georgia,"Noto Serif CJK SC",serif;margin:0 0 1rem}} h3{{line-height:1.35}} .lede{{max-width:900px;color:var(--muted)}}
    .verdict-grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin:1.5rem 0}} .verdict{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.2rem;box-shadow:var(--shadow)}} .verdict b{{display:block;font-size:1.05rem}} .verdict .big{{font:700 2.2rem/1 ui-serif,Georgia,serif;margin:.55rem 0}} .oktext{{color:var(--green)}} .warntext{{color:var(--amber)}} .badtext{{color:var(--red)}}
    .bottom-line{{background:#17211d;color:#f9f4e8;border-radius:18px;padding:1.5rem 1.6rem;margin:1.5rem 0}} .bottom-line strong{{color:#bfe4d5}} .bottom-line p{{margin:.4rem 0}}
    .table-wrap{{overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--card)}} table{{border-collapse:collapse;width:100%;min-width:720px}} th,td{{padding:.72rem .8rem;border-bottom:1px solid #e7e1d4;text-align:left;vertical-align:top}} thead th{{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;background:#eee9dd;position:sticky;top:0}} tbody tr:last-child>*{{border-bottom:0}} td{{font-variant-numeric:tabular-nums}}
    .pill{{display:inline-block;padding:.13rem .52rem;border-radius:999px;font-size:.76rem;font-weight:800}} .pill.pass{{background:var(--green-bg);color:var(--green)}} .pill.fail{{background:var(--red-bg);color:var(--red)}}
    .flags{{display:grid;gap:1rem}} .flag{{border:1px solid var(--line);border-left-width:6px;border-radius:12px;background:var(--card);overflow:hidden}} .flag.high{{border-left-color:var(--red)}} .flag.medium{{border-left-color:var(--amber)}} .flag.low{{border-left-color:var(--green)}} .flag-head{{display:flex;gap:.75rem;align-items:center;padding:1rem 1.1rem .45rem}} .flag-head h3{{margin:0;font-size:1.03rem}} .signal{{font-size:.68rem;letter-spacing:.09em;font-weight:900;border-radius:999px;padding:.18rem .5rem}} .high .signal{{background:var(--red-bg);color:var(--red)}} .medium .signal{{background:var(--amber-bg);color:var(--amber)}} .low .signal{{background:var(--green-bg);color:var(--green)}} .flag-body{{padding:0 1.1rem .9rem;color:#3f4a45}} .flag-body p{{margin:.3rem 0}}
    .forest{{padding:1rem;background:var(--card);border:1px solid var(--line);border-radius:14px;margin:1.2rem 0}} .forest-row{{display:grid;grid-template-columns:180px minmax(260px,1fr) 170px;gap:1rem;align-items:center;padding:.7rem 0;border-bottom:1px solid #eee8dc}} .forest-row:last-child{{border:0}} .forest-row small{{display:block;color:var(--muted)}} .track{{height:28px;position:relative;background:linear-gradient(90deg,transparent 0 66.66%,rgba(22,122,88,.08) 66.66% 100%);border-bottom:1px solid #b9b1a2}} .zero{{position:absolute;top:0;bottom:0;width:1px;background:#17211d}} .ci{{position:absolute;top:13px;height:3px;background:var(--red)}} .dot{{position:absolute;top:8px;width:12px;height:12px;border-radius:50%;background:var(--red);transform:translateX(-6px);box-shadow:0 0 0 3px var(--red-bg)}}
    .note{{border-radius:12px;padding:1rem 1.15rem;background:var(--blue-bg);border:1px solid #c9def1}} .quote-review{{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(320px,1.3fr);gap:1rem;margin:1rem 0}} .quote{{background:#ede7d9;border-radius:12px;padding:1rem;color:#493f33}} .review{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1rem}} .review b{{color:var(--red)}}
    .two-col{{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem}} .card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.25rem}} .card h3{{margin-top:0}} .callout{{background:var(--amber-bg);border:1px solid #e8d39b;border-radius:12px;padding:1rem 1.2rem}}
    .copy{{background:#f0ede5;border-left:4px solid var(--green);padding:1.1rem 1.3rem;border-radius:0 12px 12px 0}} details{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.8rem 1rem;margin:.75rem 0}} summary{{font-weight:800;cursor:pointer}} footer{{color:var(--muted);font-size:.86rem;border-top:1px solid var(--line);padding-top:1.2rem}}
    @media(max-width:900px){{.verdict-grid{{grid-template-columns:1fr 1fr}}.two-col{{grid-template-columns:1fr}}.forest-row{{grid-template-columns:125px minmax(190px,1fr)}}.forest-row .mono{{grid-column:2}}.quote-review{{grid-template-columns:1fr}}}}
    @media(max-width:560px){{.verdict-grid{{grid-template-columns:1fr}}.hero{{padding-top:3rem}}main{{padding-inline:.8rem}}}}
    @media print{{nav{{display:none}}body{{background:#fff}}.hero{{padding:2rem;color:#000;background:#fff;border-bottom:2px solid #000}}.hero p,.kicker{{color:#333}}.verdict,.flag,.card{{box-shadow:none}}details{{break-inside:avoid}}}}
  </style>
</head>
<body>
  <header class="hero">
    <div class="kicker">Independent cross-review · 2026-09-04</div>
    <h1>Study 1 分析手册<br>交叉复核版</h1>
    <p>以原 <a href="../study1-20260902/workbook.html" style="color:#d7f2e7">workbook.html</a> 为蓝本，独立核对原始导出、派生数据、主结果与解释边界。原报告及其代码、日志均未修改；本页只在新的 sibling 目录中生成。</p>
    <div class="badges"><span class="badge">原始完成者 300</span><span class="badge">主样本 272</span><span class="badge">C3 人类条件 n={n_dis+n_nom}</span><span class="badge">50,000 次随机化复核</span></div>
  </header>
  <nav><a href="#verdict">结论</a><a href="#disability">残障复核</a><a href="#flags">疑点标记</a><a href="#equivalence">等价 / BF</a><a href="#design">设计解释</a><a href="#other">其他发现</a><a href="#writing">建议写法</a><a href="#audit">审计</a></nav>
  <main>
    <section id="verdict">
      <h2>先给结论</h2>
      <p class="lede">“残障告知没有达到统计显著”可以复现；“残障没有效应”则超出了这项设计和当前精度。最稳妥的判断是：<b>没有发现算错，但原 artifact 对 null 的叙述偏强。</b></p>
      <div class="verdict-grid">
        <div class="verdict"><b>数据与编码</b><div class="big oktext">通过</div><span>原始表、派生表、条件映射和合成分一致。</span></div>
        <div class="verdict"><b>C3 两侧显著性</b><div class="big oktext">未显著</div><span>四个主结果 LMM 均 p ≥ .112。</span></div>
        <div class="verdict"><b>“近似零”证据</b><div class="big warntext">有限</div><span>OH 较清楚；AU1/CR1 仍兼容 d≈−.5。</span></div>
        <div class="verdict"><b>因果外推</b><div class="big badtext">应收窄</div><span>只适用于这次显式、单句、带能力保证的披露。</span></div>
      </div>
      <div class="bottom-line"><strong>一句话复核结论</strong><p>在 H/HA 条件里，显式披露智力或行动残障相对“不提及”没有产生可检出的平均效应；但 AU1 与 CR1 的多种参与者层方法落在 p=.064–.088，95% CI 仍允许约半个 SD 的负效应，且操纵接收并未被直接验证。</p></div>
    </section>

    <section id="disability">
      <div class="kicker" style="color:var(--green)">C3 · disability disclosure</div>
      <h2>残障结果：数值是真的，解释需要降一档</h2>
      <p class="lede">下表把原主 LMM、独立参与者层 HC3、原 cluster bootstrap、按实际随机化结构置换 profile 的随机化检验，以及原协变量调整并列。没有一种预先合理的方法给出两侧 p&lt;.05；但 AU1/CR1 明显不是“精确的零”。</p>
      <div class="forest">
        <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:.78rem;margin-left:180px"><span>d = −.60</span><span>95% CI；竖线 = 0</span><span>d = +.30</span></div>
        {forest_html}
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>结果</th><th>原 LMM Δ [95% CI]</th><th>d [95% CI]</th><th>LMM p</th><th>参与者 HC3 p</th><th>bootstrap p</th><th>随机化 p</th><th>原调整 LMM Δ / p</th></tr></thead>
        <tbody>{effects_html}</tbody>
      </table></div>
      <div class="note" style="margin-top:1rem"><b>怎么看：</b>两侧 .05 阈值下应报告 null result；但“未显著”不等于“估计为零”。所有四个未调整点估计都为负，AU1/CR1 的参与者层 p 约 .06–.09。因为四个结果高度相关，这个方向一致性是一个需要预注册复现的线索，不应在本样本改成单侧检验来追显著。</div>
      <div class="two-col" style="margin-top:1.2rem">
        <div class="card"><h3>当前精度</h3><p>人类格子中，告知 n={n_dis}，不提及 n={n_nom}。普通两组近似下，80% power 的最小可检出效应约 <b>d={mde_80:.2f}</b>；若真实 d=.24，当前 power 约 <b>{100*power_d24:.0f}%</b>。所以它能较好排除大效应，不能稳定检出小效应。</p></div>
        <div class="card"><h3>样本筛选不是主要解释</h3><p>C3 相关的 usable 比例为：告知 {100*all_human.loc[all_human.disab==1,'usable'].mean():.1f}%，不提及 {100*all_human.loc[all_human.disab==0,'usable'].mean():.1f}%，Fisher p={fmt_p(pass_fisher_p)}。排除在两组间基本相当；原报告的 all-completers 敏感性也保持同方向。</p></div>
      </div>
    </section>

    <section id="flags">
      <h2>对原 artifact 的疑点标记</h2>
      <p class="lede">HIGH 表示会改变可以声称的结论；MEDIUM 表示数值不一定错，但证据强度或方法标签需要收窄。</p>
      <div class="flags">{''.join(flags)}</div>
    </section>

    <section id="equivalence">
      <h2>等价性与 Bayes factor：可以辅助，不能兜底</h2>
      <h3>TOST</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>结果</th><th>d [90% CI]</th><th>±0.35 SD</th><th>±0.50 SD</th></tr></thead><tbody>{tost_html}</tbody>
      </table></div>
      <p class="callout"><b>复核意见：</b>原报告说“C3 在 ±0.50 SD 内等价”在计算上成立；但 ±0.50 是中等效应的宽边界，而且 AU1/CR1/HM 的结果靠近边缘。更关键的是，边界来自本设计的 sensitivity/MDE，不是外部定义的最小重要效应。建议写“排除大于约半个 SD 的效应”，不要直接写“无实际效应”。</p>
      <h3>BIC 近似 BF01</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>结果</th><th>原报告（clip rows 作 n）</th><th>参与者均值重算（n=236）</th><th>膨胀比</th></tr></thead><tbody>{bf_html}</tbody>
      </table></div>
      <p class="lede">参与者均值重算仍普遍偏向 null，但力度更温和：AU1/CR1 约 3:1，CR2/CR3 约 8–9:1，OH 约 12:1。所有 BIC-BF 都依赖 unit-information prior；不宜把它写成不依赖先验的“20 倍证明”。</p>
    </section>

    <section id="design">
      <h2>为什么这个 null 没那么反常</h2>
      <div class="quote-review"><div class="quote">披露前：<b>“About people with disabilities”</b><br>连续 9 个 competence / warmth 刻板印象题。</div><div class="review"><b>需求特征 / 启动</b><br>所有组在看到操纵前都被明显提醒“残障”是研究主题。H1/HA1 因而不是心理意义上的真正 unmarked control，也可能提高社会期许作答。</div></div>
      <div class="quote-review"><div class="quote">披露后：<b>“All operators complete the same training and meet the same standard …”</b></div><div class="review"><b>反刻板能力保证</b><br>这句话紧跟残障标签，等于直接告诉参与者能力达标。如果研究目标是测试能力刻板印象，它很可能主动中和 CR2 甚至相邻评价的差异。</div></div>
      <div class="quote-review"><div class="quote">操纵：一行粗体标签，只出现一次；随后完整观看相同影片。</div><div class="review"><b>弱且一次性的处理</b><br>检验对象不是可见残障，也不是反复提醒后的身份线索。效果被具体、流畅行为证据覆盖并不奇怪；而且第一项结果只在看完影片后测。</div></div>
      <div class="quote-review"><div class="quote">BEL1：相信“the description of the OriHime operator”。</div><div class="review"><b>复合而非 disability-specific</b><br>描述还包含控制方式、经验、频率、培训标准。高 BEL1 可能只是相信其中大部分，并不等于相信或记住那一句残障标签。</div></div>
      <h3>基线失衡</h3>
      <div class="table-wrap"><table><thead><tr><th>变量</th><th>告知</th><th>不提及</th><th>SMD</th><th>Welch p</th></tr></thead><tbody>{balance_html}</tbody></table></div>
      <p class="lede">年龄差是最明显的一项（不提及组约大 7.3 岁）。随机化保证长期无偏，不保证这一次样本完全平衡。原协变量分析值得保留，但应和未调整的随机化估计并列，而不是让它单独裁决。</p>
    </section>

    <section id="other">
      <h2>原报告其他部分的交叉复核</h2>
      <div class="flags">
        {severity('medium','“confirmatory”标签应改成“analysis-plan primary”','<p>主样本、结果和对比是在数据收完后、未外部预注册的情况下锁定；且描述性 pass 已经发生。代码日志透明，这是优点，但严格意义上不能获得预注册 confirmatory 的证据等级。</p>')}
        {severity('medium','C1 的 power 叙述用了 all-completers 人数','<p>手册写 256 vs 44、MDE≈.46；主样本实际为 236 vs 36，对应两组近似 MDE≈.50。差异不改变 AU1 结论，但会轻微高估主分析对 AI-only 对比的精度。</p>')}
        {severity('medium','AU1 题目与 AI-only 操纵存在语义贴近','<p>“felt genuine, rather than like the execution of a program” 几乎直接呼应“entirely by an AI system”。AU1 的强 C1 效应可以是真实感知，也可能含有需求一致性；它不应被当作与操纵语义完全独立的结果。</p>')}
        {severity('medium','归因排名跨 H/HA 改变了选项集合','<p>H 有 3 个角色，HA 多出 AI，operator 排第一的 odds 自然会下降。用共同角色作锚后，operator 相对 ORG/USER 仍从责任 %.1f%%→%.1f%%、功劳 %.1f%%→%.1f%%（p=%s/%s），所以方向不全是机械结果；但“odds 减半”仍混合了真实再分配与增加竞争选项两部分。</p>' % (100*anchors.iloc[0].share_H,100*anchors.iloc[0].share_HA,100*anchors.iloc[1].share_H,100*anchors.iloc[1].share_HA,fmt_p(anchors.iloc[0].p),fmt_p(anchors.iloc[1].p)))}
        {severity('low','主 LMM 本身可复现','<p>四个主结果和 CR3 的 REML 模型均重新拟合并收敛；随机截距方差非零。原始导出到合成分也一致。未看到足以推翻主表的实现错误。</p>')}
      </div>
      <details><summary>共同角色锚定的归因复核表</summary><div class="table-wrap" style="margin-top:.8rem"><table><thead><tr><th>问题</th><th>H：operator 胜过 ORG/USER</th><th>HA</th><th>OR</th><th>p</th></tr></thead><tbody>{anchor_html}</tbody></table></div></details>
    </section>

    <section id="writing">
      <h2>建议替换成的论文表述</h2>
      <h3>中文判断</h3>
      <div class="copy"><p>在六个人类操作员条件中，与不提供残障信息相比，显式说明操作员有智力残障或行动相关残障，并未在四个主结果上产生统计上可检出的平均差异（双侧 p ≥ .112）。四个未调整点估计均为负；其中真实感和温暖的效应约为 d = −.24 与 −.25，95% 置信区间仍延伸至约 −.51 与 −.52，参与者均值与 bootstrap 分析的 p 值约为 .06–.09。因此，本研究较能排除大效应，但不能把小到中等的负效应视为已经排除。该结论只适用于本研究的一次性文字披露、同等培训保证及随后呈现的称职行为，不能推广为“残障身份本身没有影响”。</p></div>
      <h3>English draft</h3>
      <div class="copy"><p>Within the six human-operator conditions, explicitly disclosing an intellectual or mobility-related disability, compared with omitting disability information, did not produce statistically detectable average differences in the four primary outcomes (two-sided ps ≥ .112). All four unadjusted point estimates were negative. For genuineness and warmth, the estimates were approximately d = −.24 and −.25, with 95% confidence intervals extending to about −.51 and −.52; participant-mean and bootstrap analyses yielded ps of approximately .06–.09. The data therefore rule out large effects more clearly than small-to-moderate negative effects. Because the manipulation was a single textual sentence followed by an equal-training assurance and competent behavioral evidence, and because disability-specific uptake was not measured, this result should be interpreted as a null average effect of explicit disclosure in this framing rather than evidence that disability status generally has no effect.</p></div>
      <h3>后续研究最值钱的三处改动</h3>
      <ol><li>在所有结果之后加入 disability-specific recall：未提及 / 智力残障 / 行动残障 / 不记得。</li><li>把 SCM 残障前测移到结果之后，或在预注册中把“被启动”明确作为边界条件。</li><li>把“同样训练与标准”的能力保证作为独立因子，或删去；按 d=.20–.25 预注册功效，并优先指定一个全局主要结果，避免四个高度相关结果分散功效。</li></ol>
      <p class="note"><b>关于现有 Study 2：</b>它可以告诉你新样本在无描述时会默认推断什么，是很有价值的语境证据；但它不能回溯证明 Study 1 的参与者读到/相信了残障句，也不能单独识别 Study 1 null 的机制。</p>
    </section>

    <section id="audit">
      <h2>审计轨迹</h2>
      <div class="table-wrap"><table><thead><tr><th>检查</th><th>状态</th><th>结果</th></tr></thead><tbody>{checks_html}</tbody></table></div>
      <details><summary>方法说明</summary><ul><li>没有 import 或执行原分析脚本；只读取 CSV，再用独立代码重算。</li><li>随机化检验在 H、HA 内分别打乱 profile，保持六个 condition 的实际样本量，统计量与原 C3 相同：四个告知 cell 的等权均值减两个不提及 cell 的等权均值。</li><li>参与者 HC3 先把三段影片求均值，再拟合 outcome ~ disclosure + control source；这把独立单位明确设为参与者。</li><li>BF 复核仍是 BIC 近似，只是把独立信息单位从 clip rows 改为 participant means；它不是完整的先验敏感性分析。</li></ul></details>
      <footer>生成脚本：<code>analysis/study1-20260902-cross-review/build_cross_review.py</code> · 数值表：<code>review_results.csv</code> · 原 artifact 未修改。</footer>
    </section>
  </main>
</body>
</html>"""

    (HERE / "workbook_cross_review.html").write_text(html, encoding="utf-8")
    print(f"wrote {HERE / 'workbook_cross_review.html'}")
    print(f"wrote {HERE / 'review_results.csv'}")


if __name__ == "__main__":
    build()
