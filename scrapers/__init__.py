"""
Modul pre scrapovanie akciových letákov zo slovenských obchodov.

V produkčnom prostredí by sa použil skutočný web scraping.
Pre jednoduchosť a spoľahlivosť používame demo dáta,
ktoré simulujú reálne akciové ponuky slovenských obchodov.
"""

from scrapers.demo_data import DEMO_DEALS


def get_all_deals():
    """Vráti všetky aktuálne akciové ponuky."""
    return DEMO_DEALS


def search_deals(query):
    """Vyhľadá ponuky podľa názvu produktu."""
    query_lower = query.lower()
    query_words = query_lower.split()

    results = []
    for deal in DEMO_DEALS:
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
