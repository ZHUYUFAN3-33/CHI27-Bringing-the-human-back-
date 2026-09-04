"""Build the analysis-ready datasets for Study 1 from the raw export.

Inputs  (raw export directory: $STUDY1_EXPORT, default ../../exports/20260902T104106Z):
  wide.csv, participants.csv, responses.csv, page_times.csv, video_events.csv
Outputs (this directory):
  participants_clean.csv   one row per completed participant, with scale scores and quality flags
  long_segments.csv        one row per participant x clip (3 per participant)
  ranks_long.csv           one row per participant x clip x rank question x actor
Nothing here runs an inferential test.
"""
import pandas as pd, numpy as np, re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); RAW = os.environ.get("STUDY1_EXPORT") or os.path.join(HERE, "..", "..", "exports", "20260902T104106Z")
rd = lambda f: pd.read_csv(os.path.join(RAW, f), encoding="utf-8-sig")
w = rd("wide.csv"); p = rd("participants.csv"); pt = rd("page_times.csv"); ve = rd("video_events.csv"); r = rd("responses.csv")

w = w[w.status == "completed"].copy()
w["profile"] = w["profile"].astype("Int64")
ORD = {"O1": ["REL","ADV","COL"], "O2": ["ADV","COL","REL"], "O3": ["COL","REL","ADV"],
       "O4": ["REL","COL","ADV"], "O5": ["ADV","REL","COL"], "O6": ["COL","ADV","REL"]}
AV1_CORRECT = {"REL": 1, "ADV": 2, "COL": 0}
w["first_seg"] = w.seg_order.map(lambda o: ORD[o][0])
w["mid_seg"]   = w.seg_order.map(lambda o: ORD[o][1])
w["last_seg"]  = w.seg_order.map(lambda o: ORD[o][2])
w["av1_answer"] = [row[f"{s}_AV1"] for s, row in zip(w.first_seg, w.to_dict("records"))]
w["av1_pass"] = [int(v == AV1_CORRECT[s]) for s, v in zip(w.first_seg, w.av1_answer)]
w["at1_answer"] = [row[f"{s}_AT1"] for s, row in zip(w.mid_seg, w.to_dict("records"))]
w["at1_pass"] = (w.at1_answer == 2).astype(int)
w["human"] = np.where(w.ctrl == "A", 0, 1)
w["profile_label"] = w.profile.map({1: "no mention", 2: "intellectual", 3: "mobility"}).astype(object)
w.loc[w.ctrl == "A", "profile_label"] = "AI (no operator)"

# ---- scales (stored raw; reverse here) ----
rev = lambda s: 8 - s
NARS_ALL = ["NARS_01","NARS_02","NARS_03","NARS_04","NARS_05","NARS_06","NARS_07","NARS_08","NARS_10","NARS_11"]
N = w[NARS_ALL].copy()
for c in ["NARS_03","NARS_05","NARS_06"]: N[c] = rev(N[c])
w["NARS"] = N.mean(axis=1)                                   # higher = more negative toward robots
w["NARS_S1"] = N[["NARS_04","NARS_07","NARS_08","NARS_10"]].mean(axis=1)
w["NARS_S2"] = N[["NARS_01","NARS_02","NARS_11"]].mean(axis=1)
w["NARS_S3"] = N[["NARS_03","NARS_05","NARS_06"]].mean(axis=1)
GP = ["GAAIS_07","GAAIS_11","GAAIS_12","GAAIS_17","GAAIS_18"]; GN = ["GAAIS_08","GAAIS_10","GAAIS_15","GAAIS_19"]
G = w[GP+GN].copy()
for c in GN: G[c] = rev(G[c])
w["GAAIS_pos"] = G[GP].mean(axis=1)                          # higher = more positive about AI
w["GAAIS_neg"] = G[GN].mean(axis=1)                          # reversed: higher = LESS negative about AI
w["GAAIS"] = G.mean(axis=1)                                  # convenience total; authors advise subscales
w["SCM_comp"] = w[["SCM_01","SCM_02","SCM_03","SCM_04","SCM_05"]].mean(axis=1)
w["SCM_warm"] = w[["SCM_06","SCM_07","SCM_08","SCM_09"]].mean(axis=1)
w["PE"] = w[["PE1","PE2","PE3","PE4"]].mean(axis=1)
w["HM"] = w[["HM1","HM2","HM3"]].mean(axis=1)
w["dur_min"] = w.duration_s / 60

# ---- device / video compliance ----
pp = p.set_index("id")
w["mobile"] = w.participant_id.map(pp.user_agent.str.contains("iPhone|Android|Mobile", regex=True)).astype(int)
w["timezone"] = w.participant_id.map(pp.timezone)
go = ve[ve.event == "gate_open"].groupby(["participant_id","segment"]).size().unstack(fill_value=0)
for s in ["REL","ADV","COL"]:
    w[f"gate_{s}"] = w.participant_id.map(go[s] if s in go else 0).fillna(0).astype(int)
fb = ve[ve.event.isin(["fallback_confirm"])].participant_id.unique()
w["fallback_any"] = w.participant_id.isin(fb).astype(int)
err = ve[ve.event == "error"].participant_id.unique()
w["player_error_any"] = w.participant_id.isin(err).astype(int)
# seconds actually watched per segment (max watch_s reported at gate_open / ended)
ws = ve[ve.watch_s.notna()].groupby(["participant_id","segment"]).watch_s.max().unstack()
for s in ["REL","ADV","COL"]:
    w[f"watch_s_{s}"] = w.participant_id.map(ws[s]) if s in ws else np.nan
# page dwell per segment page
seg_dwell = pt[pt.page_key.str.startswith("segment_")].groupby(["participant_id","page_key"]).dwell_ms.sum().unstack()
for k in ["segment_1","segment_2","segment_3"]:
    w[f"dwell_{k}_s"] = w.participant_id.map(seg_dwell[k]) / 1000

# ---- straightlining on the segment Likert items ----
seg_items = lambda s: [f"{s}_{c}" for c in ["OH1","OH2","OH3","AU1","CR1","CR2","CR3"]]
sd_by_seg = pd.concat([w[seg_items(s)].std(axis=1, skipna=True) for s in ["REL","ADV","COL"]], axis=1)
w["straightline_segments"] = (sd_by_seg.fillna(0) == 0).sum(axis=1)     # 0..3 segments with zero within-page variance
lik_all = [c for c in w.columns if re.match(r"^(NARS|GAAIS|SCM|PE|HM)", c)] + [f"{s}_{c}" for s in ["REL","ADV","COL"] for c in ["OH1","OH2","OH3","AU1","CR1","CR2","CR3"]]
w["likert_sd_all"] = w[lik_all].std(axis=1, skipna=True)

# ---- long: participant x segment ----
rows = []
for rec in w.to_dict("records"):
    for pos, seg in enumerate(ORD[rec["seg_order"]], start=1):
        d = {"pid": rec["participant_id"], "condition": rec["condition"], "ctrl": rec["ctrl"], "profile": rec["profile"],
             "profile_label": rec["profile_label"], "human": rec["human"], "seg_order": rec["seg_order"],
             "segment": seg, "pos": pos, "first_seg": rec["first_seg"],
             "at1_pass": rec["at1_pass"], "av1_pass": rec["av1_pass"], "attention_pass": rec["attention_pass"],
             "BEL1": rec["BEL1"], "NARS": rec["NARS"], "GAAIS_pos": rec["GAAIS_pos"], "GAAIS_neg": rec["GAAIS_neg"], "GAAIS": rec["GAAIS"],
             "SCM_comp": rec["SCM_comp"], "SCM_warm": rec["SCM_warm"], "PE": rec["PE"], "HM": rec["HM"],
             "BG_age": rec["BG_age"], "BG_gender": rec["BG_gender"], "BG_freq_ai": rec["BG_freq_ai"], "BG_freq_robot": rec["BG_freq_robot"],
             "BG_freq_disability": rec["BG_freq_disability"], "mobile": rec["mobile"], "dur_min": rec["dur_min"],
             "gate_open": rec[f"gate_{seg}"], "watch_s": rec[f"watch_s_{seg}"], "dwell_s": rec[f"dwell_segment_{pos}_s"]}
        for c in ["OH1","OH2","OH3","AU1","CR1","CR2","CR3"]:
            d[c] = rec[f"{seg}_{c}"]
        for rk in ["R1","R2"]:
            for a in ["CTRL","AI","ORG","USER"]:
                d[f"{rk}_{a}"] = rec[f"{seg}_{rk}__{a}"]
        d["OH"] = np.nanmean([d["OH1"], d["OH2"], d["OH3"]])
        rows.append(d)
L = pd.DataFrame(rows)

# ---- ranks long ----
rk_rows = []
for rec in L.to_dict("records"):
    for rk in ["R1","R2"]:
        for a in ["CTRL","AI","ORG","USER"]:
            v = rec[f"{rk}_{a}"]
            if pd.notna(v):
                rk_rows.append({"pid": rec["pid"], "ctrl": rec["ctrl"], "condition": rec["condition"], "segment": rec["segment"], "pos": rec["pos"],
                                "question": rk, "actor": a, "rank": int(v)})
RK = pd.DataFrame(rk_rows)

w.to_csv(os.path.join(HERE, "participants_clean.csv"), index=False)
L.to_csv(os.path.join(HERE, "long_segments.csv"), index=False)
RK.to_csv(os.path.join(HERE, "ranks_long.csv"), index=False)
print("participants_clean:", w.shape, " long_segments:", L.shape, " ranks_long:", RK.shape)
