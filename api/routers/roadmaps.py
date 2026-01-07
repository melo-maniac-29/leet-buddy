from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import Problem, Solution, Topic, UserProgress, UserRoadmap, Roadmap

router = APIRouter(prefix="/api/roadmaps", tags=["roadmaps"])

# Response models
class RoadmapInfo(BaseModel):
    name: str
    display_name: str
    category: str
    total_problems: int
    description: Optional[str] = None
    difficulty_distribution: Optional[dict] = None

class ProblemWithProgress(BaseModel):
    id: int
    problem_id: int
    title: str
    title_slug: str
    difficulty: str
    acceptance_rate: Optional[float]
    problem_url: Optional[str]
    topics: List[str]
    completed: bool = False
    solved_at: Optional[datetime] = None
    languages: List[str] = []

class UserProgressResponse(BaseModel):
    user_id: str
    roadmap_name: str
    total_problems: int
    completed_problems: int
    progress_percentage: float
    by_difficulty: dict
    last_activity: Optional[datetime]

# Get all available roadmaps
@router.get("/", response_model=List[RoadmapInfo])
def get_roadmaps(db: Session = Depends(get_db)):
    """Get all available learning paths"""
    
    roadmaps = []
    
    # 1. Curated roadmaps from database
    curated = db.query(Roadmap).filter(Roadmap.category == 'curated').all()
    
    for roadmap in curated:
        roadmaps.append(RoadmapInfo(
            name=roadmap.name,
            display_name=roadmap.display_name,
            category=roadmap.category,
            total_problems=roadmap.total_problems,
            description=roadmap.description,
            difficulty_distribution=roadmap.difficulty_distribution
        ))
    
    # 2. Topic-based roadmaps (ordered by learning progression)
    # Get all topics with counts
    topics = db.query(
        Topic.name,
        func.count(Problem.problem_id).label('total')
    ).join(
        Problem.topics
    ).group_by(Topic.name).all()
    
    # Convert to dict for easy lookup
    topic_counts = {topic.name: topic.total for topic in topics}
    
    # Learning order (Striver's A2Z progression)
    learning_order = [
        # Fundamentals
        'Array', 'String', 'Math',
        # Basic techniques
        'Hash Table', 'Sorting', 'Two Pointers', 'Sliding Window', 'Prefix Sum',
        'Binary Search', 'Bit Manipulation', 'Counting',
        # Recursion & Patterns
        'Recursion', 'Backtracking', 'Divide and Conquer', 'Greedy',
        # Data Structures - Linear
        'Stack', 'Queue', 'Monotonic Stack', 'Monotonic Queue', 
        'Linked List', 'Doubly-Linked List',
        # Data Structures - Trees
        'Tree', 'Binary Tree', 'Binary Search Tree', 'Heap (Priority Queue)',
        'Trie', 'Segment Tree', 'Binary Indexed Tree', 'Ordered Set',
        # Graph Theory
        'Graph', 'Depth-First Search', 'Breadth-First Search',
        'Topological Sort', 'Shortest Path', 'Union Find',
        'Minimum Spanning Tree', 'Strongly Connected Component', 
        'Biconnected Component', 'Eulerian Circuit',
        # Dynamic Programming
        'Dynamic Programming', 'Memoization', 'Bitmask',
        # Matrix & Geometry
        'Matrix', 'Geometry', 'Line Sweep',
        # Advanced
        'Simulation', 'Enumeration', 'Combinatorics', 'Number Theory',
        'Game Theory', 'Brainteaser',
        # String Advanced
        'String Matching', 'Rolling Hash', 'Hash Function', 'Suffix Array',
        # Sorting Advanced  
        'Merge Sort', 'Quickselect', 'Counting Sort', 'Bucket Sort', 'Radix Sort',
        # Special Topics
        'Design', 'Data Stream', 'Iterator', 'Randomized',
        'Reservoir Sampling', 'Rejection Sampling',
        'Probability and Statistics', 'Concurrency',
        'Database', 'Shell', 'Interactive'
    ]
    
    # Add topics in learning order
    for topic_name in learning_order:
        if topic_name in topic_counts:
            roadmaps.append(RoadmapInfo(
                name=f"topic_{topic_name.replace(' ', '_')}",
                display_name=f"{topic_name} Mastery",
                category="topic",
                total_problems=topic_counts[topic_name],
                description=f"Master {topic_name} from basics to advanced"
            ))
    
    # Add any remaining topics not in learning_order (edge case)
    for topic_name, count in topic_counts.items():
        if topic_name not in learning_order:
            roadmaps.append(RoadmapInfo(
                name=f"topic_{topic_name.replace(' ', '_')}",
                display_name=f"{topic_name} Mastery",
                category="topic",
                total_problems=count,
                description=f"Master {topic_name} from basics to advanced"
            ))
    
    return roadmaps

# Get problems for a specific roadmap
@router.get("/{roadmap_name}/problems", response_model=List[ProblemWithProgress])
def get_roadmap_problems(
    roadmap_name: str,
    user_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all problems for a roadmap with user progress"""
    
    # Determine roadmap type
    if roadmap_name.startswith("topic_"):
        # Topic-based roadmap
        topic_name = roadmap_name.replace("topic_", "").replace("_", " ").title()
        query = db.query(Problem).join(Problem.topics).filter(Topic.name == topic_name)
    else:
        # Curated roadmap - get from roadmaps table
        roadmap = db.query(Roadmap).filter(Roadmap.name == roadmap_name).first()
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        query = db.query(Problem).filter(Problem.problem_id.in_(roadmap.problem_ids))
    
    # Filter by difficulty if specified
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty.capitalize())
    
    # Order by problem_id
    problems = query.order_by(Problem.problem_id).all()
    
    # Get user progress if user_id provided
    user_completed = {}
    if user_id:
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.problem_id.in_([p.problem_id for p in problems])
        ).all()
        
        for p in progress:
            if p.problem_id not in user_completed:
                user_completed[p.problem_id] = {
                    'solved_at': p.solved_at,
                    'languages': []
                }
            user_completed[p.problem_id]['languages'].append(p.language)
    
    # Build response
    result = []
    for problem in problems:
        completed_info = user_completed.get(problem.problem_id, {})
        
        result.append(ProblemWithProgress(
            id=problem.id,
            problem_id=problem.problem_id,
            title=problem.title,
            title_slug=problem.title_slug,
            difficulty=problem.difficulty,
            acceptance_rate=float(problem.acceptance_rate) if problem.acceptance_rate else None,
            problem_url=problem.problem_url,
            topics=[t.name for t in problem.topics],
            completed=problem.problem_id in user_completed,
            solved_at=completed_info.get('solved_at'),
            languages=completed_info.get('languages', [])
        ))
    
    return result

# Get user progress for a roadmap
@router.get("/{roadmap_name}/progress/{user_id}", response_model=UserProgressResponse)
def get_user_progress(
    roadmap_name: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's progress on a specific roadmap"""
    
    # Get total problems in roadmap
    if roadmap_name.startswith("topic_"):
        topic_name = roadmap_name.replace("topic_", "").replace("_", " ").title()
        total_problems = db.query(func.count(Problem.problem_id)).join(
            Problem.topics
        ).filter(Topic.name == topic_name).scalar()
    else:
        total_problems = db.query(func.count(Problem.problem_id)).filter(
            text(f"'{roadmap_name}' = ANY(problems.roadmaps)")
        ).scalar()
    
    # Get completed problems
    if roadmap_name.startswith("topic_"):
        topic_name = roadmap_name.replace("topic_", "").replace("_", " ").title()
        completed_query = db.query(
            func.count(UserProgress.problem_id.distinct()).label('completed'),
            Problem.difficulty,
        ).join(
            Problem, UserProgress.problem_id == Problem.problem_id
        ).join(
            Problem.topics
        ).filter(
            UserProgress.user_id == user_id,
            Topic.name == topic_name
        ).group_by(Problem.difficulty).all()
    else:
        completed_query = db.query(
            func.count(UserProgress.problem_id.distinct()).label('completed'),
            Problem.difficulty,
        ).join(
            Problem, UserProgress.problem_id == Problem.problem_id
        ).filter(
            UserProgress.user_id == user_id,
            text(f"'{roadmap_name}' = ANY(problems.roadmaps)")
        ).group_by(Problem.difficulty).all()
    
    completed_problems = sum(row.completed for row in completed_query)
    by_difficulty = {row.difficulty: row.completed for row in completed_query}
    
    # Get last activity
    last_activity = db.query(func.max(UserProgress.solved_at)).filter(
        UserProgress.user_id == user_id
    ).scalar()
    
    return UserProgressResponse(
        user_id=user_id,
        roadmap_name=roadmap_name,
        total_problems=total_problems or 0,
        completed_problems=completed_problems,
        progress_percentage=round((completed_problems / total_problems * 100), 2) if total_problems > 0 else 0,
        by_difficulty=by_difficulty,
        last_activity=last_activity
    )

# Activate a roadmap for user
@router.post("/{roadmap_name}/activate/{user_id}")
def activate_roadmap(
    roadmap_name: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Mark a roadmap as active for user"""
    
    # Check if already exists
    existing = db.query(UserRoadmap).filter(
        UserRoadmap.user_id == user_id,
        UserRoadmap.roadmap_name == roadmap_name
    ).first()
    
    if existing:
        existing.is_active = True
        existing.last_activity = datetime.now()
    else:
        new_roadmap = UserRoadmap(
            user_id=user_id,
            roadmap_name=roadmap_name,
            is_active=True
        )
        db.add(new_roadmap)
    
    db.commit()
    
    return {"success": True, "message": f"Roadmap {roadmap_name} activated"}

# Get user's active roadmaps
@router.get("/user/{user_id}/active")
def get_user_active_roadmaps(user_id: str, db: Session = Depends(get_db)):
    """Get all active roadmaps for a user"""
    
    roadmaps = db.query(UserRoadmap).filter(
        UserRoadmap.user_id == user_id,
        UserRoadmap.is_active == True
    ).all()
    
    result = []
    for roadmap in roadmaps:
        # Get progress
        progress = get_user_progress(roadmap.roadmap_name, user_id, db)
        result.append({
            "roadmap_name": roadmap.roadmap_name,
            "started_at": roadmap.started_at,
            "last_activity": roadmap.last_activity,
            "progress": progress.dict()
        })
    
    return result
