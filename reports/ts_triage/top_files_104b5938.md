# TypeScript Triage Top Files

Generated: 2025-09-30T04:57:29.048Z

Total TS errors recorded: **6763**

## Top 20 files by error count

| Rank | Errors | File | Example error codes |
|---:|---:|---|---|
| 1 | 181 | frontend\src\components\ui\ConfidenceBandChart.tsx | TS2578, TS2304 |
| 2 | 159 | frontend\src\services\predictionCache.ts | TS2304, TS2339 |
| 3 | 142 | frontend\src\components\ui\ModernNotificationCenter.tsx | TS2578, TS2304 |
| 4 | 134 | frontend\src\components\ui\BetSimulationTool.tsx | TS2578, TS2304 |
| 5 | 129 | frontend\src\components\ui\ParticleField.tsx | TS2554, TS2304 |
| 6 | 122 | frontend\src\components\features\sports\SportsManager.tsx | TS2724 |
| 7 | 117 | frontend\src\components\ui\StyledSelect.tsx | TS2578, TS2304 |
| 8 | 115 | frontend\src\components\ui\SafeChart.tsx | TS2578, TS2304, TS18004 |
| 9 | 113 | frontend\src\components\ui\ConfidenceBands.tsx | TS2578, TS2304 |
| 10 | 113 | frontend\src\components\ui\ModernCommandPalette.tsx | TS2578, TS2304 |
| 11 | 107 | frontend\src\hooks\useRealtimeData.ts | TS2578, TS2339 |
| 12 | 105 | frontend\src\hooks\usePredictionCacheManager.ts | TS2724, TS2554, TS2304 |
| 13 | 103 | frontend\src\components\features\lineup\LineupBuilder.tsx | TS2724, TS2614, TS2304 |
| 14 | 101 | frontend\src\components\features\prizepicks\PrizePicks.tsx | TS2304, TS2339 |
| 15 | 96 | frontend\src\components\ui\OfflineIndicator.tsx | TS2578, TS2339, TS2304 |
| 16 | 94 | frontend\src\components\ui\BankrollTracker.tsx | TS2578, TS2304 |
| 17 | 94 | frontend\src\components\ui\SearchModal.tsx | TS2578, TS2304 |
| 18 | 93 | frontend\src\hooks\useEnhancedRealDataSources.ts | TS2304 |
| 19 | 91 | frontend\src\components\ui\ModernActivityFeed.tsx | TS2578, TS2304 |
| 20 | 87 | frontend\src\components\core\ThemeSelector.tsx | TS2304 |


## Quick recommendations

- Target the top files above first; they represent the largest error surface.
- Common error classes: missing symbol names (TS2304), shorthand property issues (TS18004), JSX mismatches (TS17002), and unused @ts-expect-error (TS2578). Address these categories with small PRs: add missing imports/decls, fix JSX tags, replace @ts-expect-error with proper fixes or clear them.


## Next steps

1. Create small PRs to fix top 3 files and re-run triage.
2. Add incremental tsconfig slices to widen CI enforcement progressively.
3. Move clearly legacy files to a /src/legacy/ folder and exclude them from main tsconfig until fixed.
