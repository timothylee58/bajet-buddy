from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class OCRScanRequest(BaseModel):
    """Receipt or bank statement image as base64-encoded data URL."""

    image_base64: str = Field(
        ..., description="Base64-encoded image (with or without data:image prefix)"
    )
    language_hint: str = Field(
        default="en", description="Language hint: 'en', 'bm', or 'auto'"
    )


class OCRTransaction(BaseModel):
    """A single transaction extracted from a receipt or bank statement."""

    merchant: str = Field(default="", description="Merchant / store / payee name")
    amount: float = Field(
        default=0.0, description="Transaction amount in RM (always positive)"
    )
    category: str = Field(
        default="other",
        description="Category: food, groceries, shopping, transport, utilities, health, entertainment, other, income",
    )
    date: str = Field(default="", description="Transaction date in YYYY-MM-DD format")
    note: str = Field(
        default="", description="Additional note (item name, reference, etc.)"
    )
    transaction_type: str = Field(
        default="debit", description="'debit' (money out) or 'credit' (money in)"
    )


class OCRScanResult(BaseModel):
    """Structured data extracted by the OCR agent (ChatGPT-4o).
    For receipts: store_name + line_items are populated.
    For bank statements: transactions list is populated.
    For e-wallet screenshots (TnG/MAE/GrabPay "Payment Successful" screens):
    wallet_provider/counterparty/reference_id/wallet_transaction_type are
    populated instead of store_name — these screens rarely have a store name
    or itemized line items."""

    document_type: Literal["receipt", "bank_statement", "ewallet_screenshot"] = Field(
        default="receipt"
    )
    store_name: str = Field(default="", description="Merchant name (receipt mode)")
    total_amount: float = Field(
        default=0.0, description="Total receipt amount (receipt mode)"
    )
    line_items: list[OCRTransaction] = Field(
        default_factory=list,
        description="Line items from receipt or statement entries",
    )
    transactions: list[OCRTransaction] = Field(
        default_factory=list,
        description="All extracted transactions (always populated)",
    )
    raw_text: str = Field(default="", description="Raw OCR text for debugging")

    # ── E-wallet screenshot mode only (all optional; None for receipt/statement) ──
    wallet_provider: Literal["tng", "mae", "grabpay", "other"] | None = Field(
        default=None, description="E-wallet provider detected from the screenshot"
    )
    counterparty: str | None = Field(
        default=None, description="Recipient/sender name shown on the confirmation screen"
    )
    reference_id: str | None = Field(
        default=None, description="Transaction reference / receipt number shown on the screen"
    )
    wallet_transaction_type: (
        Literal["send", "receive", "payment", "topup", "bill_payment", "other"] | None
    ) = Field(default=None, description="Kind of e-wallet transaction")


class OCRSpendingSummary(BaseModel):
    """AI-generated spending summary produced by DeepSeek after OCR."""

    headline: str = Field(
        default="Here's your spending breakdown",
        description="Punchy Manglish headline about the spending",
    )
    insight: str = Field(
        default="", description="2-3 sentence Manglish spending analysis"
    )
    top_category: str = Field(
        default="other", description="Category with highest total spend"
    )
    total_debits: float = Field(
        default=0.0, description="Sum of all debit (spending) amounts"
    )
    total_credits: float = Field(
        default=0.0, description="Sum of all credit (income) amounts"
    )
    savings_tip: str = Field(
        default="", description="One specific Malaysian-context money-saving tip"
    )


class OCRInsertResult(BaseModel):
    """Result of inserting one transaction into the database."""

    transaction_id: str | None = None
    merchant: str = ""
    amount: float = 0.0
    db_inserted: bool = False
    db_error: str | None = None


class OCRScanResponse(BaseModel):
    """Unified response from the OCR scan endpoint.
    Step 1: ChatGPT-4o extracts transactions (scan_result).
    Step 2: DeepSeek generates a Manglish spending summary (spending_summary).
    Step 3: Transactions are bulk-inserted into Supabase."""

    status: Literal["ok", "error"] = Field(default="ok")
    scan_result: OCRScanResult | None = None
    spending_summary: OCRSpendingSummary | None = Field(
        default=None,
        description="AI spending summary from DeepSeek (null if no DEEPSEEK_API_KEY or no transactions)",
    )
    insert_results: list[OCRInsertResult] = Field(default_factory=list)
    total_inserted: int = Field(default=0)
    total_failed: int = Field(default=0)
    xp_earned: int = Field(default=0)
    processing_time_ms: float = Field(default=0.0)
    error: str | None = Field(default=None)
