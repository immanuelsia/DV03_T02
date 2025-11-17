// RQ1: Detection Method vs Outcomes
// JavaScript for visualization and interactions

let rq1Chart = null;
let rq1SmallMultiples = {};

function initRQ1() {
    renderRQ1Chart('stacked');
    
    document.getElementById('rq1-view').addEventListener('change', (e) => {
        const view = e.target.value;
        
        if (view === 'small-multiples') {
            document.getElementById('rq1-chart').parentElement.style.display = 'none';
            document.getElementById('rq1-small-multiples').style.display = 'grid';
            renderRQ1SmallMultiples();
        } else {
            document.getElementById('rq1-chart').parentElement.style.display = 'block';
            document.getElementById('rq1-small-multiples').style.display = 'none';
            renderRQ1Chart(view);
        }
    });
}

function renderRQ1Chart(type) {
    const ctx = document.getElementById('rq1-chart').getContext('2d');
    
    if (rq1Chart) {
        rq1Chart.destroy();
    }
    
    const datasets = [
        {
            label: 'Camera - Warning',
            data: DATA.rq1.camera.warning,
            backgroundColor: 'rgba(201, 184, 168, 0.8)',
            borderColor: 'rgb(201, 184, 168)',
            borderWidth: 2,
            stack: type === 'stacked' ? 'camera' : undefined
        },
        {
            label: 'Camera - Fine',
            data: DATA.rq1.camera.fine,
            backgroundColor: 'rgba(168, 162, 158, 0.8)',
            borderColor: 'rgb(168, 162, 158)',
            borderWidth: 2,
            stack: type === 'stacked' ? 'camera' : undefined
        },
        {
            label: 'Camera - Court',
            data: DATA.rq1.camera.court,
            backgroundColor: 'rgba(120, 113, 108, 0.8)',
            borderColor: 'rgb(120, 113, 108)',
            borderWidth: 2,
            stack: type === 'stacked' ? 'camera' : undefined
        },
        {
            label: 'Police - Warning',
            data: DATA.rq1.police.warning,
            backgroundColor: 'rgba(214, 211, 209, 0.8)',
            borderColor: 'rgb(214, 211, 209)',
            borderWidth: 2,
            stack: type === 'stacked' ? 'police' : undefined
        },
        {
            label: 'Police - Fine',
            data: DATA.rq1.police.fine,
            backgroundColor: 'rgba(146, 133, 122, 0.8)',
            borderColor: 'rgb(146, 133, 122)',
            borderWidth: 2,
            stack: type === 'stacked' ? 'police' : undefined
        },
        {
            label: 'Police - Court',
            data: DATA.rq1.police.court,
            backgroundColor: 'rgba(87, 83, 78, 0.8)',
            borderColor: 'rgb(87, 83, 78)',
            borderWidth: 2,
            stack: type === 'stacked' ? 'police' : undefined
        }
    ];
    
    rq1Chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: DATA.rq1.years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Detection Method vs Outcomes Over Time',
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + utils.formatNumber(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Year', font: { weight: 'bold' } }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Infractions', font: { weight: 'bold' } },
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

function renderRQ1SmallMultiples() {
    const outcomes = ['warning', 'fine', 'court'];
    const canvasIds = ['rq1-warning', 'rq1-fine', 'rq1-court'];
    
    outcomes.forEach((outcome, idx) => {
        const ctx = document.getElementById(canvasIds[idx]).getContext('2d');
        
        if (rq1SmallMultiples[outcome]) {
            rq1SmallMultiples[outcome].destroy();
        }
        
        rq1SmallMultiples[outcome] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: DATA.rq1.years,
                datasets: [
                    {
                        label: 'Camera',
                        data: DATA.rq1.camera[outcome],
                        borderColor: 'rgb(120, 113, 108)',
                        backgroundColor: 'rgba(120, 113, 108, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Police',
                        data: DATA.rq1.police[outcome],
                        borderColor: 'rgb(146, 133, 122)',
                        backgroundColor: 'rgba(146, 133, 122, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true, position: 'bottom' }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return utils.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRQ1);
} else {
    initRQ1();
}

