from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.receipt import ReceiptScanResponse
from app.services.receipt_scanner_service import scan_receipt

router = APIRouter()


@router.post("/scan", response_model=ReceiptScanResponse)
async def scan_receipt_image(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> ReceiptScanResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    image_bytes = await file.read()
    user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
    return await scan_receipt(image_bytes, file.content_type, user_id=user_id)
