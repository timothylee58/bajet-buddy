from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    amount: float
    category: str
    merchant: str
    note: str = ""
    verdict: Literal["boleh", "fikir_dulu", "jangan_dulu"] = "boleh"


class TransactionOut(BaseModel):
    id: str
    user_id: str
    amount: float
    category: str
    merchant: str
    note: str
    verdict: str
    created_at: datetime
