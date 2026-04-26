"""
Modul pre scrapovanie akciových letákov zo slovenských obchodov.

V produkčnom prostredí by sa použil skutočný web scraping.
Pre jednoduchosť a spoľahlivosť používame demo dáta,
ktoré simulujú reálne akciové ponuky slovenských obchodov.
"""

from datetime import date

from scrapers.demo_data import DEMO_DEALS


def _parse_valid_until(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def has_only_expired_deals():
    """Zistí, či sú všetky demo ponuky po dátume platnosti."""
    today = date.today()
    dated = [_parse_valid_until(deal.get("valid_until")) for deal in DEMO_DEALS]
    dated = [d for d in dated if d is not None]
    return bool(dated) and all(d < today for d in dated)


def get_all_deals(include_expired=False):
    """Vráti aktuálne akciové ponuky; pri stale demo dátach vráti fallback všetkých ponúk."""
    if include_expired:
        return DEMO_DEALS

    today = date.today()
    active = []
    for deal in DEMO_DEALS:
        valid_until = _parse_valid_until(deal.get("valid_until"))
        if valid_until is None or valid_until >= today:
            active.append(deal)

    # Fallback pre demo prostredie: ak sú všetky akcie expirované, vrátime všetko.
    return active if active else DEMO_DEALS


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
