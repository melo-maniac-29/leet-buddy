from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from models import UserProgress, Problem

router = APIRouter(prefix="/api/progress", tags=["progress"])

# Request/Response models
class SaveProgressRequest(BaseModel):
    user_id: str
    problem_id: int
    language: str
    solution_code: str
    runtime: Optional[str] = None
    memory: Optional[str] = None
    notes: Optional[str] = None
    github_synced: bool = False
    github_url: Optional[str] = None

class ProgressResponse(BaseModel):
    success: bool
    message: str
    progress_id: Optional[int] = None

# Save or update user progress
@router.post("/save", response_model=ProgressResponse)
def save_progress(
    request: SaveProgressRequest,
    db: Session = Depends(get_db)
):
    """
    Save user's solution progress to database.
    Called when user submits a solution on LeetCode.
    Stores code, runtime, memory, notes, and GitHub sync status.
    """
    try:
        # Verify problem exists
        problem = db.query(Problem).filter(
            Problem.problem_id == request.problem_id
        ).first()
        
        if not problem:
            raise HTTPException(
                status_code=404, 
                detail=f"Problem #{request.problem_id} not found"
            )
        
        # Check if progress already exists
        existing = db.query(UserProgress).filter(
            UserProgress.user_id == request.user_id,
            UserProgress.problem_id == request.problem_id,
            UserProgress.language == request.language
        ).first()
        
        if existing:
            # Update existing progress
            existing.solution_code = request.solution_code
            existing.runtime = request.runtime
            existing.memory = request.memory
            existing.notes = request.notes
            existing.solved_at = datetime.now()
            existing.github_synced = request.github_synced
            existing.github_url = request.github_url
            
            db.commit()
            
            return ProgressResponse(
                success=True,
                message="Progress updated successfully",
                progress_id=existing.id
            )
        else:
            # Create new progress entry
            progress = UserProgress(
                user_id=request.user_id,
                problem_id=request.problem_id,
                language=request.language,
                solution_code=request.solution_code,
                runtime=request.runtime,
                memory=request.memory,
                notes=request.notes,
                solved_at=datetime.now(),
                github_synced=request.github_synced,
                github_url=request.github_url
            )
            
            db.add(progress)
            db.commit()
            db.refresh(progress)
            
            return ProgressResponse(
                success=True,
                message="Progress saved successfully",
                progress_id=progress.id
            )
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save progress: {str(e)}"
        )

# Get user's progress for a specific problem
@router.get("/{user_id}/{problem_id}")
def get_problem_progress(
    user_id: str,
    problem_id: int,
    db: Session = Depends(get_db)
):
    """Get all progress entries for a user on a specific problem"""
    
    progress_entries = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.problem_id == problem_id
    ).all()
    
    if not progress_entries:
        return {"solutions": []}
    
    solutions = []
    for entry in progress_entries:
        solutions.append({
            "id": entry.id,
            "language": entry.language,
            "solved_at": entry.solved_at.isoformat() if entry.solved_at else None,
            "runtime": entry.runtime,
            "memory": entry.memory,
            "notes": entry.notes,
            "github_synced": entry.github_synced,
            "github_url": entry.github_url,
            "has_code": bool(entry.solution_code)
        })
    
    return {"solutions": solutions}

# Get user's solution code
@router.get("/{user_id}/{problem_id}/{language}/code")
def get_solution_code(
    user_id: str,
    problem_id: int,
    language: str,
    db: Session = Depends(get_db)
):
    """Get the actual solution code for a specific language"""
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.problem_id == problem_id,
        UserProgress.language == language
    ).first()
    
    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Solution not found"
        )
    
    return {
        "code": progress.solution_code,
        "language": progress.language,
        "runtime": progress.runtime,
        "memory": progress.memory,
        "notes": progress.notes,
        "solved_at": progress.solved_at.isoformat() if progress.solved_at else None
    }

# Update GitHub sync status
@router.patch("/{progress_id}/github-sync")
def update_github_sync(
    progress_id: int,
    github_url: str,
    db: Session = Depends(get_db)
):
    """Update GitHub sync status after successful upload"""
    
    progress = db.query(UserProgress).filter(
        UserProgress.id == progress_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    
    progress.github_synced = True
    progress.github_url = github_url
    
    db.commit()
    
    return {"success": True, "message": "GitHub sync status updated"}
