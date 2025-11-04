from .crud import create_question, create_test, list_questions
from .db import get_session

def seed():
    qs = list_questions()
    if len(qs) >= 30:
        print("Already seeded.")
        return
    for i in range(1, 31):
        text = f"What is {i} + {i}?"
        choices = [str(i+i), str(i+i+1), str(i+i-1), str(i+i+2)]
        q = create_question(text, choices, 0)
        print("Created q", q.id)
    qs = list_questions()
    ids = [q.id for q in qs][:30]
    t = create_test("Sample Test", 300, ids)
    print("Seed complete. Test id:", t.id)

if __name__ == "__main__":
    seed()
