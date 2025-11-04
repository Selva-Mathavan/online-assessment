import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./assessment.db")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
ACCESS_TOKEN_EXPIRE_SECONDS = int(os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", "300"))
