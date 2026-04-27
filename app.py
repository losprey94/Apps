"""
Porovnávač cien - Slovenské obchody
Automaticky hľadá akciové letáky online a porovnáva ceny produktov.
"""

import os
import logging
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="static")
app.logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Scraper: sťahuje akciové ponuky zo slovenských obchodov
# ---------------------------------------------------------------------------

from scrapers import get_all_deals, get_data_freshness, has_only_expired_deals, search_deals

# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/search")
def api_search():
    """Vyhľadaj produkt naprieč všetkými obchodmi."""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Zadajte názov produktu"}), 400

    include_expired = request.args.get("include_expired", "").lower() in {"1", "true", "yes"}
    results = search_deals(query, include_expired=include_expired)
    freshness = get_data_freshness()

    # Zoradiť podľa ceny (najlacnejšie prvé)
    results.sort(key=lambda x: x.get("price", float("inf")))

    return jsonify({
        "query": query,
        "results": results,
        "count": len(results),
        "stale_demo_data": has_only_expired_deals(),
        "data_freshness": freshness,
        "current_date": datetime.now().date().isoformat(),
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/api/stores")
def api_stores():
    """Zoznam podporovaných obchodov."""
    stores = [
        {"id": "lidl", "name": "Lidl", "color": "#0050aa"},
        {"id": "kaufland", "name": "Kaufland", "color": "#e10a14"},
        {"id": "billa", "name": "Billa", "color": "#cd1719"},
        {"id": "tesco", "name": "Tesco", "color": "#00539f"},
        {"id": "coop", "name": "COOP Jednota", "color": "#e30613"},
        {"id": "penny", "name": "Penny Market", "color": "#cd1414"},
    ]
    return jsonify({"stores": stores})


@app.route("/api/deals")
def api_deals():
    """Všetky aktuálne akciové ponuky."""
    store = request.args.get("store", "")
    category = request.args.get("category", "")
    include_expired = request.args.get("include_expired", "").lower() in {"1", "true", "yes"}
    deals = get_all_deals(include_expired=include_expired)
    freshness = get_data_freshness()

    if store:
        deals = [d for d in deals if d["store_id"] == store]
    if category:
        deals = [d for d in deals if d.get("category", "").lower() == category.lower()]

    deals.sort(key=lambda x: x.get("price", float("inf")))
    return jsonify({
        "deals": deals,
        "count": len(deals),
        "stale_demo_data": has_only_expired_deals(),
        "data_freshness": freshness,
        "current_date": datetime.now().date().isoformat(),
    })


@app.route("/manifest.json")
def manifest():
    return send_from_directory("static", "manifest.json")


@app.route("/sw.js")
def service_worker():
    return send_from_directory("static", "sw.js")


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
