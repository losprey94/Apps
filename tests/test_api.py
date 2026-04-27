import unittest
import os
import json
import tempfile

from app import app


class ApiSmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_deals_response_contains_metadata(self):
        response = self.client.get("/api/deals")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("deals", data)
        self.assertIn("count", data)
        self.assertIn("stale_demo_data", data)
        self.assertIn("data_freshness", data)
        self.assertIn("current_date", data)

    def test_search_requires_query(self):
        response = self.client.get("/api/search")
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("error", data)

    def test_search_include_expired_flag(self):
        response = self.client.get("/api/search?q=mlieko&include_expired=true")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("results", data)
        self.assertIn("stale_demo_data", data)
        self.assertIn("data_freshness", data)
        self.assertIn("current_date", data)
        self.assertIn("timestamp", data)

    def test_deals_filter_by_store(self):
        response = self.client.get("/api/deals?store=lidl&include_expired=true")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("deals", data)
        self.assertTrue(all(deal.get("store_id") == "lidl" for deal in data["deals"]))

    def test_deals_filter_by_category(self):
        response = self.client.get("/api/deals?category=Mäso&include_expired=true")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("deals", data)
        self.assertTrue(all(deal.get("category", "").lower() == "mäso" for deal in data["deals"]))

    def test_deals_default_mode_has_expected_metadata(self):
        response = self.client.get("/api/deals")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("stale_demo_data", data)
        self.assertIn("data_freshness", data)
        self.assertIn("current_date", data)

    def test_data_freshness_payload_shape(self):
        response = self.client.get("/api/deals")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        freshness = data.get("data_freshness", {})
        self.assertIn("has_valid_until", freshness)
        self.assertIn("all_expired", freshness)
        self.assertIn("latest_valid_until", freshness)
        self.assertIn("oldest_valid_until", freshness)
        self.assertIn("days_since_latest_valid_until", freshness)

    def test_live_deals_file_is_used_when_available(self):
        payload = {
            "deals": [
                {
                    "name": "Test Mlieko Live 1l",
                    "price": 0.77,
                    "original_price": 1.09,
                    "unit": "1 l",
                    "store": "Tesco",
                    "store_id": "tesco",
                    "category": "Mliečne výrobky",
                    "valid_until": "2099-12-31",
                    "discount_percent": 29,
                }
            ]
        }
        with tempfile.TemporaryDirectory() as tmp:
            file_path = os.path.join(tmp, "live_deals.json")
            with open(file_path, "w", encoding="utf-8") as fh:
                json.dump(payload, fh)

            old_value = os.environ.get("LIVE_DEALS_FILE")
            os.environ["LIVE_DEALS_FILE"] = file_path
            try:
                response = self.client.get("/api/search?q=Test+Mlieko+Live")
                self.assertEqual(response.status_code, 200)
                data = response.get_json()
                self.assertGreaterEqual(data.get("count", 0), 1)
                self.assertTrue(any(item.get("name") == "Test Mlieko Live 1l" for item in data.get("results", [])))
            finally:
                if old_value is None:
                    os.environ.pop("LIVE_DEALS_FILE", None)
                else:
                    os.environ["LIVE_DEALS_FILE"] = old_value


if __name__ == "__main__":
    unittest.main()
