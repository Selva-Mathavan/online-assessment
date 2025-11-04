from fastapi import FastAPI
from sqlmodel import SQLModel
from .db import engine
from .routes import router

app = FastAPI(title="Online Assessment")
app.include_router(router)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
