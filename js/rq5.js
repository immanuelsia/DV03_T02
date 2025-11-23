// RQ5: Age Groups Analysis - Bubble Chart with Filters
// Using final.csv data to show speeding offences by age group adjusted for license holders

let rq5Data = [];
let bubbleChart = null;
let currentFilters = {
    year: 'all',
    jurisdiction: 'all'
};

// Load and process the final.csv data
async function loadRQ5Data() {
    try {
        const response = await fetch('final.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        rq5Data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length < 7) continue;
            
            const row = {
                year: parseInt(values[0]),
                jurisdiction: values[1],
                ageGroup: values[2],
                fines: parseInt(values[3]) || 0,
                arrests: parseInt(values[4]) || 0,
                charges: parseInt(values[5]) || 0,
                licenceHolders: parseFloat(values[6]) || 0
            };
            
            // Only include rows with specific age groups (not "All ages") and with license holder data
            if (row.ageGroup !== 'All ages' && row.licenceHolders > 0) {
                row.totalInfractions = row.fines + row.arrests + row.charges;
                row.ratePerTenK = (row.totalInfractions / row.licenceHolders) * 10000;
                rq5Data.push(row);
            }
        }
        
        console.log('Loaded RQ5 data:', rq5Data.length, 'rows');
        initRQ5Filters();
        renderBubbleChart();
        
    } catch (error) {
        console.error('Error loading RQ5 data:', error);
    }
}

function initRQ5Filters() {
    // Get unique years and jurisdictions
    const years = [...new Set(rq5Data.map(d => d.year))].sort((a, b) => b - a);
    const jurisdictions = [...new Set(rq5Data.map(d => d.jurisdiction))].sort();
    
    // Populate year filter
    const yearSelect = document.getElementById('rq5-year');
    yearSelect.innerHTML = '<option value="all">All Years</option>';
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
    
    // Populate jurisdiction filter
    const jurisdictionSelect = document.getElementById('rq5-jurisdiction');
    jurisdictionSelect.innerHTML = '<option value="all">All Jurisdictions</option>';
    jurisdictions.forEach(jurisdiction => {
        jurisdictionSelect.innerHTML += `<option value="${jurisdiction}">${jurisdiction}</option>`;
    });
    
    // Add event listeners
    yearSelect.addEventListener('change', (e) => {
        currentFilters.year = e.target.value;
        renderBubbleChart();
    });
    
    jurisdictionSelect.addEventListener('change', (e) => {
        currentFilters.jurisdiction = e.target.value;
        renderBubbleChart();
    });
}

function filterData() {
    let filteredData = rq5Data;
    
    if (currentFilters.year !== 'all') {
        filteredData = filteredData.filter(d => d.year === parseInt(currentFilters.year));
    }
    
    if (currentFilters.jurisdiction !== 'all') {
        filteredData = filteredData.filter(d => d.jurisdiction === currentFilters.jurisdiction);
    }
    
    // Aggregate by age group
    const ageGroups = {};
    filteredData.forEach(row => {
        if (!ageGroups[row.ageGroup]) {
            ageGroups[row.ageGroup] = {
                ageGroup: row.ageGroup,
                totalInfractions: 0,
                totalLicenceHolders: 0,
                count: 0
            };
        }
        ageGroups[row.ageGroup].totalInfractions += row.totalInfractions;
        ageGroups[row.ageGroup].totalLicenceHolders += row.licenceHolders;
        ageGroups[row.ageGroup].count++;
    });
    
    // Calculate rates
    const aggregated = Object.values(ageGroups).map(ag => ({
        ageGroup: ag.ageGroup,
        totalInfractions: ag.totalInfractions,
        totalLicenceHolders: ag.totalLicenceHolders,
        ratePerTenK: (ag.totalInfractions / ag.totalLicenceHolders) * 10000,
        count: ag.count
    }));
    
    return aggregated;
}

function renderBubbleChart() {
    const data = filterData();
    
    if (data.length === 0) {
        document.getElementById('rq5-bubble-chart').innerHTML = '<p style="text-align: center; padding: 50px;">No data available for selected filters</p>';
        return;
    }
    
    // Clear previous chart
    document.getElementById('rq5-bubble-chart').innerHTML = '';
    
    // Set up dimensions
    const margin = { top: 60, right: 40, bottom: 80, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select('#rq5-bubble-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Define age group order for X-axis
    const ageGroupOrder = ['0-16', '17-25', '26-39', '40-64', '65 and over'];
    const sortedData = data.sort((a, b) => 
        ageGroupOrder.indexOf(a.ageGroup) - ageGroupOrder.indexOf(b.ageGroup)
    );
    
    // Create scales
    const xScale = d3.scalePoint()
        .domain(ageGroupOrder)
        .range([0, width])
        .padding(0.5);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.ratePerTenK) * 1.15])
        .range([height, 0]);
    
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.totalInfractions)])
        .range([10, 60]);
    
    // Color scale
    const colorScale = d3.scaleOrdinal()
        .domain(ageGroupOrder)
        .range(['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']);
    
    // Add grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );
    
    // Create bubbles
    const bubbles = svg.selectAll('.bubble')
        .data(sortedData)
        .enter()
        .append('g')
        .attr('class', 'bubble');
    
    bubbles.append('circle')
        .attr('cx', d => xScale(d.ageGroup))
        .attr('cy', d => yScale(d.ratePerTenK))
        .attr('r', 0)
        .attr('fill', d => colorScale(d.ageGroup))
        .attr('opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1)
                .attr('stroke-width', 3);
            
            // Show tooltip
            tooltip.style('display', 'block')
                .html(`
                    <strong>${d.ageGroup}</strong><br/>
                    Rate: <strong>${d.ratePerTenK.toFixed(1)}</strong> per 10k<br/>
                    Total Infractions: <strong>${d.totalInfractions.toLocaleString()}</strong><br/>
                    License Holders: <strong>${Math.round(d.totalLicenceHolders).toLocaleString()}</strong>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 0.7)
                .attr('stroke-width', 2);
            
            tooltip.style('display', 'none');
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr('r', d => sizeScale(d.totalInfractions));
    
    // Add value labels on bubbles
    bubbles.append('text')
        .attr('x', d => xScale(d.ageGroup))
        .attr('y', d => yScale(d.ratePerTenK))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0)
        .text(d => Math.round(d.ratePerTenK))
        .transition()
        .duration(800)
        .delay((d, i) => i * 100 + 400)
        .attr('opacity', 1);
    
    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('font-size', '13px')
        .style('font-weight', '600')
        .style('fill', '#374151');
    
    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(yScale)
            .ticks(8)
            .tickFormat(d => d.toFixed(0))
        )
        .selectAll('text')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', '#374151');
    
    // Add axis labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .attr('text-anchor', 'middle')
        .style('font-size', '15px')
        .style('font-weight', 'bold')
        .style('fill', '#1f2937')
        .text('Age Group');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -55)
        .attr('text-anchor', 'middle')
        .style('font-size', '15px')
        .style('font-weight', 'bold')
        .style('fill', '#1f2937')
        .text('Infractions per 10,000 License Holders');
    
    // Add title
    const titleText = currentFilters.year === 'all' && currentFilters.jurisdiction === 'all' 
        ? 'All Years & Jurisdictions'
        : (currentFilters.year !== 'all' ? currentFilters.year : 'All Years') + 
          (currentFilters.jurisdiction !== 'all' ? ` - ${currentFilters.jurisdiction}` : '');
    
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .style('fill', '#111827')
        .text(`Speeding Offences by Age Group: ${titleText}`);
    
    // Create tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'bubble-tooltip')
        .style('position', 'absolute')
        .style('display', 'none')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRQ5Data);
} else {
    loadRQ5Data();
}
