#!/usr/bin/env python3
"""
simulate_client_filters.py

Load a saved backend_opps.json (server response) and apply the same filters used by
`PropFinderDashboard` to determine how many server opportunities survive client-side filtering.

Usage (PowerShell):
    Invoke-WebRequest -Uri '<url>' -OutFile backend_opps.json
    python ./scripts/simulate_client_filters.py backend_opps.json

"""
import json
import sys
from pathlib import Path


def to_num(x):
    try:
        if x is None:
            return None
        if isinstance(x, (int, float)):
            return float(x)
        return float(str(x))
    except Exception:
        return None


def load_opps(path: Path):
    obj = json.loads(path.read_text())
    data = obj.get('data', obj)
    opps = data.get('opportunities', [])
    return opps, data.get('summary')


def apply_filters(opps):
    # Dashboard default filters
    selected_sports = ['NBA', 'MLB']
    selected_sports_norm = [s.lower() for s in selected_sports]
    confidence_min, confidence_max = 0, 100
    edge_min, edge_max = 0, 20
    ev_min, ev_max = 0, 100
    selected_ev_tiers = set(['high', 'moderate', 'low', 'negative'])
    show_arbitrage_only = False
    show_low_juice_only = False
    min_bookmakers = 1
    selected_sharp_money = set()
    volatility_min = 0
    min_ev_percent = 0
    show_bookmarked_only = False

    survivors = []
    for opp in opps:
        sport = str(opp.get('sport', '') or '').lower()
        confidence = to_num(opp.get('confidence') or opp.get('aiProbability')) or 0
        edge = to_num(opp.get('edge') or opp.get('edgePct')) or 0
        evPercent = to_num(opp.get('evPercent') or opp.get('ev_percent') or opp.get('ev'))
        if evPercent is None:
            evPercent = 0
        num_bookmakers = opp.get('numBookmakers') or (len(opp.get('bookmakers') or [])) or 0
        recent = opp.get('recentForm') or opp.get('recent_form') or []
        volatility = (max(recent) - min(recent)) if (isinstance(recent, list) and len(recent) > 1) else 0

        if selected_sports_norm and sport not in selected_sports_norm:
            continue
        if not (confidence_min <= confidence <= confidence_max):
            continue
        if not (edge_min <= edge <= edge_max):
            continue
        if not (ev_min <= evPercent <= ev_max):
            continue
        ev_tier = (str(opp.get('evTier') or opp.get('ev_tier') or '')).lower() or 'negative'
        if selected_ev_tiers and ev_tier not in selected_ev_tiers:
            continue
        if show_arbitrage_only and not opp.get('hasArbitrage'):
            continue
        if show_low_juice_only and not opp.get('isLowJuice'):
            continue
        if num_bookmakers and num_bookmakers < min_bookmakers:
            continue
        if selected_sharp_money and (str(opp.get('sharpMoney') or '').lower() not in selected_sharp_money):
            continue
        if volatility < volatility_min:
            continue
        if evPercent < min_ev_percent:
            continue
        if show_bookmarked_only and not opp.get('isBookmarked'):
            continue
        survivors.append(opp)

    return survivors


def main(argv):
    if len(argv) < 2:
        print('Usage: simulate_client_filters.py <backend_opps.json>')
        sys.exit(2)
    p = Path(argv[1])
    if not p.exists():
        print('File not found:', p)
        sys.exit(2)
    opps, summary = load_opps(p)
    print('server_opps_count=', len(opps))
    survivors = apply_filters(opps)
    print('survivors_count=', len(survivors))
    if survivors:
        s = survivors[0]
        print('sample id, sport, confidence, evPercent, numBookmakers:')
        print(s.get('id'), s.get('sport'), s.get('confidence'), s.get('evPercent'), s.get('numBookmakers'))


if __name__ == '__main__':
    main(sys.argv)
