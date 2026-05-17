from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class OCRScanRequest(BaseModel):
    """Receipt or bank statement image as base64-encoded data URL."""
    image_base64: str = Field(..., description="Base64-encoded image (with or without data:image prefix)")
    language_hint: str = Field(default="en", description="Language hint: 'en', 'bm', or 'auto'")


class OCRTransaction(BaseModel):
    """A single transaction extracted from a receipt or bank statement."""
    merchant: str = Field(default="", description="Merchant / store / payee name")
    amount: float = Field(default=0.0, description="Transaction amount in RM (always positive)")
    category: str = Field(default="other", description="Category: food, groceries, shopping, transport, utilities, health, entertainment, other, income")
    date: str = Field(default="", description="Transaction date in YYYY-MM-DD format")
    note: str = Field(default="", description="Additional note (item name, reference, etc.)")
    transaction_type: str = Field(default="debit", description="'debit' (money out) or 'credit' (money in)")


class OCRScanResult(BaseModel):
    """Structured data extracted by the OCR agent.
    For receipts: store_name + line_items are populated.
    For bank statements: transactions list is populated."""
    document_type: Literal["receipt", "bank_statement"] = Field(default="receipt")
    store_name: str = Field(default="", description="Merchant name (receipt mode)")
    total_amount: float = Field(default=0.0, description="Total receipt amount (receipt mode)")
    line_items: list[OCRTransaction] = Field(default_factory=list, description="Line items from receipt or statement entries")
    transactions: list[OCRTransaction] = Field(default_factory=list, description="All extracted transactions (always populated)")
    raw_text: str = Field(default="", description="Raw OCR text for debugging")


class OCRInsertResult(BaseModel):
    """Result of inserting one transaction into the database."""
    transaction_id: str | None = None
    merchant: str = ""
    amount: float = 0.0
    db_inserted: bool = False
    db_error: str | None = None


class OCRScanResponse(BaseModel):
    """Response from the OCR scan endpoint."""
    status: Literal["ok", "error"] = Field(default="ok")
    scan_result: OCRScanResult | None = None
    insert_results: list[OCRInsertResult] = Field(default_factory=list)
    total_inserted: int = Field(default=0)
    total_failed: int = Field(default=0)
    xp_earned: int = Field(default=0)
    processing_time_ms: float = Field(default=0.0)
    error: str | None = Field(default=None)
