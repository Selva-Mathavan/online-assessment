from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from .crud import *
from .auth import create_token, get_token_payload
from .db import get_session
from .models import Question

router = APIRouter(prefix="/api")

@router.post("/candidates")
def create_candidate_endpoint(body: dict):
    c = create_candidate(body.get("name"), body.get("email"))
    token = create_token({"sub": str(c.id), "role": "candidate"})
    return {"id": c.id, "token": token}

@router.post("/tests/{test_id}/start")
def start_test(test_id: int, payload: dict = Depends(get_token_payload)):
    candidate_id = int(payload.get("sub"))
    t = get_test(test_id)
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")
    started = datetime.utcnow()
    expires = started + timedelta(seconds=t.duration_seconds)
    a = create_attempt(candidate_id, test_id, started.isoformat(), expires.isoformat())
    return {"attempt_id": a.id, "started_at": a.started_at, "expires_at": a.expires_at}

@router.get("/tests/{test_id}/questions")
def get_test_questions(test_id: int, token_payload: dict = Depends(get_token_payload)):
    t = get_test(test_id)
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")
    questions = []
    with get_session() as s:
        for qid in t.question_ids:
            q = s.get(Question, qid)
            if q:
                questions.append({"id": q.id, "text": q.text, "choices": q.choices})
    return {"test_id": t.id, "questions": questions}

@router.post("/attempts/{attempt_id}/answer")
def save_answer_endpoint(attempt_id: int, body: dict, token_payload: dict = Depends(get_token_payload)):
    a = save_answer(attempt_id, body.get("question_id"), body.get("selected_choice_index"))
    return {"ok": True, "saved_at": a.saved_at}

@router.post("/attempts/{attempt_id}/submit")
def submit_attempt(attempt_id: int, token_payload: dict = Depends(get_token_payload)):
    attempt = get_attempt(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    answers = list_answers_for_attempt(attempt_id)
    t = get_test(attempt.test_id)
    correct = 0
    total = 0
    with get_session() as s:
        for qid in t.question_ids:
            q = s.get(Question, qid)
            if q:
                total += 1
                ans = next((x for x in answers if x.question_id == q.id), None)
                if ans and ans.selected_choice_index == q.correct_choice_index:
                    correct += 1
    return {"attempt_id": attempt_id, "score": correct, "total": total}
