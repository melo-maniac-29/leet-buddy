#!/usr/bin/env python3
"""
Migrate final_database.json to PostgreSQL
Run this once after starting Docker containers
"""

import json
import sys
from sqlalchemy import create_engine, text, func
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.models import Base, Problem, Solution, Topic, Company, Roadmap
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
        roadmap_problems = {
            'leadcoding_by_fraz_250_qs_dsa_sheet': set(),
            'arsh_goyal_280_qs_dsa_sheet': set(),
            'strivers': set(),
            'NeetCode': set(),
            'Interview_DS_Algo': set()
        }
        
        # Load existing topics and companies into cache
        print("📋 Loading existing topics and companies...")
        for topic in db.query(Topic).all():
            topics_dict[topic.name] = topic
        for company in db.query(Company).all():
            companies_dict[company.name] = company
        print(f"   Found {len(topics_dict)} topics and {len(companies_dict)} companies")
        
        print("\n📊 Processing problems and solutions...")
        
        for idx, problem_data in enumerate(data['problems'], 1):
            if idx % 100 == 0:
                print(f"   Processed {idx}/{len(data['problems'])} problems...")
            
            # Skip if problem already exists
            existing_problem = db.query(Problem).filter_by(problem_id=problem_data['id']).first()
            if existing_problem:
                continue
            
            # Create problem
            problem = Problem(
                problem_id=problem_data['id'],
                title=problem_data['title'],
                title_slug=problem_data['title_slug'],
                difficulty=problem_data['difficulty'],
                acceptance_rate=problem_data.get('acceptance_rate'),
                frontend_id=problem_data.get('id'),  # Use id as frontend_id
                is_premium=False,  # Only free problems
                problem_url=problem_data.get('url', '')
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
            
            # Track roadmap memberships
            roadmaps_data = problem_data.get('roadmaps', {})
            if 'leadcoding_by_fraz_250_qs_dsa_sheet' in roadmaps_data:
                roadmap_problems['leadcoding_by_fraz_250_qs_dsa_sheet'].add(problem_data['id'])
            if 'arsh_goyal_280_qs_dsa_sheet' in roadmaps_data:
                roadmap_problems['arsh_goyal_280_qs_dsa_sheet'].add(problem_data['id'])
            if 'strivers' in roadmaps_data:
                roadmap_problems['strivers'].add(problem_data['id'])
            
            # Add solutions and track roadmap sources
            solutions_data = problem_data.get('solutions', {})
            if isinstance(solutions_data, dict):
                # Solutions are organized by language
                for language, lang_solutions in solutions_data.items():
                    for solution_data in lang_solutions:
                        source = solution_data.get('source', 'community')
                        
                        # Track NeetCode and Interview_DS_Algo roadmap membership
                        if source == 'NeetCode':
                            roadmap_problems['NeetCode'].add(problem_data['id'])
                        elif source == 'Interview_DS_Algo':
                            roadmap_problems['Interview_DS_Algo'].add(problem_data['id'])
                        
                        solution = Solution(
                            problem_id=problem_data['id'],
                            language=language,
                            code=solution_data['code'],
                            source=source,
                            contributed_at=datetime.now()
                        )
                        db.add(solution)
        
        # Commit all changes
        print("\n💾 Committing to database...")
        db.commit()
        
        # Insert curated roadmaps metadata
        print("\n📚 Creating curated roadmaps...")
        from api.models import Roadmap
        
        roadmaps_to_insert = [
            {
                'name': 'Fraz',
                'display_name': 'LeadCoding by Fraz (250 Questions)',
                'description': 'Curated DSA sheet by Fraz covering essential interview problems',
                'category': 'curated',
                'total_problems': len(roadmap_problems['leadcoding_by_fraz_250_qs_dsa_sheet']),
                'problem_ids': list(roadmap_problems['leadcoding_by_fraz_250_qs_dsa_sheet'])
            },
            {
                'name': 'Arsh',
                'display_name': 'Arsh Goyal DSA Sheet (280 Questions)',
                'description': 'Comprehensive DSA preparation sheet by Arsh Goyal',
                'category': 'curated',
                'total_problems': len(roadmap_problems['arsh_goyal_280_qs_dsa_sheet']),
                'problem_ids': list(roadmap_problems['arsh_goyal_280_qs_dsa_sheet'])
            },
            {
                'name': 'Strivers',
                'display_name': "Striver's SDE Sheet",
                'description': 'Popular SDE interview preparation roadmap by Striver',
                'category': 'curated',
                'total_problems': len(roadmap_problems['strivers']),
                'problem_ids': list(roadmap_problems['strivers'])
            },
            {
                'name': 'NeetCode',
                'display_name': 'NeetCode 150',
                'description': 'Popular coding pattern problems from NeetCode covering all major topics',
                'category': 'curated',
                'total_problems': len(roadmap_problems['NeetCode']),
                'problem_ids': list(roadmap_problems['NeetCode'])
            },
            {
                'name': 'Interview_DS_Algo',
                'display_name': 'Interview DS & Algorithms',
                'description': 'Comprehensive collection of data structures and algorithms interview problems',
                'category': 'curated',
                'total_problems': len(roadmap_problems['Interview_DS_Algo']),
                'problem_ids': list(roadmap_problems['Interview_DS_Algo'])
            }
        ]
        
        for roadmap_data in roadmaps_to_insert:
            # Calculate difficulty distribution
            problem_ids = roadmap_data['problem_ids']
            difficulties = db.query(Problem.difficulty, func.count(Problem.id)).filter(
                Problem.problem_id.in_(problem_ids)
            ).group_by(Problem.difficulty).all()
            
            difficulty_dist = {diff: count for diff, count in difficulties}
            roadmap_data['difficulty_distribution'] = difficulty_dist
            
            roadmap = Roadmap(**roadmap_data)
            db.add(roadmap)
            
            print(f"   ✅ {roadmap_data['name']}: {roadmap_data['total_problems']} problems")
        
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
            text("UPDATE database_metadata SET value = :val, updated_at = NOW() WHERE key = 'total_problems'"),
            {"val": str(db.query(Problem).count())}
        )
        db.execute(
            text("UPDATE database_metadata SET value = :val, updated_at = NOW() WHERE key = 'total_solutions'"),
            {"val": str(db.query(Solution).count())}
        )
        db.execute(
            text("UPDATE database_metadata SET value = :val, updated_at = NOW() WHERE key = 'last_sync'"),
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
