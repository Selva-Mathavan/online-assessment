from typing import List, Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON

class Candidate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    choices: List[str] = Field(sa_column=Column(JSON), default=[])
    correct_choice_index: int = 0

class TestModel(SQLModel, table=True):
    __tablename__ = "test"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    duration_seconds: int = 1800
    question_ids: List[int] = Field(sa_column=Column(JSON), default=[])

class Attempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int
    test_id: int
    started_at: Optional[str] = None
    expires_at: Optional[str] = None
    submitted_at: Optional[str] = None

class Answer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    attempt_id: int
    question_id: int
    selected_choice_index: int
    saved_at: Optional[str] = None
