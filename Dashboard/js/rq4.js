// RQ4: Location of Infractions
// JavaScript for hotspot map and location category visualizations

let rq4Map = null;
let rq4HeatmapChart = null;

function initRQ4() {
    renderRQ4Map('all');
    renderRQ4LocationChart('all');
    
    document.getElementById('rq4-jurisdiction').addEventListener('change', (e) => {
        const jurisdiction = e.target.value;
        renderRQ4Map(jurisdiction);
        renderRQ4LocationChart(jurisdiction);
    });
}

function renderRQ4Map(jurisdiction) {
    const mapContainer = document.getElementById('rq4-map');
    mapContainer.innerHTML = '';
    
    rq4Map = L.map('rq4-map').setView([-25, 133], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(rq4Map);
    
    const filteredHotspots = jurisdiction === 'all' 
        ? DATA.rq4.hotspots 
        : DATA.rq4.hotspots.filter(h => h.jurisdiction === jurisdiction);
    
    if (filteredHotspots.length > 0 && jurisdiction !== 'all') {
        const avgLat = filteredHotspots.reduce((sum, h) => sum + h.lat, 0) / filteredHotspots.length;
        const avgLng = filteredHotspots.reduce((sum, h) => sum + h.lng, 0) / filteredHotspots.length;
        rq4Map.setView([avgLat, avgLng], 7);
    }
    
    filteredHotspots.forEach(hotspot => {
        const color = hotspot.category === 'Metropolitan' ? '#78716c' :
                      hotspot.category === 'Regional' ? '#a8a29e' : '#c9b8a8';
        
        const circle = L.circleMarker([hotspot.lat, hotspot.lng], {
            radius: Math.sqrt(hotspot.infractions) / 5,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        }).addTo(rq4Map);
        
        circle.bindPopup(`
            <strong>${hotspot.name}</strong><br>
            ${hotspot.jurisdiction}<br>
            Category: ${hotspot.category}<br>
            Infractions: ${utils.formatNumber(hotspot.infractions)}
        `);
    });
}

function renderRQ4LocationChart(jurisdiction) {
    const ctx = document.getElementById('rq4-heatmap-chart').getContext('2d');
    
    if (rq4HeatmapChart) {
        rq4HeatmapChart.destroy();
    }
    
    let labels, metro, regional, remote;
    
    if (jurisdiction === 'all') {
        labels = DATA.rq4.locationCategories.labels;
        metro = DATA.rq4.locationCategories.metropolitan;
        regional = DATA.rq4.locationCategories.regional;
        remote = DATA.rq4.locationCategories.remote;
    } else {
        const idx = DATA.rq4.locationCategories.labels.indexOf(jurisdiction);
        labels = [jurisdiction];
        metro = [DATA.rq4.locationCategories.metropolitan[idx]];
        regional = [DATA.rq4.locationCategories.regional[idx]];
        remote = [DATA.rq4.locationCategories.remote[idx]];
    }
    
    rq4HeatmapChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Metropolitan',
                    data: metro,
                    backgroundColor: 'rgba(120, 113, 108, 0.8)',
                    borderColor: 'rgb(120, 113, 108)',
                    borderWidth: 2
                },
                {
                    label: 'Regional',
                    data: regional,
                    backgroundColor: 'rgba(168, 162, 158, 0.8)',
                    borderColor: 'rgb(168, 162, 158)',
                    borderWidth: 2
                },
                {
                    label: 'Remote',
                    data: remote,
                    backgroundColor: 'rgba(201, 184, 168, 0.8)',
                    borderColor: 'rgb(201, 184, 168)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Location Category Distribution',
                    font: { size: 14, weight: 'bold' }
                },
                legend: { display: true, position: 'bottom' }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
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
    document.addEventListener('DOMContentLoaded', initRQ4);
} else {
    initRQ4();
}

