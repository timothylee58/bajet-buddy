from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.ocr import OCRScanRequest, OCRScanResponse
from app.services.ocr_service import scan_receipt

router = APIRouter()


@router.post("/scan", response_model=OCRScanResponse)
async def scan_receipt_endpoint(
    payload: OCRScanRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> OCRScanResponse:
    """Agent 4: Receipt Scanner — upload a receipt image, get structured data back, auto-insert into DB."""
    user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
    return await scan_receipt(payload, user_id=user_id)
