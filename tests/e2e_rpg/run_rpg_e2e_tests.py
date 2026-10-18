#!/usr/bin/env python3
"""SNSHero Revolution 40-Chapter RPG Mode (/main) 4-Tier Master E2E Test Runner.

Executes the complete, autonomous, requirement-driven opaque-box verification harness:
- Tier 1: Feature Coverage & Interface Contracts (F1 Storyline, F2 Scripts, F3 Choices Data,
          F4 Choices UI, F5 Timers, F8 Ambush Encounters, F12 Auto-Play) - 36 assertions.
- Tier 2: Boundary Value Analysis & Corner Cases (Ch 1 Init, Ch 40 Epilogue, Missing Defaults,
          Safe Losses, 0 Buff State, Negative & Overflow Inputs) - 6 assertions.
- Tier 3: Pairwise Combinations & State Machine (Multi-Phase Pipeline, Buff Acquisition & Combat,
          Choice SNS Persistence, Dynamic Auto-Mode Switching, Cross-Chapter Cooldown) - 5 assertions.
- Tier 4: Real-World Workload Scenarios (Full 40-Chapter Hands-Free Playthrough, Rebirth Loops,
          10,000-Step Monte Carlo Audit, Safe Loss Recovery) - 4 assertions.

Usage:
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 1
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 2
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 3
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 4
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M1
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M2
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M3
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M4
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --verbose
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --json
    python3 tests/e2e_rpg/run_rpg_e2e_tests.py --allow-fail
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import List, Optional

# Ensure repository root is on sys.path
repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from tests.e2e_rpg.helpers import TestResult
from tests.e2e_rpg.tier1_feature_coverage import run_tier1_tests
from tests.e2e_rpg.tier2_boundary_corner import run_tier2_tests
from tests.e2e_rpg.tier3_cross_feature import run_tier3_tests
from tests.e2e_rpg.tier4_realworld_workload import run_tier4_tests

# ANSI color codes for terminal formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(tier_arg: str, verbose: bool, milestone_arg: Optional[str] = None):
    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}  SNSHero Revolution 40-Chapter RPG Mode (/main) Master E2E Runner   {RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}")
    print(f"Working Directory : {repo_root}")
    print(f"Target Scope      : 40 Chapters Storyline, Choices, Timers, Encounters, Auto-Play")
    scope_str = f"Execution Tier    : {tier_arg.upper()}"
    if milestone_arg:
        scope_str += f" | Milestone: {milestone_arg.upper()}"
    print(scope_str)
    print(f"Verbose Logging   : {verbose}\n")


def print_tier_header(tier_num: int, title: str):
    print(f"{BOLD}=== [TIER {tier_num}] {title} ==={RESET}")


def print_result_line(res: TestResult, verbose: bool):
    if res.status == "PASS":
        badge = f"{GREEN}✓ PASS{RESET}"
    elif res.status == "WARN":
        badge = f"{YELLOW}⚠ WARN{RESET}"
    else:
        badge = f"{RED}✗ FAIL{RESET}"

    time_str = f"({res.duration_ms:.1f}ms)" if res.duration_ms > 0 else ""
    ms_badge = f"[{res.milestone}]" if res.milestone != "ALL" else ""
    print(f"  {badge} [{res.test_id}] {ms_badge} {res.name} {time_str}")

    if res.status != "PASS" or verbose:
        prefix = "    "
        print(f"{prefix}Message: {res.message}")
        if res.details:
            for d in res.details[:6]:
                print(f"{prefix}  - {d}")
            if len(res.details) > 6:
                print(f"{prefix}  ... and {len(res.details) - 6} more occurrences")


def print_summary_table(results: List[TestResult], elapsed_total: float):
    total = len(results)
    passed = sum(1 for r in results if r.status == "PASS")
    failed = sum(1 for r in results if r.status == "FAIL")
    warned = sum(1 for r in results if r.status == "WARN")
    pass_pct = (passed / total * 100.0) if total > 0 else 0.0

    # Group by tier
    tier_counts = {1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0]}
    for r in results:
        if r.tier in tier_counts:
            tier_counts[r.tier][0] += 1
            if r.status == "PASS":
                tier_counts[r.tier][1] += 1

    print(f"\n{BOLD}======================================================================{RESET}")
    print(f"{BOLD}                       RPG E2E EXECUTION SUMMARY                      {RESET}")
    print(f"{BOLD}======================================================================{RESET}")
    print(f"{'Tier':<10} | {'Category / Objective':<42} | {'Pass / Total':<14}")
    print("-" * 72)
    t1_p, t1_t = tier_counts[1][1], tier_counts[1][0]
    t2_p, t2_t = tier_counts[2][1], tier_counts[2][0]
    t3_p, t3_t = tier_counts[3][1], tier_counts[3][0]
    t4_p, t4_t = tier_counts[4][1], tier_counts[4][0]

    print(f"{'Tier 1':<10} | {'Feature Coverage (F1, F2, F3, F4, F5, F8, F12)':<42} | {f'{t1_p}/{t1_t}':<14}")
    print(f"{'Tier 2':<10} | {'Boundary & Corner Cases (Ch1, Ch40, Timer, Loss)':<42} | {f'{t2_p}/{t2_t}':<14}")
    print(f"{'Tier 3':<10} | {'Cross-Feature & State Machine Combinations':<42} | {f'{t3_p}/{t3_t}':<14}")
    print(f"{'Tier 4':<10} | {'Real-World Workload Playthrough & Monte Carlo':<42} | {f'{t4_p}/{t4_t}':<14}")
    print("=" * 72)

    status_color = GREEN if failed == 0 else RED
    print(f"Total Assertions : {total}")
    print(f"Passed           : {GREEN}{passed}{RESET}")
    print(f"Failed           : {RED if failed > 0 else GREEN}{failed}{RESET}")
    print(f"Warnings         : {YELLOW}{warned}{RESET}")
    print(f"Compliance Rate  : {status_color}{pass_pct:.1f}%{RESET}")
    print(f"Execution Time   : {elapsed_total:.2f}s")
    print(f"{BOLD}======================================================================{RESET}\n")


def main():
    parser = argparse.ArgumentParser(
        description="SNSHero Revolution 40-Chapter RPG Mode (/main) Master E2E Runner"
    )
    parser.add_argument(
        "--tier",
        type=str,
        default="all",
        choices=["all", "1", "2", "3", "4"],
        help="Run specific test tier (1, 2, 3, 4, or all)",
    )
    parser.add_argument(
        "--milestone",
        type=str,
        default=None,
        choices=["M1", "M2", "M3", "M4", "ALL"],
        help="Filter tests by milestone scope (M1, M2, M3, M4, ALL)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print detailed diagnostic output for all assertions",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output machine-readable JSON summary only",
    )
    parser.add_argument(
        "--allow-fail",
        action="store_true",
        help="Exit with code 0 even if assertions fail (baseline audit mode)",
    )

    args = parser.parse_args()
    start_total_time = time.perf_counter()

    if not args.json:
        print_banner(args.tier, args.verbose, args.milestone)

    all_results: List[TestResult] = []

    # Tier 1
    if args.tier in ("all", "1"):
        if not args.json:
            print_tier_header(1, "Feature Coverage & Interface Contracts (F1, F2, F3, F4, F5, F8, F12)")
        t1_results = run_tier1_tests(milestone_filter=args.milestone, verbose=args.verbose)
        for r in t1_results:
            if not args.json:
                print_result_line(r, args.verbose)
            all_results.append(r)
        if not args.json:
            print()

    # Tier 2
    if args.tier in ("all", "2"):
        if not args.json:
            print_tier_header(2, "Boundary Value Analysis & Corner Cases (Ch 1, Ch 40, Timers, Losses)")
        t2_results = run_tier2_tests(milestone_filter=args.milestone, verbose=args.verbose)
        for r in t2_results:
            if not args.json:
                print_result_line(r, args.verbose)
            all_results.append(r)
        if not args.json:
            print()

    # Tier 3
    if args.tier in ("all", "3"):
        if not args.json:
            print_tier_header(3, "Cross-Feature Combinations & State Machine Transitions")
        t3_results = run_tier3_tests(milestone_filter=args.milestone, verbose=args.verbose)
        for r in t3_results:
            if not args.json:
                print_result_line(r, args.verbose)
            all_results.append(r)
        if not args.json:
            print()

    # Tier 4
    if args.tier in ("all", "4"):
        if not args.json:
            print_tier_header(4, "Real-World Workload Scenarios & Autonomous Simulation")
        t4_results = run_tier4_tests(milestone_filter=args.milestone, verbose=args.verbose)
        for r in t4_results:
            if not args.json:
                print_result_line(r, args.verbose)
            all_results.append(r)
        if not args.json:
            print()

    total_elapsed = time.perf_counter() - start_total_time

    if args.json:
        payload = {
            "summary": {
                "total": len(all_results),
                "passed": sum(1 for r in all_results if r.status == "PASS"),
                "failed": sum(1 for r in all_results if r.status == "FAIL"),
                "warned": sum(1 for r in all_results if r.status == "WARN"),
                "compliance_pct": round(
                    sum(1 for r in all_results if r.status == "PASS") / len(all_results) * 100.0, 2
                ) if all_results else 0.0,
                "elapsed_seconds": round(total_elapsed, 3),
            },
            "results": [r.to_dict() for r in all_results],
        }
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    else:
        print_summary_table(all_results, total_elapsed)

    has_failures = any(r.status == "FAIL" for r in all_results)
    if has_failures and not args.allow_fail:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
