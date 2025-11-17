// ---------------------------
// D3 Map Viewer (TopoJSON) - scoped to Q3 (ASYNC FIX)
// ---------------------------
(function(){

// Use the map card inner dimensions so the SVG fills the card
const mapContainer = document.getElementById('map-q3') ? document.getElementById('map-q3').parentElement : (document.querySelector('#card-q3 .map-inner') || document.querySelector('.map-inner'));
let width = mapContainer ? Math.max(200, mapContainer.clientWidth) : window.innerWidth;
let height = mapContainer ? Math.max(200, mapContainer.clientHeight) : window.innerHeight;

const svg = d3.select("#map-q3")
  .attr("width", width)
  .attr("height", height)
  .style('cursor','grab');

const g = svg.append("g");

const infoPanel = d3.select("#infoPanel-q3");
const loading = d3.select("#loading-q3");

let projection, path, geojsonData;
// small horizontal shift (pixels) to nudge the map left
const horizontalShift = 200;

// Disable all zoom gestures, allow only programmatic zoom
const zoom = d3.zoom()
  .scaleExtent([0.8, 12])
  .on("zoom", (event) => g.attr("transform", event.transform))
  .on("start", () => svg.style('cursor','grabbing'))
  .on("end", () => svg.style('cursor','grab'));

// Attach zoom to enable panning via drag, but disable wheel/dblclick zoom gestures
svg.call(zoom).on("wheel.zoom", null).on("dblclick.zoom", null);

// State labels (optional)
const labels = [
  { name: "Western Australia", coords: [122, -25] },
  { name: "Northern Territory", coords: [133, -20] },
  { name: "South Australia", coords: [135, -30] },
  { name: "Queensland", coords: [145, -23] },
  { name: "New South Wales", coords: [147, -32] },
  { name: "Victoria", coords: [144, -37] },
  { name: "Tasmania", coords: [147, -42] },
];

// Info panel update - NOW SHOWS DATA VALUES
function updateInfo(properties, dataValues) {
  if (!properties) {
    infoPanel.html("<h3>Feature Info</h3><div class='hint'>Hover over features to see details</div>");
    return;
  }

  let html = `<h3>${properties.name || properties.id || 'Unknown'}</h3>`;
  
  // Add data values if available
  if (dataValues) {
    html += `<div class="property">
      <div class="property-key">Camera per 10k:</div>
      <div class="property-value">${Math.round(dataValues.Camera_offence_per10k || 0)}</div>
    </div>
    <div class="property">
      <div class="property-key">Police per 10k:</div>
      <div class="property-value">${Math.round(dataValues.Police_offence_per10k || 0)}</div>
    </div>
    <div class="property">
      <div class="property-key">Camera %:</div>
      <div class="property-value">${(dataValues.Camera_Percentage || 0).toFixed(1)}%</div>
    </div>
    <div class="property">
      <div class="property-key">Police %:</div>
      <div class="property-value">${(dataValues.Police_Percentage || 0).toFixed(1)}%</div>
    </div>`;
  } else {
    const props = Object.entries(properties)
      .map(([k, v]) => `<div class="property">
          <div class="property-key">${k}:</div>
          <div class="property-value">${v}</div>
        </div>`)
      .join("");
    html += props;
  }

  infoPanel.html(html);
}

// Fit map to viewport
function fitToMap() {
  if (!geojsonData || !path) return;
  const bounds = path.bounds(geojsonData);
  const dx = bounds[1][0] - bounds[0][0];
  const dy = bounds[1][1] - bounds[0][1];
  const x = (bounds[0][0] + bounds[1][0]) / 2;
  const y = (bounds[0][1] + bounds[1][1]) / 2;
  const scale = Math.max(0.8, Math.min(12, 0.85 / Math.max(dx / width, dy / height)));
  const translate = [width / 2 - scale * x - horizontalShift, height / 2 - scale * y];

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

// --- Async loading flags ---
let topojsonLoaded = false;
let csvLoaded = false;

function tryUpdateChoropleth() {
  if (topojsonLoaded && csvLoaded) {
    console.log('Both files loaded - updating choropleth');
    updateChoropleth(currentYear);
  }
}

// --- Year slider and data-driven coloring ---
let q3DataLookup = {};
let currentYear = 2024;
let currentMode = 'both';

function getJurisdictionFromProps(props) {
  if (!props) return null;
  if (props.id) {
    const id = props.id.toUpperCase().trim();
    const validCodes = ['NSW', 'NT', 'QLD', 'WA', 'SA', 'TAS', 'VIC', 'ACT'];
    if (validCodes.includes(id)) {
      return id;
    }
  }
  if (props.name) {
    const name = props.name.trim().toUpperCase();
    const MAP = {
      'NEW SOUTH WALES': 'NSW',
      'NORTHERN TERRITORY': 'NT',
      'QUEENSLAND': 'QLD',
      'WESTERN AUSTRALIA': 'WA',
      'SOUTH AUSTRALIA': 'SA',
      'TASMANIA': 'TAS',
      'VICTORIA': 'VIC',
      'AUSTRALIAN CAPITAL TERRITORY': 'ACT'
    };
    return MAP[name] || null;
  }
  console.warn('Unmapped jurisdiction:', props);
  return null;
}

function getValueByMode(row){
  if(!row) return null;
  if(currentMode === 'camera') return row.Camera_offence_per10k ?? row.Camera_Percentage ?? null;
  if(currentMode === 'police') return row.Police_offence_per10k ?? row.Police_Percentage ?? null;
  if(currentMode === 'both'){
    const c = row.Camera_offence_per10k ?? 0;
    const p = row.Police_offence_per10k ?? 0;
    const sum = (Number(c) || 0) + (Number(p) || 0);
    return sum > 0 ? sum : null;
  }
  return null;
}

function updateChoropleth(year){
  const values = [];
  g.selectAll('.feature').each(function(d){
    const code = getJurisdictionFromProps(d.properties);
    const entry = (q3DataLookup[code] && q3DataLookup[code][year]) ? q3DataLookup[code][year] : null;
    if(entry != null){
      const val = getValueByMode(entry);
      if(val != null) values.push(val);
    }
  });
  const min = d3.min(values) ?? 0;
  const max = d3.max(values) ?? 1;
  const interp = currentMode === 'camera' ? d3.interpolateBlues : 
                 (currentMode === 'police' ? d3.interpolateReds : d3.interpolateYlOrRd);
  const color = d3.scaleSequential().domain([min,max]).interpolator(interp);

  g.selectAll('.feature').transition().duration(300).attr('fill', function(d){
    const code = getJurisdictionFromProps(d.properties);
    const entry = (q3DataLookup[code] && q3DataLookup[code][year]) ? q3DataLookup[code][year] : null;
    if(!entry) return '#eee';
    const val = getValueByMode(entry);
    return val != null ? color(val) : '#eee';
  });
  d3.select('#year-label-q3').text(year);
  updateLegend(year, min, max, color);
}

// Load and draw TopoJSON
d3.json("mapOfKangaroos.json")
  .then((topology) => {
    loading.style("display", "none");
    const objectKey = Object.keys(topology.objects)[0];
    const data = topojson.feature(topology, topology.objects[objectKey]);
    geojsonData = data;
    projection = d3.geoIdentity().reflectY(true).fitSize([width, height], data);
    path = d3.geoPath(projection);

    // Draw features
    g.selectAll(".feature")
      .data(data.features)
      .enter()
      .append("path")
      .attr("class", "feature")
      .attr("d", path)
      .on("mouseenter", function (event, d) {
        const code = getJurisdictionFromProps(d.properties);
        const entry = (q3DataLookup[code] && q3DataLookup[code][currentYear]) ? q3DataLookup[code][currentYear] : null;
        
        d3.select(this).classed("highlighted", true).transition().duration(150).attr("fill-opacity", 0.55);
        updateInfo(d.properties, entry);
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(150).attr("fill-opacity", 0.3).on('end', function(){ d3.select(this).classed('highlighted', false); });
        updateInfo(null);
      });

    // Click/select logic
    g.selectAll('.feature')
      .on('click', function(event, d){
        event.stopPropagation();
        const code = getJurisdictionFromProps(d.properties);
        const entry = (q3DataLookup[code] && q3DataLookup[code][currentYear]) ? q3DataLookup[code][currentYear] : null;
        
        g.selectAll('.feature').classed('selected', false);
        d3.select(this).classed('selected', true);
        updateInfo(d.properties, entry);
      });

    // Add labels
    g.selectAll(".state-label")
      .data(labels)
      .enter()
      .append("text")
      .attr("class", "state-label")
      .attr("x", (d) => {
        const p = projection(d.coords);
        return p ? p[0] : 0;
      })
      .attr("y", (d) => {
        const p = projection(d.coords);
        return p ? p[1] : 0;
      })
      .text((d) => d.name);

    fitToMap();

    // Mark TopoJSON as loaded
    topojsonLoaded = true;
    tryUpdateChoropleth();
  })
  .catch((err) => {
    loading.html(`Error: ${err.message}`);
    console.error("Error loading TopoJSON:", err);
  });

// Zoom buttons
d3.select("#zoomIn-q3").on("click", () => {
  svg.transition().duration(300).call(zoom.scaleBy, 1.5);
});
d3.select("#zoomOut-q3").on("click", () => {
  svg.transition().duration(300).call(zoom.scaleBy, 0.67);
});
d3.select("#reset-q3").on("click", fitToMap);

// Load CSV data
d3.csv('data/Q3DATA.csv', d3.autoType).then(rows => {
  console.log('CSV loaded, rows:', rows.length);
  
  // Build lookup
  rows.forEach(r => {
    const code = (''+r.JURISDICTION).toUpperCase().trim();
    q3DataLookup[code] = q3DataLookup[code] || {};
    q3DataLookup[code][+r.YEAR] = r;
  });

  // Debug NT
  console.log('NT 2024 data:', q3DataLookup['NT']?.[2024]);

  // Mark CSV as loaded
  csvLoaded = true;
  tryUpdateChoropleth();

  // Hook up slider/mode tabs
  const slider = d3.select('#year-slider-q3');
  if(!slider.empty()){
    slider.on('input', (event) => {
      currentYear = +event.target.value;
      updateChoropleth(currentYear);
    });
  }

  function setMode(mode){
    currentMode = mode;
    d3.selectAll('#mode-tabs-q3 .mode-tab').classed('active', false);
    d3.select('#mode-'+mode+'-q3').classed('active', true);
    updateChoropleth(currentYear);
  }
  d3.select('#mode-camera-q3').on('click', () => setMode('camera'));
  d3.select('#mode-police-q3').on('click', () => setMode('police'));
  d3.select('#mode-both-q3').on('click', () => setMode('both'));
  setMode(currentMode);
}).catch(err => {
  console.warn('Failed to load Q3 CSV:', err);
  loading.html(`CSV Error: ${err.message}`);
});

// --- Add Legend with VALUES ---
function updateLegend(year, min, max, color) {
  let legend = d3.select('#legend-q3');
  if (legend.empty()) {
    legend = d3.select('#card-q3').append('div')
      .attr('id', 'legend-q3')
      .style('margin', '12px 18px')
      .style('padding', '12px')
      .style('background', '#f9f9f9')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px');
  }
  legend.html('');
  
  const title = currentMode === 'both' ? 'Total Speeding Offences per 10k' : 
                currentMode === 'camera' ? 'Camera Offences per 10k' : 'Police Offences per 10k';
  
  legend.append('div')
    .style('font-weight', 'bold')
    .style('margin-bottom', '8px')
    .text(`Legend: ${title}`);

  const width = 200;
  const height = 20;
  const svgLegend = legend.append('svg')
    .attr('width', width)
    .attr('height', height + 30);
  
  const gradient = svgLegend.append('defs')
    .append('linearGradient')
    .attr('id', 'legend-gradient')
    .attr('x1', 0).attr('y1', 0).attr('x2', 1).attr('y2', 0);
  
  gradient.append('stop').attr('offset', '0%').attr('stop-color', color(min));
  gradient.append('stop').attr('offset', '100%').attr('stop-color', color(max));
  
  svgLegend.append('rect').attr('width', width).attr('height', height).style('fill', 'url(#legend-gradient)');
  
  svgLegend.append('text')
    .attr('x', 0)
    .attr('y', height + 15)
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text(Math.round(min));
  
  svgLegend.append('text')
    .attr('x', width - 40)
    .attr('y', height + 15)
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text(Math.round(max));
}

// Handle resize
window.addEventListener("resize", () => {
  const newW = mapContainer ? Math.max(200, mapContainer.clientWidth) : window.innerWidth;
  const newH = mapContainer ? Math.max(200, mapContainer.clientHeight) : window.innerHeight;
  svg.attr("width", newW).attr("height", newH);
  if (geojsonData && projection) {
    projection.fitSize([newW, newH], geojsonData);
    g.selectAll(".feature").attr("d", path);
    g.selectAll('.state-label')
      .attr('x', d => { const p = projection(d.coords); return p ? p[0] : 0; })
      .attr('y', d => { const p = projection(d.coords); return p ? p[1] : 0; });
    fitToMap();
  }
});

})();