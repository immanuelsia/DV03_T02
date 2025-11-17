// RQ5: Age Groups Analysis
// JavaScript for bar chart and lollipop chart visualizations

let rq5Chart = null;

function initRQ5() {
    renderRQ5BarChart('age');
    
    document.getElementById('rq5-style').addEventListener('change', (e) => {
        const style = e.target.value;
        if (style === 'bar') {
            document.getElementById('rq5-chart').parentElement.style.display = 'block';
            document.getElementById('rq5-lollipop').style.display = 'none';
            const sortBy = document.getElementById('rq5-sort').value;
            renderRQ5BarChart(sortBy);
        } else {
            document.getElementById('rq5-chart').parentElement.style.display = 'none';
            document.getElementById('rq5-lollipop').style.display = 'block';
            const sortBy = document.getElementById('rq5-sort').value;
            renderRQ5Lollipop(sortBy);
        }
    });
    
    document.getElementById('rq5-sort').addEventListener('change', (e) => {
        const sortBy = e.target.value;
        const style = document.getElementById('rq5-style').value;
        if (style === 'bar') {
            renderRQ5BarChart(sortBy);
        } else {
            renderRQ5Lollipop(sortBy);
        }
    });
}

function renderRQ5BarChart(sortBy) {
    const ctx = document.getElementById('rq5-chart').getContext('2d');
    
    if (rq5Chart) {
        rq5Chart.destroy();
    }
    
    let data = DATA.rq5.ageGroups.map(ag => ({
        label: ag.label,
        rate: utils.perLicenseRate(ag.infractions, ag.licenseHolders),
        infractions: ag.infractions
    }));
    
    if (sortBy === 'rate') {
        data.sort((a, b) => b.rate - a.rate);
    }
    
    rq5Chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: 'Infractions per 10k License Holders',
                data: data.map(d => d.rate),
                backgroundColor: 'rgba(120, 113, 108, 0.8)',
                borderColor: 'rgb(120, 113, 108)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Infractions by Age Group (Adjusted for License Holders)',
                    font: { size: 18, weight: 'bold' }
                },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Rate: ${context.parsed.y} per 10k`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Age Group', font: { weight: 'bold' } }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Per 10k License Holders', font: { weight: 'bold' } }
                }
            }
        }
    });
}

function renderRQ5Lollipop(sortBy) {
    const container = document.getElementById('rq5-lollipop-svg');
    container.innerHTML = '';
    
    const margin = { top: 50, right: 50, bottom: 70, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    let data = DATA.rq5.ageGroups.map(ag => ({
        label: ag.label,
        rate: utils.perLicenseRate(ag.infractions, ag.licenseHolders)
    }));
    
    if (sortBy === 'rate') {
        data.sort((a, b) => b.rate - a.rate);
    }
    
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.3);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.rate) * 1.1])
        .range([height, 0]);
    
    svg.selectAll('.lollipop-line')
        .data(data)
        .enter()
        .append('line')
        .attr('class', 'lollipop-line')
        .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 2)
        .attr('x2', d => xScale(d.label) + xScale.bandwidth() / 2)
        .attr('y1', yScale(0))
        .attr('y2', d => yScale(d.rate))
        .attr('stroke', '#78716c')
        .attr('stroke-width', 3);
    
    svg.selectAll('.lollipop-circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'lollipop-circle')
        .attr('cx', d => xScale(d.label) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.rate))
        .attr('r', 8)
        .attr('fill', '#78716c')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 12);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 8);
        })
        .append('title')
        .text(d => `${d.label}: ${d.rate} per 10k`);
    
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('font-size', '12px')
        .style('font-weight', '600');
    
    svg.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('font-size', '12px')
        .style('font-weight', '600');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Per 10k License Holders');
    
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Infractions by Age Group (Lollipop Chart)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRQ5);
} else {
    initRQ5();
}

