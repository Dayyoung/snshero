#!/usr/bin/env python3
"""SNSHero Revolution Terminal-Flat Design System 4-Tier Master E2E Test Runner.

Executes the complete, autonomous, requirement-driven opaque-box verification harness:
- Tier 1: Feature Coverage & Visual Compliance across all 22+ views and chrome (0 banned classes, font-mono, 2-tier radius, 1px hairlines).
- Tier 2: Boundary Value Analysis & Ergonomic Limits (min-h-[44px] touch targets, top-layer [x]/[SKIP] dismiss, 375px mobile resilience).
- Tier 3: Pairwise Combinatorial & Cross-Feature Integration (View transitions, hero_* persistence, safeLazy imports, 0 index imports).
- Tier 4: Real-World Workload Testing (6 End-to-end player journeys, zero viewport intrusion, layout clearance).

Usage:
    python3 tests/e2e_design_system/run_all_e2e_tests.py
    python3 tests/e2e_design_system/run_all_e2e_tests.py --tier 1
    python3 tests/e2e_design_system/run_all_e2e_tests.py --tier 2
    python3 tests/e2e_design_system/run_all_e2e_tests.py --tier 3
    python3 tests/e2e_design_system/run_all_e2e_tests.py --tier 4
    python3 tests/e2e_design_system/run_all_e2e_tests.py --milestone M1
    python3 tests/e2e_design_system/run_all_e2e_tests.py --milestone M2
    python3 tests/e2e_design_system/run_all_e2e_tests.py --milestone M3
    python3 tests/e2e_design_system/run_all_e2e_tests.py --verbose
    python3 tests/e2e_design_system/run_all_e2e_tests.py --json
    python3 tests/e2e_design_system/run_all_e2e_tests.py --allow-fail
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

from tests.e2e_design_system.helpers import TestResult
from tests.e2e_design_system.tier1_feature_coverage import run_tier1_tests
from tests.e2e_design_system.tier2_boundary_corner import run_tier2_tests
from tests.e2e_design_system.tier3_cross_feature import run_tier3_tests
from tests.e2e_design_system.tier4_realworld_workload import run_tier4_tests

# ANSI color codes for terminal formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(tier_arg: str, verbose: bool, milestone_arg: Optional[str] = None):
    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}  SNSHero Revolution Terminal-Flat Design System 4-Tier E2E Runner   {RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}")
    print(f"Working Directory : {repo_root}")
    print(f"Target Scope      : All 22+ Core Views & Shared Chrome (DESIGN.md Canonical)")
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


def main():
    parser = argparse.ArgumentParser(
        description="SNSHero Revolution Terminal-Flat Design System 4-Tier E2E Runner"
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
            print_tier_header(1, "Feature Coverage & DESIGN.md Visual Compliance")
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
            print_tier_header(2, "Boundary Value Analysis & Ergonomic Limits (44px+, Modals, Viewport)")
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
            print_tier_header(3, "Pairwise Combinatorial & Cross-Feature Integration")
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
            print_tier_header(4, "Real-World Workload Testing (6 End-to-End Player Journeys)")
        t4_results = run_tier4_tests(milestone_filter=args.milestone, verbose=args.verbose)
        for r in t4_results:
            if not args.json:
                print_result_line(r, args.verbose)
            all_results.append(r)
        if not args.json:
            print()

    total_duration = time.perf_counter() - start_total_time
    total_count = len(all_results)
    pass_count = sum(1 for r in all_results if r.status == "PASS")
    fail_count = sum(1 for r in all_results if r.status == "FAIL")
    warn_count = sum(1 for r in all_results if r.status == "WARN")
    pass_rate = (pass_count / total_count * 100.0) if total_count > 0 else 0.0

    if args.json:
        output_data = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_assertions": total_count,
            "passed": pass_count,
            "failed": fail_count,
            "warnings": warn_count,
            "pass_rate_pct": round(pass_rate, 2),
            "duration_sec": round(total_duration, 3),
            "tier": args.tier,
            "milestone": args.milestone,
            "results": [
                {
                    "test_id": r.test_id,
                    "name": r.name,
                    "tier": r.tier,
                    "status": r.status,
                    "milestone": r.milestone,
                    "message": r.message,
                    "duration_ms": round(r.duration_ms, 2),
                    "details": r.details,
                }
                for r in all_results
            ],
        }
        print(json.dumps(output_data, indent=2))
    else:
        print(f"----------------------------------------------------------------------")
        print(f"  SNSHero Design System E2E Execution Summary ({total_duration:.2f}s)")
        print(f"----------------------------------------------------------------------")
        print(f"  Total Assertions   : {total_count}")
        print(f"  Passed Assertions  : {pass_count}")
        print(f"  Failed Assertions  : {fail_count}")
        print(f"  Warnings           : {warn_count}")
        print(f"  Pass Rate          : {pass_rate:.1f}%")
        print()

        if fail_count == 0:
            print(f"{GREEN}{BOLD}STATUS: ALL ASSERTIONS PASSED (100.0% COMPLIANCE).{RESET}")
            print("DESIGN.md Terminal-Flat Visual Unification requirements fully verified.")
        else:
            print(f"{YELLOW}{BOLD}STATUS: PENDING MILESTONE DELIVERABLES DETECTED ({fail_count} failures).{RESET}")
            print("Run with `--milestone M1`, `--milestone M2`, or `--milestone M3` to track per-milestone progress.")

    if fail_count > 0 and not args.allow_fail:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
