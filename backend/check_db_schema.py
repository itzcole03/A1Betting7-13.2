#!/usr/bin/env python3
"""Check actual database schema for cache warming"""

import sqlite3

def check_predictions_schema():
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    
    try:
        # Get table schema for predictions
        cursor.execute("PRAGMA table_info(predictions)")
        predictions_cols = cursor.fetchall()
        
        print("📋 predictions table schema:")
        for col_info in predictions_cols:
            cid, name, col_type, not_null, default, pk = col_info
            print(f"   • {name}: {col_type}{' NOT NULL' if not_null else ''}{' PRIMARY KEY' if pk else ''}")
        
        # Check what data is actually in predictions table
        cursor.execute("SELECT COUNT(*) FROM predictions")
        pred_count = cursor.fetchone()[0]
        print(f"\n📊 predictions table: {pred_count} rows")
        
        if pred_count > 0:
            # Get sample data
            cursor.execute("SELECT * FROM predictions LIMIT 3")
            columns = [description[0] for description in cursor.description]
            sample_data = cursor.fetchall()
            
            print("\n🔍 Sample predictions data:")
            print(f"   Columns: {', '.join(columns)}")
            for i, row in enumerate(sample_data):
                print(f"   Row {i+1}: {dict(zip(columns, row))}")
        
        # Check model_predictions table
        cursor.execute("PRAGMA table_info(model_predictions)")
        model_pred_cols = cursor.fetchall()
        
        print("\n📋 model_predictions table schema:")
        for col_info in model_pred_cols:
            cid, name, col_type, not_null, default, pk = col_info
            print(f"   • {name}: {col_type}{' NOT NULL' if not_null else ''}{' PRIMARY KEY' if pk else ''}")
        
        cursor.execute("SELECT COUNT(*) FROM model_predictions")
        model_pred_count = cursor.fetchone()[0]
        print(f"\n📊 model_predictions table: {model_pred_count} rows")
        
        # Check other relevant tables
        for table in ['odds', 'events', 'matches', 'teams']:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"📊 {table} table: {count} rows")
            
            if count > 0 and count < 10:  # Show sample for small tables
                cursor.execute(f"SELECT * FROM {table} LIMIT 2")
                columns = [description[0] for description in cursor.description]
                sample = cursor.fetchall()
                print(f"   Sample: {columns}")
                for row in sample:
                    print(f"   {dict(zip(columns, row))}")
                    
    finally:
        conn.close()

if __name__ == '__main__':
    check_predictions_schema()