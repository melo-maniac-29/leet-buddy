from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime

from database import get_db, engine
from models import Problem, Solution, PendingContribution, Topic, Company
from schemas import (
    ProblemResponse, 
    SolutionResponse, 
    ContributionRequest,
    ContributionResponse,
    FilterRequest
)
from github_service import GitHubService

# Initialize FastAPI
app = FastAPI(
    title="LeetBuddy API",
    description="Open source LeetCode learning platform with community contributions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Chrome extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GitHub service
github_service = GitHubService(
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    repo_owner=os.getenv("GITHUB_REPO_OWNER"),
    repo_name=os.getenv("GITHUB_REPO_NAME")
)


@app.get("/")
def root():
    return {
        "message": "LeetBuddy API",
        "version": "1.0.0",
        "endpoints": {
            "problems": "/api/problems",
            "solutions": "/api/solutions/{problem_id}",
            "contribute": "/api/contribute",
            "stats": "/api/stats"
        }
    }


@app.get("/api/problems", response_model=List[ProblemResponse])
def get_problems(
    difficulty: Optional[str] = None,
    topic: Optional[str] = None,
    company: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get problems with optional filters"""
    query = db.query(Problem)
    
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty.capitalize())
    
    if topic:
        query = query.join(Problem.topics).filter(Topic.name == topic)
    
    if company:
        query = query.join(Problem.companies).filter(Company.name == company)
    
    problems = query.offset(skip).limit(limit).all()
    return problems


@app.get("/api/problems/{problem_id}", response_model=ProblemResponse)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """Get a specific problem by ID"""
    problem = db.query(Problem).filter(Problem.problem_id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem


@app.get("/api/solutions/{problem_id}", response_model=List[SolutionResponse])
def get_solutions(problem_id: int, db: Session = Depends(get_db)):
    """Get all solutions for a problem"""
    solutions = db.query(Solution).filter(Solution.problem_id == problem_id).all()
    return solutions


@app.post("/api/contribute", response_model=ContributionResponse)
async def contribute_solution(
    contribution: ContributionRequest,
    db: Session = Depends(get_db)
):
    """
    Submit a new solution contribution
    Creates a GitHub PR automatically
    """
    # Check if solution already exists
    existing = db.query(Solution).filter(
        Solution.problem_id == contribution.problem_id,
        Solution.language == contribution.language
    ).first()
    
    if existing:
        return ContributionResponse(
            status="duplicate",
            message=f"We already have a {contribution.language} solution for this problem"
        )
    
    # Check if pending
    pending = db.query(PendingContribution).filter(
        PendingContribution.problem_id == contribution.problem_id,
        PendingContribution.language == contribution.language,
        PendingContribution.status == "pending"
    ).first()
    
    if pending:
        return ContributionResponse(
            status="pending",
            message="This solution is already under review",
            pr_url=pending.pr_url
        )
    
    # Get problem details
    problem = db.query(Problem).filter(Problem.problem_id == contribution.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    try:
        # Create GitHub PR
        pr_data = await github_service.create_contribution_pr(
            problem_id=contribution.problem_id,
            problem_title=problem.title,
            language=contribution.language,
            code=contribution.code,
            contributor_github=contribution.contributor_github,
            runtime=contribution.runtime,
            memory=contribution.memory
        )
        
        # Save to pending contributions
        pending_contrib = PendingContribution(
            problem_id=contribution.problem_id,
            language=contribution.language,
            code=contribution.code,
            contributor_github=contribution.contributor_github,
            pr_number=pr_data["number"],
            pr_url=pr_data["url"],
            status="pending",
            runtime=contribution.runtime,
            memory=contribution.memory
        )
        db.add(pending_contrib)
        db.commit()
        
        return ContributionResponse(
            status="success",
            message="🎉 Contribution submitted! PR created successfully",
            pr_url=pr_data["url"],
            pr_number=pr_data["number"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create PR: {str(e)}")


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get database statistics"""
    total_problems = db.query(Problem).count()
    total_solutions = db.query(Solution).count()
    total_pending = db.query(PendingContribution).filter(
        PendingContribution.status == "pending"
    ).count()
    
    # Language distribution
    from sqlalchemy import func
    language_stats = db.query(
        Solution.language,
        func.count(Solution.id).label("count")
    ).group_by(Solution.language).all()
    
    return {
        "total_problems": total_problems,
        "total_solutions": total_solutions,
        "pending_contributions": total_pending,
        "languages": {lang: count for lang, count in language_stats},
        "last_updated": datetime.now().isoformat()
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
