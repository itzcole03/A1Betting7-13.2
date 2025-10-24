import json
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

URL = (
    "http://127.0.0.1:5173/api/propfinder/opportunities"
    "?limit=100&sports=NBA,MLB&confidence_min=0&confidence_max=100&edge_min=0&edge_max=20"
)

# Dashboard-like filters (match PropFinderDashboard initial state)
selected_sports = ['NBA', 'MLB']
confidence_range = (0, 100)
edge_range = (0, 20)
ev_range = (0, 100)
selected_ev_tiers = ['high', 'moderate', 'low', 'negative']
show_arbitrage_only = False
show_low_juice_only = False
min_bookmakers = 1
selected_sharp_money = []
min_ev_percent = 0
show_bookmarked_only = False
volatility_min = 0.0


def to_number(v):
    try:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip()
        if not s:
            return None
        return float(s)
    except Exception:
        return None


def normalize_string(v):
    if v is None:
        return ''
    if isinstance(v, str):
        return v
    return str(v)


def reason_for_exclusion(opp):
    reasons = []
    player = normalize_string(opp.get('player', '')).lower()
    market = normalize_string(opp.get('market', '')).lower()
    team = normalize_string(opp.get('team', '')).lower()
    sport = normalize_string(opp.get('sport', '')).lower()

    # search (empty in initial load)
    normalized_search = ''.lower()
    if normalized_search:
        if normalized_search not in player and normalized_search not in market and normalized_search not in team:
            reasons.append('search')

    selected_sports_norm = [s.lower() for s in selected_sports]
    # server provided sports filter, so client shouldn't apply local sports filter (applyLocalSportsFilter = False)
    apply_local_sports_filter = False
    if apply_local_sports_filter:
        if sport not in selected_sports_norm:
            reasons.append('sport')

    # server confidence/edge filters are present, so client won't reapply
    has_server_confidence_filter = True
    has_server_edge_filter = True

    if not has_server_confidence_filter:
        conf = to_number(opp.get('confidence') or opp.get('confidence_pct') or opp.get('aiProbability')) or 0
        if not (confidence_range[0] <= conf <= confidence_range[1]):
            reasons.append('confidence')

    if not has_server_edge_filter:
        edge = to_number(opp.get('edge') or opp.get('edge_pct')) or 0
        if not (edge_range[0] <= edge <= edge_range[1]):
            reasons.append('edge')

    evp = to_number(opp.get('evPercent') or opp.get('ev_percent') or opp.get('evValue')) or 0
    if not (ev_range[0] <= evp <= ev_range[1]):
        reasons.append('evRange')

    ev_tier = normalize_string(opp.get('evTier') or opp.get('ev_tier') or opp.get('evTier')).lower() or 'negative'
    if ev_tier not in [t.lower() for t in selected_ev_tiers]:
        reasons.append('evTier')

    if show_arbitrage_only and not opp.get('hasArbitrage'):
        reasons.append('arbitrage')

    if show_low_juice_only and not opp.get('isLowJuice'):
        reasons.append('lowJuice')

    num_books = to_number(opp.get('numBookmakers') or (len(opp.get('bookmakers') or []))) or 0
    if num_books and num_books < min_bookmakers:
        reasons.append('numBookmakers')

    sharp = normalize_string(opp.get('sharpMoney') or opp.get('sharp_money')).lower()
    if selected_sharp_money and sharp not in [s.lower() for s in selected_sharp_money]:
        reasons.append('sharpMoney')

    recent_form = opp.get('recentForm') or opp.get('recent_form') or []
    if isinstance(recent_form, list) and len(recent_form) > 1:
        try:
            volatility = max(recent_form) - min(recent_form)
        except Exception:
            volatility = 0
    else:
        volatility = 0
    if volatility < volatility_min:
        reasons.append('volatility')

    if (to_number(opp.get('evPercent') or opp.get('ev_percent') or opp.get('evValue')) or 0) < min_ev_percent:
        reasons.append('minEvPercent')

    if show_bookmarked_only and not opp.get('isBookmarked'):
        reasons.append('bookmarked')

    return reasons


def main():
    print('Fetching', URL)
    req = Request(URL, headers={'Accept': 'application/json', 'User-Agent': 'diag-script/1.0'})
    try:
        with urlopen(req, timeout=10) as resp:
            raw = resp.read()
            payload = json.loads(raw)
    except HTTPError as e:
        print('HTTP error', e.code, e.reason)
        sys.exit(2)
    except URLError as e:
        print('URL error', e.reason)
        sys.exit(2)
    except Exception as e:
        print('Fetch failed:', e)
        sys.exit(2)

    data = payload.get('data') or payload
    opportunities = data.get('opportunities') or []
    summary = data.get('summary')

    print('\nServer returned:')
    print('  opportunities:', len(opportunities))
    print('  summary present:', bool(summary))
    if summary:
        print('  summary keys:', list(summary.keys()))

    # Run client-side filtering emulation
    filtered = []
    reasons_map = {}
    for opp in opportunities:
        reasons = reason_for_exclusion(opp)
        if not reasons:
            filtered.append(opp)
        else:
            reasons_map[opp.get('id') or opp.get('player') or '<unknown>'] = reasons

    print('\nClient-side emulation results:')
    print('  filtered opportunities:', len(filtered))
    print('  excluded opportunities:', len(opportunities) - len(filtered))

    if len(filtered) == 0 and len(opportunities) > 0:
        warn = {
            'serverCount': len(opportunities),
            'activeFilters': {
                'sports': selected_sports,
                'confidence_min': confidence_range[0],
                'confidence_max': confidence_range[1],
                'edge_min': edge_range[0],
                'edge_max': edge_range[1]
            },
            'search': ''
        }
        print('\n--- ENHANCED LOGGER WARN PAYLOAD (simulated) ---')
        print(json.dumps(warn, indent=2))

        print('\nPer-opportunity exclusion reasons (sample up to 30):')
        count = 0
        for k, v in reasons_map.items():
            print(' -', k, '=>', v)
            count += 1
            if count >= 30:
                break

    # Also print a small sample of the first 10 opportunities
    print('\nSample opportunities (first 10):')
    for opp in opportunities[:10]:
        print(' - id:', opp.get('id'), 'player:', opp.get('player'), 'sport:', opp.get('sport'), 'confidence:', opp.get('confidence'), 'edge:', opp.get('edge'))


if __name__ == '__main__':
    main()
