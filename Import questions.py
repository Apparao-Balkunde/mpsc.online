#!/usr/bin/env python3
"""
MPSC सारथी — Supabase Question Importer
Usage: python3 import_questions.py --file questions.csv --table prelims_questions
"""

import argparse
import csv
import json
import os
import sys
import time
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Install: pip install supabase")
    sys.exit(1)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

VALID_TABLES = [
    "prelims_questions", "mains_questions", "mock_questions",
    "saralseva_questions", "current_affairs", "vocab_questions",
    "literature_questions"
]

REQUIRED_COLS = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer_index", "explanation"]
OPTIONAL_COLS = ["subject", "exam_name", "year", "difficulty", "category", "language", "is_pyq"]

def parse_options(row: dict) -> list[str]:
    return [
        row.get("option_a", "").strip(),
        row.get("option_b", "").strip(),
        row.get("option_c", "").strip(),
        row.get("option_d", "").strip(),
    ]

def parse_row(row: dict, table: str) -> dict | None:
    question = row.get("question", "").strip()
    if not question:
        return None

    try:
        correct_idx = int(str(row.get("correct_answer_index", "0")).strip())
        if correct_idx not in range(4):
            correct_idx = 0
    except ValueError:
        correct_idx = 0

    record = {
        "question":            question,
        "options":             parse_options(row),
        "correct_answer_index": correct_idx,
        "explanation":         row.get("explanation", "").strip() or "स्पष्टीकरण उपलब्ध नाही.",
    }

    # Optional fields
    for col in OPTIONAL_COLS:
        val = row.get(col, "").strip()
        if val:
            if col == "year":
                try: record["year"] = int(val)
                except: pass
            elif col == "correct_answer_index":
                pass
            elif col == "is_pyq":
                record["is_pyq"] = val.lower() in ("true", "1", "yes", "हो")
            else:
                record[col] = val

    return record

def import_csv(file_path: str, table: str, batch_size: int = 25, dry_run: bool = False):
    if table not in VALID_TABLES:
        print(f"❌ Invalid table: {table}. Valid: {', '.join(VALID_TABLES)}")
        sys.exit(1)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Set SUPABASE_URL and SUPABASE_KEY environment variables")
        sys.exit(1)

    path = Path(file_path)
    if not path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    print(f"\n📂 Reading {file_path}...")
    rows = []
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            parsed = parse_row(row, table)
            if parsed:
                rows.append(parsed)
            else:
                print(f"  ⚠️  Row {i+2}: Empty question — skipped")

    print(f"✅ Valid rows: {len(rows)}")

    if dry_run:
        print(f"\n🔍 DRY RUN — Sample (first 3):")
        for r in rows[:3]:
            print(f"  → {r['question'][:60]}...")
            print(f"     Options: {r['options']}")
            print(f"     Correct: {r['correct_answer_index']}")
        print(f"\n✅ Dry run complete — {len(rows)} rows ready")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    total, errors = 0, 0

    print(f"\n🚀 Importing to '{table}' in batches of {batch_size}...")
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        batch_num = i // batch_size + 1
        try:
            res = supabase.table(table).insert(batch).execute()
            total += len(batch)
            print(f"  ✅ Batch {batch_num}: {len(batch)} rows → Total: {total}")
        except Exception as e:
            errors += len(batch)
            print(f"  ❌ Batch {batch_num} failed: {e}")
        time.sleep(0.3)  # Rate limit buffer

    print(f"\n{'='*50}")
    print(f"✅ Done! Imported: {total} | Failed: {errors}")
    print(f"Table: {table}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MPSC सारथी CSV Importer")
    parser.add_argument("--file",  required=True, help="CSV file path")
    parser.add_argument("--table", required=True, help=f"Table: {', '.join(VALID_TABLES)}")
    parser.add_argument("--batch", type=int, default=25, help="Batch size (default: 25)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without importing")
    args = parser.parse_args()
    import_csv(args.file, args.table, args.batch, args.dry_run)
