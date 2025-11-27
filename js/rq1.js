// RQ1: Monthly Speeding Fines by Jurisdiction
// D3 Multi-Line Chart Visualization with real data from Q1.csv

(function(){

// Load the dataset
loadQ1Data().then(data => {
  console.log('RQ1 data loaded:', data.length, 'rows');
  
  // Get unique jurisdictions and sort them
  const jurisdictions = Array.from(new Set(data.map(d => d.JURISDICTION))).filter(j => j).sort();
  console.log('Jurisdictions:', jurisdictions);
  
  // Build the control panel
  const controlsDiv = d3.select('#rq1-controls');
  controlsDiv.attr('class', 'viz-controls');
  
  // Create dropdown-style multi-select control
  const dropdownContainer = controlsDiv.append('div')
    .attr('class', 'control-label')
    .style('position', 'relative');
  
  dropdownContainer.append('span').text('Select Jurisdictions:');
  
  // Create dropdown button
  const dropdownButton = dropdownContainer.append('div')
    .attr('class', 'control-select')
    .style('cursor', 'pointer')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('align-items', 'center')
    .style('user-select', 'none')
    .html(`<span>All Jurisdictions (${jurisdictions.length})</span><span style="font-size: 0.7em;">▼</span>`);
  
  // Create dropdown menu
  const dropdownMenu = dropdownContainer.append('div')
    .style('position', 'absolute')
    .style('top', '100%')
    .style('left', '0')
    .style('right', '0')
    .style('background', 'white')
    .style('border', '2px solid #e5e7eb')
    .style('border-radius', '8px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
    .style('margin-top', '4px')
    .style('max-height', '300px')
    .style('overflow-y', 'auto')
    .style('z-index', '1000')
    .style('display', 'none');
  
  // Add "Select All" option
  const selectAllOption = dropdownMenu.append('label')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('padding', '10px 12px')
    .style('cursor', 'pointer')
    .style('border-bottom', '1px solid #e5e7eb')
    .style('background', '#f9fafb')
    .style('font-weight', '600')
    .on('mouseover', function() {
      d3.select(this).style('background', '#f3f4f6');
    })
    .on('mouseout', function() {
      d3.select(this).style('background', '#f9fafb');
    });
  
  const selectAllCheckbox = selectAllOption.append('input')
    .attr('type', 'checkbox')
    .attr('id', 'select-all')
    .attr('checked', true)
    .style('cursor', 'pointer')
    .style('margin-right', '8px');
  
  selectAllOption.append('span').text('Select All');
  
  // Add individual jurisdiction checkboxes
  const checkboxes = {};
  jurisdictions.forEach(jurisdiction => {
    const option = dropdownMenu.append('label')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('padding', '8px 12px')
      .style('cursor', 'pointer')
      .style('transition', 'background 0.2s')
      .on('mouseover', function() {
        d3.select(this).style('background', '#f3f4f6');
      })
      .on('mouseout', function() {
        d3.select(this).style('background', 'white');
      });
    
    const checkbox = option.append('input')
      .attr('type', 'checkbox')
      .attr('class', 'jurisdiction-checkbox')
      .attr('value', jurisdiction)
      .attr('checked', true)
      .style('cursor', 'pointer')
      .style('margin-right', '8px');
    
    option.append('span').text(jurisdiction);
    
    checkboxes[jurisdiction] = checkbox.node();
  });
  
  // Toggle dropdown visibility
  let isDropdownOpen = false;
  dropdownButton.on('click', function(event) {
    event.stopPropagation();
    isDropdownOpen = !isDropdownOpen;
    dropdownMenu.style('display', isDropdownOpen ? 'block' : 'none');
    dropdownButton.html(`<span>${getSelectedText()}</span><span style="font-size: 0.7em;">${isDropdownOpen ? '▲' : '▼'}</span>`);
  });
  
  // Close dropdown when clicking outside
  d3.select('body').on('click.rq1-dropdown', function(event) {
    if (isDropdownOpen && !dropdownContainer.node().contains(event.target)) {
      isDropdownOpen = false;
      dropdownMenu.style('display', 'none');
      dropdownButton.html(`<span>${getSelectedText()}</span><span style="font-size: 0.7em;">▼</span>`);
    }
  });
  
  // Function to get selected text
  function getSelectedText() {
    const selectedCount = jurisdictions.filter(j => checkboxes[j].checked).length;
    if (selectedCount === 0) return 'No Jurisdictions Selected';
    if (selectedCount === jurisdictions.length) return `All Jurisdictions (${jurisdictions.length})`;
    if (selectedCount === 1) return jurisdictions.find(j => checkboxes[j].checked);
    return `${selectedCount} Jurisdictions Selected`;
  }
  
  // Set up the chart dimensions
  const chartContainer = d3.select('#rq1-chart');
  
  // Detect device and orientation
  const isMobile = window.innerWidth <= 768;
  const isLandscape = window.innerWidth > window.innerHeight;
  
  // Get full available width of the container
  const containerNode = chartContainer.node();
  let containerWidth = containerNode.getBoundingClientRect().width || window.innerWidth - 40;
  let chartHeight = 450;
  let margin = { top: 20, right: 120, bottom: 60, left: 80 };
  
  if (isMobile) {
    if (isLandscape) {
      // Landscape: reduce height, keep standard margins
      chartHeight = 350;
      margin = { top: 15, right: 100, bottom: 50, left: 60 };
    } else {
      // Portrait: enable horizontal scrolling with wider chart
      containerWidth = Math.max(containerWidth, 600); // Minimum width for readability
      chartHeight = 400;
      margin = { top: 20, right: 100, bottom: 50, left: 60 };
    }
  }
  
  const width = containerWidth - margin.left - margin.right;
  const height = chartHeight - margin.top - margin.bottom;
  
  // Create wrapper for horizontal scrolling on mobile portrait
  if (isMobile && !isLandscape) {
    chartContainer
      .style('overflow-x', 'auto')
      .style('overflow-y', 'hidden')
      .style('-webkit-overflow-scrolling', 'touch')
      .style('width', '100%');
  }
  
  // Create SVG
  const svg = chartContainer.append('svg')
    .attr('width', containerWidth)
    .attr('height', chartHeight);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Add color-blind toggle button (top-right position)
  const toggleButton = svg.append('g')
    .attr('class', 'colorblind-toggle')
    .attr('transform', `translate(${containerWidth - 55}, 15)`)
    .style('cursor', 'pointer');
  
  const toggleTitle = toggleButton.append('title')
    .text('Enable color blind mode');
  
  toggleButton.append('rect')
    .attr('width', 40)
    .attr('height', 28)
    .attr('rx', 4)
    .attr('fill', '#f3f4f6')
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 1);
  
  // Add eye icon (centered in smaller button)
  toggleButton.append('path')
    .attr('d', 'M20 8 C15 8, 12 11, 12 14 C12 17, 15 20, 20 20 C25 20, 28 17, 28 14 C28 11, 25 8, 20 8 M20 10 C23 10, 25 12, 25 14 C25 16, 23 18, 20 18 C17 18, 15 16, 15 14 C15 12, 17 10, 20 10')
    .attr('fill', '#374151')
    .attr('transform', 'translate(0, 0)');
  
  toggleButton.append('circle')
    .attr('cx', 20)
    .attr('cy', 14)
    .attr('r', 2)
    .attr('fill', '#374151');
  
  // Add hover effects
  toggleButton.on('mouseenter', function() {
    toggleButton.select('rect')
      .transition()
      .duration(200)
      .attr('transform', 'scale(1.05)');
  });
  
  toggleButton.on('mouseleave', function() {
    toggleButton.select('rect')
      .transition()
      .duration(200)
      .attr('transform', 'scale(1)');
  });
  
  toggleButton.on('click', function() {
    isColorBlindMode = !isColorBlindMode;
    
    // Update button appearance
    toggleButton.select('rect')
      .attr('fill', isColorBlindMode ? '#10b981' : '#f3f4f6')
      .attr('stroke', isColorBlindMode ? '#059669' : '#d1d5db');
    
    toggleButton.selectAll('path, circle')
      .attr('fill', isColorBlindMode ? '#ffffff' : '#374151');
    
    // Update title text based on state
    toggleTitle.text(isColorBlindMode ? 'Disable Colour-Blind Mode' : 'Enable Colour-Blind Mode');
    
    // Update all colors and enhance visual contrast in color-blind mode
    updateChart();
    
    // Additional enhancements for color-blind mode
    if (window.rq1AllLines) {
      window.rq1AllLines
        .transition()
        .duration(500)
        .attr('stroke-width', isColorBlindMode ? 3 : 2.5)
        .style('opacity', isColorBlindMode ? 0.95 : 1);
    }
    
    if (window.rq1AllCircles) {
      window.rq1AllCircles
        .transition()
        .duration(500)
        .attr('r', isColorBlindMode ? 5 : 4)
        .style('stroke', isColorBlindMode ? '#000' : 'none')
        .style('stroke-width', isColorBlindMode ? 1 : 0);
    }
  });
  
  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'rq1-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('padding', '10px 12px')
    .style('font-size', '12px')
    .style('background', 'rgba(255, 255, 255, 0.95)')
    .style('color', '#333')
    .style('border', '1px solid #ccc')
    .style('border-radius', '4px')
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
    .style('opacity', 0);
  
  // Create crosshair group
  const crosshair = g.append('g')
    .attr('class', 'crosshair')
    .style('display', 'none');
  
  const verticalLine = crosshair.append('line')
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#666')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4');
  
  // Create overlay for mouse tracking
  const overlay = g.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .style('fill', 'none')
    .style('pointer-events', 'all');
  
  // Create scales
  const xScale = d3.scaleLinear()
    .domain([1, 12])
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .range([height, 0]);
  
  // Color scale
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(jurisdictions);
  
  // Color-blind friendly palette (Okabe-Ito - gold standard)
  const colorBlindPalette = [
    '#0072B2', // Blue
    '#009E73', // Green
    '#F0E442', // Yellow
    '#E69F00', // Orange
    '#56B4E9', // Sky Blue
    '#CC79A7', // Pink
    '#D55E00', // Red
    '#000000'  // Black
  ];
  const colorBlindScale = d3.scaleOrdinal(colorBlindPalette)
    .domain(jurisdictions);
  
  // Toggle state for color-blind mode
  let isColorBlindMode = false;
  
  // Function to get current color scale
  function getCurrentColorScale() {
    return isColorBlindMode ? colorBlindScale : colorScale;
  }
  
  // Create axes
  const xAxis = g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`);
  
  const yAxis = g.append('g')
    .attr('class', 'y-axis');
  
  // Add axis labels
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('text-anchor', 'middle')
    .attr('x', margin.left + width / 2)
    .attr('y', height + margin.top + margin.bottom - 10)
    .style('font-size', '14px')
    .style('font-weight', '600')
    .text('Month');
  
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('text-anchor', 'middle')
    .attr('transform', `rotate(-90)`)
    .attr('x', -(margin.top + height / 2))
    .attr('y', 20)
    .style('font-size', '14px')
    .style('font-weight', '600')
    .text('Total Fines');
  
  // Line generator
  const line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(d.Month))
    .y(d => yScale(d.Sum_FINES));
  
  // Create lines group
  const linesGroup = g.append('g').attr('class', 'lines-group');
  
  // Create dots group
  const dotsGroup = g.append('g').attr('class', 'dots-group');
  
  // Create legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);
  
  // State for hover and isolation
  let hoveredJurisdiction = null;
  let isolatedJurisdiction = null;
  
  // Function to get selected jurisdictions
  function getSelectedJurisdictions() {
    return jurisdictions.filter(j => checkboxes[j].checked);
  }
  
  // Function to update the chart
  function updateChart() {
    const selected = getSelectedJurisdictions();
    
    // Filter data for selected jurisdictions
    const filteredData = data.filter(d => selected.includes(d.JURISDICTION));
    
    // Update Y scale domain based on filtered data
    const maxValue = d3.max(filteredData, d => d.Sum_FINES) || 100;
    yScale.domain([0, maxValue]).nice();
    
    // Group data by jurisdiction for easy lookup
    const dataByJurisdictionMap = {};
    selected.forEach(jurisdiction => {
      dataByJurisdictionMap[jurisdiction] = data
        .filter(d => d.JURISDICTION === jurisdiction)
        .sort((a, b) => a.Month - b.Month);
    });
    
    // Update axes with transition
    xAxis.transition().duration(500)
      .call(d3.axisBottom(xScale)
        .ticks(12)
        .tickFormat(d => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months[d - 1] || d;
        }));
    
    yAxis.transition().duration(500)
      .call(d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d => d3.format('.2s')(d)));
    
    // Group data by jurisdiction
    const dataByJurisdiction = selected.map(jurisdiction => ({
      jurisdiction,
      values: data.filter(d => d.JURISDICTION === jurisdiction).sort((a, b) => a.Month - b.Month)
    }));
    
    // Update lines
    const lines = linesGroup.selectAll('.line')
      .data(dataByJurisdiction, d => d.jurisdiction);
    
    // Exit - interrupt any existing transitions first
    lines.exit()
      .interrupt()
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
    
    // Enter + Update
    const linesEnter = lines.enter()
      .append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke-width', 2.5)
      .style('opacity', 0);
    
    const allLines = linesEnter.merge(lines);
    
    allLines
      .interrupt()
      .transition()
      .duration(500)
      .attr('stroke', d => getCurrentColorScale()(d.jurisdiction))
      .attr('d', d => line(d.values))
      .style('opacity', d => {
        if (isolatedJurisdiction) {
          return d.jurisdiction === isolatedJurisdiction ? 1 : 0.1;
        }
        if (hoveredJurisdiction) {
          return d.jurisdiction === hoveredJurisdiction ? 1 : 0.15;
        }
        return 1;
      })
      .attr('stroke-width', d => {
        const baseWidth = isColorBlindMode ? 3 : 2.5;
        const highlightWidth = isColorBlindMode ? 4 : 3.5;
        if (isolatedJurisdiction) {
          return d.jurisdiction === isolatedJurisdiction ? highlightWidth : baseWidth;
        }
        if (hoveredJurisdiction) {
          return d.jurisdiction === hoveredJurisdiction ? highlightWidth : baseWidth;
        }
        return baseWidth;
      });
    
    // Add hover and click handlers to lines
    allLines
      .style('cursor', 'pointer')
      .on('mouseenter touchstart', function(event, d) {
        if (event.type === 'touchstart') event.preventDefault();
        hoveredJurisdiction = d.jurisdiction;
        updateLineStyles();
        updateLegendStyles();
      })
      .on('mouseleave', function() {
        hoveredJurisdiction = null;
        updateLineStyles();
        updateLegendStyles();
      })
      .on('click touchend', function(event, d) {
        event.preventDefault();
        event.stopPropagation();
        if (isolatedJurisdiction === d.jurisdiction) {
          isolatedJurisdiction = null;
        } else {
          isolatedJurisdiction = d.jurisdiction;
        }
        hoveredJurisdiction = null;
        updateLineStyles();
        updateLegendStyles();
        updateDotsVisibility();
        if (window.rq1UpdateMinMaxBubbles) {
          window.rq1UpdateMinMaxBubbles();
        }
      });
    
    // Update dots
    const dots = dotsGroup.selectAll('.dot-group')
      .data(dataByJurisdiction, d => d.jurisdiction);
    
    // Exit - interrupt any existing transitions first
    dots.exit()
      .interrupt()
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
    
    // Enter
    const dotsEnter = dots.enter()
      .append('g')
      .attr('class', 'dot-group')
      .style('opacity', 0);
    
    // Update + Enter
    const dotsUpdate = dotsEnter.merge(dots);
    
    dotsUpdate
      .interrupt()
      .transition()
      .duration(500)
      .style('opacity', 1);
    
    // Bind dots to individual data points
    const circles = dotsUpdate.selectAll('circle')
      .data(d => d.values.map(v => ({ ...v, jurisdiction: d.jurisdiction })), d => `${d.jurisdiction}-${d.Month}`);
    
    circles.exit()
      .interrupt()
      .remove();
    
    const circlesEnter = circles.enter()
      .append('circle')
      .attr('r', isColorBlindMode ? 5 : 4)
      .attr('fill', d => getCurrentColorScale()(d.jurisdiction))
      .style('cursor', 'pointer')
      .style('stroke', isColorBlindMode ? '#000' : 'none')
      .style('stroke-width', isColorBlindMode ? 1 : 0)
      .style('opacity', 0);
    
    const allCircles = circlesEnter.merge(circles);
    
    allCircles
      .interrupt()
      .transition()
      .duration(500)
      .attr('cx', d => xScale(d.Month))
      .attr('cy', d => yScale(d.Sum_FINES))
      .attr('r', isColorBlindMode ? 5 : 4)
      .attr('fill', d => getCurrentColorScale()(d.jurisdiction))
      .style('stroke', isColorBlindMode ? '#000' : 'none')
      .style('stroke-width', isColorBlindMode ? 1 : 0)
      .style('opacity', d => {
        if (isolatedJurisdiction) {
          return d.jurisdiction === isolatedJurisdiction ? 1 : 0.1;
        }
        if (hoveredJurisdiction) {
          return d.jurisdiction === hoveredJurisdiction ? 1 : 0.15;
        }
        return 1;
      });
    
    // Store reference for later updates
    window.rq1AllCircles = allCircles;
    
    // Function to show/hide min/max bubbles
    function updateMinMaxBubbles() {
      // Remove existing bubbles and lines
      g.selectAll('.minmax-bubble').remove();
      g.selectAll('.minmax-lines').remove();
      g.selectAll('.minmax-axis-label').remove();
      
      // Reset axis tick highlights
      xAxis.selectAll('.tick text')
        .style('fill', null)
        .style('font-weight', null)
        .style('font-size', null);
      
      yAxis.selectAll('.tick text')
        .style('fill', null)
        .style('font-weight', null)
        .style('font-size', null);
      
      if (!isolatedJurisdiction) return;
      
      // Calculate min/max for the isolated jurisdiction
      const isolatedJurData = dataByJurisdictionMap[isolatedJurisdiction] || [];
      const isolatedValues = isolatedJurData.map(item => item.Sum_FINES).filter(v => v != null);
      if (isolatedValues.length === 0) return;
      
      const minVal = Math.min(...isolatedValues);
      const maxVal = Math.max(...isolatedValues);
      
      // Find the data points for min and max
      const minMaxPoints = isolatedJurData.filter(d => d.Sum_FINES === minVal || d.Sum_FINES === maxVal);
      
      // First pass: draw all lines and axis labels
      minMaxPoints.forEach(d => {
        const label = d.Sum_FINES === maxVal ? 'MAX' : 'MIN';
        const bgColor = d.Sum_FINES === maxVal ? '#10b981' : '#ef4444';
        
        const cx = xScale(d.Month);
        const cy = yScale(d.Sum_FINES);
        
        // Create lines group
        const linesGroup = g.insert('g', '.minmax-bubble')
          .attr('class', 'minmax-lines')
          .style('opacity', 0)
          .style('pointer-events', 'none');
        
        // Vertical line to X-axis
        linesGroup.append('line')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', cx)
          .attr('y2', height)
          .attr('stroke', bgColor)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.8);
        
        // Horizontal line to Y-axis
        linesGroup.append('line')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', 0)
          .attr('y2', cy)
          .attr('stroke', bgColor)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.8);
        
        // Highlight X-axis tick if it matches
        const xTicks = xScale.ticks();
        const isXOnTick = xTicks.some(tick => Math.abs(tick - d.Month) < 0.5);
        
        if (isXOnTick) {
          xAxis.selectAll('.tick text')
            .filter(function(t) { return Math.abs(t - d.Month) < 0.5; })
            .style('fill', bgColor)
            .style('font-weight', '700')
            .style('font-size', '13px');
        } else {
          // Add custom X-axis label
          const xLabelGroup = g.append('g')
            .attr('class', 'minmax-axis-label')
            .style('opacity', 0);
          
          const xMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const xLabelText = xMonths[d.Month - 1];
          
          const xLabel = xLabelGroup.append('text')
            .attr('x', cx)
            .attr('y', height + 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('fill', bgColor)
            .text(xLabelText);
          
          const xLabelBBox = xLabel.node().getBBox();
          xLabelGroup.insert('rect', 'text')
            .attr('x', xLabelBBox.x - 4)
            .attr('y', xLabelBBox.y - 2)
            .attr('width', xLabelBBox.width + 8)
            .attr('height', xLabelBBox.height + 4)
            .attr('fill', 'white')
            .attr('opacity', 0.9)
            .attr('rx', 3);
          
          xLabelGroup.transition().duration(300).style('opacity', 1);
        }
        
        // Store Y-axis label info for positioning
        d.yLabelInfo = {
          value: d.Sum_FINES,
          cy: cy,
          bgColor: bgColor,
          label: label
        };
        
        // Animate lines in
        linesGroup.transition().duration(300).style('opacity', 1);
      });
      
      // Position Y-axis labels with smart spacing to avoid overlap
      const yLabelsToPlace = minMaxPoints.map(d => d.yLabelInfo).sort((a, b) => b.cy - a.cy);
      const minSpacing = 25; // Minimum pixels between labels
      
      yLabelsToPlace.forEach((labelInfo, idx) => {
        // Calculate position avoiding overlap
        let targetY = labelInfo.cy;
        
        // Check previous label for overlap
        if (idx > 0) {
          const prevLabel = yLabelsToPlace[idx - 1];
          const prevY = prevLabel.adjustedY || prevLabel.cy;
          if (Math.abs(targetY - prevY) < minSpacing) {
            targetY = prevY - minSpacing;
          }
        }
        
        labelInfo.adjustedY = targetY;
        
        // Check if adjusted Y matches a tick
        const yTicks = yScale.ticks();
        const isYOnTick = yTicks.some(tick => Math.abs(tick - labelInfo.value) < (labelInfo.value * 0.02));
        
        if (isYOnTick) {
          yAxis.selectAll('.tick text')
            .filter(function(t) { return Math.abs(t - labelInfo.value) < (labelInfo.value * 0.02); })
            .style('fill', labelInfo.bgColor)
            .style('font-weight', '700')
            .style('font-size', '13px');
        } else {
          // Add custom Y-axis label group
          const yLabelGroup = g.append('g')
            .attr('class', 'minmax-axis-label')
            .style('opacity', 0);
          
          // Draw connecting line from label to actual data point if positions differ
          if (Math.abs(targetY - labelInfo.cy) > 2) {
            yLabelGroup.append('line')
              .attr('x1', -8)
              .attr('y1', targetY)
              .attr('x2', 0)
              .attr('y2', labelInfo.cy)
              .attr('stroke', labelInfo.bgColor)
              .attr('stroke-width', 1)
              .attr('opacity', 0.5);
          }
          
          const yLabel = yLabelGroup.append('text')
            .attr('x', -10)
            .attr('y', targetY + 4)
            .attr('text-anchor', 'end')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('fill', labelInfo.bgColor)
            .text(d3.format('.2s')(labelInfo.value));
          
          const yLabelBBox = yLabel.node().getBBox();
          yLabelGroup.insert('rect', 'text')
            .attr('x', yLabelBBox.x - 4)
            .attr('y', yLabelBBox.y - 2)
            .attr('width', yLabelBBox.width + 8)
            .attr('height', yLabelBBox.height + 4)
            .attr('fill', 'white')
            .attr('opacity', 0.9)
            .attr('rx', 3);
          
          yLabelGroup.transition().duration(300).style('opacity', 1);
        }
      });
      
      // Second pass: draw all chat bubbles on top
      minMaxPoints.forEach(d => {
        const label = d.Sum_FINES === maxVal ? 'MAX' : 'MIN';
        const bgColor = d.Sum_FINES === maxVal ? '#10b981' : '#ef4444';
        
        const cx = xScale(d.Month);
        const cy = yScale(d.Sum_FINES);
        
        // Chat bubble
        const bubbleGroup = g.append('g')
          .attr('class', 'minmax-bubble')
          .attr('transform', `translate(${cx}, ${cy - 30})`)
          .style('pointer-events', 'all');
        
        // Chat bubble background
        bubbleGroup.append('rect')
          .attr('x', -25)
          .attr('y', -18)
          .attr('width', 50)
          .attr('height', 24)
          .attr('rx', 5)
          .attr('fill', bgColor)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
        
        // Chat bubble pointer
        bubbleGroup.append('path')
          .attr('d', 'M -4,6 L 0,12 L 4,6 Z')
          .attr('fill', bgColor);
        
        // Label text
        bubbleGroup.append('text')
          .attr('x', 0)
          .attr('y', -4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('fill', 'white')
          .text(label);
        
        // Animate in
        bubbleGroup
          .style('opacity', 0)
          .transition()
          .duration(300)
          .style('opacity', 1);
      });
    }
    
    // Store function reference
    window.rq1UpdateMinMaxBubbles = updateMinMaxBubbles;
    
    // Store reference for later updates
    window.rq1AllCircles = allCircles;
    
    // Update legend
    const legendItems = legend.selectAll('.legend-item')
      .data(selected, d => d);
    
    // Exit
    legendItems.exit().remove();
    
    // Enter
    const legendEnter = legendItems.enter()
      .append('g')
      .attr('class', 'legend-item');
    
    legendEnter.append('rect')
      .attr('width', 16)
      .attr('height', 16)
      .attr('fill', d => getCurrentColorScale()(d))
      .attr('rx', 2);
    
    legendEnter.append('text')
      .attr('x', 22)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(d => d);
    
    // Update positions and add interactivity
    const allLegendItems = legendEnter.merge(legendItems);
    
    // Calculate vertical centering
    const itemHeight = 22; // Height per item
    const totalHeight = selected.length * itemHeight;
    const startY = (height - totalHeight) / 2;
    
    allLegendItems
      .transition()
      .duration(500)
      .attr('transform', (d, i) => `translate(0, ${startY + i * itemHeight})`);
    
    // Update legend rect colors
    allLegendItems.select('rect')
      .transition()
      .duration(500)
      .attr('fill', d => getCurrentColorScale()(d));
    
    // Add hover and click handlers to legend
    allLegendItems
      .style('cursor', 'pointer')
      .on('mouseenter touchstart', function(event, d) {
        if (event.type === 'touchstart') event.preventDefault();
        hoveredJurisdiction = d;
        updateLineStyles();
        updateLegendStyles();
      })
      .on('mouseleave', function() {
        hoveredJurisdiction = null;
        updateLineStyles();
        updateLegendStyles();
      })
      .on('click touchend', function(event, d) {
        event.preventDefault();
        event.stopPropagation();
        if (isolatedJurisdiction === d) {
          isolatedJurisdiction = null;
        } else {
          isolatedJurisdiction = d;
        }
        hoveredJurisdiction = null;
        updateLineStyles();
        updateLegendStyles();
        updateDotsVisibility();
        if (window.rq1UpdateMinMaxBubbles) {
          window.rq1UpdateMinMaxBubbles();
        }
      });
    
    // Store reference for later updates
    window.rq1AllLegendItems = allLegendItems;
    
    // Update overlay mouse events
    overlay
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const month = Math.round(xScale.invert(mouseX));
        
        if (month < 1 || month > 12) {
          crosshair.style('display', 'none');
          tooltip.style('opacity', 0);
          return;
        }
        
        // Show crosshair
        crosshair.style('display', null);
        verticalLine.attr('x1', xScale(month)).attr('x2', xScale(month));
        
        // Build tooltip content
        let tooltipHtml = `<div style="font-weight: 600; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd;">${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} 2024</div>`;
        
        // If a jurisdiction is isolated, only show that one
        const jurisdictionsToShow = isolatedJurisdiction ? [isolatedJurisdiction] : selected;
        
        // Calculate min/max for isolated jurisdiction if applicable
        let minValue = null, maxValue = null;
        if (isolatedJurisdiction) {
          const isolatedData = dataByJurisdictionMap[isolatedJurisdiction] || [];
          const values = isolatedData.map(d => d.Sum_FINES).filter(v => v != null);
          if (values.length > 0) {
            minValue = Math.min(...values);
            maxValue = Math.max(...values);
          }
        }
        
        // Get data for this month for the jurisdictions to show
        const monthData = jurisdictionsToShow.map(jurisdiction => {
          const jurData = dataByJurisdictionMap[jurisdiction] || [];
          const monthEntry = jurData.find(d => d.Month === month);
          return {
            jurisdiction,
            value: monthEntry ? monthEntry.Sum_FINES : null
          };
        }).filter(d => d.value !== null)
          .sort((a, b) => b.value - a.value); // Sort by value descending
        
        monthData.forEach(d => {
          tooltipHtml += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <div style="width: 12px; height: 12px; background: ${getCurrentColorScale()(d.jurisdiction)}; border-radius: 2px;"></div>
            <span style="flex: 1; font-weight: 500;">${d.jurisdiction}</span>
            <span style="font-weight: 600;">${d.value.toLocaleString()}</span>
          </div>`;
        });
        
        tooltip
          .style('opacity', 1)
          .html(tooltipHtml)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseleave touchend', function() {
        crosshair.style('display', 'none');
        tooltip.style('opacity', 0);
      })
      .on('touchstart touchmove', function(event) {
        const touch = event.touches[0];
        const [mouseX] = d3.pointer(touch, this);
        const month = Math.round(xScale.invert(mouseX));
        
        if (month < 1 || month > 12) {
          crosshair.style('display', 'none');
          tooltip.style('opacity', 0);
          return;
        }
        
        // Show crosshair
        crosshair.style('display', null);
        verticalLine.attr('x1', xScale(month)).attr('x2', xScale(month));
        
        // Build tooltip content
        let tooltipHtml = `<div style="font-weight: 600; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd;">${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} 2024</div>`;
        
        // If a jurisdiction is isolated, only show that one (applies to touch events too)
        const jurisdictionsToShow = isolatedJurisdiction ? [isolatedJurisdiction] : selected;
        
        // Calculate min/max for isolated jurisdiction if applicable (for touch events)
        let minValueTouch = null, maxValueTouch = null;
        if (isolatedJurisdiction) {
          const isolatedDataTouch = dataByJurisdictionMap[isolatedJurisdiction] || [];
          const valuesTouch = isolatedDataTouch.map(d => d.Sum_FINES).filter(v => v != null);
          if (valuesTouch.length > 0) {
            minValueTouch = Math.min(...valuesTouch);
            maxValueTouch = Math.max(...valuesTouch);
          }
        }
        
        // Get data for this month for the jurisdictions to show
        const monthData = jurisdictionsToShow.map(jurisdiction => {
          const jurData = dataByJurisdictionMap[jurisdiction] || [];
          const monthEntry = jurData.find(d => d.Month === month);
          return {
            jurisdiction,
            value: monthEntry ? monthEntry.Sum_FINES : null
          };
        }).filter(d => d.value !== null)
          .sort((a, b) => b.value - a.value);
        
        monthData.forEach(d => {
          tooltipHtml += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <div style="width: 12px; height: 12px; background: ${getCurrentColorScale()(d.jurisdiction)}; border-radius: 2px;"></div>
            <span style="flex: 1; font-weight: 500;">${d.jurisdiction}</span>
            <span style="font-weight: 600;">${d.value.toLocaleString()}</span>
          </div>`;
        });
        
        tooltip
          .style('opacity', 1)
          .html(tooltipHtml)
          .style('left', (touch.pageX + 15) + 'px')
          .style('top', (touch.pageY - 10) + 'px');
      });
    
    // Store references for later updates
    window.rq1AllLines = linesGroup.selectAll('.line');
    
    // Update MIN/MAX bubbles if a jurisdiction is isolated
    if (window.rq1UpdateMinMaxBubbles) {
      window.rq1UpdateMinMaxBubbles();
    }
  }
  
  // Helper function to update line styles
  function updateLineStyles() {
    if (window.rq1AllLines) {
      window.rq1AllLines
        .transition()
        .duration(200)
        .style('opacity', d => {
          if (isolatedJurisdiction) {
            return d.jurisdiction === isolatedJurisdiction ? 1 : 0.1;
          }
          if (hoveredJurisdiction) {
            return d.jurisdiction === hoveredJurisdiction ? 1 : 0.15;
          }
          return 1;
        })
        .attr('stroke-width', d => {
          if (isolatedJurisdiction) {
            return d.jurisdiction === isolatedJurisdiction ? 3.5 : 2.5;
          }
          if (hoveredJurisdiction) {
            return d.jurisdiction === hoveredJurisdiction ? 3.5 : 2.5;
          }
          return 2.5;
        });
    }
  }
  
  // Helper function to update legend styles
  function updateLegendStyles() {
    if (window.rq1AllLegendItems) {
      window.rq1AllLegendItems
        .transition()
        .duration(200)
        .style('opacity', d => {
          if (isolatedJurisdiction) {
            return d === isolatedJurisdiction ? 1 : 0.4;
          }
          if (hoveredJurisdiction) {
            return d === hoveredJurisdiction ? 1 : 0.6;
          }
          return 1;
        })
        .selectAll('rect')
        .attr('stroke', d => {
          if (isolatedJurisdiction === d || hoveredJurisdiction === d) {
            return '#333';
          }
          return 'none';
        })
        .attr('stroke-width', 2);
    }
  }
  
  // Helper function to update dots visibility
  function updateDotsVisibility() {
    if (window.rq1AllCircles) {
      window.rq1AllCircles
        .transition()
        .duration(200)
        .style('opacity', d => {
          if (isolatedJurisdiction) {
            return d.jurisdiction === isolatedJurisdiction ? 1 : 0.1;
          }
          if (hoveredJurisdiction) {
            return d.jurisdiction === hoveredJurisdiction ? 1 : 0.15;
          }
          return 1;
        });
    }
  }
  
  // Click anywhere to clear isolation and bubbles
  svg.on('click', function(event) {
    if (event.target === this || event.target.classList.contains('overlay')) {
      if (isolatedJurisdiction) {
        isolatedJurisdiction = null;
        updateLineStyles();
        updateLegendStyles();
        updateDotsVisibility();
        if (window.rq1UpdateMinMaxBubbles) {
          window.rq1UpdateMinMaxBubbles();
        }
      }
    }
  });
  
  // Event handlers for checkboxes
  selectAllCheckbox.on('change', function() {
    const isChecked = this.checked;
    jurisdictions.forEach(j => {
      checkboxes[j].checked = isChecked;
    });
    dropdownButton.html(`<span>${getSelectedText()}</span><span style="font-size: 0.7em;">${isDropdownOpen ? '▲' : '▼'}</span>`);
    updateChart();
  });
  
  jurisdictions.forEach(jurisdiction => {
    d3.select(checkboxes[jurisdiction]).on('change', function() {
      // Update "Select All" checkbox state
      const allChecked = jurisdictions.every(j => checkboxes[j].checked);
      selectAllCheckbox.node().checked = allChecked;
      dropdownButton.html(`<span>${getSelectedText()}</span><span style="font-size: 0.7em;">${isDropdownOpen ? '▲' : '▼'}</span>`);
      // Clear isolation when toggling checkboxes
      isolatedJurisdiction = null;
      hoveredJurisdiction = null;
      updateChart();
    });
  });
  
  // Initial render
  updateChart();
  
  // Responsive resize handler with debouncing
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      const newIsMobile = window.innerWidth <= 768;
      const newIsLandscape = window.innerWidth > window.innerHeight;
      
      // Get new container width
      const newContainerWidth = chartContainer.node().getBoundingClientRect().width;
      
      // Update SVG width to match container dynamically
      if (newContainerWidth > 0 && Math.abs(newContainerWidth - containerWidth) > 20) {
        containerWidth = newContainerWidth;
        const newWidth = newContainerWidth - margin.left - margin.right;
        
        // Update SVG dimensions
        svg.attr('width', newContainerWidth);
        
        // Recalculate x-scale range
        xScale.range([0, newWidth]);
        
        // Update overlay width
        overlay.attr('width', newWidth);
        
        // Update legend position
        legend.attr('transform', `translate(${newWidth + margin.left + 20}, ${margin.top})`);
        
        // Update axis label position
        svg.select('.axis-label').filter(function() {
          return d3.select(this).text() === 'Month';
        }).attr('x', margin.left + newWidth / 2);
        
        // Redraw everything with new dimensions
        updateChart();
      }
      
      // Reload page if switching between mobile/desktop or portrait/landscape
      if (newIsMobile !== isMobile || 
          (newIsMobile && newIsLandscape !== isLandscape)) {
        location.reload();
      }
    }, 150);
  });
  
  // Handle orientation change
  window.addEventListener('orientationchange', function() {
    setTimeout(function() {
      location.reload();
    }, 100);
  });
  
}).catch(err => {
  console.error('Failed to load Q1 data:', err);
  d3.select('#rq1-chart').append('div')
    .style('padding', '20px')
    .style('text-align', 'center')
    .style('color', '#d00')
    .html(`<strong>Error loading data:</strong> ${err.message}`);
});

})();

