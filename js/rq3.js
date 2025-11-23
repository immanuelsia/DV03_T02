// RQ3: Method Effectiveness by Jurisdiction
// JavaScript for map and bar chart visualizations

let rq3Map = null;
let rq3BarChart = null;

function initRQ3() {
    renderRQ3Map('camera', 'percapita');
    renderRQ3BarChart('camera', 'percapita');
    
    document.getElementById('rq3-method').addEventListener('change', updateRQ3);
    document.getElementById('rq3-metric').addEventListener('change', updateRQ3);
}

function updateRQ3() {
    const method = document.getElementById('rq3-method').value;
    const metric = document.getElementById('rq3-metric').value;
    renderRQ3Map(method, metric);
    renderRQ3BarChart(method, metric);
}

function renderRQ3Map(method, metric) {
    const mapContainer = document.getElementById('rq3-map');
    mapContainer.innerHTML = '';
    
    rq3Map = L.map('rq3-map').setView([-25, 133], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(rq3Map);
    
    const detections = method === 'camera' ? DATA.rq3.cameraDetections : DATA.rq3.policeDetections;
    
    DATA.rq3.jurisdictions.forEach(jurisdiction => {
        const infractions = detections[jurisdiction.name];
        const value = metric === 'percapita' 
            ? utils.perCapitaRate(infractions, jurisdiction.population)
            : infractions;
        
        const color = utils.getChoroplethColor(metric === 'percapita' ? value : value / 1000);
        
        const circle = L.circleMarker([jurisdiction.lat, jurisdiction.lng], {
            radius: metric === 'percapita' ? Math.sqrt(value) * 2 : Math.sqrt(value) / 20,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        }).addTo(rq3Map);
        
        circle.bindPopup(`
            <strong>${jurisdiction.fullName}</strong><br>
            ${method === 'camera' ? 'Camera' : 'Police'} Detections: ${utils.formatNumber(infractions)}<br>
            ${metric === 'percapita' ? `Per Capita Rate: ${value} per 10k` : ''}
        `);
    });
}

function renderRQ3BarChart(method, metric) {
    const ctx = document.getElementById('rq3-bar-chart').getContext('2d');
    
    if (rq3BarChart) {
        rq3BarChart.destroy();
    }
    
    const detections = method === 'camera' ? DATA.rq3.cameraDetections : DATA.rq3.policeDetections;
    
    const chartData = DATA.rq3.jurisdictions.map(j => {
        const infractions = detections[j.name];
        return metric === 'percapita' 
            ? utils.perCapitaRate(infractions, j.population)
            : infractions;
    });
    
    rq3BarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: DATA.rq3.jurisdictions.map(j => j.name),
            datasets: [{
                label: metric === 'percapita' ? 'Per 10k Residents' : 'Total Infractions',
                data: chartData,
                backgroundColor: 'rgba(120, 113, 108, 0.8)',
                borderColor: 'rgb(120, 113, 108)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                title: {
                    display: true,
                    text: `${method === 'camera' ? 'Camera' : 'Police'} Detections`,
                    font: { size: 14, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                x: {
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRQ3);
} else {
    initRQ3();
}

