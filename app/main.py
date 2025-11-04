from fastapi import FastAPI
from sqlmodel import SQLModel
from .db import engine
from .routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Online Assessment")
app.include_router(router)

# Allow CORS for deployed frontend and local dev
# For now we allow all origins (safe for testing). Later restrict to your Vercel domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your production URL like "https://your-vercel-url.vercel.app"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
