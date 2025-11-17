# Traffic Infraction Analysis Website
## COS30045 Data Visualization Project

A modern, interactive web application for visualizing and analyzing traffic infraction data across Australian jurisdictions.

---

## 🎯 Features

### Research Question 1: Detection Method vs Outcomes
- **Visualizations**: Stacked bar chart, Grouped bar chart, Small multiples by outcome
- **Interactivity**: Toggle between different views
- **Data**: Camera vs Police detection methods across 6 years
- **Insights**: Trend analysis and outcome distribution

### Research Question 2: Seasonal Patterns
- **Visualizations**: Year-Month heatmap, Monthly line chart
- **Interactivity**: Switch between heatmap and line chart views
- **Data**: Monthly infraction patterns from 2019-2024
- **Insights**: Peak seasons and lowest periods

### Research Question 3: Method Effectiveness by Jurisdiction
- **Visualizations**: Interactive choropleth map, Horizontal bar chart
- **Interactivity**: Toggle between camera/police and per capita/total metrics
- **Data**: Detection rates across 8 Australian jurisdictions
- **Insights**: Jurisdiction comparisons and per capita analysis

### Research Question 4: Location of Infractions
- **Visualizations**: Hotspot map, Stacked bar chart
- **Interactivity**: Filter by jurisdiction
- **Data**: Location categories (Metropolitan, Regional, Remote)
- **Insights**: Urban concentration and remote area analysis

### Research Question 5: Age Groups Analysis
- **Visualizations**: Bar chart, Lollipop chart
- **Interactivity**: Toggle chart styles and sort by age/rate
- **Data**: Infractions adjusted per 10,000 license holders
- **Insights**: Age group risk profiles

---

## 🚀 Getting Started

### Option 1: Direct Opening (Simplest)
1. Open `index.html` in any modern web browser
2. All visualizations will load automatically

### Option 2: Local Server (Recommended)
Using Python:
```bash
cd website
python -m http.server 8000
```

Using Node.js:
```bash
npm install -g http-server
cd website
http-server
```

Then open `http://localhost:8000` in your browser.

---

## 📁 File Structure

```
website/
├── index.html              # Main HTML structure
├── styles.css              # Modern CSS styling
├── data.js                 # Sample data for all research questions
├── visualizations.js       # Chart implementations
├── main.js                 # Navigation and interactions
└── README.md              # This file
```

---

## 🎨 Design Features

- **Modern & Slick UI**: Clean, professional design with gradient hero section
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Interactive**: All visualizations are fully interactive with hover effects
- **Smooth Navigation**: Scroll-based navigation with active section highlighting
- **Accessible**: Keyboard navigation support and skip links
- **Performance**: Optimized with lazy loading and efficient rendering

---

## 📊 Data Structure

The website uses sample data stored in `data.js`. To use your own data:

1. Open `data.js`
2. Replace the sample data in the `DATA` object with your actual dataset
3. Maintain the same structure for compatibility

### Data Format Example:

```javascript
const DATA = {
    rq1: {
        years: ['2019', '2020', ...],
        camera: {
            warning: [1200, 1350, ...],
            fine: [15000, 18500, ...],
            court: [450, 520, ...]
        },
        police: { ... }
    },
    // ... other research questions
};
```

---

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality
- **Chart.js 4.4.0**: Bar, line, and other chart types
- **D3.js v7**: Advanced visualizations (heatmap, lollipop)
- **Leaflet 1.9.4**: Interactive maps
- **Google Fonts**: Inter font family

---

## 🎯 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #2563eb;
    --secondary: #10b981;
    --accent: #f59e0b;
    /* ... */
}
```

### Data
Update `data.js` with your actual dataset while maintaining the structure.

### Charts
Modify chart configurations in `visualizations.js` for different appearances.

---

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

---

## 🔧 Troubleshooting

### Charts not displaying
- Ensure all CDN libraries are loading (check browser console)
- Try using a local server instead of opening the file directly
- Check that `data.js` is loaded before `visualizations.js`

### Maps not showing
- Check internet connection (Leaflet tiles require internet)
- Verify Leaflet CSS and JS are properly loaded
- Check browser console for errors

### Styling issues
- Clear browser cache
- Ensure `styles.css` is properly linked in `index.html`
- Check for CSS conflicts if integrating with other stylesheets

---

## 📈 Exporting Data

Use the browser console to export data:
```javascript
exportData('rq1')  // Exports RQ1 data as JSON
exportData('rq2')  // Exports RQ2 data as JSON
// ... etc
```

---

## 🤝 Contributing

This is a course project for COS30045. To modify:

1. Edit the relevant files
2. Test in multiple browsers
3. Ensure responsive design is maintained
4. Check accessibility features

---

## 📝 Notes

- **Sample Data**: All data is currently sample data for demonstration
- **Real Data**: Replace with actual traffic infraction data
- **Performance**: Large datasets may require optimization
- **Hosting**: Can be hosted on GitHub Pages, Netlify, or any static host

---

## 🎓 Project Information

**Course**: COS30045 Data Visualization  
**Year**: 2025  
**Topic**: Traffic Infraction Analysis  
**Focus**: Detection methods, seasonal patterns, jurisdiction analysis

---

## 📧 Support

For issues or questions related to the visualization implementation:
- Check browser console for errors
- Verify all dependencies are loaded
- Review the data structure in `data.js`

---

## ⚡ Quick Tips

1. Use `Ctrl+F` or `Cmd+F` to search within visualizations
2. Arrow keys navigate between sections
3. All charts are interactive - hover for details
4. Mobile-friendly with touch support
5. Print-friendly layout for reports

---

**Built with ❤️ for COS30045**

