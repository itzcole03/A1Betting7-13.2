#!/usr/bin/env python3
"""
Check which client-side dashboard filters would exclude opportunities.

Usage: python scripts/check_client_filters.py <opps_json_file>

The script models the filtering logic in frontend/src/components/dashboard/PropFinderDashboard.tsx
with default UI state. It prints totals, pass/fail counts and top failure reasons.
"""
import json
import sys
from collections import Counter, defaultdict
from typing import Any, Dict, List


def to_number(v: Any):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v))
    except Exception:
        return None


def normalize_string(v: Any) -> str:
    if isinstance(v, str):
        return v
    if isinstance(v, (int, float)):
        return str(v)
    return ''


def evaluate_filters(opps: List[Dict],
                     selected_sports=None,
                     confidence_range=(0,100),
                     edge_range=(0,20),
                     ev_range=(0,100),
                     selected_ev_tiers=None,
                     show_arbitrage_only=False,
                     show_low_juice_only=False,
                     min_bookmakers=1,
                     selected_sharp_money=None,
                     min_ev_percent=0,
                     show_bookmarked_only=False,
                     volatility_min=0,
                     has_server_confidence_filter=False,
                     has_server_edge_filter=False):

    selected_sports = selected_sports if selected_sports is not None else ['nba','mlb']
    selected_ev_tiers = selected_ev_tiers if selected_ev_tiers is not None else ['high','moderate','low','negative']
    selected_sharp_money = selected_sharp_money if selected_sharp_money is not None else []

    reasons_counter = Counter()
    per_item_reasons = defaultdict(list)
    passed = []

    for opp in opps:
        reason_list = []
        search_match = True  # not testing search here

        sport_key = normalize_string(opp.get('sport','')).lower()
        matches_sports = (len(selected_sports) == 0) or (sport_key in [s.lower() for s in selected_sports])

        conf = to_number(opp.get('confidence') or opp.get('aiProbability') or 0) or 0
        matches_confidence = conf >= confidence_range[0] and conf <= confidence_range[1]

        edge = to_number(opp.get('edge') or 0) or 0
        matches_edge = edge >= edge_range[0] and edge <= edge_range[1]

        ev_percent = to_number(opp.get('evPercent') or opp.get('ev_percent') or opp.get('evValue') or 0) or 0
        matches_ev_range = ev_percent >= ev_range[0] and ev_percent <= ev_range[1]

        ev_tier_key = normalize_string(opp.get('evTier') or opp.get('ev_tier') or 'negative').lower() or 'negative'
        matches_ev_tier = (len(selected_ev_tiers) == 0) or (ev_tier_key in [t.lower() for t in selected_ev_tiers])

        has_arbitrage = bool(opp.get('hasArbitrage') or opp.get('has_arbitrage'))
        matches_arbitrage = (not show_arbitrage_only) or has_arbitrage

        is_low_juice = bool(opp.get('isLowJuice') or opp.get('is_low_juice'))
        matches_low_juice = (not show_low_juice_only) or is_low_juice

        num_bookmakers = int(to_number(opp.get('numBookmakers') or opp.get('num_bookmakers') or (len(opp.get('bookmakers') or []) or 1)) or 0)
        matches_bookmakers = (not num_bookmakers) or (num_bookmakers >= min_bookmakers)

        sharp_key = normalize_string(opp.get('sharpMoney') or opp.get('sharp_money') or '').lower()
        matches_sharp = (len(selected_sharp_money) == 0) or (sharp_key in [s.lower() for s in selected_sharp_money])

        recent_form = opp.get('recentForm') or opp.get('recent_form') or []
        volatility = (max(recent_form) - min(recent_form)) if (isinstance(recent_form, list) and len(recent_form) > 1) else 0
        matches_volatility = volatility >= volatility_min

        matches_ev_percent = ev_percent >= min_ev_percent

        matches_bookmarked = (not show_bookmarked_only) or bool(opp.get('isBookmarked') or opp.get('is_bookmarked'))

        # emulate dashboard short-circuit logic
        if not search_match:
            reason_list.append('search')
        if (len(selected_sports) > 0) and (not matches_sports):
            reason_list.append('sport_filter')
        if (not has_server_confidence_filter) and (not matches_confidence):
            reason_list.append('confidence')
        if (not has_server_edge_filter) and (not matches_edge):
            reason_list.append('edge')
        if not matches_ev_range:
            reason_list.append('ev_range')
        if not matches_ev_tier:
            reason_list.append('ev_tier')
        if not matches_arbitrage:
            reason_list.append('arbitrage_only')
        if not matches_low_juice:
            reason_list.append('low_juice_only')
        if not matches_bookmakers:
            reason_list.append('min_bookmakers')
        if not matches_sharp:
            reason_list.append('sharp_money')
        if not matches_ev_percent:
            reason_list.append('min_ev_percent')
        if not matches_bookmarked:
            reason_list.append('bookmarked_only')
        if not matches_volatility:
            reason_list.append('volatility')

        if reason_list:
            per_item_reasons[opp.get('id')].extend(reason_list)
            for r in reason_list:
                reasons_counter[r] += 1
        else:
            passed.append(opp)

    return {
        'total': len(opps),
        'passed_count': len(passed),
        'failed_count': len(opps) - len(passed),
        'reasons_counter': reasons_counter,
        'per_item_reasons': per_item_reasons,
        'passed_samples': passed[:10],
    }


def main():
    if len(sys.argv) < 2:
        print('Usage: python scripts/check_client_filters.py <opps_json_file>')
        sys.exit(2)

    path = sys.argv[1]
    with open(path, 'r', encoding='utf-8') as f:
        payload = json.load(f)

    data = payload.get('data') or payload
    opps = data.get('opportunities') if isinstance(data, dict) else payload.get('opportunities')
    if not isinstance(opps, list):
        print('No opportunities array found in file')
        sys.exit(1)

    print(f'Loaded {len(opps)} opportunities')

    # scenario A: dashboard default client state (no server confidence/edge filters)
    resA = evaluate_filters(opps)
    print('\nScenario A: no server filters (dashboard will apply confidence/edge locally)')
    print(f" Passed: {resA['passed_count']}  Failed: {resA['failed_count']}")
    print('Top failure reasons:', resA['reasons_counter'].most_common())

    # scenario B: server applied confidence/edge (dashboard won't re-apply)
    resB = evaluate_filters(opps, has_server_confidence_filter=True, has_server_edge_filter=True)
    print('\nScenario B: server filters present (dashboard assumes server filtered confidence/edge)')
    print(f" Passed: {resB['passed_count']}  Failed: {resB['failed_count']}")
    print('Top failure reasons:', resB['reasons_counter'].most_common())

    # show a few failed items and reasons
    print('\nSample failed items (id -> reasons)')
    count = 0
    for oid, reasons in list(resB['per_item_reasons'].items())[:20]:
        print(f" - {oid} -> {reasons}")
        count += 1
        if count >= 20:
            break

    print('\nSample passed items (first 10 ids):')
    for o in resB['passed_samples']:
        print(' -', o.get('id'), '|', o.get('player'), '|', o.get('sport'), '| conf=', o.get('confidence'))


if __name__ == '__main__':
    main()
