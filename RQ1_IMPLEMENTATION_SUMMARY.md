# RQ1 Implementation Summary

## Overview
Research Question 1 explores monthly speeding fine fluctuations across Australian jurisdictions to identify seasonal patterns and year-over-year trends. Implemented as an interactive multi-line chart using D3.js with real data from Q1.csv covering all of 2024.

## Research Question
**How do monthly speeding fines differ across Australian jurisdictions in 2024?**

## Data Source
**File:** `data/Q1.csv`

**Structure:**
```csv
YEAR, MONTH, JURISDICTION, FINES
```

**Coverage:**
- Year: 2024 (12 months)
- Jurisdictions: ACT, NT, NSW, VIC, QLD, SA, TAS, WA (8 jurisdictions)
- Metric: Monthly speeding fine counts

## Visualization Type
**Interactive Multi-Line Chart**

### Features Implemented

#### 1. ✅ Multi-Line Time Series
**Purpose:** Compare monthly trends across jurisdictions

**Features:**
- **X-Axis:** Months (January - December 2024)
- **Y-Axis:** Number of speeding fines
- **Multiple Lines:** One line per jurisdiction with unique color
- **Smooth Curves:** D3 curve interpolation for better readability
- **Animations:** Animated line drawing effect on load
- **Legend:** Interactive clickable legend for jurisdiction identification

#### 2. ✅ Interactive Dropdown Multi-Select Control
**Purpose:** Filter which jurisdictions to display

**Features:**
- Dropdown-style multi-select interface
- "Select All" / "Deselect All" toggle
- Individual jurisdiction checkboxes
- Real-time chart updates on selection change
- Shows count of selected jurisdictions in button label
- Styled with hover effects and smooth transitions

#### 3. ✅ Hover Interactions
**Purpose:** Detailed data exploration

**Features:**
- **Vertical Dashed Line:** Shows across all months on hover
- **Data Points:** Highlighted circles appear on each visible line
- **Tooltip:** Shows month, jurisdiction, and exact fine count
- **Multi-Jurisdiction Display:** Shows values for all visible jurisdictions at hovered month
- **Smooth Transitions:** Animated movement of hover elements

#### 4. ✅ Click-to-Focus Feature
**Purpose:** Isolate single jurisdiction for detailed analysis

**Features:**
- Click on any line or legend item to focus
- Focused jurisdiction highlighted with thicker line
- Other jurisdictions dimmed (reduced opacity)
- Min/Max value markers displayed for focused jurisdiction
- Click again or click different jurisdiction to change focus
- Click background to reset to normal view

#### 5. ✅ Min/Max Value Highlighting
**Purpose:** Show extremes for focused jurisdiction

**Features:**
- Green marker for minimum monthly value
- Red marker for maximum monthly value
- Labels showing exact values
- Only appears when a jurisdiction is focused

## Key Insights

### Highest Monthly Fines
Victoria consistently records the highest monthly speeding fines, with peaks exceeding **102,000 fines** in single months (October 2024).

### Seasonal Patterns
- **Spring Peak (September-November):** Most jurisdictions show increased enforcement
- **Autumn Peak (March-May):** Secondary peak period
- **Summer Variation:** Mixed patterns, some jurisdictions show holiday effects

### Regional Differences
- **Major States (NSW, VIC, QLD):** High absolute numbers (60,000-100,000+ monthly)
- **Medium States (WA, SA):** Moderate levels (15,000-30,000 monthly)
- **Territories (ACT, NT):** Lower but consistent patterns (2,000-8,000 monthly)
- **Tasmania:** Lowest volumes (1,500-3,000 monthly)

### Year-over-Year Trends
Most jurisdictions show relatively stable patterns across 2024 with:
- Victoria maintaining dominance
- NSW showing consistent second-place position
- Queensland displaying steady growth throughout the year

## Technical Implementation

### Files Modified

#### 1. **rq1.html**
**Structure:**
- Navigation bar with active state
- Page header with research question
- Visualization container (`#rq1-chart`)
- Controls container (`#rq1-controls`)
- Usage instructions panel
- Key insights cards
- Jurisdiction comparison analysis section
- Navigation buttons to other RQs

#### 2. **js/rq1.js** (1194 lines)
**Key Functions:**
```javascript
// Main execution flow
loadQ1Data() // Loads from data/Q1.csv
  .then(data => {
    // Build dropdown controls
    // Initialize chart with all jurisdictions
    // Set up event handlers
  });

// Chart rendering
renderChart(selectedJurisdictions, allData);

// Event handlers
- Checkbox changes → updateChart()
- Hover → showTooltip()
- Click → focusJurisdiction()
- Window resize → responsiveRedraw()
```

**Data Processing:**
- Groups data by jurisdiction
- Sorts by month chronologically
- Filters based on user selections
- Calculates min/max values per jurisdiction
- Formats dates for display

**D3.js Features Used:**
- `d3.csv()` for data loading
- `d3.scaleTime()` for X-axis
- `d3.scaleLinear()` for Y-axis
- `d3.line()` for line generation
- `d3.curveMonotoneX` for smooth curves
- `d3.transition()` for animations
- `d3.axisBottom()` and `d3.axisLeft()` for axes

#### 3. **script/load-q1data.js**
**Purpose:** Data loading utility

**Features:**
- Loads Q1.csv with proper type conversion
- Parses dates (YEAR/MONTH to Date objects)
- Converts FINES to numbers
- Filters out invalid rows
- Provides global `loadQ1Data()` function
- Auto-executes if D3 is available
- Console logging for debugging

**Data Schema:**
```javascript
{
  YEAR: number,        // e.g., 2024
  MONTH: number,       // 1-12
  JURISDICTION: string, // "NSW", "VIC", etc.
  FINES: number,       // Monthly fine count
  date: Date           // Parsed date object
}
```

## Color Scheme

### Jurisdiction Colors
- **NSW:** `#3b82f6` (Blue)
- **VIC:** `#ef4444` (Red)
- **QLD:** `#f59e0b` (Orange)
- **WA:** `#10b981` (Green)
- **SA:** `#8b5cf6` (Purple)
- **TAS:** `#ec4899` (Pink)
- **ACT:** `#06b6d4` (Cyan)
- **NT:** `#f97316` (Dark Orange)

### State Colors
- **Focused Line:** Full opacity with 3px stroke
- **Unfocused Lines:** 30% opacity with 2px stroke
- **Hover Points:** White fill with colored border
- **Min Marker:** `#10b981` (Green)
- **Max Marker:** `#ef4444` (Red)

## Responsive Design
- SVG with viewBox for scaling
- Dynamic width calculation based on container
- Maintains aspect ratio on resize
- Mobile-friendly touch interactions
- Readable font sizes at all screen sizes

## Accessibility Features
- Clear color distinctions between jurisdictions
- Interactive legend for identification
- Tooltips with detailed information
- Keyboard-accessible controls (checkboxes)
- Sufficient color contrast
- Clear axis labels and titles
- Usage instructions panel

## User Interactions Summary

1. **Initial Load:** All jurisdictions displayed with animated line drawing
2. **Dropdown Click:** Opens multi-select menu with all options
3. **Checkbox Toggle:** Instantly updates chart with selected jurisdictions
4. **Select All:** Quickly show/hide all jurisdictions
5. **Hover:** Vertical guide line with data points and tooltip
6. **Click Line/Legend:** Focus on single jurisdiction with min/max markers
7. **Click Background:** Reset to normal view

## Performance Considerations
- Efficient data filtering and grouping
- Smooth transitions without lag
- Debounced window resize events
- Minimal DOM manipulations
- Optimized D3 selections

## Future Enhancement Possibilities
- Year selector (if multi-year data available)
- Export chart as PNG/SVG
- Data table view toggle
- Comparison mode (side-by-side years)
- Trend line overlays
- Statistical summaries per jurisdiction
