"""Data-quality report for Study 1 (no inferential tests)."""
import pandas as pd, numpy as np, re, os
HERE = os.path.dirname(os.path.abspath(__file__)); RAW = os.environ.get("STUDY1_EXPORT") or os.path.join(HERE, "..", "..", "exports", "20260902T104106Z")
pd.set_option("display.width", 220); pd.set_option("display.max_columns", 80); pd.set_option("display.max_rows", 300)
w = pd.read_csv(os.path.join(HERE, "participants_clean.csv")); L = pd.read_csv(os.path.join(HERE, "long_segments.csv"))
p = pd.read_csv(os.path.join(RAW, "participants.csv"), encoding="utf-8-sig"); ve = pd.read_csv(os.path.join(RAW, "video_events.csv"), encoding="utf-8-sig")
pt = pd.read_csv(os.path.join(RAW, "page_times.csv"), encoding="utf-8-sig"); r = pd.read_csv(os.path.join(RAW, "responses.csv"), encoding="utf-8-sig")
pip = pd.read_csv(os.path.join(RAW, "participants_in_progress.csv"), encoding="utf-8-sig")

print("=== 1. SAMPLE FUNNEL ===")
print("participants.csv status:", p.status.value_counts().to_dict(), "| in-progress file:", len(pip), "| screen-out reasons:", p.screen_out_reason.dropna().value_counts().to_dict())
print("in-progress answered_count:", pip.answered_count.value_counts().sort_index().to_dict())
print("duplicate external_pid among completed:", w.external_pid.duplicated().sum(), "| duplicate participant_id:", w.participant_id.duplicated().sum())
print("in-progress pids that also completed:", pip.external_pid.isin(w.external_pid).sum())
print("instrument_ver:", p.instrument_ver.value_counts().to_dict())
print("completed by condition:", w.condition.value_counts().sort_index().to_dict())
print("completed by ctrl:", w.ctrl.value_counts().to_dict(), "| by order:", w.seg_order.value_counts().sort_index().to_dict())
print(pd.crosstab(w.condition, w.seg_order))

print("\n=== 2. MISSINGNESS (completed only) ===")
items = [c for c in w.columns if re.match(r"^(E\d|BG_|NARS_|GAAIS_|SCM_|D1|REL_|ADV_|COL_|PE\d|HM\d|BEL1|FU1)", c)]
miss = w[items].isna().sum()
print("items with any missing:"); print(miss[miss > 0].to_string())
print("CR3 missing in A (expected 44 each):", {s: int(w.loc[w.ctrl=="A", f"{s}_CR3"].isna().sum()) for s in ["REL","ADV","COL"]}, "| CR3 missing in H/HA (expected 0):", {s: int(w.loc[w.ctrl!="A", f"{s}_CR3"].isna().sum()) for s in ["REL","ADV","COL"]})
print("R1__AI present in H (expected 0):", int(w.loc[w.ctrl=="H", [f"{s}_R1__AI" for s in ["REL","ADV","COL"]]].notna().sum().sum()), "| R1__CTRL present in A (expected 0):", int(w.loc[w.ctrl=="A", [f"{s}_R1__CTRL" for s in ["REL","ADV","COL"]]].notna().sum().sum()))
print("AV1 answered exactly once per participant:", ((w[["REL_AV1","ADV_AV1","COL_AV1"]].notna().sum(axis=1)) == 1).all(), "| AT1 answered exactly once:", ((w[["REL_AT1","ADV_AT1","COL_AT1"]].notna().sum(axis=1)) == 1).all())
print("AV1 on the FIRST segment only:", all(pd.notna(w.loc[i, f"{s}_AV1"]) for i, s in zip(w.index, w.first_seg)), "| AT1 on the MIDDLE segment only:", all(pd.notna(w.loc[i, f"{s}_AT1"]) for i, s in zip(w.index, w.mid_seg)))
print("answered_count distribution:", w.answered_count.value_counts().sort_index().to_dict())
print("responses.csv rows per completed participant: min/max", r[r.participant_id.isin(w.participant_id)].groupby("participant_id").size().agg(["min","max"]).to_dict())
print("duplicate (participant,item) rows in responses.csv:", r.duplicated(["participant_id","item_id"]).sum())

print("\n=== 3. VALUE RANGES ===")
lik = [c for c in items if re.match(r"^(NARS_|GAAIS_|SCM_|PE\d|HM\d|BEL1)", c) or re.match(r"^(REL|ADV|COL)_(OH\d|AU1|CR\d|AT1)$", c)]
bad = {c: int(((w[c] < 1) | (w[c] > 7)).sum()) for c in lik if ((w[c] < 1) | (w[c] > 7)).sum() > 0}
print("Likert values outside 1..7:", bad or "none")
print("age range:", w.BG_age.min(), "-", w.BG_age.max(), "| ages <18 or >100:", int(((w.BG_age < 18) | (w.BG_age > 100)).sum()))
print("E1/E2/E3 all Yes(0):", (w[["E1","E2","E3"]] == 0).all(axis=1).all(), "| D1 == 0:", (w.D1 == 0).all())
bad_rank = 0; n_rank = 0
for rec in L.to_dict("records"):
    for rk in ["R1","R2"]:
        vals = [rec[f"{rk}_{a}"] for a in ["CTRL","AI","ORG","USER"] if pd.notna(rec[f"{rk}_{a}"])]
        n_rank += 1
        if sorted(vals) != list(range(1, len(vals)+1)): bad_rank += 1
print(f"rank questions: {n_rank}, invalid permutations: {bad_rank}")
print("rows shown per rank question by ctrl:", {c: sorted(x[["R1_CTRL","R1_AI","R1_ORG","R1_USER"]].notna().sum(axis=1).unique().tolist()) for c, x in L.groupby("ctrl")})

print("\n=== 4. ATTENTION / COMPREHENSION ===")
print("server attention_pass vs recomputed at1_pass agree:", (w.attention_pass.astype(str).str.lower().eq("true").astype(int) == w.at1_pass).all())
print("AT1 pass:", int(w.at1_pass.sum()), "/", len(w), "| AT1 answer distribution:", w.at1_answer.value_counts().sort_index().to_dict())
print("AT1 pass by middle segment:", w.groupby("mid_seg").at1_pass.agg(["mean","count"]).round(3).to_dict("index"))
print("AV1 pass:", int(w.av1_pass.sum()), "/", len(w))
print("AV1 pass by first segment:", w.groupby("first_seg").av1_pass.agg(["mean","count"]).round(3).to_dict("index"))
print("AV1 answer distribution by first segment (correct: REL=1, ADV=2, COL=0):"); print(pd.crosstab(w.first_seg, w.av1_answer))
print("both pass:", int(((w.at1_pass==1)&(w.av1_pass==1)).sum()), "| AT1 fail only:", int(((w.at1_pass==0)&(w.av1_pass==1)).sum()), "| AV1 fail only:", int(((w.at1_pass==1)&(w.av1_pass==0)).sum()), "| both fail:", int(((w.at1_pass==0)&(w.av1_pass==0)).sum()))
print("AT1 fail by condition:", w[w.at1_pass==0].condition.value_counts().sort_index().to_dict())
print("AV1 fail by condition:", w[w.av1_pass==0].condition.value_counts().sort_index().to_dict())
print("AT1 fail: mobile share %.2f vs overall %.2f" % (w[w.at1_pass==0].mobile.mean(), w.mobile.mean()))

print("\n=== 5. DURATION / DWELL / VIDEO ===")
print("total duration (min): ", w.dur_min.describe().round(1).to_dict())
print("under 8 min:", int((w.dur_min<8).sum()), "| under 10:", int((w.dur_min<10).sum()), "| over 45:", int((w.dur_min>45).sum()), "| over 60:", int((w.dur_min>60).sum()))
print("fastest 10 (min):", sorted(w.dur_min.round(1))[:10])
print("segment page dwell (s) median by position:", {k: round(w[f"dwell_{k}_s"].median(),1) for k in ["segment_1","segment_2","segment_3"]})
print("clip length REL 70s, ADV 105s, COL 115s. dwell below clip length (should be ~0): ",
      {s: int((L[L.segment==s].dwell_s < {"REL":70,"ADV":105,"COL":115}[s]).sum()) for s in ["REL","ADV","COL"]})
print("gate_open count per participant-segment:", L.gate_open.value_counts().sort_index().to_dict())
print("video events:", ve.event.value_counts().to_dict())
print("gate_open detail:", ve[ve.event=="gate_open"].detail.fillna("playback").value_counts().to_dict())
print("participants with fallback_confirm:", int(w.fallback_any.sum()), "| with player error:", int(w.player_error_any.sum()))
print("fallback participants:"); print(w[w.fallback_any==1][["condition","seg_order","dur_min","at1_pass","av1_pass"]].to_string())
print("watch_s (max reported) vs clip length, share >= 0.9*length:", {s: round((L[L.segment==s].watch_s >= 0.9*{"REL":70,"ADV":105,"COL":115}[s]).mean(),3) for s in ["REL","ADV","COL"]})
print("page dwell medians (s):"); print((pt.groupby("page_key").dwell_ms.median()/1000).round(1).to_string())
print("mobile:", int(w.mobile.sum()), "/", len(w))

print("\n=== 6. RESPONSE STYLE ===")
print("segments with zero within-page variance (0..3):", w.straightline_segments.value_counts().sort_index().to_dict())
print("participants straightlining all 3 segments:"); print(w[w.straightline_segments==3][["condition","dur_min","at1_pass","av1_pass","likert_sd_all"]].to_string())
print("overall Likert SD across all items, lowest 8:"); print(w.nsmallest(8, "likert_sd_all")[["condition","dur_min","at1_pass","av1_pass","likert_sd_all","straightline_segments"]].to_string())

print("\n=== 7. COVARIATE BALANCE ACROSS CONDITIONS (descriptive only) ===")
cov = ["BG_age","NARS","GAAIS_pos","GAAIS_neg","SCM_comp","SCM_warm","BG_freq_ai","BG_freq_robot","BG_freq_disability"]
print(w.groupby("condition")[cov].mean().round(2))
print(w.groupby("ctrl")[cov].mean().round(2))
print("gender by condition:"); print(pd.crosstab(w.condition, w.BG_gender))
print("age SD overall %.1f; by condition:" % w.BG_age.std(), w.groupby("condition").BG_age.std().round(1).to_dict())

print("\n=== 8. SCALE RELIABILITY (Cronbach alpha) & FLOOR/CEILING ===")
def alpha(df):
    df = df.dropna(); k = df.shape[1]
    return round((k/(k-1))*(1 - df.var(ddof=1).sum()/df.sum(axis=1).var(ddof=1)), 3)
rev = lambda s: 8 - s
N = w[["NARS_01","NARS_02","NARS_03","NARS_04","NARS_05","NARS_06","NARS_07","NARS_08","NARS_10","NARS_11"]].copy()
for c in ["NARS_03","NARS_05","NARS_06"]: N[c] = rev(N[c])
GP = ["GAAIS_07","GAAIS_11","GAAIS_12","GAAIS_17","GAAIS_18"]; GN = ["GAAIS_08","GAAIS_10","GAAIS_15","GAAIS_19"]
G = w[GP+GN].copy()
for c in GN: G[c] = rev(G[c])
print("NARS(10) alpha", alpha(N), "| S1(4)", alpha(N[["NARS_04","NARS_07","NARS_08","NARS_10"]]), "| S2(3)", alpha(N[["NARS_01","NARS_02","NARS_11"]]), "| S3(3, rev)", alpha(N[["NARS_03","NARS_05","NARS_06"]]))
print("item-total corr NARS:", N.apply(lambda c: round(c.corr(N.drop(columns=c.name).mean(axis=1)),2)).to_dict())
print("GAAIS all(9) alpha", alpha(G), "| pos(5)", alpha(G[GP]), "| neg(4)", alpha(G[GN]), "| corr(pos, neg_rev) = %.2f" % w.GAAIS_pos.corr(w.GAAIS_neg))
print("SCM comp(5) alpha", alpha(w[["SCM_01","SCM_02","SCM_03","SCM_04","SCM_05"]]), "| warm(4)", alpha(w[["SCM_06","SCM_07","SCM_08","SCM_09"]]), "| corr(comp, warm) = %.2f" % w.SCM_comp.corr(w.SCM_warm))
print("PE(4) alpha", alpha(w[["PE1","PE2","PE3","PE4"]]), "| HM(3) alpha", alpha(w[["HM1","HM2","HM3"]]), "| corr(PE,HM) = %.2f" % w.PE.corr(w.HM))
print("OH1-3 alpha per segment:", {s: alpha(w[[f"{s}_OH1", f"{s}_OH2", f"{s}_OH3"]]) for s in ["REL","ADV","COL"]}, "| pooled rows:", alpha(L[["OH1","OH2","OH3"]]))
print("OH1-3 + AU1 alpha pooled:", alpha(L[["OH1","OH2","OH3","AU1"]]), "| corr AU1 with OH composite: %.2f" % L.AU1.corr(L.OH))
print("CR1/CR2 corr pooled: %.2f" % L.CR1.corr(L.CR2), "| CR2/CR3 corr (H,HA): %.2f" % L[L.ctrl!="A"].CR2.corr(L[L.ctrl!="A"].CR3))
print("inter-clip consistency (same item across the 3 clips, participant-level corr, REL-ADV / REL-COL / ADV-COL):")
for c in ["OH","AU1","CR1","CR2","CR3"]:
    wide_c = L.pivot(index="pid", columns="segment", values=c)[["REL","ADV","COL"]]
    print("  ", c, wide_c.corr().round(2).values[np.triu_indices(3,1)].tolist())
print("floor/ceiling (share at 1 / at 7), segment items pooled over clips:")
for c in ["OH1","OH2","OH3","AU1","CR1","CR2","CR3"]:
    x = L[c].dropna(); print(f"  {c}: n={len(x)} mean={x.mean():.2f} sd={x.std():.2f} floor={100*(x==1).mean():.1f}% ceiling={100*(x==7).mean():.1f}% top2={100*(x>=6).mean():.1f}%")
for c in ["BEL1","PE","HM","NARS","GAAIS_pos","GAAIS_neg","SCM_comp","SCM_warm"]:
    x = w[c].dropna(); print(f"  {c}: mean={x.mean():.2f} sd={x.std():.2f} min={x.min():.2f} max={x.max():.2f} share>=6: {100*(x>=6).mean():.1f}% share<=2: {100*(x<=2).mean():.1f}%")
print("BEL1 distribution:", w.BEL1.value_counts().sort_index().to_dict())
