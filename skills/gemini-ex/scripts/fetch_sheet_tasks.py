#!/usr/bin/env python3
import csv
import io
import sys
import subprocess

# Published Google Sheet CSV URL (Public Web Export)
CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRF82ZJBHIhPsTzzjGm8DFutzw6PtAwqT_iyEB3MG5yKvZrEs354rKHy7YIFIO2zgqKSuRbo62uNyX_/pub?gid=0&single=true&output=csv"
SHEET_KEY = "2PACX-1vRF82ZJBHIhPsTzzjGm8DFutzw6PtAwqT_iyEB3MG5yKvZrEs354rKHy7YIFIO2zgqKSuRbo62uNyX_"

def fetch_tasks(pending_only=True):
    try:
        res = subprocess.run(
            ["curl", "-sL", CSV_URL],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        content = res.stdout
    except Exception as e:
        print(f"Error fetching sheet with curl: {e}", file=sys.stderr)
        return []

    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    if not rows:
        return []

    tasks = []
    for i, row in enumerate(rows[1:], start=2):
        if not any(row):
            continue
        task = {
            "row": i,
            "id": row[0] if len(row) > 0 else f"Row-{i}",
            "screen": row[1] if len(row) > 1 else "",
            "dept": row[2] if len(row) > 2 else "",
            "category": row[3] if len(row) > 3 else "",
            "problem": row[4] if len(row) > 4 else "",
            "improvement": row[5] if len(row) > 5 else "",
            "expected_effect": row[6] if len(row) > 6 else "",
            "status": row[7] if len(row) > 7 else "",
            "related_files": row[8] if len(row) > 8 else ""
        }
        if pending_only and "완료" in task["status"]:
            continue
        tasks.append(task)
    return tasks

if __name__ == "__main__":
    tasks = fetch_tasks(pending_only=False)
    print(f"Fetched {len(tasks)} tasks from Google Sheet (Published CSV: {SHEET_KEY[:25]}...):\n")
    for t in tasks:
        print(f"[{t['id']}] ({t['screen']} | {t['dept']} | {t['category']}) Status: {t['status']}")
        print(f"  - 개선안: {t['improvement'][:80]}...")
        print(f"  - 관련파일: {t['related_files']}\n")
