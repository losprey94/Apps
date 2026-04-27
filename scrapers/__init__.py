"""
Modul pre scrapovanie akciových letákov zo slovenských obchodov.

V produkčnom prostredí by sa použil skutočný web scraping.
Pre jednoduchosť a spoľahlivosť používame demo dáta,
ktoré simulujú reálne akciové ponuky slovenských obchodov.
"""

import json
import os
from datetime import date
from pathlib import Path

from scrapers.demo_data import DEMO_DEALS


def _get_live_deals_file():
    return Path(os.environ.get("LIVE_DEALS_FILE", "data/live_deals.json"))


def _load_live_deals():
    file_path = _get_live_deals_file()
    if not file_path.exists():
        return []
    try:
        payload = json.loads(file_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []

    if isinstance(payload, list):
        deals = payload
    elif isinstance(payload, dict):
        deals = payload.get("deals", [])
    else:
        deals = []

    return [deal for deal in deals if isinstance(deal, dict) and deal.get("name") and deal.get("store_id")]


def _deals_source():
    live_deals = _load_live_deals()
    return live_deals if live_deals else DEMO_DEALS


def _parse_valid_until(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def _valid_dates():
    return [
        parsed
        for parsed in (_parse_valid_until(deal.get("valid_until")) for deal in _deals_source())
        if parsed is not None
    ]


def get_data_freshness():
    """Vráti metadata o čerstvosti dát pre UI/API."""
    today = date.today()
    dates = _valid_dates()
    if not dates:
        return {
            "has_valid_until": False,
            "all_expired": False,
            "latest_valid_until": None,
            "oldest_valid_until": None,
            "days_since_latest_valid_until": None,
        }

    latest = max(dates)
    oldest = min(dates)
    days_since_latest = (today - latest).days
    return {
        "has_valid_until": True,
        "all_expired": all(d < today for d in dates),
        "latest_valid_until": latest.isoformat(),
        "oldest_valid_until": oldest.isoformat(),
        "days_since_latest_valid_until": max(days_since_latest, 0),
    }


def has_only_expired_deals():
    """Zistí, či sú všetky demo ponuky po dátume platnosti."""
    today = date.today()
    parsed_dates = [_parse_valid_until(deal.get("valid_until")) for deal in _deals_source()]

    # Ak niektorá položka nemá dátum platnosti, nechápeme ju ako expirovanú.
    if any(d is None for d in parsed_dates):
        return False

    return bool(parsed_dates) and all(d < today for d in parsed_dates)


def get_all_deals(include_expired=False):
    """Vráti aktuálne akciové ponuky; pri stale demo dátach vráti fallback všetkých ponúk."""
    deals_dataset = _deals_source()
    if include_expired:
        return deals_dataset

    today = date.today()
    active = []
    for deal in deals_dataset:
        valid_until = _parse_valid_until(deal.get("valid_until"))
        if valid_until is None or valid_until >= today:
            active.append(deal)

    # Fallback pre demo prostredie: ak sú všetky akcie expirované, vrátime všetko.
    return active if active else deals_dataset


def search_deals(query, include_expired=False):
    """Vyhľadá ponuky podľa názvu produktu."""
    query_lower = query.lower()
    query_words = query_lower.split()
    deals = get_all_deals(include_expired=include_expired)

    results = []
    for deal in deals:
        name_lower = deal["name"].lower()
        # Zhoda ak všetky slová z hľadania sú v názve produktu
        if all(word in name_lower for word in query_words):
            results.append(deal)
            continue
        # Alebo ak aspoň jedno slovo sa presne zhoduje
        if any(word in name_lower.split() for word in query_words):
            results.append(deal)
            continue
        # Alebo zhoda v kategórii
        cat = deal.get("category", "").lower()
        if any(word in cat for word in query_words):
            results.append(deal)

    return results
