#!/usr/bin/env python3
"""SNSHero 110-Hero Character Illustration Remaster E2E Automated Test Runner.

Executes a 4-tier requirement-driven verification harness:
- Tier 1: Feature Coverage (Seat portraits, Primary 10x10, Legacy 10x11, Faction sheets)
- Tier 2: Boundary & Corner Cases (Size budgets, Header integrity, Grid transitions, Bosses)
- Tier 3: Cross-Feature & Coordinate Alignment (Mathematical coordinate parity, pixel similarity)
- Tier 4: Real-World Scenarios (CardItem tints/frames, CanvasCardRenderer blitting, Payload audit)

Usage:
    python3 tests/e2e_character_assets/runner.py
    python3 tests/e2e_character_assets/runner.py --tier 1
    python3 tests/e2e_character_assets/runner.py --tier 2
    python3 tests/e2e_character_assets/runner.py --tier 3
    python3 tests/e2e_character_assets/runner.py --tier 4
    python3 tests/e2e_character_assets/runner.py --verbose
    python3 tests/e2e_character_assets/runner.py --json
    python3 tests/e2e_character_assets/runner.py --allow-fail
"""

import argparse
import json
import sys
import time
from typing import List, Optional

# Ensure repository root is on sys.path
from pathlib import Path
repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from tests.e2e_character_assets.helpers import TestResult
from tests.e2e_character_assets.tier1_feature_coverage import run_tier1_tests
from tests.e2e_character_assets.tier2_boundary_corner import run_tier2_tests
from tests.e2e_character_assets.tier3_coordinate_alignment import run_tier3_tests
from tests.e2e_character_assets.tier4_real_world import run_tier4_tests

# ANSI color codes for terminal formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(tier_arg: str, verbose: bool, feature_arg: Optional[str] = None, milestone_arg: Optional[str] = None):
    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}  SNSHero 110-Hero Character Remaster Dual-Track E2E Test Runner      {RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}")
    print(f"Working Directory : {repo_root}")
    print(f"Target Scope      : 110 Heroes across 11 Factions (public/seat, sprite sheets)")
    scope_str = f"Execution Tier    : {tier_arg.upper()}"
    if feature_arg:
        scope_str += f" | Feature: {feature_arg}"
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
    print(f"  {badge} [{res.test_id}] {res.name} {time_str}")

    if res.status != "PASS" or verbose:
        prefix = "    "
        print(f"{prefix}Message: {res.message}")
        if res.details:
            for d in res.details[:12]:
                print(f"{prefix}  - {d}")
            if len(res.details) > 12:
                print(f"{prefix}  ... and {len(res.details) - 12} more items")


def main():
    parser = argparse.ArgumentParser(
        description="SNSHero 110-Hero Character Illustration Remaster E2E Test Runner"
    )
    parser.add_argument(
        "--tier",
        type=str,
        default="all",
        choices=["all", "1", "2", "3", "4"],
        help="Specify which tier to execute (default: all)",
    )
    parser.add_argument(
        "--feature",
        "-f",
        type=str,
        default=None,
        help="Specify feature to test (e.g. '2', 'F2', 'seat')",
    )
    parser.add_argument(
        "--milestone",
        "-m",
        type=str,
        default=None,
        help="Specify milestone to test (e.g. '1', 'M1', '2', 'M2', '3', 'M3')",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable detailed diagnostic reporting for every assertion",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in JSON format",
    )
    parser.add_argument(
        "--allow-fail",
        action="store_true",
        help="Exit with code 0 even if assertions fail (useful for baseline audits)",
    )

    args = parser.parse_args()

    if not args.json:
        print_banner(args.tier, args.verbose, args.feature, args.milestone)

    def matches_filter(r: TestResult) -> bool:
        if args.feature:
            fq = str(args.feature).strip().lower().replace("feature", "").replace("f", "").strip()
            return (
                f".f{fq}." in r.test_id.lower()
                or r.feature.lower().startswith(f"feature {fq}")
                or f"feature {fq}:" in r.feature.lower()
                or (fq in ("seat", "portrait") and "seat" in r.feature.lower())
            )
        if args.milestone:
            mq = str(args.milestone).strip().lower().replace("m", "")
            if mq == "1":
                return (
                    f".f2." in r.test_id.lower()
                    or f".f1." in r.test_id.lower()
                    or r.feature.lower().startswith("feature 1")
                    or r.feature.lower().startswith("feature 2")
                )
            elif mq == "2":
                return (
                    any(f".f{k}." in r.test_id.lower() for k in ("3", "4", "5", "6"))
                    or any(r.feature.lower().startswith(f"feature {k}") for k in ("3", "4", "5", "6"))
                )
            elif mq == "3":
                return (
                    ".f7." in r.test_id.lower()
                    or r.feature.lower().startswith("feature 7")
                )
            elif mq == "4":
                return True
        return True

    all_results: List[TestResult] = []
    start_total_time = time.perf_counter()

    # Tier 1
    if args.tier in ("all", "1"):
        t1_raw = run_tier1_tests()
        t1_results = [r for r in t1_raw if matches_filter(r)]
        if t1_results:
            if not args.json:
                print_tier_header(1, "Feature Coverage & Asset Integrity (public/seat, master, faction sheets)")
            all_results.extend(t1_results)
            if not args.json:
                for r in t1_results:
                    print_result_line(r, args.verbose)
                print()

    # Tier 2
    if args.tier in ("all", "2"):
        t2_raw = run_tier2_tests()
        t2_results = [r for r in t2_raw if matches_filter(r)]
        if t2_results:
            if not args.json:
                print_tier_header(2, "Boundary & Corner Cases (Size Budgets, Header Magic Bytes, Grid Boundaries)")
            all_results.extend(t2_results)
            if not args.json:
                for r in t2_results:
                    print_result_line(r, args.verbose)
                print()

    # Tier 3
    if args.tier in ("all", "3"):
        t3_raw = run_tier3_tests()
        t3_results = [r for r in t3_raw if matches_filter(r)]
        if t3_results:
            if not args.json:
                print_tier_header(3, "Cross-Feature Interactions & Coordinate Alignment (Math & Pixel Parity)")
            all_results.extend(t3_results)
            if not args.json:
                for r in t3_results:
                    print_result_line(r, args.verbose)
                print()

    # Tier 4
    if args.tier in ("all", "4"):
        t4_raw = run_tier4_tests()
        t4_results = [r for r in t4_raw if matches_filter(r)]
        if t4_results:
            if not args.json:
                print_tier_header(4, "Real-World Scenarios (CardItem Tints/Frames, Canvas Slicing, Payload Audit)")
            all_results.extend(t4_results)
            if not args.json:
                for r in t4_results:
                    print_result_line(r, args.verbose)
                print()

    total_duration = time.perf_counter() - start_total_time

    pass_count = sum(1 for r in all_results if r.status == "PASS")
    fail_count = sum(1 for r in all_results if r.status == "FAIL")
    warn_count = sum(1 for r in all_results if r.status == "WARN")
    total_count = len(all_results)

    if args.json:
        output_payload = {
            "summary": {
                "total": total_count,
                "passed": pass_count,
                "failed": fail_count,
                "warnings": warn_count,
                "duration_seconds": round(total_duration, 3),
                "all_passed": fail_count == 0,
            },
            "results": [r.to_dict() for r in all_results],
        }
        print(json.dumps(output_payload, indent=2, ensure_ascii=False))
    else:
        print(f"{BOLD}----------------------------------------------------------------------{RESET}")
        print(f"{BOLD}  E2E Test Execution Summary ({total_duration:.2f}s){RESET}")
        print(f"{BOLD}----------------------------------------------------------------------{RESET}")
        print(f"  Total Assertions   : {total_count}")
        print(f"  {GREEN}Passed Assertions  : {pass_count}{RESET}")
        print(f"  {RED}Failed Assertions  : {fail_count}{RESET}")
        print(f"  {YELLOW}Warnings           : {warn_count}{RESET}")

        pass_rate = (pass_count / total_count * 100) if total_count > 0 else 0
        print(f"  Pass Rate          : {pass_rate:.1f}%\n")

        if fail_count > 0:
            print(f"{RED}{BOLD}STATUS: UNMET MILESTONE REQUIREMENTS DETECTED ({fail_count} failures).{RESET}")
            print(f"Implementation milestones M1 (portraits), M2 (sheets), M3 (budgets) required.\n")
        else:
            print(f"{GREEN}{BOLD}STATUS: ALL E2E REQUIREMENTS VERIFIED 100% SATISFIED!{RESET}\n")

    if fail_count > 0 and not args.allow_fail:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
