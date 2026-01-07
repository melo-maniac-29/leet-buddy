from sqlalchemy import Column, Integer, String, Boolean, Text, DECIMAL, TIMESTAMP, ForeignKey, Table, JSON, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime

try:
    from database import Base
except ImportError:
    from api.database import Base

# Association tables for many-to-many relationships
problem_topics = Table(
    'problem_topics',
    Base.metadata,
    Column('problem_id', Integer, ForeignKey('problems.problem_id', ondelete='CASCADE'), primary_key=True),
    Column('topic_id', Integer, ForeignKey('topics.id', ondelete='CASCADE'), primary_key=True)
)

problem_companies = Table(
    'problem_companies',
    Base.metadata,
    Column('problem_id', Integer, ForeignKey('problems.problem_id', ondelete='CASCADE'), primary_key=True),
    Column('company_id', Integer, ForeignKey('companies.id', ondelete='CASCADE'), primary_key=True)
)


class Problem(Base):
    __tablename__ = "problems"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    title_slug = Column(String(500), nullable=False)
    difficulty = Column(String(20), nullable=False, index=True)
    acceptance_rate = Column(DECIMAL(5, 2))
    frontend_id = Column(Integer, index=True)
    is_premium = Column(Boolean, default=False)
    problem_url = Column(String(500))
    
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    solutions = relationship("Solution", back_populates="problem", cascade="all, delete-orphan")
    topics = relationship("Topic", secondary=problem_topics, back_populates="problems")
    companies = relationship("Company", secondary=problem_companies, back_populates="problems")


class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now)
    
    # Relationships
    problems = relationship("Problem", secondary=problem_topics, back_populates="topics")


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now)
    
    # Relationships
    problems = relationship("Problem", secondary=problem_companies, back_populates="companies")


class Solution(Base):
    __tablename__ = "solutions"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.problem_id", ondelete="CASCADE"), nullable=False)
    language = Column(String(50), nullable=False, index=True)
    code = Column(Text, nullable=False)
    
    source = Column(String(50), default="official")
    contributor_github = Column(String(100))
    contributed_at = Column(TIMESTAMP)
    
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    problem = relationship("Problem", back_populates="solutions")


class PendingContribution(Base):
    __tablename__ = "pending_contributions"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.problem_id", ondelete="CASCADE"), nullable=False)
    language = Column(String(50), nullable=False)
    code = Column(Text, nullable=False)
    
    contributor_github = Column(String(100), nullable=False)
    pr_number = Column(Integer)
    pr_url = Column(String(500))
    
    status = Column(String(20), default="pending", index=True)
    submitted_at = Column(TIMESTAMP, default=datetime.now)
    reviewed_at = Column(TIMESTAMP)
    reviewer_notes = Column(Text)
    
    runtime = Column(String(50))
    memory = Column(String(50))


class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("problems.problem_id", ondelete="CASCADE"), nullable=False, index=True)
    solved_at = Column(TIMESTAMP, default=datetime.now, index=True)
    language = Column(String(50))
    runtime = Column(String(50))
    memory = Column(String(50))
    solution_code = Column(Text)
    notes = Column(Text)
    github_synced = Column(Boolean, default=False)
    github_url = Column(String(500))


class UserRoadmap(Base):
    __tablename__ = "user_roadmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    roadmap_name = Column(String(100), nullable=False)
    started_at = Column(TIMESTAMP, default=datetime.now)
    is_active = Column(Boolean, default=True, index=True)
    last_activity = Column(TIMESTAMP, default=datetime.now)


class UserAISettings(Base):
    __tablename__ = "user_ai_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), unique=True, nullable=False)
    api_base_url = Column(String(500), default="https://api.openai.com/v1")
    api_key_encrypted = Column(Text)
    model_name = Column(String(100), default="gpt-3.5-turbo")
    enabled = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)


class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(50))
    total_problems = Column(Integer)
    problem_ids = Column(ARRAY(Integer))
    difficulty_distribution = Column(JSON)
    created_at = Column(TIMESTAMP, default=datetime.now)

