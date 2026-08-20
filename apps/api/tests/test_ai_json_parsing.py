from __future__ import annotations

import sys
import unittest
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.services.ocr_service import _parse_summary_response, _parse_vision_response
from app.services.receipt_scanner_service import _parse_json_response

# Regression tests for the "json.loads on raw Claude output" trap: models wrap
# JSON in ``` fences and/or prose, so every parser here must slice to the
# outermost braces instead of trusting the whole response is valid JSON.

FENCED = '```json\n{"store_name": "Guardian", "item": "Vitamins", "amount": 18.5, "category": "health"}\n```'
PROSE_PREFIXED = 'Sure, here is the extracted data:\n{"store_name": "Guardian", "item": "Vitamins", "amount": 18.5, "category": "health"}'
PROSE_WRAPPED = 'Here you go:\n{"store_name": "Guardian", "item": "Vitamins", "amount": 18.5, "category": "health"}\nLet me know if you need anything else!'
PLAIN = '{"store_name": "Guardian", "item": "Vitamins", "amount": 18.5, "category": "health"}'


class ReceiptScannerJsonParsingTests(unittest.TestCase):
    def test_parses_fenced_json(self) -> None:
        self.assertEqual(_parse_json_response(FENCED)["store_name"], "Guardian")

    def test_parses_prose_prefixed_json_without_fences(self) -> None:
        self.assertEqual(_parse_json_response(PROSE_PREFIXED)["amount"], 18.5)

    def test_parses_prose_wrapped_json_without_fences(self) -> None:
        self.assertEqual(_parse_json_response(PROSE_WRAPPED)["category"], "health")

    def test_parses_plain_json(self) -> None:
        self.assertEqual(_parse_json_response(PLAIN)["item"], "Vitamins")


class OcrVisionResponseParsingTests(unittest.TestCase):
    def _payload(self, body: str) -> str:
        return body

    def test_parses_fenced_json(self) -> None:
        raw = '```json\n{"document_type": "receipt", "store_name": "Guardian", "total_amount": 18.5, "transactions": []}\n```'
        result = _parse_vision_response(raw)
        self.assertEqual(result.store_name, "Guardian")

    def test_parses_prose_wrapped_json_without_fences(self) -> None:
        raw = (
            'Here is what I found on the receipt:\n'
            '{"document_type": "receipt", "store_name": "Guardian", "total_amount": 18.5, "transactions": []}\n'
            'Hope that helps!'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.store_name, "Guardian")
        self.assertEqual(result.total_amount, 18.5)

    def test_malformed_json_raises_value_error_not_a_bare_json_decode_error(self) -> None:
        with self.assertRaises(ValueError):
            _parse_vision_response("not json at all")


class OcrSummaryResponseParsingTests(unittest.TestCase):
    def test_parses_prose_wrapped_json_without_fences(self) -> None:
        raw = (
            'Here is your spending summary:\n'
            '{"headline": "Big spender!", "insight": "Too much shopping", '
            '"top_category": "shopping", "total_debits": 500, "total_credits": 0}\n'
            'Cheers!'
        )
        result = _parse_summary_response(raw)
        self.assertEqual(result.top_category, "shopping")

    def test_malformed_json_raises_value_error(self) -> None:
        with self.assertRaises(ValueError):
            _parse_summary_response("not json at all")


if __name__ == "__main__":
    unittest.main()
