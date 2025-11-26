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
  controlsDiv.attr('class', 'rq1-controls');
  
  // Create checkbox group
  const checkboxGroup = controlsDiv.append('div').attr('class', 'checkbox-group');
  
  // Add "Select All" checkbox
  const selectAllLabel = checkboxGroup.append('label')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '6px')
    .style('cursor', 'pointer')
    .style('font-weight', '600')
    .style('padding', '8px 12px')
    .style('background', '#f0f0f0')
    .style('border-radius', '4px');
  
  const selectAllCheckbox = selectAllLabel.append('input')
    .attr('type', 'checkbox')
    .attr('id', 'select-all')
    .attr('checked', true)
    .style('cursor', 'pointer');
  
  selectAllLabel.append('span').text('Select All');
  
  // Add individual jurisdiction checkboxes
  const checkboxes = {};
  jurisdictions.forEach(jurisdiction => {
    const label = checkboxGroup.append('label')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px')
      .style('cursor', 'pointer')
      .style('padding', '6px 10px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('transition', 'all 0.2s');
    
    const checkbox = label.append('input')
      .attr('type', 'checkbox')
      .attr('class', 'jurisdiction-checkbox')
      .attr('value', jurisdiction)
      .attr('checked', true)
      .style('cursor', 'pointer');
    
    label.append('span').text(jurisdiction);
    
    checkboxes[jurisdiction] = checkbox.node();
  });
  
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
    .attr('transform', `translate(${width + margin.left + 10}, ${margin.top})`);
  
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
    
    // Exit
    lines.exit()
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
      .transition()
      .duration(500)
      .attr('stroke', d => colorScale(d.jurisdiction))
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
        if (isolatedJurisdiction) {
          return d.jurisdiction === isolatedJurisdiction ? 3.5 : 2.5;
        }
        if (hoveredJurisdiction) {
          return d.jurisdiction === hoveredJurisdiction ? 3.5 : 2.5;
        }
        return 2.5;
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
      });
    
    // Update dots
    const dots = dotsGroup.selectAll('.dot-group')
      .data(dataByJurisdiction, d => d.jurisdiction);
    
    // Exit
    dots.exit()
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
    
    dotsUpdate.transition()
      .duration(500)
      .style('opacity', 1);
    
    // Bind dots to individual data points
    const circles = dotsUpdate.selectAll('circle')
      .data(d => d.values.map(v => ({ ...v, jurisdiction: d.jurisdiction })), d => `${d.jurisdiction}-${d.Month}`);
    
    circles.exit().remove();
    
    const circlesEnter = circles.enter()
      .append('circle')
      .attr('r', 4)
      .attr('fill', d => colorScale(d.jurisdiction))
      .style('cursor', 'pointer')
      .style('opacity', 0);
    
    const allCircles = circlesEnter.merge(circles);
    
    allCircles
      .transition()
      .duration(500)
      .attr('cx', d => xScale(d.Month))
      .attr('cy', d => yScale(d.Sum_FINES))
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
    
    // Update legend
    const legendItems = legend.selectAll('.legend-item')
      .data(selected, d => d);
    
    // Exit
    legendItems.exit().remove();
    
    // Enter
    const legendEnter = legendItems.enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 22})`);
    
    legendEnter.append('rect')
      .attr('width', 16)
      .attr('height', 16)
      .attr('fill', d => colorScale(d))
      .attr('rx', 2);
    
    legendEnter.append('text')
      .attr('x', 22)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(d => d);
    
    // Update positions and add interactivity
    const allLegendItems = legendEnter.merge(legendItems);
    
    allLegendItems
      .transition()
      .duration(500)
      .attr('transform', (d, i) => `translate(0, ${i * 22})`);
    
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
        
        // Get data for this month for all selected jurisdictions
        const monthData = selected.map(jurisdiction => {
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
            <div style="width: 12px; height: 12px; background: ${colorScale(d.jurisdiction)}; border-radius: 2px;"></div>
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
        
        // Get data for this month for all selected jurisdictions
        const monthData = selected.map(jurisdiction => {
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
            <div style="width: 12px; height: 12px; background: ${colorScale(d.jurisdiction)}; border-radius: 2px;"></div>
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
  
  // Click anywhere to clear isolation
  svg.on('click', function(event) {
    if (event.target === this || event.target.classList.contains('overlay')) {
      if (isolatedJurisdiction) {
        isolatedJurisdiction = null;
        updateLineStyles();
        updateLegendStyles();
        updateDotsVisibility();
      }
    }
  });
  
  // Event handlers for checkboxes
  selectAllCheckbox.on('change', function() {
    const isChecked = this.checked;
    jurisdictions.forEach(j => {
      checkboxes[j].checked = isChecked;
    });
    updateChart();
  });
  
  jurisdictions.forEach(jurisdiction => {
    d3.select(checkboxes[jurisdiction]).on('change', function() {
      // Update "Select All" checkbox state
      const allChecked = jurisdictions.every(j => checkboxes[j].checked);
      selectAllCheckbox.node().checked = allChecked;
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
        legend.attr('transform', `translate(${newWidth + margin.left + 10}, ${margin.top})`);
        
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

