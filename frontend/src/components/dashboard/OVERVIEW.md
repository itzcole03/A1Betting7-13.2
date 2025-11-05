# PropFinder Clone Dashboard

This component recreates the exact interface seen in the PropFinder screenshot provided by the user. It features a professional sports betting dashboard with a clean, dark theme that displays player prop data in a tabular format.

## Features

### 🎯 Exact Interface Match
- **Header Navigation**: OVER/UNDER tabs, Search Player dropdown, Categories filter, Games filter, Show All Lines toggle
- **Professional Table Layout**: Matches the exact column structure from the screenshot
- **Color-Coded Performance**: Green for favorable percentages (>60%), Yellow for moderate (40-60%), Red for unfavorable (<40%)
- **PF Rating System**: Circular rating badges with color coding (Green: 80+, Yellow: 70+, Orange: 60+, Red: <60)
- **Interactive Elements**: Favorite buttons (heart icons), dropdown menus for odds/markets

### 📊 Table Columns (Matching Screenshot)
1. **Heart Icon** - Favorite toggle
2. **PF Rating** - Circular rating badge (82, 72, 68, etc.)
3. **Team** - Team abbreviation (CHC)
4. **Pos** - Player position (SS)
5. **Player** - Player name with avatar and batting hand indicator
6. **Prop** - Betting proposition (o0.5 Hits, o0.5 Singles, etc.)
7. **L10 Avg** - Last 10 games average
8. **L5 Avg** - Last 5 games average  
9. **Odds** - Betting odds with markets dropdown
10. **Streak** - Current streak count
11. **Matchup** - Matchup details with batting average
12. **Performance Columns** - 2024, 2025, H2H, L5, L10, L20 percentages with record details

### 🎨 Visual Design
- **Dark Theme**: Gray-900 background with gray-800 cards
- **Color Coding**: Consistent with the screenshot's green/yellow/red system  
- **Typography**: Professional font weights and sizing
- **Hover Effects**: Smooth transitions on interactive elements
- **Responsive Design**: Works on desktop and mobile devices

### 🏈 Mock Data
The component includes mock data for **Dansby Swanson (CHC SS)** with 6 different prop types:
- o0.5 Hits (Rating: 82)
- o0.5 Singles (Rating: 72)  
- o1.5 Total Bases (Rating: 68)
- o0.5 Stolen Bases (Rating: 64)
- o0.5 Home Runs (Rating: 51)
- o1.5 RBIs (Rating: 60)

## Usage

### Basic Implementation
```tsx
import PropFinderDashboard from '../dashboard/PropFinderDashboard';

// Use with mock data
<PropFinderDashboard />

// Use with real data
<PropFinderDashboard 
  data={yourPropData} 
  loading={isLoading} 
/>
```

### Navigation Integration
The component is available at `/propfinder-clone` and appears in the navigation as "PropFinder Clone" with a trophy icon and "CLONE" badge.

### Data Structure
```typescript
interface PropData {
  id: string;
  player: {
    id: string;
    name: string;
    team: string;
    position: string;
  };
  prop: string;
  l10Avg: number;
  l5Avg: number;
  odds: number;
  streak: number;
  matchup: string;
  pfRating: number;
  teamColor: string;
  stats: {
    2024: number;
    2025: number;
    h2h: number;
    l5: number;
    l10: number;
    l20: number;
  };
  marketOdds: Array<{
    sportsbook: string;
    odds: number;
  }>;
  isFavorited: boolean;
}
```

## Development Notes

### Implementation Details
- Built with **React + TypeScript**
- Uses **Tailwind CSS** for styling
- Includes **Lucide React** icons
- **Responsive grid layout** for the table structure
- **State management** for filters and toggles

### Key Functions
- `getPercentageColor()` - Determines color coding for performance percentages
- `formatOdds()` - Formats betting odds display (+/-) 
- `getRatingColor()` - Color codes PF rating badges
- Interactive state for tabs, filters, and toggles

### Future Enhancements
- Connect to real MLB prop data API
- Add sorting functionality for table columns
- Implement advanced filtering options
- Add real-time odds updates
- Include more sports beyond baseball

## Files

- **Component**: `frontend/src/components/dashboard/PropFinderDashboard.tsx`
- **Route**: `/propfinder-clone` 
- **Navigation**: Integrated in EnhancedNavigation.tsx

This dashboard provides the exact PropFinder experience requested, serving as a foundation for implementing AI-powered enhancements while maintaining the familiar professional interface users expect.