# PropCard Component Migration Guide

## Overview
This document outlines the migration from multiple PropCard variants to the unified PropCard component.

## Deprecated Components
The following components are being replaced by the unified `PropCard`:
- `PropCard.tsx` (original standard version)
- `CondensedPropCard.tsx` (compact version)
- `EnhancedPropCard.tsx` (wrapper with enhanced analysis)
- `ui/EnhancedPropCard.tsx` (enhanced version with motion)

## New Unified Component
**Location**: `frontend/src/components/ui/unified/PropCard.tsx`

### Variants
The unified component supports three variants:
1. `condensed` - Compact display for lists
2. `standard` - Default detailed view (replaces original PropCard)
3. `enhanced` - Premium view with animations and advanced features

## Migration Examples

### 1. Migrating from Original PropCard
**Before:**
```tsx
import PropCard from './PropCard';

<PropCard
  player="Juan Soto"
  team="SD"
  position="OF"
  score={85}
  summary="Strong performance expected"
  analysis={analysisNode}
  stats={statsArray}
  insights={insightsArray}
  onCollapse={handleCollapse}
  onRequestAnalysis={handleRequestAnalysis}
  isAnalysisLoading={false}
  hasAnalysis={true}
/>
```

**After:**
```tsx
import UnifiedPropCard from './ui/unified/PropCard';

<UnifiedPropCard
  variant="standard"
  player={{
    name: "Juan Soto",
    team: "SD",
    position: "OF"
  }}
  game={{
    matchup: "SD vs LAD"
  }}
  prop={{
    type: "Hits + RBI",
    stat: "hits_rbi",
    line: 1.5,
    confidence: 85
  }}
  analysis={{
    summary: "Strong performance expected",
    analysis: analysisNode,
    stats: statsArray,
    insights: insightsArray
  }}
  onCollapse={handleCollapse}
  onRequestAnalysis={handleRequestAnalysis}
  isAnalysisLoading={false}
  hasAnalysis={true}
/>
```

### 2. Migrating from CondensedPropCard
**Before:**
```tsx
import CondensedPropCard from './CondensedPropCard';

<CondensedPropCard
  player="Juan Soto"
  team="SD"
  stat="Hits + RBI"
  line={1.5}
  confidence={85}
  grade="A+"
  onClick={handleClick}
  isExpanded={false}
  matchup="SD vs LAD"
  espnPlayerId="123456"
/>
```

**After:**
```tsx
import UnifiedPropCard from './ui/unified/PropCard';

<UnifiedPropCard
  variant="condensed"
  player={{
    name: "Juan Soto",
    team: "SD",
    espnPlayerId: "123456"
  }}
  game={{
    matchup: "SD vs LAD"
  }}
  prop={{
    type: "Hits + RBI",
    stat: "hits_rbi", 
    line: 1.5,
    confidence: 85
  }}
  analysis={{
    stats: [],
    insights: [],
    summary: ""
  }}
  onClick={handleClick}
  isExpanded={false}
/>
```

### 3. Migrating from EnhancedPropCard
**Before:**
```tsx
import EnhancedPropCard from './EnhancedPropCard';

<EnhancedPropCard
  proj={featuredProp}
  analysisNode={analysisNode}
  onCollapse={handleCollapse}
  fetchEnhancedAnalysis={fetchEnhancedAnalysis}
  enhancedAnalysisCache={cache}
  loadingAnalysis={loadingSet}
/>
```

**After:**
```tsx
import UnifiedPropCard from './ui/unified/PropCard';

<UnifiedPropCard
  variant="enhanced"
  player={{
    name: featuredProp.player,
    team: extractTeamFromMatchup(featuredProp.matchup),
    headshot: featuredProp.headshot
  }}
  game={{
    matchup: featuredProp.matchup
  }}
  prop={{
    type: featuredProp.stat,
    stat: featuredProp.stat,
    line: featuredProp.line,
    confidence: featuredProp.confidence
  }}
  analysis={{
    summary: generateSummary(featuredProp),
    analysis: analysisNode,
    stats: getStatsFromProp(featuredProp),
    insights: getInsightsFromProp(featuredProp)
  }}
  onCollapse={handleCollapse}
  fetchEnhancedAnalysis={fetchEnhancedAnalysis}
  enhancedAnalysisCache={cache}
  loadingAnalysis={loadingSet}
/>
```

## Helper Functions for Migration

```tsx
// Convert old prop format to new unified format
export const convertToUnifiedFormat = (
  oldProp: any,
  variant: 'condensed' | 'standard' | 'enhanced' = 'standard'
): UnifiedPropCardProps => {
  return {
    variant,
    player: {
      name: oldProp.player || oldProp.playerName,
      team: oldProp.team,
      position: oldProp.position,
      headshot: oldProp.headshot,
      espnPlayerId: oldProp.espnPlayerId
    },
    game: {
      matchup: oldProp.matchup,
      opponent: oldProp.opponent,
      date: oldProp.date,
      time: oldProp.time,
      venue: oldProp.venue
    },
    prop: {
      type: oldProp.stat || oldProp.propType,
      stat: oldProp.stat,
      line: oldProp.line,
      confidence: oldProp.confidence,
      overOdds: oldProp.overOdds,
      underOdds: oldProp.underOdds,
      recommendation: oldProp.recommendation
    },
    analysis: {
      summary: oldProp.summary,
      analysis: oldProp.analysis,
      stats: oldProp.stats || [],
      insights: oldProp.insights || []
    }
  };
};

// Extract team from matchup string
export const extractTeamFromMatchup = (matchup: string): string => {
  if (!matchup) return '';
  const parts = matchup.split(' ');
  return parts[0] || '';
};

// Generate summary from prop data
export const generateSummary = (prop: any): string => {
  const confidence = prop.confidence || 0;
  const recommendation = confidence > 65 ? 'OVER' : 'UNDER';
  return `We suggest betting the ${recommendation} on ${prop.player}`;
};
```

## Breaking Changes
1. **Prop Structure**: Data is now organized into `player`, `game`, `prop`, and `analysis` objects
2. **Variant System**: Must specify variant instead of using different components
3. **Analysis Data**: Enhanced analysis features require new data structure
4. **Callbacks**: Some callback signatures have changed

## Benefits of Migration
1. **Consistency**: Single component with consistent behavior across all use cases
2. **Maintainability**: One component to update instead of four
3. **Performance**: Optimized rendering and reduced bundle size
4. **Features**: Enhanced animations and interactions in enhanced variant
5. **Type Safety**: Better TypeScript support with unified interfaces

## Timeline
- **Phase 1** (Week 1): Create unified component ✅
- **Phase 2** (Week 2): Update critical usage points
- **Phase 3** (Week 3): Complete migration of all instances
- **Phase 4** (Week 4): Remove deprecated components

## Testing Strategy
1. **Component Tests**: Update existing tests to use unified component
2. **Visual Regression**: Ensure UI consistency across variants
3. **Integration Tests**: Verify data flow with new prop structure
4. **Performance Tests**: Validate bundle size reduction

## Support
If you encounter issues during migration:
1. Check this guide for similar use cases
2. Use the helper functions provided
3. Consult the TypeScript interfaces for correct prop structure
4. Test thoroughly in your specific context
