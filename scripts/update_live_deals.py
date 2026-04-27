"""
Stiahne a uloží live deals zo vzdialených JSON feedov.

Použitie:
  LIVE_DEALS_URLS="https://example.com/store1.json,https://example.com/store2.json" python scripts/update_live_deals.py
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen


OUTPUT_FILE = Path(os.environ.get("LIVE_DEALS_FILE", "data/live_deals.json"))
FEED_URLS = [u.strip() for u in os.environ.get("LIVE_DEALS_URLS", "").split(",") if u.strip()]


def _fetch_json(url: str):
    req = Request(url, headers={"User-Agent": "DomaciRytmusBot/1.0"})
    with urlopen(req, timeout=20) as response:  # nosec B310
        return json.loads(response.read().decode("utf-8"))


def _extract_deals(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if isinstance(payload.get("deals"), list):
            return payload["deals"]
        if isinstance(payload.get("results"), list):
            return payload["results"]
    return []


def _normalize_deal(deal: dict):
    try:
        price = float(deal.get("price"))
    except (TypeError, ValueError):
        return None

    name = str(deal.get("name", "")).strip()
    store_id = str(deal.get("store_id", "")).strip().lower()
    store = str(deal.get("store", "")).strip()
    if not name or not store_id or not store:
        return None

    normalized = {
        "name": name,
        "price": price,
        "store": store,
        "store_id": store_id,
        "category": str(deal.get("category", "")).strip(),
        "unit": str(deal.get("unit", "")).strip(),
        "valid_until": deal.get("valid_until"),
        "original_price": deal.get("original_price"),
        "discount_percent": deal.get("discount_percent"),
    }
    return normalized


def main():
    if not FEED_URLS:
        print("LIVE_DEALS_URLS nie je nastavené, preskakujem refresh.")
        return 0

    deals = []
    errors = []
    for url in FEED_URLS:
        try:
            payload = _fetch_json(url)
            for raw_deal in _extract_deals(payload):
                if not isinstance(raw_deal, dict):
                    continue
                normalized = _normalize_deal(raw_deal)
                if normalized:
                    deals.append(normalized)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            errors.append(f"{url}: {exc}")

    deals.sort(key=lambda d: (d.get("name", "").lower(), d.get("store_id", ""), d.get("price", 0)))
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "feeds": FEED_URLS,
        "count": len(deals),
        "errors": errors,
        "deals": deals,
    }
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Uložené {len(deals)} položiek do {OUTPUT_FILE}")
    if errors:
        print(f"Varovanie: {len(errors)} feedov zlyhalo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
