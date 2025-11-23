// RQ2: Seasonal Patterns
// JavaScript for heatmap and line chart visualizations

let rq2LineChart = null;

function initRQ2() {
    renderRQ2Heatmap();
    
    document.getElementById('rq2-view').addEventListener('change', (e) => {
        const view = e.target.value;
        
        if (view === 'heatmap') {
            document.getElementById('rq2-heatmap').style.display = 'block';
            document.getElementById('rq2-line').style.display = 'none';
            renderRQ2Heatmap();
        } else {
            document.getElementById('rq2-heatmap').style.display = 'none';
            document.getElementById('rq2-line').style.display = 'block';
            renderRQ2LineChart();
        }
    });
}

function renderRQ2Heatmap() {
    const container = document.getElementById('rq2-heatmap-viz');
    container.innerHTML = '';
    
    const margin = { top: 50, right: 50, bottom: 50, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const years = DATA.rq2.years;
    const months = DATA.rq2.months;
    
    const xScale = d3.scaleBand()
        .domain(months)
        .range([0, width])
        .padding(0.05);
    
    const yScale = d3.scaleBand()
        .domain(years)
        .range([0, height])
        .padding(0.05);
    
    const allValues = DATA.rq2.heatmapData.flat();
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    // Custom beige/brown interpolator for heatmap
    const beigeInterpolator = t => {
        const colors = [
            'rgb(250, 250, 249)', // beige-50
            'rgb(245, 245, 244)', // beige-100
            'rgb(231, 229, 228)', // beige-200
            'rgb(214, 211, 209)', // beige-300
            'rgb(168, 162, 158)', // beige-400
            'rgb(120, 113, 108)', // beige-500
            'rgb(87, 83, 78)',    // beige-600
            'rgb(68, 64, 60)'     // beige-700
        ];
        const index = Math.floor(t * (colors.length - 1));
        const nextIndex = Math.min(index + 1, colors.length - 1);
        const localT = (t * (colors.length - 1)) - index;
        return d3.interpolateRgb(colors[index], colors[nextIndex])(localT);
    };
    
    const colorScale = d3.scaleSequential()
        .domain([minValue, maxValue])
        .interpolator(beigeInterpolator);
    
    years.forEach((year, yearIdx) => {
        months.forEach((month, monthIdx) => {
            const value = DATA.rq2.heatmapData[yearIdx][monthIdx];
            
            svg.append('rect')
                .attr('x', xScale(month))
                .attr('y', yScale(year))
                .attr('width', xScale.bandwidth())
                .attr('height', yScale.bandwidth())
                .attr('fill', colorScale(value))
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .attr('rx', 4)
                .style('cursor', 'pointer')
                .on('mouseover', function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('stroke-width', 4)
                        .attr('opacity', 0.8);
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('stroke-width', 2)
                        .attr('opacity', 1);
                })
                .append('title')
                .text(`${month} ${year}: ${utils.formatNumber(value)} infractions`);
            
            svg.append('text')
                .attr('x', xScale(month) + xScale.bandwidth() / 2)
                .attr('y', yScale(year) + yScale.bandwidth() / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '11px')
                .style('font-weight', '600')
                .style('fill', value > (minValue + maxValue) / 2 ? '#fff' : '#333')
                .style('pointer-events', 'none')
                .text(Math.round(value / 1000) + 'k');
        });
    });
    
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
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('Monthly Infraction Patterns by Year');
}

function renderRQ2LineChart() {
    const ctx = document.getElementById('rq2-line-chart').getContext('2d');
    
    if (rq2LineChart) {
        rq2LineChart.destroy();
    }
    
    const datasets = DATA.rq2.years.map((year, idx) => ({
        label: year.toString(),
        data: DATA.rq2.heatmapData[idx],
        borderWidth: 3,
        tension: 0.4,
        fill: false
    }));
    
    const colors = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2'];
    datasets.forEach((dataset, idx) => {
        dataset.borderColor = colors[idx % colors.length];
        dataset.backgroundColor = colors[idx % colors.length];
    });
    
    rq2LineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: DATA.rq2.months,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Trends Across Years',
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Month', font: { weight: 'bold' } }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Infractions', font: { weight: 'bold' } },
                    ticks: {
                        callback: function(value) {
                            return utils.formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRQ2);
} else {
    initRQ2();
}

