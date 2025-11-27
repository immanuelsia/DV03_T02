/**
 * RQ2: The Automation Paradox
 * 
 * Research Question: Does increasing reliance on automated enforcement lead to a drop in serious legal charges?
 * 
 * Dataset: state_efficiency_index.csv (derived from Q2.csv)
 * Schema:
 *   - JURISDICTION (string): State abbreviation (e.g., "TAS", "ACT", "VIC", "NSW")
 *   - Automation_Score (number): Percentage of fines issued by cameras (0-100)
 *   - Severity_Score (number): Serious charges per 10,000 fines (0-35)
 *   - Total_Fines_Calc (number): Total volume of fines in that jurisdiction
 * 
 * How Data Supports Question:
 *   Compares jurisdictions by degree of automation vs severity rate while controlling
 *   for total fines volume. Visual encoding reveals trade-off between high-frequency/
 *   low-severity enforcement (camera-heavy) and low-frequency/high-severity enforcement
 *   (police-heavy).
 */

(function() {
  'use strict';

  // Fallback data if CSV fails to load
  const fallbackData = [
    { JURISDICTION: "TAS", Automation_Score: 45, Severity_Score: 28, Total_Fines_Calc: 25000 },
    { JURISDICTION: "ACT", Automation_Score: 55, Severity_Score: 22, Total_Fines_Calc: 35000 },
    { JURISDICTION: "NT", Automation_Score: 48, Severity_Score: 30, Total_Fines_Calc: 18000 },
    { JURISDICTION: "SA", Automation_Score: 65, Severity_Score: 18, Total_Fines_Calc: 45000 },
    { JURISDICTION: "QLD", Automation_Score: 75, Severity_Score: 12, Total_Fines_Calc: 120000 },
    { JURISDICTION: "WA", Automation_Score: 70, Severity_Score: 15, Total_Fines_Calc: 85000 },
    { JURISDICTION: "VIC", Automation_Score: 88, Severity_Score: 8, Total_Fines_Calc: 180000 },
    { JURISDICTION: "NSW", Automation_Score: 92, Severity_Score: 5, Total_Fines_Calc: 220000 }
  ];

  /**
   * Render the Automation Paradox bubble chart
   * @param {string} containerSelector - CSS selector for chart container
   * @param {string} csvPath - Path to CSV data file
   */
  function renderAutomationParadoxChart(containerSelector, csvPath = 'data/state_efficiency_index.csv') {
    const container = d3.select(containerSelector);
    
    // Clear previous content
    container.selectAll('*').remove();
    
    // Chart dimensions with margin convention
    const margin = { top: 60, right: 180, bottom: 70, left: 70 };
    const containerWidth = container.node().getBoundingClientRect().width || 900;
    const width = containerWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG with viewBox for responsiveness
    const svg = container.append('svg')
      .attr('viewBox', `0 0 ${containerWidth} ${500}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto');
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Toggle state for color-blind mode (at container level)
    let isColorBlindMode = false;
    
    // Add color-blind toggle button
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
    
    // Create tooltip
    let tooltip = d3.select('body').select('.rq2-automation-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div')
        .attr('class', 'rq2-automation-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('padding', '12px 16px')
        .style('font-size', '13px')
        .style('line-height', '1.6')
        .style('background', 'rgba(0, 0, 0, 0.85)')
        .style('color', '#fff')
        .style('border-radius', '6px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
        .style('opacity', 0)
        .style('transition', 'opacity 0.2s');
    }
    
    // Load and process data
    d3.csv(csvPath, d => ({
      JURISDICTION: d.JURISDICTION,
      Automation_Score: +d.Automation_Score,
      Severity_Score: +d.Severity_Score,
      Total_Fines_Calc: +d.Total_Fines_Calc
    }))
    .then(data => {
      if (!data || data.length === 0) {
        console.warn('CSV empty or failed, using fallback data');
        return fallbackData;
      }
      return data;
    })
    .catch(err => {
      console.warn('Failed to load CSV:', err.message, '- using fallback data');
      return fallbackData;
    })
    .then(data => {
      console.log('RQ2 data loaded:', data.length, 'jurisdictions');
      
      // Define scales
      const xScale = d3.scaleLinear()
        .domain([40, 100])
        .range([0, width]);
      
      const yScale = d3.scaleLinear()
        .domain([0, 35])
        .range([height, 0]);
      
      const rScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.Total_Fines_Calc)])
        .range([8, 50]);
      
      const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(data.map(d => d.JURISDICTION));
      
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
        .domain(data.map(d => d.JURISDICTION));
      
      // Function to get current color scale (uses container-level isColorBlindMode)
      function getCurrentColorScale() {
        return isColorBlindMode ? colorBlindScale : colorScale;
      }
      
      // Calculate midpoints for zones
      const midAutomation = 70;
      const midSeverity = 17.5;
      
      // Add background zones
      const zonesGroup = g.append('g').attr('class', 'zones');
      
      // High Intervention Zone (top-left)
      const highInterventionZone = zonesGroup.append('rect')
        .attr('class', 'high-intervention-zone')
        .attr('x', xScale(40))
        .attr('y', yScale(35))
        .attr('width', xScale(midAutomation) - xScale(40))
        .attr('height', yScale(midSeverity) - yScale(35))
        .attr('fill', '#ff6b6b')
        .attr('opacity', 0.08);
      
      const highInterventionText = zonesGroup.append('text')
        .attr('class', 'high-intervention-text')
        .attr('x', xScale(40) + (xScale(midAutomation) - xScale(40)) / 2)
        .attr('y', yScale(35) + 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#d63031')
        .attr('opacity', 0.6)
        .text('High Intervention Zone');
      
      // Machine Zone (bottom-right)
      const machineZone = zonesGroup.append('rect')
        .attr('class', 'machine-zone')
        .attr('x', xScale(midAutomation))
        .attr('y', yScale(midSeverity))
        .attr('width', xScale(100) - xScale(midAutomation))
        .attr('height', yScale(0) - yScale(midSeverity))
        .attr('fill', '#4834d4')
        .attr('opacity', 0.08);
      
      const machineZoneText = zonesGroup.append('text')
        .attr('class', 'machine-zone-text')
        .attr('x', xScale(midAutomation) + (xScale(100) - xScale(midAutomation)) / 2)
        .attr('y', yScale(0) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#4834d4')
        .attr('opacity', 0.6)
        .text('Machine Zone');
      
      // Add diagonal guideline
      const guideline = g.append('line')
        .attr('x1', xScale(45))
        .attr('y1', yScale(32))
        .attr('x2', xScale(95))
        .attr('y2', yScale(3))
        .attr('stroke', '#95a5a6')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.4);
      
      // Add gridlines
      const gridlinesX = g.append('g')
        .attr('class', 'gridlines-x')
        .call(d3.axisBottom(xScale)
          .tickSize(height)
          .tickFormat(''))
        .style('opacity', 0.1);
      
      gridlinesX.selectAll('line')
        .attr('stroke', '#999');
      
      const gridlinesY = g.append('g')
        .attr('class', 'gridlines-y')
        .call(d3.axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(''))
        .style('opacity', 0.1);
      
      gridlinesY.selectAll('line')
        .attr('stroke', '#999');
      
      // Add axes
      const xAxis = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
          .tickFormat(d => d + '%'));
      
      const yAxis = g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));
      
      // Store tick positions for later highlighting
      const xTicks = xScale.ticks();
      const yTicks = yScale.ticks();
      
      // Add axis labels
      g.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Degree of Automation (%)');
      
      g.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Severity (Charges per 10k fines)');
      
      // Add title
      svg.append('text')
        .attr('class', 'chart-title')
        .attr('text-anchor', 'middle')
        .attr('x', containerWidth / 2)
        .attr('y', 30)
        .style('font-size', '18px')
        .style('font-weight', '700')
        .text('The Automation Paradox');
      
      // Add color-blind mode indicator (initially hidden)
      const modeIndicator = svg.append('text')
        .attr('class', 'mode-indicator')
        .attr('text-anchor', 'middle')
        .attr('x', containerWidth / 2)
        .attr('y', 48)
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', '#666')
        .style('opacity', 0)
        .text('Color-Blind Mode Active (Okabe–Ito Palette)');
      
      // Create hover outline circle (hidden initially)
      const hoverCircle = g.append('circle')
        .attr('class', 'hover-outline')
        .attr('fill', 'none')
        .attr('stroke', '#2c3e50')
        .attr('stroke-width', 3)
        .attr('opacity', 0)
        .attr('pointer-events', 'none');
      
      // Create focus elements group (hidden initially)
      const focusGroup = g.append('g')
        .attr('class', 'focus-group')
        .style('opacity', 0)
        .style('pointer-events', 'none');
      
      // Dashed line to X-axis
      const focusLineX = focusGroup.append('line')
        .attr('class', 'focus-line-x')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.8);
      
      // Dashed line to Y-axis
      const focusLineY = focusGroup.append('line')
        .attr('class', 'focus-line-y')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.8);
      
      // Value label on X-axis (only shown if not on existing tick)
      const focusLabelX = focusGroup.append('text')
        .attr('class', 'focus-label-x')
        .attr('text-anchor', 'middle')
        .attr('dy', 25)
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .attr('fill', '#e74c3c');
      
      // Background for X-axis label
      const focusLabelXBg = focusGroup.insert('rect', '.focus-label-x')
        .attr('class', 'focus-label-x-bg')
        .attr('fill', 'white')
        .attr('opacity', 0.9)
        .attr('rx', 4);
      
      // Value label on Y-axis (only shown if not on existing tick)
      const focusLabelY = focusGroup.append('text')
        .attr('class', 'focus-label-y')
        .attr('text-anchor', 'end')
        .attr('dx', -10)
        .attr('dy', 4)
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .attr('fill', '#e74c3c');
      
      // Background for Y-axis label
      const focusLabelYBg = focusGroup.insert('rect', '.focus-label-y')
        .attr('class', 'focus-label-y-bg')
        .attr('fill', 'white')
        .attr('opacity', 0.9)
        .attr('rx', 4);
      
      // Track currently focused bubble
      let focusedBubble = null;
      
      // Add bubbles
      const bubbles = g.selectAll('.bubble')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'bubble')
        .attr('cx', d => xScale(d.Automation_Score))
        .attr('cy', d => yScale(d.Severity_Score))
        .attr('r', d => rScale(d.Total_Fines_Calc))
        .attr('fill', d => getCurrentColorScale()(d.JURISDICTION))
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 1)
        .style('cursor', 'pointer')
        .on('mouseenter', function(event, d) {
          // Don't show hover effects if this bubble is already focused
          if (focusedBubble === d) return;
          
          // Highlight bubble
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 1)
            .attr('stroke-width', 3);
          
          // Show hover outline
          const r = rScale(d.Total_Fines_Calc);
          hoverCircle
            .attr('cx', xScale(d.Automation_Score))
            .attr('cy', yScale(d.Severity_Score))
            .attr('r', r + 4)
            .transition()
            .duration(200)
            .attr('opacity', 0.6);
          
          // Position and show axis indicators
          const cx = xScale(d.Automation_Score);
          const cy = yScale(d.Severity_Score);
          
          // Position focus lines
          focusLineX
            .attr('x1', cx)
            .attr('y1', cy)
            .attr('x2', cx)
            .attr('y2', height);
          
          focusLineY
            .attr('x1', cx)
            .attr('y1', cy)
            .attr('x2', 0)
            .attr('y2', cy);
          
          // Check if values match existing ticks
          const isXOnTick = xTicks.some(tick => Math.abs(tick - d.Automation_Score) < 0.5);
          const isYOnTick = yTicks.some(tick => Math.abs(tick - d.Severity_Score) < 0.5);
          
          if (isXOnTick) {
            xAxis.selectAll('.tick text')
              .filter(function(t) { return Math.abs(t - d.Automation_Score) < 0.5; })
              .style('fill', '#e74c3c')
              .style('font-weight', '700')
              .style('font-size', '14px');
            
            focusLabelX.text('');
            focusLabelXBg.attr('width', 0);
          } else {
            const xLabelText = `${d.Automation_Score.toFixed(1)}%`;
            focusLabelX
              .attr('x', cx)
              .attr('y', height)
              .text(xLabelText);
            
            const xLabelBBox = focusLabelX.node().getBBox();
            focusLabelXBg
              .attr('x', xLabelBBox.x - 6)
              .attr('y', xLabelBBox.y - 2)
              .attr('width', xLabelBBox.width + 12)
              .attr('height', xLabelBBox.height + 4);
          }
          
          if (isYOnTick) {
            yAxis.selectAll('.tick text')
              .filter(function(t) { return Math.abs(t - d.Severity_Score) < 0.5; })
              .style('fill', '#e74c3c')
              .style('font-weight', '700')
              .style('font-size', '14px');
            
            focusLabelY.text('');
            focusLabelYBg.attr('width', 0);
          } else {
            const yLabelText = `${d.Severity_Score.toFixed(1)}`;
            focusLabelY
              .attr('x', 0)
              .attr('y', cy)
              .text(yLabelText);
            
            const yLabelBBox = focusLabelY.node().getBBox();
            focusLabelYBg
              .attr('x', yLabelBBox.x - 6)
              .attr('y', yLabelBBox.y - 2)
              .attr('width', yLabelBBox.width + 12)
              .attr('height', yLabelBBox.height + 4);
          }
          
          // Show focus elements
          focusGroup
            .transition()
            .duration(200)
            .style('opacity', 1);
          
          // Show tooltip
          const tooltipContent = `
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px;">
              ${d.JURISDICTION}
            </div>
            <div style="margin: 4px 0;">
              <span style="opacity: 0.8;">Method:</span> <strong>${d.Automation_Score.toFixed(0)}% automated</strong>
            </div>
            <div style="margin: 4px 0;">
              <span style="opacity: 0.8;">Risk:</span> <strong>${d.Severity_Score.toFixed(1)} charges per 10k</strong>
            </div>
            <div style="margin: 4px 0;">
              <span style="opacity: 0.8;">Volume:</span> <strong>${d.Total_Fines_Calc.toLocaleString()} total fines</strong>
            </div>
          `;
          
          tooltip
            .html(tooltipContent)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .style('opacity', 1);
        })
        .on('mousemove', function(event) {
          tooltip
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseleave', function(event, d) {
          // Don't reset if this bubble is focused
          if (focusedBubble === d) return;
          
          // Reset bubble
          d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', isColorBlindMode ? 0.9 : 0.7)
            .attr('stroke-width', isColorBlindMode ? 2.5 : 2);
          
          // Hide hover outline
          hoverCircle
            .transition()
            .duration(200)
            .attr('opacity', 0);
          
          // Reset axis tick highlights
          xAxis.selectAll('.tick text')
            .transition()
            .duration(200)
            .style('fill', null)
            .style('font-weight', null)
            .style('font-size', null);
          
          yAxis.selectAll('.tick text')
            .transition()
            .duration(200)
            .style('fill', null)
            .style('font-weight', null)
            .style('font-size', null);
          
          // Hide focus elements
          focusGroup
            .transition()
            .duration(200)
            .style('opacity', 0);
          
          // Hide tooltip
          tooltip
            .transition()
            .duration(200)
            .style('opacity', 0);
        })
        .on('click', function(event, d) {
          event.stopPropagation();
          
          // If clicking the same bubble, unfocus
          if (focusedBubble === d) {
            focusedBubble = null;
            
            // Reset all bubbles
            bubbles
              .transition()
              .duration(300)
              .attr('fill-opacity', isColorBlindMode ? 0.9 : 0.7)
              .attr('stroke-width', isColorBlindMode ? 2.5 : 2);
            
            // Hide focus elements
            focusGroup
              .transition()
              .duration(300)
              .style('opacity', 0);
            
            return;
          }
          
          // Set new focused bubble
          focusedBubble = d;
          
          // Dim all bubbles except the focused one
          bubbles
            .transition()
            .duration(300)
            .attr('fill-opacity', b => b === d ? 1 : 0.2)
            .attr('stroke-width', b => b === d ? 4 : isColorBlindMode ? 2.5 : 2);
          
          // Position focus lines
          const cx = xScale(d.Automation_Score);
          const cy = yScale(d.Severity_Score);
          
          // Line to X-axis
          focusLineX
            .attr('x1', cx)
            .attr('y1', cy)
            .attr('x2', cx)
            .attr('y2', height);
          
          // Line to Y-axis
          focusLineY
            .attr('x1', cx)
            .attr('y1', cy)
            .attr('x2', 0)
            .attr('y2', cy);
          
          // Check if X value matches an existing tick (within 0.5 tolerance)
          const isXOnTick = xTicks.some(tick => Math.abs(tick - d.Automation_Score) < 0.5);
          
          // Check if Y value matches an existing tick (within 0.5 tolerance)
          const isYOnTick = yTicks.some(tick => Math.abs(tick - d.Severity_Score) < 0.5);
          
          // Reset all axis tick highlights
          xAxis.selectAll('.tick text')
            .style('fill', null)
            .style('font-weight', null)
            .style('font-size', null);
          
          yAxis.selectAll('.tick text')
            .style('fill', null)
            .style('font-weight', null)
            .style('font-size', null);
          
          if (isXOnTick) {
            // Highlight the existing tick on X-axis
            xAxis.selectAll('.tick text')
              .filter(function(t) { return Math.abs(t - d.Automation_Score) < 0.5; })
              .style('fill', '#e74c3c')
              .style('font-weight', '700')
              .style('font-size', '14px');
            
            // Hide custom label
            focusLabelX.text('');
            focusLabelXBg.attr('width', 0);
          } else {
            // Show custom label
            const xLabelText = `${d.Automation_Score.toFixed(1)}%`;
            focusLabelX
              .attr('x', cx)
              .attr('y', height)
              .text(xLabelText);
            
            // Update X-axis label background
            const xLabelBBox = focusLabelX.node().getBBox();
            focusLabelXBg
              .attr('x', xLabelBBox.x - 6)
              .attr('y', xLabelBBox.y - 2)
              .attr('width', xLabelBBox.width + 12)
              .attr('height', xLabelBBox.height + 4);
          }
          
          if (isYOnTick) {
            // Highlight the existing tick on Y-axis
            yAxis.selectAll('.tick text')
              .filter(function(t) { return Math.abs(t - d.Severity_Score) < 0.5; })
              .style('fill', '#e74c3c')
              .style('font-weight', '700')
              .style('font-size', '14px');
            
            // Hide custom label
            focusLabelY.text('');
            focusLabelYBg.attr('width', 0);
          } else {
            // Show custom label
            const yLabelText = `${d.Severity_Score.toFixed(1)}`;
            focusLabelY
              .attr('x', 0)
              .attr('y', cy)
              .text(yLabelText);
            
            // Update Y-axis label background
            const yLabelBBox = focusLabelY.node().getBBox();
            focusLabelYBg
              .attr('x', yLabelBBox.x - 6)
              .attr('y', yLabelBBox.y - 2)
              .attr('width', yLabelBBox.width + 12)
              .attr('height', yLabelBBox.height + 4);
          }
          
          // Show focus elements
          focusGroup
            .transition()
            .duration(300)
            .style('opacity', 1);
        });
      
      // Prepare label data with initial positions
      const labelData = data.map(d => ({
        ...d,
        x: xScale(d.Automation_Score),
        y: yScale(d.Severity_Score),
        r: rScale(d.Total_Fines_Calc)
      }));
      
      // Create force simulation for label positioning
      const simulation = d3.forceSimulation(labelData)
        .force('x', d3.forceX(d => d.x).strength(0.5))
        .force('y', d3.forceY(d => d.y).strength(0.5))
        .force('collide', d3.forceCollide().radius(d => d.r + 15))
        .stop();
      
      // Run simulation to static layout
      for (let i = 0; i < 120; i++) {
        simulation.tick();
      }
      
      // Add labels
      const labels = g.selectAll('.jurisdiction-label')
        .data(labelData)
        .enter()
        .append('text')
        .attr('class', 'jurisdiction-label')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', '#2c3e50')
        .attr('pointer-events', 'none')
        .style('text-shadow', '0 0 3px white, 0 0 3px white, 0 0 3px white')
        .text(d => d.JURISDICTION);
      
      // Click anywhere in SVG to unfocus (except on bubbles)
      svg.on('click', function(event) {
        // Always clear focus when clicking the SVG background
        focusedBubble = null;
        
        // Reset all bubbles
        bubbles
          .transition()
          .duration(300)
          .attr('fill-opacity', isColorBlindMode ? 0.9 : 0.7)
          .attr('stroke-width', isColorBlindMode ? 2.5 : 2);
        
        // Reset axis tick highlights
        xAxis.selectAll('.tick text')
          .transition()
          .duration(300)
          .style('fill', null)
          .style('font-weight', null)
          .style('font-size', null);
        
        yAxis.selectAll('.tick text')
          .transition()
          .duration(300)
          .style('fill', null)
          .style('font-weight', null)
          .style('font-size', null);
        
        // Hide focus elements
        focusGroup
          .transition()
          .duration(300)
          .style('opacity', 0);
      });
      
      // Also allow clicking outside the chart container to clear focus
      d3.select('body').on('click.rq2-clear', function(event) {
        const chartContainer = container.node();
        if (chartContainer && !chartContainer.contains(event.target) && focusedBubble) {
          focusedBubble = null;
          
          // Reset all bubbles
          bubbles
            .transition()
            .duration(300)
            .attr('fill-opacity', isColorBlindMode ? 0.9 : 0.7)
            .attr('stroke-width', isColorBlindMode ? 2.5 : 2);
          
          // Reset axis tick highlights
          xAxis.selectAll('.tick text')
            .transition()
            .duration(300)
            .style('fill', null)
            .style('font-weight', null)
            .style('font-size', null);
          
          yAxis.selectAll('.tick text')
            .transition()
            .duration(300)
            .style('fill', null)
            .style('font-weight', null)
            .style('font-size', null);
          
          // Hide focus elements
          focusGroup
            .transition()
            .duration(300)
            .style('opacity', 0);
        }
      });
      
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
      
      // Set up toggle button click handler (now that data and scales are loaded)
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
        
        // Show/hide mode indicator label
        modeIndicator
          .transition()
          .duration(300)
          .style('opacity', isColorBlindMode ? 1 : 0);
        
        // Update background zone colors
        highInterventionZone
          .transition()
          .duration(500)
          .attr('fill', isColorBlindMode ? '#F0E442' : '#ff6b6b')
          .attr('opacity', isColorBlindMode ? 0.12 : 0.08);
        
        highInterventionText
          .transition()
          .duration(500)
          .attr('fill', isColorBlindMode ? '#9a8500' : '#d63031');
        
        machineZone
          .transition()
          .duration(500)
          .attr('fill', isColorBlindMode ? '#009E73' : '#4834d4')
          .attr('opacity', isColorBlindMode ? 0.12 : 0.08);
        
        machineZoneText
          .transition()
          .duration(500)
          .attr('fill', isColorBlindMode ? '#006d50' : '#4834d4');
        
        // Update all bubble colors and styling
        bubbles
          .transition()
          .duration(500)
          .attr('fill', d => getCurrentColorScale()(d.JURISDICTION))
          .attr('fill-opacity', isColorBlindMode ? 0.9 : 0.7)
          .attr('stroke', isColorBlindMode ? '#000' : '#fff')
          .attr('stroke-width', isColorBlindMode ? 2.5 : 2)
          .attr('stroke-opacity', isColorBlindMode ? 1 : 1);
      });
      
      console.log('RQ2: Automation Paradox chart rendered successfully');
    })
    .catch(err => {
      console.error('Fatal error rendering RQ2 chart:', err);
      container.append('div')
        .style('padding', '40px')
        .style('text-align', 'center')
        .style('color', '#e74c3c')
        .html(`<strong>Error:</strong> Failed to render chart<br><small>${err.message}</small>`);
    });
  }

  // Auto-render if container exists
  if (document.querySelector('#rq2-chart')) {
    renderAutomationParadoxChart('#rq2-chart');
  }

  // Expose function globally for external use
  window.renderAutomationParadoxChart = renderAutomationParadoxChart;

})();

