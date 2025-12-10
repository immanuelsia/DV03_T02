// RQ5: Age Groups Analysis - Modern Visualization with Multiple Views
// Data: data/q5.csv - Speeding offences by age group (2010-2024)

let rq5Data = [];
let currentView = 'bubble'; // 'bubble' or 'bar'
let isColorblind = false;

// Color schemes
const normalColors = {
  'Underage': '#10b981',
  '17-25': '#3b82f6',
  '26-39': '#f59e0b',
  '40-64': '#ef4444',
  '65+': '#8b5cf6',
  'All ages': '#6b7280'
};

const colorblindColors = {
  'Underage': '#0173b2',
  '17-25': '#de8f05',
  '26-39': '#029e73',
  '40-64': '#cc78bc',
  '65+': '#ca9161',
  'All ages': '#949494'
};

// Load and process data
async function loadRQ5Data() {
    try {
    const data = await d3.csv('data/q5.csv');
    
    rq5Data = data
      .filter(d => d.AGE_GROUP && d.AGE_GROUP !== 'All ages') // Exclude "All ages"
      .map(d => ({
        year: +d.YEAR,
        jurisdiction: d.JURISDICTION,
        ageGroup: d.AGE_GROUP === '0-16' ? 'Underage' : (d.AGE_GROUP === '65 and over' ? '65+' : d.AGE_GROUP),
        fines: +d['Sum(FINES)'] || 0,
        licenceHolders: +d.Licence_Holders || 0,
        ratePerTenK: +d.Infractions_per_10000 || 0
      }))
      .filter(d => d.licenceHolders > 0); // Only include rows with license holder data
        
        console.log('Loaded RQ5 data:', rq5Data.length, 'rows');
    console.log('Years:', [...new Set(rq5Data.map(d => d.year))].sort());
    console.log('Age groups:', [...new Set(rq5Data.map(d => d.ageGroup))]);
    
    initRQ5();
    renderVisualization();
        
    } catch (error) {
        console.error('Error loading RQ5 data:', error);
    d3.select('#rq5-chart').selectAll('*:not(#colorblind-toggle)').remove();
    d3.select('#rq5-chart')
      .append('p')
      .style('text-align', 'center')
      .style('padding', '50px')
      .style('color', '#ef4444')
      .text(`Error loading data: ${error.message}`);
  }
}

function initRQ5() {
  // View toggle buttons
  document.getElementById('view-bubble').addEventListener('click', () => {
    currentView = 'bubble';
    document.querySelectorAll('.view-icon-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('view-bubble').classList.add('active');
    // Enable year dropdown for bubble chart
    document.getElementById('rq5-year').disabled = false;
    document.getElementById('rq5-year').style.opacity = '1';
    document.getElementById('rq5-year').style.cursor = 'pointer';
    renderVisualization();
  });
  
  document.getElementById('view-line').addEventListener('click', () => {
    currentView = 'bar';
    document.querySelectorAll('.view-icon-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('view-line').classList.add('active');
    // Disable year dropdown for bar chart (shows all years)
    document.getElementById('rq5-year').disabled = true;
    document.getElementById('rq5-year').style.opacity = '0.5';
    document.getElementById('rq5-year').style.cursor = 'not-allowed';
    renderVisualization();
  });
  
  // Colorblind toggle
  document.getElementById('colorblind-toggle').addEventListener('click', (e) => {
    isColorblind = !isColorblind;
    e.currentTarget.classList.toggle('active', isColorblind);
    renderVisualization();
  });
  
  // Year filter (for bubble chart)
    const yearSelect = document.getElementById('rq5-year');
  const years = [...new Set(rq5Data.map(d => d.year))].sort((a, b) => b - a);
  yearSelect.innerHTML = '<option value="all">All Years (Average)</option>';
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
  yearSelect.value = '2024'; // Default to most recent year
  
  yearSelect.addEventListener('change', () => {
    if (currentView === 'bubble') {
      renderVisualization();
    }
  });
  
  // Jurisdiction filter
  const jurisSelect = document.getElementById('rq5-jurisdiction');
  const jurisdictions = [...new Set(rq5Data.map(d => d.jurisdiction))].sort();
  jurisSelect.innerHTML = '<option value="all">All Jurisdictions</option>';
  jurisdictions.forEach(j => {
    jurisSelect.innerHTML += `<option value="${j}">${j}</option>`;
  });
  
  jurisSelect.addEventListener('change', () => {
    renderVisualization();
  });
  
  // Age group filter
  const ageFilter = document.getElementById('rq5-age-filter');
  if (ageFilter) {
    ageFilter.addEventListener('change', () => {
      renderVisualization();
    });
  }
  
  // Reset filters button
  const resetBtn = document.getElementById('rq5-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      yearSelect.value = '2024';
      jurisSelect.value = 'all';
      if (ageFilter) ageFilter.value = 'all';
      
      // Reset to bubble view
      currentView = 'bubble';
      document.querySelectorAll('.view-icon-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById('view-bubble').classList.add('active');
      yearSelect.disabled = false;
      yearSelect.style.opacity = '1';
      yearSelect.style.cursor = 'pointer';
      
      // Reset colorblind mode
      isColorblind = false;
      document.getElementById('colorblind-toggle').classList.remove('active');
      
      renderVisualization();
    });
  }
}

function getColors() {
  return isColorblind ? colorblindColors : normalColors;
}

function filterData() {
  const year = document.getElementById('rq5-year').value;
  const jurisdiction = document.getElementById('rq5-jurisdiction').value;
  const ageFilter = document.getElementById('rq5-age-filter');
  const ageGroup = ageFilter ? ageFilter.value : 'all';
  
  let filtered = rq5Data;
  
  if (year !== 'all') {
    filtered = filtered.filter(d => d.year === +year);
  }
  
  if (jurisdiction !== 'all') {
    filtered = filtered.filter(d => d.jurisdiction === jurisdiction);
  }
  
  // Filter by age group category
  if (ageGroup !== 'all') {
    const ageGroupMap = {
      'young': ['Underage', '17-25'],
      'adult': ['26-39', '40-64'],
      'senior': ['65+']
    };
    const targetGroups = ageGroupMap[ageGroup] || [];
    filtered = filtered.filter(d => targetGroups.includes(d.ageGroup));
  }
  
  return filtered;
}

function aggregateByAgeGroup(data) {
  const ageGroupOrder = ['Underage', '17-25', '26-39', '40-64', '65+'];
  const groups = {};
  
  data.forEach(d => {
    if (!groups[d.ageGroup]) {
      groups[d.ageGroup] = {
        ageGroup: d.ageGroup,
        totalFines: 0,
                totalLicenceHolders: 0,
                count: 0
            };
        }
    groups[d.ageGroup].totalFines += d.fines;
    groups[d.ageGroup].totalLicenceHolders += d.licenceHolders;
    groups[d.ageGroup].count++;
  });
  
  return ageGroupOrder
    .filter(ag => groups[ag])
    .map(ag => ({
      ageGroup: ag,
      totalFines: groups[ag].totalFines,
      totalLicenceHolders: groups[ag].totalLicenceHolders,
      ratePerTenK: (groups[ag].totalFines / groups[ag].totalLicenceHolders) * 10000,
      count: groups[ag].count
    }));
}

function renderVisualization() {
  if (currentView === 'bubble') {
    renderBubbleChart();
  } else {
    renderBarChart();
  }
}

function renderBubbleChart() {
    const data = filterData();
  const aggregated = aggregateByAgeGroup(data);
  
  if (aggregated.length === 0) {
    d3.select('#rq5-chart').selectAll('*:not(#colorblind-toggle)').remove();
    d3.select('#rq5-chart')
      .append('p')
      .style('text-align', 'center')
      .style('padding', '50px')
      .style('color', '#6b7280')
      .text('No data available for selected filters');
        return;
    }
    
  // Clear previous chart (but keep the colorblind button)
  d3.select('#rq5-chart').selectAll('*:not(#colorblind-toggle)').remove();
  
  // Dimensions
  const container = document.getElementById('rq5-chart');
  const containerWidth = container.clientWidth || 1000;
  const margin = { top: 80, right: 60, bottom: 100, left: 100 };
  const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    // Create SVG
  const svg = d3.select('#rq5-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
  const colors = getColors();
  const ageGroupOrder = ['Underage', '17-25', '26-39', '40-64', '65+'];
  
  // Scales
    const xScale = d3.scalePoint()
        .domain(ageGroupOrder)
        .range([0, width])
        .padding(0.5);
    
  const yMax = d3.max(aggregated, d => d.ratePerTenK) * 1.2;
    const yScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0])
    .nice();
    
    const sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(aggregated, d => d.totalFines)])
    .range([20, 80]);
  
  // Axes
  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style('font-size', '14px')
    .style('font-weight', '600');
  
  xAxis.selectAll('text')
    .style('fill', '#374151');
  
  const yAxis = svg.append('g')
    .call(d3.axisLeft(yScale).ticks(8))
    .style('font-size', '13px')
    .style('font-weight', '600');
  
  yAxis.selectAll('text')
    .style('fill', '#374151');
  
  // Axis labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 60)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#1f2937')
    .text('Age Group');
  
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -65)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#1f2937')
    .text('Infractions per 10,000 License Holders');
  
  // Title
  const year = document.getElementById('rq5-year').value;
  const jurisdiction = document.getElementById('rq5-jurisdiction').value;
  const titleText = year === 'all' 
    ? 'Average Across All Years (2010-2024)'
    : `Year ${year}`;
  const subtitleText = jurisdiction === 'all' 
    ? 'All Jurisdictions'
    : jurisdiction;
  
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -50)
    .attr('text-anchor', 'middle')
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .style('fill', '#111827')
    .text(`Speeding Offences by Age Group: ${titleText}`);
  
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -25)
    .attr('text-anchor', 'middle')
    .style('font-size', '15px')
    .style('fill', '#6b7280')
    .text(subtitleText);
  
  // Tooltip - Remove existing and create new
  d3.selectAll('.rq5-tooltip').remove();
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'rq5-tooltip')
    .style('position', 'fixed')
    .style('display', 'none')
    .style('background', 'rgba(0, 0, 0, 0.92)')
    .style('color', '#fff')
    .style('padding', '12px 16px')
    .style('border-radius', '8px')
    .style('font-size', '13px')
    .style('pointer-events', 'none')
    .style('z-index', '99999')
    .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.4)')
    .style('line-height', '1.7')
    .style('max-width', '280px');
  
  // Bubbles
    const bubbles = svg.selectAll('.bubble')
    .data(aggregated)
        .enter()
        .append('g')
        .attr('class', 'bubble');
    
    bubbles.append('circle')
        .attr('cx', d => xScale(d.ageGroup))
        .attr('cy', d => yScale(d.ratePerTenK))
        .attr('r', 0)
    .attr('fill', d => colors[d.ageGroup])
    .attr('opacity', 0.75)
        .attr('stroke', '#fff')
    .attr('stroke-width', 3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1)
        .attr('stroke-width', 4);
            
      tooltip
                .html(`
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: ${colors[d.ageGroup]}">
            ${d.ageGroup}
          </div>
          <div><strong>Rate:</strong> ${d.ratePerTenK.toFixed(1)} per 10k license holders</div>
          <div><strong>Total Infractions:</strong> ${d.totalFines.toLocaleString()}</div>
          <div><strong>License Holders:</strong> ${Math.round(d.totalLicenceHolders).toLocaleString()}</div>
          <div style="margin-top: 6px; font-size: 11px; color: #ccc;">Based on ${d.count} data point(s)</div>
        `)
        .style('left', (event.clientX + 15) + 'px')
        .style('top', (event.clientY - 10) + 'px')
        .style('display', 'block');
      
      // Trigger animation on next frame
      setTimeout(() => tooltip.classed('visible', true), 10);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.clientX + 15) + 'px')
        .style('top', (event.clientY - 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
        .attr('opacity', 0.75)
        .attr('stroke-width', 3);
            
      tooltip.classed('visible', false);
      setTimeout(() => tooltip.style('display', 'none'), 100);
        })
        .transition()
    .duration(1000)
    .delay((d, i) => i * 150)
    .ease(d3.easeElasticOut.amplitude(1).period(0.5))
    .attr('r', d => sizeScale(d.totalFines));
  
  // Value labels on bubbles
    bubbles.append('text')
        .attr('x', d => xScale(d.ageGroup))
        .attr('y', d => yScale(d.ratePerTenK))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
    .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0)
    .style('pointer-events', 'none')
        .text(d => Math.round(d.ratePerTenK))
        .transition()
        .duration(800)
    .delay((d, i) => i * 150 + 600)
        .attr('opacity', 1);
    
  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 150}, 20)`);
  
  legend.append('text')
    .attr('x', 0)
    .attr('y', -10)
    .style('font-size', '13px')
    .style('font-weight', 'bold')
    .style('fill', '#374151')
    .text('Bubble Size');
  
  legend.append('text')
    .attr('x', 0)
    .attr('y', 10)
    .style('font-size', '11px')
    .style('fill', '#6b7280')
    .text('= Total Infractions');
}

function renderBarChart() {
  const jurisdiction = document.getElementById('rq5-jurisdiction').value;
  
  let data = rq5Data;
  if (jurisdiction !== 'all') {
    data = data.filter(d => d.jurisdiction === jurisdiction);
  }
  
  // Group by year and age group
  const years = [...new Set(data.map(d => d.year))].sort();
  const ageGroups = ['Underage', '17-25', '26-39', '40-64', '65+'];
  
  // Prepare data for grouped bar chart
  const barData = years.map(year => {
    const yearData = { year };
    ageGroups.forEach(ag => {
      const filtered = data.filter(d => d.year === year && d.ageGroup === ag);
      if (filtered.length > 0) {
        const totalFines = d3.sum(filtered, d => d.fines);
        const totalLicence = d3.sum(filtered, d => d.licenceHolders);
        yearData[ag] = totalLicence > 0 ? (totalFines / totalLicence) * 10000 : 0;
      } else {
        yearData[ag] = 0;
      }
    });
    return yearData;
  });
  
  if (barData.every(d => ageGroups.every(ag => d[ag] === 0))) {
    d3.select('#rq5-chart').selectAll('*:not(#colorblind-toggle)').remove();
    d3.select('#rq5-chart')
      .append('p')
      .style('text-align', 'center')
      .style('padding', '50px')
      .style('color', '#6b7280')
      .text('No data available for selected filters');
    return;
  }
  
  // Clear previous chart (but keep the colorblind button)
  d3.select('#rq5-chart').selectAll('*:not(#colorblind-toggle)').remove();
  
  // Dimensions
  const container = document.getElementById('rq5-chart');
  const containerWidth = container.clientWidth || 1000;
  const margin = { top: 80, right: 180, bottom: 80, left: 100 };
  const width = Math.max(700, containerWidth) - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select('#rq5-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const colors = getColors();
  
  // Scales
  const x0 = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.2);
  
  const x1 = d3.scaleBand()
    .domain(ageGroups)
    .range([0, x0.bandwidth()])
    .padding(0.1);
  
  const allValues = barData.flatMap(d => ageGroups.map(ag => d[ag]));
  const yMax = d3.max(allValues) * 1.1;
  const yScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0])
    .nice();
  
  // Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickFormat(d3.format('d')))
    .style('font-size', '12px')
    .style('font-weight', '600')
        .selectAll('text')
    .style('fill', '#374151')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');
  
  svg.append('g')
    .call(d3.axisLeft(yScale).ticks(8))
        .style('font-size', '13px')
        .style('font-weight', '600')
        .selectAll('text')
        .style('fill', '#374151');
    
  // Axis labels
    svg.append('text')
        .attr('x', width / 2)
    .attr('y', height + 70)
        .attr('text-anchor', 'middle')
    .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#1f2937')
    .text('Year');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
    .attr('y', -65)
        .attr('text-anchor', 'middle')
    .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#1f2937')
        .text('Infractions per 10,000 License Holders');
    
  // Title
  const subtitleText = jurisdiction === 'all' 
    ? 'All Jurisdictions'
    : jurisdiction;
    
    svg.append('text')
        .attr('x', width / 2)
    .attr('y', -50)
        .attr('text-anchor', 'middle')
    .style('font-size', '20px')
        .style('font-weight', 'bold')
        .style('fill', '#111827')
    .text('Speeding Offences by Age Group Over Time (2010-2024)');
  
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -25)
    .attr('text-anchor', 'middle')
    .style('font-size', '15px')
    .style('fill', '#6b7280')
    .text(subtitleText);
  
  // Tooltip
  d3.selectAll('.rq5-tooltip').remove();
    const tooltip = d3.select('body')
        .append('div')
    .attr('class', 'rq5-tooltip')
    .style('position', 'fixed')
        .style('display', 'none')
    .style('background', 'rgba(0, 0, 0, 0.92)')
        .style('color', '#fff')
    .style('padding', '12px 16px')
        .style('border-radius', '8px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
    .style('z-index', '99999')
    .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.4)')
    .style('line-height', '1.7')
    .style('max-width', '280px');
  
  // Draw grouped bars
  const barGroups = svg.selectAll('.year-group')
    .data(barData)
    .enter()
    .append('g')
    .attr('class', 'year-group')
    .attr('transform', d => `translate(${x0(d.year)},0)`);
  
  ageGroups.forEach((ag, agIndex) => {
    barGroups.selectAll(`.bar-${agIndex}`)
      .data(d => [d])
      .enter()
      .append('rect')
      .attr('class', `bar-${agIndex}`)
      .attr('x', x1(ag))
      .attr('y', height)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('fill', colors[ag])
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8);
        
        tooltip
          .html(`
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: ${colors[ag]}">
              ${ag}
            </div>
            <div><strong>Year:</strong> ${d.year}</div>
            <div><strong>Rate:</strong> ${d[ag].toFixed(1)} per 10k license holders</div>
          `)
          .style('left', (event.clientX + 15) + 'px')
          .style('top', (event.clientY - 10) + 'px')
          .style('display', 'block');
        
        setTimeout(() => tooltip.classed('visible', true), 10);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.clientX + 15) + 'px')
          .style('top', (event.clientY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1);
        
        tooltip.classed('visible', false);
        setTimeout(() => tooltip.style('display', 'none'), 100);
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 30 + agIndex * 80)
      .attr('y', d => yScale(d[ag]))
      .attr('height', d => height - yScale(d[ag]));
  });
  
  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width + 10}, 0)`);
  
  legend.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#374151')
    .text('Age Groups');
  
  ageGroups.forEach((ag, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 30 + 25})`);
    
    legendRow.append('rect')
      .attr('x', 0)
      .attr('y', -8)
      .attr('width', 30)
      .attr('height', 16)
      .attr('fill', colors[ag])
      .attr('rx', 2);
    
    legendRow.append('text')
      .attr('x', 40)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '13px')
      .style('fill', '#374151')
      .text(ag);
  });
}

// ===== DATA TABLE FUNCTIONALITY =====
function populateDataTable() {
  const tableBody = d3.select('#rq5-summary-table tbody');
  if (tableBody.empty()) return;
  
  const data = filterData();
  const aggregated = aggregateByAgeGroup(data);
  
  if (aggregated.length === 0) {
    tableBody.html('<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">No data available for selected filters</td></tr>');
    return;
  }
  
  const colors = getColors();
  
  // Calculate risk levels
  const maxRate = d3.max(aggregated, d => d.ratePerTenK);
  const minRate = d3.min(aggregated, d => d.ratePerTenK);
  const rateRange = maxRate - minRate;
  
  function getRiskLevel(rate) {
    const normalized = (rate - minRate) / rateRange;
    if (normalized > 0.75) return { label: 'High', class: 'trend-up', color: '#ef4444' };
    if (normalized > 0.4) return { label: 'Medium', class: '', color: '#f59e0b' };
    return { label: 'Low', class: 'trend-down', color: '#10b981' };
  }
  
  // Sort by rate (descending) initially
  aggregated.sort((a, b) => b.ratePerTenK - a.ratePerTenK);
  
  // Clear and populate table
  tableBody.html('');
  
  aggregated.forEach(stat => {
    const risk = getRiskLevel(stat.ratePerTenK);
    
    const row = tableBody.append('tr');
    
    row.append('td')
      .html(`<div class="jurisdiction-cell">
        <span class="color-indicator" style="background: ${colors[stat.ageGroup]}"></span>
        <span>${stat.ageGroup}</span>
      </div>`);
    
    row.append('td')
      .style('font-weight', '600')
      .text(stat.ratePerTenK.toFixed(1));
    
    row.append('td').text(stat.totalFines.toLocaleString());
    row.append('td').text(Math.round(stat.totalLicenceHolders).toLocaleString());
    
    row.append('td')
      .html(`<span style="color: ${risk.color}; font-weight: 600;">${risk.label}</span>`);
  });
  
  // Add sorting functionality
  d3.selectAll('#rq5-summary-table th[data-sort]').on('click', function() {
    const sortKey = d3.select(this).attr('data-sort');
    const currentDir = d3.select(this).classed('sorted-asc') ? 'asc' : 
                      (d3.select(this).classed('sorted-desc') ? 'desc' : 'none');
    
    // Reset all headers
    d3.selectAll('#rq5-summary-table th').classed('sorted-asc', false).classed('sorted-desc', false);
    
    // Determine new direction
    const newDir = currentDir === 'asc' ? 'desc' : 'asc';
    d3.select(this).classed(`sorted-${newDir}`, true);
    
    // Sort data
    aggregated.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === 'string') {
        return newDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return newDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    // Re-render table
    tableBody.html('');
    aggregated.forEach(stat => {
      const risk = getRiskLevel(stat.ratePerTenK);
      
      const row = tableBody.append('tr');
      
      row.append('td')
        .html(`<div class="jurisdiction-cell">
          <span class="color-indicator" style="background: ${colors[stat.ageGroup]}"></span>
          <span>${stat.ageGroup}</span>
        </div>`);
      
      row.append('td')
        .style('font-weight', '600')
        .text(stat.ratePerTenK.toFixed(1));
      
      row.append('td').text(stat.totalFines.toLocaleString());
      row.append('td').text(Math.round(stat.totalLicenceHolders).toLocaleString());
      
      row.append('td')
        .html(`<span style="color: ${risk.color}; font-weight: 600;">${risk.label}</span>`);
    });
  });
}

// Update table when filters change
const originalRenderViz = renderVisualization;
renderVisualization = function() {
  originalRenderViz();
  populateDataTable();
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRQ5Data);
} else {
    loadRQ5Data();
}
