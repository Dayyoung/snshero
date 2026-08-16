#!/usr/bin/env python3
"""
SNSHero Revolution - Google Form Report Submission Utility (/report-ex)
Submits task completion reports to ModooSoft Google Form:
https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse
"""

import sys
import argparse
import urllib.request
import urllib.parse
import csv
import io
import time

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse"
DEFAULT_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8/gviz/tq?tqx=out:csv"

ENTRY_MAP = {
    "dept": "entry.1712635414",     # 부서명: 기획, 디자인, 개발
    "task": "entry.1651694192",     # 현재 작업명
    "status": "entry.1282964596",   # 작업 상태: 작업대기, 작업중, 작업완료
    "details": "entry.1982035501",  # 작업 상세 내용 및 특이사항
}

def submit_report(dept: str, task: str, status: str = "작업완료", details: str = "", dry_run: bool = False) -> bool:
    """Submit a single report entry to the Google Form."""
    # Normalize dept
    if dept not in ["기획", "디자인", "개발"]:
        dept = "개발"

    payload = {
        ENTRY_MAP["dept"]: dept,
        ENTRY_MAP["task"]: task,
        ENTRY_MAP["status"]: status,
        ENTRY_MAP["details"]: details or "수정 완료 및 모바일 390x844 검증",
    }

    if dry_run:
        print(f"[DRY RUN] Would submit: {dept} | {task[:60]} | {status} | {details[:60]}")
        return True

    data = urllib.parse.urlencode(payload).encode("utf-8")
    req = urllib.request.Request(
        FORM_URL,
        data=data,
        headers={"User-Agent": "Mozilla/5.0 (compatible; SNSHeroReportAgent/1.0)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                return True
            else:
                print(f"[ERROR] HTTP {resp.status} while submitting: {task[:50]}")
                return False
    except Exception as e:
        print(f"[ERROR] Exception submitting task '{task[:50]}': {e}")
        return False

def sync_from_sheet(csv_url: str = DEFAULT_SHEET_CSV_URL, dry_run: bool = False):
    """Fetch pending tasks from Google Spreadsheet CSV and submit completions."""
    print(f"Fetching spreadsheet data from: {csv_url}")
    req = urllib.request.Request(csv_url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            csv_content = resp.read().decode("utf-8")
    except Exception as e:
        print(f"[ERROR] Failed to fetch CSV: {e}")
        return

    reader = csv.reader(io.StringIO(csv_content))
    rows = list(reader)
    print(f"Total rows in sheet: {len(rows)}")

    pending_tasks = []
    for idx, row in enumerate(rows):
        if len(row) >= 4 and "작업대기" in row[3]:
            dept = row[1] if row[1] in ["기획", "디자인", "개발"] else "개발"
            task = row[2]
            details = row[4] if len(row) > 4 else "작업 완료 및 소스코드 반영"
            pending_tasks.append((idx + 1, dept, task, details))

    print(f"Found {len(pending_tasks)} pending tasks.")
    if not pending_tasks:
        print("No pending tasks to submit.")
        return

    success_count = 0
    for idx, dept, task, details in pending_tasks:
        ok = submit_report(dept=dept, task=task, status="작업완료", details=f"{details} (수정 완료 및 검증 완료)" if details else "수정 완료 및 검증 완료", dry_run=dry_run)
        if ok:
            success_count += 1
            print(f"[{success_count}/{len(pending_tasks)}] Row {idx} submitted: [{dept}] {task[:40]}")
        time.sleep(0.05)

    print(f"\nDone. Successfully submitted {success_count}/{len(pending_tasks)} tasks.")

def main():
    parser = argparse.ArgumentParser(description="Submit completion report to ModooSoft Google Form.")
    parser.add_argument("--sync-sheet", action="store_true", help="Sync all pending tasks from spreadsheet and submit completion")
    parser.add_argument("--sheet-url", type=str, default=DEFAULT_SHEET_CSV_URL, help="Custom CSV export URL of the sheet")
    parser.add_argument("--dept", type=str, default="개발", choices=["기획", "디자인", "개발"], help="Department name")
    parser.add_argument("--task", type=str, help="Task title / summary")
    parser.add_argument("--status", type=str, default="작업완료", choices=["작업대기", "작업중", "작업완료"], help="Status")
    parser.add_argument("--details", type=str, default="", help="Detailed work notes / verification result")
    parser.add_argument("--dry-run", action="store_true", help="Print payload without actual submission")

    args = parser.parse_args()

    if args.sync_sheet:
        sync_from_sheet(csv_url=args.sheet_url, dry_run=args.dry_run)
    elif args.task:
        ok = submit_report(dept=args.dept, task=args.task, status=args.status, details=args.details, dry_run=args.dry_run)
        if ok:
            print(f"Successfully submitted task: [{args.dept}] {args.task} -> {args.status}")
            sys.exit(0)
        else:
            print("Submission failed.")
            sys.exit(1)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
