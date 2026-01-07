from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TopicBase(BaseModel):
    name: str


class CompanyBase(BaseModel):
    name: str


class SolutionBase(BaseModel):
    language: str
    code: str
    source: Optional[str] = "official"
    contributor_github: Optional[str] = None


class SolutionResponse(SolutionBase):
    id: int
    problem_id: int
    contributed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProblemBase(BaseModel):
    problem_id: int
    title: str
    title_slug: str
    difficulty: str
    acceptance_rate: Optional[float] = None
    frontend_id: Optional[int] = None
    is_premium: bool = False
    problem_url: Optional[str] = None


class ProblemResponse(ProblemBase):
    id: int
    topics: List[TopicBase] = []
    companies: List[CompanyBase] = []
    solutions: List[SolutionResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True


class ContributionRequest(BaseModel):
    problem_id: int
    language: str
    code: str
    contributor_github: str
    runtime: Optional[str] = None
    memory: Optional[str] = None


class ContributionResponse(BaseModel):
    status: str  # success/duplicate/pending
    message: str
    pr_url: Optional[str] = None
    pr_number: Optional[int] = None


class FilterRequest(BaseModel):
    difficulty: Optional[str] = None
    topics: Optional[List[str]] = None
    companies: Optional[List[str]] = None
    skip: int = 0
    limit: int = 100
