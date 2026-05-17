from __future__ import annotations

import base64
import io
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.ocr import OCRScanRequest, OCRScanResponse
from app.services.ocr_service import scan_receipt

router = APIRouter()
logger = logging.getLogger("receipts_route")

SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
PDF_TYPES = {"application/pdf", "application/x-pdf"}


def _pdf_to_png_bytes(pdf_bytes: bytes) -> bytes:
    """Render the first page of a PDF to PNG bytes using PyMuPDF."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if doc.page_count == 0:
            raise ValueError("PDF has no pages")
        page = doc[0]
        # 200 DPI is enough for OCR, higher = slower & costlier
        pix = page.get_pixmap(dpi=200)
        return pix.tobytes("png")
    except ImportError:
        raise HTTPException(
            status_code=422,
            detail=(
                "PDF support requires PyMuPDF — "
                "run `pip install pymupdf` in the API venv."
            ),
        )


@router.post("/scan", response_model=OCRScanResponse)
async def scan_receipt_image(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> OCRScanResponse:
    """
    Multipart file upload → OCR via ChatGPT-4o → summary via DeepSeek.

    Accepted formats: JPEG, PNG, GIF, WebP, PDF (first page rendered to PNG).
    Advantage over the JSON /api/ocr/scan endpoint: no base64 overhead in
    the request body, so large files (bank statements, multi-page PDFs) don't
    hit Next.js proxy body-size limits.
    """
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    raw_bytes = await file.read()

    # ── PDF → PNG ────────────────────────────────────────────────────────────
    if content_type in PDF_TYPES or (file.filename or "").lower().endswith(".pdf"):
        logger.info("PDF upload detected — rendering first page to PNG")
        try:
            raw_bytes = _pdf_to_png_bytes(raw_bytes)
            content_type = "image/png"
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to render PDF: {exc}",
            )

    # ── Image validation ──────────────────────────────────────────────────────
    # Sniff magic bytes for common formats in case browser sends wrong MIME
    if raw_bytes[:4] == b"\x89PNG":
        content_type = "image/png"
    elif raw_bytes[:2] in (b"\xff\xd8", b"\xff\xe0", b"\xff\xe1"):
        content_type = "image/jpeg"
    elif raw_bytes[:6] in (b"GIF87a", b"GIF89a"):
        content_type = "image/gif"
    elif raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP":
        content_type = "image/webp"

    if content_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{content_type}'. "
                "Upload a JPEG, PNG, GIF, WebP image, or a PDF."
            ),
        )

    # ── Build data URL and delegate to unified OCR service ───────────────────
    image_b64 = base64.standard_b64encode(raw_bytes).decode("utf-8")
    data_url = f"data:{content_type};base64,{image_b64}"

    user_id = (
        current_user.user_id
        if current_user
        else "00000000-0000-0000-0000-000000000001"
    )
    request = OCRScanRequest(image_base64=data_url)
    return await scan_receipt(request, user_id=user_id)
