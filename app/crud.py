from datetime import datetime
from sqlmodel import select
from .db import get_session
from .models import Candidate, Question, TestModel, Attempt, Answer

def create_candidate(name, email):
    with get_session() as s:
        c = Candidate(name=name, email=email)
        s.add(c)
        s.commit()
        s.refresh(c)
        return c

def create_question(text, choices, correct_index=0):
    with get_session() as s:
        q = Question(text=text, choices=choices, correct_choice_index=correct_index)
        s.add(q)
        s.commit()
        s.refresh(q)
        return q

def list_questions():
    with get_session() as s:
        return s.exec(select(Question)).all()

def create_test(title, duration_seconds, question_ids):
    with get_session() as s:
        t = TestModel(title=title, duration_seconds=duration_seconds, question_ids=question_ids)
        s.add(t)
        s.commit()
        s.refresh(t)
        return t

def get_test(test_id):
    with get_session() as s:
        return s.get(TestModel, test_id)

def create_attempt(candidate_id, test_id, started_at, expires_at):
    with get_session() as s:
        a = Attempt(candidate_id=candidate_id, test_id=test_id, started_at=started_at, expires_at=expires_at)
        s.add(a)
        s.commit()
        s.refresh(a)
        return a

def get_attempt(attempt_id):
    with get_session() as s:
        return s.get(Attempt, attempt_id)

def save_answer(attempt_id, question_id, selected_choice_index):
    from sqlmodel import select
    with get_session() as s:
        q = s.exec(select(Answer).where(Answer.attempt_id==attempt_id, Answer.question_id==question_id)).first()
        if q:
            q.selected_choice_index = selected_choice_index
            q.saved_at = datetime.utcnow().isoformat()
            s.add(q)
            s.commit()
            return q
        a = Answer(attempt_id=attempt_id, question_id=question_id, selected_choice_index=selected_choice_index, saved_at=datetime.utcnow().isoformat())
        s.add(a)
        s.commit()
        s.refresh(a)
        return a

def list_answers_for_attempt(attempt_id):
    with get_session() as s:
        return s.exec(select(Answer).where(Answer.attempt_id==attempt_id)).all()
