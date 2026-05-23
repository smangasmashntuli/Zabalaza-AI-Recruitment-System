#!/usr/bin/env python
"""
Database Migration Script - Add missing columns to existing tables

This script adds any missing columns that are defined in the SQLAlchemy models
but are not present in the actual database tables.
"""

import os
import sys
from sqlalchemy import inspect, text
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment
load_dotenv()

from backend.app.database import engine, Base

def get_missing_columns():
    """Check which columns defined in models are missing from the database."""
    inspector = inspect(engine)

    missing = {}

    # Check each table
    for table_name, table in Base.metadata.tables.items():
        if not inspector.has_table(table_name):
            missing[table_name] = list(table.columns.keys())
            continue

        db_columns = {col['name'] for col in inspector.get_columns(table_name)}
        model_columns = {col.name for col in table.columns}

        missing_cols = model_columns - db_columns
        if missing_cols:
            missing[table_name] = list(missing_cols)

    return missing

def add_missing_columns():
    """Add missing columns to database tables."""
    missing = get_missing_columns()

    if not missing:
        print("✓ All columns are present in the database.")
        return True

    print(f"Found missing columns: {missing}")
    print("\nAttempting to add missing columns...\n")

    with engine.begin() as connection:
        for table_name, table in Base.metadata.tables.items():
            if table_name not in missing:
                continue

            print(f"Processing table: {table_name}")

            for col in table.columns:
                if col.name not in missing[table_name]:
                    continue

                # Build ALTER TABLE statement
                col_type = str(col.type.compile(dialect=engine.dialect))
                nullable = "NULL" if col.nullable else "NOT NULL"
                default_clause = ""

                if col.default is not None:
                    if isinstance(col.default.arg, str):
                        default_clause = f" DEFAULT '{col.default.arg}'"
                    else:
                        default_clause = f" DEFAULT {col.default.arg}"

                sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{col.name}` {col_type} {nullable}{default_clause};"

                try:
                    print(f"  Adding column: {col.name} ({col_type})")
                    connection.execute(text(sql))
                    print(f"    ✓ Success")
                except Exception as e:
                    print(f"    ✗ Error: {e}")

    # Verify
    remaining_missing = get_missing_columns()
    if remaining_missing:
        print(f"\n⚠️ Some columns are still missing: {remaining_missing}")
        return False
    else:
        print("\n✓ All missing columns have been added successfully!")
        return True

if __name__ == "__main__":
    try:
        print("╔════════════════════════════════════════════════════╗")
        print("║      Database Migration - Add Missing Columns     ║")
        print("╚════════════════════════════════════════════════════╝\n")

        success = add_missing_columns()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

