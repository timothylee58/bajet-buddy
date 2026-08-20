from __future__ import annotations

import io
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from apps.api.tests.auth_override import install_auth_override

install_auth_override(app)

# A 1x1 transparent PNG, used to exercise the real magic-byte sniffing path
# without needing a real photo.
PNG_1PX = bytes.fromhex(
    "89504e470d0a1a0a0000000d494844520000000100000001080600000"
    "01f15c4890000000a4944415478da6300010000050001"
    "0d0a2db4000000004945"
    "4e44ae426082"
)


class ReceiptsScanRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_rejects_unsupported_file_type(self) -> None:
        client = TestClient(app)
        response = client.post(
            "/api/receipts/scan",
            files={"file": ("notes.txt", io.BytesIO(b"just some text"), "text/plain")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file type", response.json()["detail"])

    def test_sniffs_png_magic_bytes_even_with_wrong_declared_content_type(self) -> None:
        # Browsers sometimes send the wrong MIME type; the route must trust the
        # file's magic bytes over the declared Content-Type header.
        client = TestClient(app)
        response = client.post(
            "/api/receipts/scan",
            files={"file": ("receipt", io.BytesIO(PNG_1PX), "application/octet-stream")},
        )

        # No AI API key is configured in this test environment, so the service
        # degrades gracefully to a structured error instead of raising.
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "error")
        self.assertIn("API key", data["error"])


if __name__ == "__main__":
    unittest.main()
