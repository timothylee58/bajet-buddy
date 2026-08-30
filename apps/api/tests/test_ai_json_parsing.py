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

    def test_parses_ewallet_screenshot_with_wallet_fields(self) -> None:
        raw = (
            '```json\n'
            '{"document_type": "ewallet_screenshot", "wallet_provider": "tng", '
            '"counterparty": "Ah Beng Trading", "reference_id": "TNG20260830123456", '
            '"wallet_transaction_type": "payment", '
            '"transactions": [{"merchant": "Ah Beng Trading", "amount": 25.5, '
            '"transaction_type": "debit", "category": "food", "date": "2026-08-30", "note": ""}]}'
            '\n```'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.document_type, "ewallet_screenshot")
        self.assertEqual(result.wallet_provider, "tng")
        self.assertEqual(result.counterparty, "Ah Beng Trading")
        self.assertEqual(result.reference_id, "TNG20260830123456")
        self.assertEqual(result.wallet_transaction_type, "payment")
        self.assertEqual(result.transactions[0].amount, 25.5)
        # total_amount wasn't in the payload — falls back to the transaction sum
        # instead of showing RM0.00 (see the omitted-total_amount test below for
        # the multi-transaction case).
        self.assertEqual(result.total_amount, 25.5)

    def test_ewallet_screenshot_falls_back_to_transaction_sum_when_total_amount_omitted(self) -> None:
        raw = (
            '{"document_type": "ewallet_screenshot", "wallet_provider": "mae", '
            '"transactions": ['
            '{"merchant": "Grocer", "amount": 12.3, "transaction_type": "debit", "category": "groceries", "date": "", "note": ""}, '
            '{"merchant": "Grocer", "amount": 7.7, "transaction_type": "debit", "category": "groceries", "date": "", "note": ""}'
            ']}'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.total_amount, 20.0)

    def test_ewallet_screenshot_total_amount_stays_zero_with_no_transactions(self) -> None:
        raw = '{"document_type": "ewallet_screenshot", "wallet_provider": "grabpay", "transactions": []}'
        result = _parse_vision_response(raw)
        self.assertEqual(result.total_amount, 0)

    def test_receipt_total_amount_is_not_overridden_by_transaction_sum(self) -> None:
        # Receipt mode keeps its existing behavior: total_amount is whatever
        # the model reports (e.g. after tax/discount), not a transaction sum.
        raw = (
            '{"document_type": "receipt", "store_name": "Guardian", "total_amount": 0, '
            '"transactions": [{"merchant": "Guardian", "amount": 18.5, "transaction_type": "debit", '
            '"category": "health", "date": "", "note": ""}]}'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.total_amount, 0)

    def test_ewallet_receive_forces_transaction_row_to_credit_even_if_model_said_debit(self) -> None:
        # The confirmation screen's overall direction is more reliable than a
        # per-row transaction_type the model may get wrong — receiving money
        # must never be saved as a debit (money spent).
        raw = (
            '{"document_type": "ewallet_screenshot", "wallet_provider": "mae", '
            '"wallet_transaction_type": "receive", '
            '"transactions": [{"merchant": "Ah Beng", "amount": 50, '
            '"transaction_type": "debit", "category": "income", "date": "", "note": ""}]}'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.transactions[0].transaction_type, "credit")

    def test_ewallet_payment_forces_transaction_row_to_debit(self) -> None:
        raw = (
            '{"document_type": "ewallet_screenshot", "wallet_provider": "tng", '
            '"wallet_transaction_type": "payment", '
            '"transactions": [{"merchant": "Ah Beng", "amount": 12, '
            '"transaction_type": "credit", "category": "food", "date": "", "note": ""}]}'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.transactions[0].transaction_type, "debit")

    def test_ewallet_unrecognized_wallet_transaction_type_preserves_row_direction(self) -> None:
        # An omitted/unrecognized wallet_transaction_type ("other") must not
        # blindly force every row to debit — that would flip a correctly
        # extracted credit row to the wrong direction.
        raw = (
            '{"document_type": "ewallet_screenshot", "wallet_provider": "tng", '
            '"wallet_transaction_type": "some_unrecognized_value", '
            '"transactions": [{"merchant": "Ah Beng", "amount": 30, '
            '"transaction_type": "credit", "category": "income", "date": "", "note": ""}]}'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.wallet_transaction_type, "other")
        self.assertEqual(result.transactions[0].transaction_type, "credit")

    def test_receipt_described_as_a_screenshot_is_not_misclassified_as_ewallet(self) -> None:
        # A photo of a receipt can legitimately be described as "a screenshot
        # of a receipt" — only "wallet" in the string should trigger e-wallet
        # classification, not "screenshot" alone.
        raw = '{"document_type": "receipt screenshot", "store_name": "Guardian", "transactions": []}'
        result = _parse_vision_response(raw)
        self.assertEqual(result.document_type, "receipt")
        self.assertIsNone(result.wallet_provider)

    def test_ewallet_screenshot_detected_from_prose_wrapped_json_without_fences(self) -> None:
        raw = (
            'This looks like an e-wallet screenshot:\n'
            '{"document_type": "e-wallet screenshot", "wallet_provider": "grabpay", '
            '"counterparty": "Grab Driver", "reference_id": "GP987654", '
            '"wallet_transaction_type": "send", "transactions": []}\n'
            'Let me know if you need anything else!'
        )
        result = _parse_vision_response(raw)
        self.assertEqual(result.document_type, "ewallet_screenshot")
        self.assertEqual(result.wallet_provider, "grabpay")

    def test_unrecognized_wallet_provider_falls_back_to_other(self) -> None:
        raw = '{"document_type": "ewallet_screenshot", "wallet_provider": "boost", "transactions": []}'
        result = _parse_vision_response(raw)
        self.assertEqual(result.wallet_provider, "other")

    def test_receipt_and_bank_statement_leave_wallet_fields_none(self) -> None:
        receipt = _parse_vision_response('{"document_type": "receipt", "store_name": "Guardian", "transactions": []}')
        self.assertIsNone(receipt.wallet_provider)
        self.assertIsNone(receipt.counterparty)

        statement = _parse_vision_response('{"document_type": "bank_statement", "transactions": []}')
        self.assertIsNone(statement.wallet_provider)


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
