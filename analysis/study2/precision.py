#!/usr/bin/env python3
"""Precision and power for Study 2 (Track A), from the standard library only.

Study 2's estimands are proportions: what share of viewers infer each
controller category, and what share infer a disability. So the question before
recruitment is not "what effect can we detect" but "how precisely can we say
what the share is", plus — where a claim is phrased as a majority — how often a
given true share would actually clear that bar.

Everything here is exact rather than simulated except the within-person clip
comparison, which is simulated because its power depends on how correlated one
person's three answers are, and that is an assumption rather than a fact.

    python3 analysis/study2/precision.py

No third-party packages: this has to run on a plain interpreter years from now,
next to the numbers it produced.
"""

import math
import random

Z = 1.959963984540054          # two-sided 95%
ALPHA = 0.05
SEED = 20260905


# ---------------------------------------------------------------- intervals

def wilson(x, n, z=Z):
    """Wilson score interval for x successes in n trials. Returns (lo, hi)."""
    if n == 0:
        return (0.0, 1.0)
    p = x / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, centre - half), min(1.0, centre + half))


def wilson_halfwidth(p, n, z=Z):
    """Half the width of the Wilson interval at an observed proportion p."""
    lo, hi = wilson(p * n, n, z)
    return (hi - lo) / 2


# ------------------------------------------------------------------ binomial

def binom_pmf(k, n, p):
    """Computed in log space: math.comb(5000, 2500) overflows a float, and the
    binary search below reaches sample sizes that large."""
    if k < 0 or k > n:
        return 0.0
    if p <= 0.0:
        return 1.0 if k == 0 else 0.0
    if p >= 1.0:
        return 1.0 if k == n else 0.0
    log_p = (math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)
             + k * math.log(p) + (n - k) * math.log1p(-p))
    return math.exp(log_p)


def binom_sf(k, n, p):
    """P(X >= k), summed from the smaller tail for accuracy."""
    if k <= 0:
        return 1.0
    if k > n:
        return 0.0
    if k > n * p:
        return sum(binom_pmf(i, n, p) for i in range(k, n + 1))
    return 1.0 - sum(binom_pmf(i, n, p) for i in range(0, k))


def majority_power(n, p_true, threshold=0.5):
    """P(the Wilson 95% lower bound exceeds `threshold`) when the truth is p_true.

    This is the operating characteristic of the decision rule the analysis plan
    uses for the word "majority". It is a one-sample proportion test, so it is
    exact: find the smallest count whose lower bound clears the threshold, then
    ask how often the binomial produces at least that count.
    """
    need = None
    for x in range(n + 1):
        if wilson(x, n)[0] > threshold:
            need = x
            break
    if need is None:
        return 0.0, None
    return binom_sf(need, n, p_true), need


def n_for_majority(p_true, target=0.80, threshold=0.5, lo=20, hi=5000):
    """Smallest n whose majority-decision power reaches `target`."""
    if majority_power(hi, p_true, threshold)[0] < target:
        return None
    while lo < hi:
        mid = (lo + hi) // 2
        if majority_power(mid, p_true, threshold)[0] >= target:
            hi = mid
        else:
            lo = mid + 1
    return lo


# ------------------------------------------- within-person clip comparison

def mcnemar_power(n, p_a, p_b, rho, trials=20000, alpha=ALPHA, seed=SEED):
    """Power of an exact McNemar test that two clips differ, same participants.

    Each participant answers both clips. `rho` is the tetrachoric-ish coupling
    used to generate the pair: 0 means the two answers are independent, 1 means
    a participant who says yes to one says yes to the other whenever the
    marginals allow it. It is the assumption that matters most and the reason
    this one is simulated rather than solved.
    """
    rng = random.Random(seed)
    hits = 0
    for _ in range(trials):
        b = c = 0
        for _ in range(n):
            u = rng.random()
            a = u < p_a
            # correlate the second draw with the first by reusing u part of the time
            v = u if rng.random() < rho else rng.random()
            bb = v < p_b
            if a and not bb:
                b += 1
            elif bb and not a:
                c += 1
        m = b + c
        if m == 0:
            continue
        k = min(b, c)
        p = 2 * sum(binom_pmf(i, m, 0.5) for i in range(0, k + 1))
        if min(p, 1.0) < alpha:
            hits += 1
    return hits / trials


# ---------------------------------------------------------------------- main

def main():
    print("Study 2 (Track A) — precision and power")
    print("=" * 72)
    print()

    print("1. Worst-case precision of one proportion (Wilson 95%, p = .50)")
    print("   The estimand: P(human involved), P(AI only), P(can't tell), per clip.")
    print()
    print(f"   {'usable n':>10}  {'half-width':>12}")
    for n in (200, 250, 270, 300, 330, 385, 400):
        print(f"   {n:>10}  {wilson_halfwidth(0.50, n) * 100:>11.1f} pp")
    print()

    print("2. Precision away from .50, at n = 300 (the recommended target)")
    print()
    print(f"   {'true share':>11}  {'half-width':>12}")
    for p in (0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80):
        print(f"   {p:>10.0%}  {wilson_halfwidth(p, 300) * 100:>11.1f} pp")
    print()

    print("3. The 'majority' rule: Wilson 95% lower bound above 50%")
    print("   Power at a given true share, and the n that reaches 80%.")
    print()
    print(f"   {'true share':>11}  {'power @300':>11}  {'n for 80%':>10}")
    for p in (0.55, 0.60, 0.65, 0.70, 0.75):
        pw, _ = majority_power(300, p)
        n80 = n_for_majority(p)
        print(f"   {p:>10.0%}  {pw:>10.0%}  {n80 if n80 else '—':>10}")
    print()
    print("   A true share of .55 needs a sample this study will not have, so a")
    print("   'majority' claim is only in reach if the real split is lopsided.")
    print("   Report the interval either way; the majority rule decides wording,")
    print("   not whether there is a result.")
    print()

    print("4. The conditional disability denominator")
    print("   DIS is interpretable only among people who inferred a person is")
    print("   involved, and that share is itself an outcome. At 300 usable:")
    print()
    print(f"   {'infer a human':>14}  {'denominator':>12}  {'half-width @ p=.50':>19}")
    for share in (0.30, 0.40, 0.50, 0.60, 0.75, 0.90):
        d = round(300 * share)
        print(f"   {share:>13.0%}  {d:>12}  {wilson_halfwidth(0.50, d) * 100:>18.1f} pp")
    print()
    print("   This is why the primary disability reporting is the full WHO x DIS")
    print("   table over everyone, with the conditional estimate as the second")
    print("   step rather than the only one.")
    print()

    print("5. Within-person clip differences (exact McNemar, simulated power)")
    print("   Same people answer all three clips, so the comparison is paired.")
    print("   rho is how strongly one person's two answers move together.")
    print()
    print(f"   {'n':>5}  {'clip A':>7}  {'clip B':>7}  {'rho':>5}  {'power':>7}")
    for n in (200, 300):
        for (pa, pb) in ((0.50, 0.60), (0.50, 0.65)):
            for rho in (0.0, 0.3, 0.6):
                pw = mcnemar_power(n, pa, pb, rho, trials=4000)
                print(f"   {n:>5}  {pa:>7.0%}  {pb:>7.0%}  {rho:>5.1f}  {pw:>6.0%}")
    print()
    print("   At n = 300 a ten-point paired difference reaches 80% power only")
    print("   once the two answers are correlated (78% at rho = .3, 92% at .6);")
    print("   under independence it is 65%. A fifteen-point difference is")
    print("   comfortable throughout. So clip differences are powered for a")
    print("   sizeable gap, not for a small one, and the plan treats them as a")
    print("   secondary question reported with intervals either way.")
    print()

    print("=" * 72)
    print("Recommendation: 300 usable participants, recruit about 330 completers")
    print("to absorb 8-10% loss to the two prespecified quality checks. At 300")
    print("usable, no proportion is reported less precisely than +/-5.6 points.")


if __name__ == "__main__":
    main()
