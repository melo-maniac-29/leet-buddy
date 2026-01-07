#!/usr/bin/env python3
"""
Migrate final_database.json to PostgreSQL
Run this once after starting Docker containers
"""

import json
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.models import Base, Problem, Solution, Topic, Company
from api.database import DATABASE_URL


def load_json_database(file_path: str) -> dict:
    """Load the JSON database"""
    print(f"📂 Loading database from {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"✅ Loaded {len(data['problems'])} problems")
    return data


def migrate_database(json_file: str, database_url: str):
    """Migrate JSON data to PostgreSQL"""
    
    # Create engine and session
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("\n🚀 Starting migration...")
        
        # Load JSON data
        data = load_json_database(json_file)
        
        # Track unique topics and companies
        topics_dict = {}
        companies_dict = {}
        
        print("\n📊 Processing problems and solutions...")
        
        for idx, problem_data in enumerate(data['problems'], 1):
            if idx % 100 == 0:
                print(f"   Processed {idx}/{len(data['problems'])} problems...")
            
            # Create problem
            problem = Problem(
                problem_id=problem_data['problem_id'],
                title=problem_data['title'],
                title_slug=problem_data['title_slug'],
                difficulty=problem_data['difficulty'],
                acceptance_rate=problem_data.get('acceptance_rate'),
                frontend_id=problem_data.get('frontend_id'),
                is_premium=problem_data.get('is_premium', False),
                problem_url=problem_data.get('problem_url', '')
            )
            
            # Add topics
            for topic_name in problem_data.get('topics', []):
                if topic_name not in topics_dict:
                    topic = Topic(name=topic_name)
                    db.add(topic)
                    db.flush()  # Get the ID
                    topics_dict[topic_name] = topic
                problem.topics.append(topics_dict[topic_name])
            
            # Add companies
            for company_name in problem_data.get('companies', []):
                if company_name not in companies_dict:
                    company = Company(name=company_name)
                    db.add(company)
                    db.flush()
                    companies_dict[company_name] = company
                problem.companies.append(companies_dict[company_name])
            
            db.add(problem)
            db.flush()  # Ensure problem is saved before adding solutions
            
            # Add solutions
            for solution_data in problem_data.get('solutions', []):
                solution = Solution(
                    problem_id=problem_data['problem_id'],
                    language=solution_data['language'],
                    code=solution_data['code'],
                    source='official',
                    contributed_at=datetime.now()
                )
                db.add(solution)
        
        # Commit all changes
        print("\n💾 Committing to database...")
        db.commit()
        
        # Print statistics
        print("\n✅ Migration completed successfully!")
        print(f"\n📈 Statistics:")
        print(f"   Problems: {db.query(Problem).count()}")
        print(f"   Solutions: {db.query(Solution).count()}")
        print(f"   Topics: {db.query(Topic).count()}")
        print(f"   Companies: {db.query(Company).count()}")
        
        # Update metadata
        print("\n🔄 Updating metadata...")
        db.execute(
            "UPDATE database_metadata SET value = :val, updated_at = NOW() WHERE key = 'total_problems'",
            {"val": str(db.query(Problem).count())}
        )
        db.execute(
            "UPDATE database_metadata SET value = :val, updated_at = NOW() WHERE key = 'total_solutions'",
            {"val": str(db.query(Solution).count())}
        )
        db.execute(
            "UPDATE database_metadata SET value = :val, updated_at = NOW() WHERE key = 'last_sync'",
            {"val": datetime.now().isoformat()}
        )
        db.commit()
        
        print("✅ Metadata updated")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Configuration
    JSON_FILE = "processed-data/final_database.json"
    DB_URL = os.getenv("DATABASE_URL", DATABASE_URL)
    
    print("=" * 60)
    print("🔄 LeetBuddy Database Migration")
    print("=" * 60)
    print(f"Source: {JSON_FILE}")
    print(f"Target: {DB_URL.split('@')[1] if '@' in DB_URL else 'PostgreSQL'}")
    print("=" * 60)
    
    # Check if JSON file exists
    if not os.path.exists(JSON_FILE):
        print(f"❌ Error: {JSON_FILE} not found!")
        print("Please ensure final_database.json is in the processed-data/ directory")
        sys.exit(1)
    
    # Run migration
    try:
        migrate_database(JSON_FILE, DB_URL)
        print("\n🎉 All done! Your database is ready to use.")
        print("\n📍 Next steps:")
        print("   1. Test the API: http://localhost:8000")
        print("   2. View docs: http://localhost:8000/docs")
        print("   3. Install Chrome extension")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
