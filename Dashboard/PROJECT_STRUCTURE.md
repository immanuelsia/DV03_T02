# Speeding Enforcement Insights Dashboard - Project Structure

## Overview
This project has been reorganized into a modular structure to facilitate collaborative development and easier code maintenance.

## File Structure

```
website/
├── css/                           # Stylesheets (modular)
│   ├── styles-base.css           # Common styles (navbar, footer, buttons)
│   ├── styles-dashboard.css      # Home page specific styles
│   └── styles-questions.css      # Research question pages styles
│
├── js/                            # JavaScript files (modular)
│   ├── rq1.js                    # Detection Methods visualization
│   ├── rq2.js                    # Seasonal Patterns visualization
│   ├── rq3.js                    # Jurisdiction Analysis visualization
│   ├── rq4.js                    # Location Hotspots visualization
│   └── rq5.js                    # Age Demographics visualization
│
├── data.js                        # Shared data and utility functions
├── main.js                        # Main JavaScript (navbar, etc.)
│
├── index.html                     # Home/Dashboard page
├── rq1.html                       # Research Question 1 page
├── rq2.html                       # Research Question 2 page
├── rq3.html                       # Research Question 3 page
├── rq4.html                       # Research Question 4 page
└── rq5.html                       # Research Question 5 page
```

## CSS Organization

### styles-base.css
Contains common styles used across all pages:
- CSS variables and color palette
- Reset and base styles
- Navigation bar
- Footer
- Buttons
- Section layouts
- Animations
- Responsive design base

### styles-dashboard.css
Contains styles specific to the home page (index.html):
- Hero section
- Research cards grid
- Findings cards
- About section
- Stats cards

### styles-questions.css
Contains styles for research question pages (rq1-5.html):
- Page headers
- Visualization controls
- Chart containers
- Maps
- Heatmaps
- Insights cards
- Analysis cards
- Policy cards
- Page navigation

## JavaScript Organization

### data.js
- Shared data for all visualizations
- Utility functions (formatNumber, perCapitaRate, etc.)
- Color functions (getChoroplethColor)

### main.js
- Navbar functionality
- Shared interactions

### rq1.js - rq5.js
Each file contains page-specific visualization code:
- Chart initialization
- Data rendering
- Event handlers
- Interactive controls

## Collaboration Guidelines

### Working on Individual Pages

1. **Home Page (index.html)**
   - Edit: `index.html`, `css/styles-dashboard.css`
   - No conflicts with research pages

2. **Research Question Pages**
   - **RQ1 (Detection Methods)**
     - Edit: `rq1.html`, `js/rq1.js`
   
   - **RQ2 (Seasonal Patterns)**
     - Edit: `rq2.html`, `js/rq2.js`
   
   - **RQ3 (Jurisdiction Analysis)**
     - Edit: `rq3.html`, `js/rq3.js`
   
   - **RQ4 (Location Hotspots)**
     - Edit: `rq4.html`, `js/rq4.js`
   
   - **RQ5 (Age Demographics)**
     - Edit: `rq5.html`, `js/rq5.js`

### Shared Files (Coordinate Changes)

- **css/styles-base.css** - Common styles affecting all pages
- **data.js** - Shared data structure
- **main.js** - Shared functionality

### Git Workflow Recommendations

1. Create feature branches for each research question:
   ```bash
   git checkout -b feature/rq1-updates
   git checkout -b feature/rq2-updates
   ```

2. Work on your assigned files without conflicts

3. Before pushing, pull latest changes:
   ```bash
   git pull origin main
   ```

4. Test your changes locally

5. Create pull request for review

## Benefits of This Structure

1. **Parallel Development**: Team members can work on different research questions simultaneously without merge conflicts

2. **Easier Debugging**: Issues can be traced to specific files quickly

3. **Maintainability**: Changes to one visualization don't affect others

4. **Code Organization**: Logical separation of concerns

5. **Git Friendly**: Fewer merge conflicts, clearer diff history

## File Dependencies

### index.html depends on:
- css/styles-base.css
- css/styles-dashboard.css
- main.js

### rq1.html - rq5.html depend on:
- css/styles-base.css
- css/styles-questions.css
- data.js
- js/rqX.js (where X is 1-5)
- main.js

## Color Scheme

The dashboard uses a modern beige/white color palette:
- Primary: #78716c (beige-500)
- Backgrounds: White (#ffffff) and beige-50 (#fafaf9)
- Text: beige-800 (#292524)
- Accents: Various beige shades (100-700)

## Development Tips

1. **Adding New Visualizations**: 
   - Add to the appropriate `js/rqX.js` file
   - Update HTML in corresponding `rqX.html`

2. **Styling Changes**:
   - Page-specific: Edit `styles-questions.css`
   - Global changes: Edit `styles-base.css` (coordinate with team)

3. **Testing**:
   - Open HTML files directly in browser
   - Check all research question pages after changes to shared files

4. **Code Style**:
   - Use consistent indentation (2 spaces)
   - Comment complex visualization logic
   - Follow existing naming conventions

## Team Assignment Example

- **Member 1**: RQ1 (Detection Methods) - Files: rq1.html, js/rq1.js
- **Member 2**: RQ2 (Seasonal Patterns) - Files: rq2.html, js/rq2.js  
- **Member 3**: RQ3 (Jurisdiction Analysis) - Files: rq3.html, js/rq3.js
- **Member 4**: RQ4 (Location Hotspots) - Files: rq4.html, js/rq4.js
- **Member 5**: RQ5 (Age Demographics) - Files: rq5.html, js/rq5.js

This way, each team member has clear ownership of their files with minimal conflicts!

