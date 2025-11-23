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
const horizontalShift = 150;

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

// Info panel update: render a pie chart of Camera% vs Police% for the currently-hovered feature
function updateInfo(properties) {
  // clear existing content
  infoPanel.html('');
  if (!properties) {
    infoPanel.html("<h3>Feature Info</h3><div class='hint'>Hover over features to see details</div>");
    return;
  }
  // Header
  infoPanel.append('h3').text('Feature Info');

  // determine jurisdiction code and lookup CSV row for current year
  const code = getJurisdictionFromProps(properties);
  const row = (code && q3DataLookup[code]) ? q3DataLookup[code][currentYear] : null;

  // prepare values for pie chart: camera% and police%
  let camPerc = null, polPerc = null;
  if (row) {
    camPerc = row.Camera_Percentage != null ? +row.Camera_Percentage : null;
    polPerc = row.Police_Percentage != null ? +row.Police_Percentage : null;
    // fallback: if percentages missing but counts present, compute percent share
    if ((camPerc == null || polPerc == null) && (row.Camera_offence_per10k != null || row.Police_offence_per10k != null)){
      const c = Number(row.Camera_offence_per10k) || 0;
      const p = Number(row.Police_offence_per10k) || 0;
      const total = c + p;
      if(total > 0){
        camPerc = camPerc == null ? (c/total)*100 : camPerc;
        polPerc = polPerc == null ? (p/total)*100 : polPerc;
      }
    }
  }

  // Row: pie chart (left) and info (right)
  const rowDiv = infoPanel.append('div').attr('class','q3-info-row');
  const chartDiv = rowDiv.append('div').attr('class','q3-chart').node();
  const infoBlock = rowDiv.append('div').attr('class','q3-info-block');

  // draw pie if we have percentage values
  const color = d3.scaleOrdinal().domain(['Camera','Police']).range(['#3388ff','#ff5a5a']);
  if (camPerc != null && polPerc != null) {
    const data = [ {label:'Camera', value:camPerc}, {label:'Police', value:polPerc} ];
    const w = 180, h = 180, r = Math.min(w,h)/2;
    const svgChart = d3.select(chartDiv).append('svg').attr('width', w).attr('height', h);
    const gChart = svgChart.append('g').attr('transform', `translate(${w/2},${h/2})`);
    const pie = d3.pie().value(d=>d.value);
    const arc = d3.arc().innerRadius(r*0.35).outerRadius(r*0.9);

    const arcs = gChart.selectAll('.arc').data(pie(data)).enter().append('g').attr('class','arc');
    arcs.append('path').attr('d', arc).attr('fill', d=>color(d.data.label)).attr('stroke','white').attr('stroke-width',2);

    // mini legend
    const legend = infoBlock.append('div').attr('class','q3-legend');
    data.forEach(d=>{
      const item = legend.append('div').style('display','flex').style('align-items','center').style('gap','8px').style('margin','4px 0');
      item.append('div').style('width','12px').style('height','12px').style('background', color(d.label)).style('border-radius','2px');
      item.append('div').style('font-size','13px').html(`${d.label}: <strong>${d.value.toFixed(1)}%</strong>`);
    });
  } else {
    infoBlock.append('div').attr('class','hint').text('No Camera/Police percentage data available for this feature/year.');
  }

  // show name and counts to the right of the pie
  const name = (properties && (properties.RA_NAME21 || properties.name || properties.NAME || properties.id)) || 'Region';
  const camCount = row && row.Camera_offence_per10k != null ? Number(row.Camera_offence_per10k) : null;
  const polCount = row && row.Police_offence_per10k != null ? Number(row.Police_offence_per10k) : null;
  infoBlock.append('div').attr('class','property').html(`<div class="property-key">Jurisdiction:</div><div class="property-value">${name}</div>`);
  infoBlock.append('div').attr('class','property').html(`<div class="property-key">Camera (per10k):</div><div class="property-value">${camCount != null ? camCount.toLocaleString() : 'N/A'}</div>`);
  infoBlock.append('div').attr('class','property').html(`<div class="property-key">Police (per10k):</div><div class="property-value">${polCount != null ? polCount.toLocaleString() : 'N/A'}</div>`);

  // Line chart below: offences per10k across years for camera and police
  const lineDiv = infoPanel.append('div').attr('class','q3-linechart');
  const yearsData = [];
  if (code && q3DataLookup[code]) {
    Object.keys(q3DataLookup[code]).forEach(y => {
      const r = q3DataLookup[code][y];
      if(!r) return;
      yearsData.push({ year: +y, camera: (r.Camera_offence_per10k != null ? Number(r.Camera_offence_per10k) : null), police: (r.Police_offence_per10k != null ? Number(r.Police_offence_per10k) : null) });
    });
  }
  yearsData.sort((a,b)=>a.year - b.year);

  if (yearsData.length > 0) {
    // responsive width based on container (fall back to 300)
    const containerWidth = (lineDiv.node && lineDiv.node() && lineDiv.node().clientWidth) ? lineDiv.node().clientWidth : 300;
    const lw = Math.max(220, containerWidth);
    const lh = 120;
    // increase right margin so the final year label (e.g. 2024) isn't clipped
    const margin = {top:6,right:30,bottom:22,left:30};
    // clear any previous svg (safety)
    lineDiv.selectAll('svg').remove();
    const svgL = lineDiv.append('svg').attr('width', lw).attr('height', lh);
    const innerW = lw - margin.left - margin.right;
    const innerH = lh - margin.top - margin.bottom;
    const gL = svgL.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(yearsData, d=>d.year)).range([0, innerW]);
    // if only a single year, expand domain so chart can render
    const xDomain = d3.extent(yearsData, d=>d.year);
    if (xDomain[0] === xDomain[1]) {
      x.domain([xDomain[0] - 1, xDomain[1] + 1]);
    }
    // y domain should cover both camera and police values
    const yMin = d3.min(yearsData, d => { const vals = [d.camera, d.police].filter(v=>v!=null); return vals.length? d3.min(vals):0; });
    const yMax = d3.max(yearsData, d => { const vals = [d.camera, d.police].filter(v=>v!=null); return vals.length? d3.max(vals):1; });
    const yMinSafe = (yMin == null || isNaN(yMin)) ? 0 : yMin;
    const yMaxSafe = (yMax == null || isNaN(yMax)) ? 1 : yMax;
    const yScale = d3.scaleLinear().domain([yMinSafe, yMaxSafe]).nice().range([innerH, 0]);

    const lineCam = d3.line().defined(d=>d.camera!=null).x(d=>x(d.year)).y(d=>yScale(d.camera));
    const linePol = d3.line().defined(d=>d.police!=null).x(d=>x(d.year)).y(d=>yScale(d.police));

    // axes
    const xAxis = d3.axisBottom(x).ticks(Math.min(6, yearsData.length)).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(yScale).ticks(3).tickFormat(d=>d.toFixed(0));
    gL.append('g').attr('class','y axis').call(yAxis).selectAll('text').style('font-size','10px');
    gL.append('g').attr('class','x axis').attr('transform', `translate(0,${innerH})`).call(xAxis).selectAll('text').style('font-size','10px');

    // draw lines
    gL.append('path').datum(yearsData).attr('fill','none').attr('stroke','#3388ff').attr('stroke-width',2).attr('d', lineCam);
    gL.append('path').datum(yearsData).attr('fill','none').attr('stroke','#ff5a5a').attr('stroke-width',2).attr('d', linePol);

    // points for camera
    gL.selectAll('.pt-cam').data(yearsData.filter(d=>d.camera!=null)).enter().append('circle').attr('class','pt-cam')
      .attr('r', d => (d.year === currentYear ? 5 : 3))
      .attr('cx', d => x(d.year))
      .attr('cy', d => yScale(d.camera))
      .attr('fill', '#3388ff')
      .attr('stroke', d => (d.year === currentYear ? '#222' : 'none'))
      .attr('stroke-width', d => (d.year === currentYear ? 1.25 : 0));
    // points for police
    gL.selectAll('.pt-pol').data(yearsData.filter(d=>d.police!=null)).enter().append('circle').attr('class','pt-pol')
      .attr('r', d => (d.year === currentYear ? 5 : 3))
      .attr('cx', d => x(d.year))
      .attr('cy', d => yScale(d.police))
      .attr('fill', '#ff5a5a')
      .attr('stroke', d => (d.year === currentYear ? '#222' : 'none'))
      .attr('stroke-width', d => (d.year === currentYear ? 1.25 : 0));

  } else {
    infoPanel.append('div').attr('class','hint').text('No time-series offence data available for this feature.');
  }
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
// global min/max across all years, computed after CSV load
let globalStats = {
  camera: { min: Infinity, max: -Infinity },
  police: { min: Infinity, max: -Infinity },
  both:   { min: Infinity, max: -Infinity }
};

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
  // Use global min/max for the selected mode so the legend stays constant across years
  const stats = globalStats[currentMode] || { min: 0, max: 1 };
  const min = (stats.min != null) ? stats.min : 0;
  const max = (stats.max != null) ? stats.max : 1;
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

    // Create hover tooltip (shows basic feature info)
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'map-tooltip')
      .style('position', 'fixed')
      .style('pointer-events', 'none')
      .style('display', 'none')
      .style('z-index', 99999);

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
        updateInfo(d.properties);
        // tooltip content
        const name = (d.properties && (d.properties.RA_NAME21 || d.properties.RA_CODE21 || d.properties.name)) || 'Region';
        tooltip.style('display','block').html(`<strong>${name}</strong>`);
      })
      .on('mousemove', function(event,d){
        const cx = event.clientX || (event.pageX - window.scrollX);
        const cy = event.clientY || (event.pageY - window.scrollY);
        tooltip.style('left', (cx + 12) + 'px').style('top', (cy + 12) + 'px');
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(150).attr("fill-opacity", 0.3).on('end', function(){ d3.select(this).classed('highlighted', false); });
        updateInfo(null);
        tooltip.style('display','none');
      });

    // Click/select logic
    g.selectAll('.feature')
      .on('click', function(event, d){
        event.stopPropagation();
        const code = getJurisdictionFromProps(d.properties);
        const entry = (q3DataLookup[code] && q3DataLookup[code][currentYear]) ? q3DataLookup[code][currentYear] : null;
        
        g.selectAll('.feature').classed('selected', false);
        d3.select(this).classed('selected', true);
        updateInfo(d.properties);
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

  // compute global min/max for each display mode across all years
  Object.keys(q3DataLookup).forEach(code => {
    Object.keys(q3DataLookup[code]).forEach(yr => {
      const row = q3DataLookup[code][yr];
      if(!row) return;
      const cam = (row.Camera_offence_per10k != null) ? Number(row.Camera_offence_per10k) : (row.Camera_Percentage != null ? Number(row.Camera_Percentage) : null);
      const pol = (row.Police_offence_per10k != null) ? Number(row.Police_offence_per10k) : (row.Police_Percentage != null ? Number(row.Police_Percentage) : null);

      if (cam != null && !isNaN(cam)) {
        globalStats.camera.min = Math.min(globalStats.camera.min, cam);
        globalStats.camera.max = Math.max(globalStats.camera.max, cam);
      }
      if (pol != null && !isNaN(pol)) {
        globalStats.police.min = Math.min(globalStats.police.min, pol);
        globalStats.police.max = Math.max(globalStats.police.max, pol);
      }

      // both uses the numeric offence_per10k values (fallback to 0 if missing)
      const cnum = (!isNaN(Number(row.Camera_offence_per10k))) ? Number(row.Camera_offence_per10k) : 0;
      const pnum = (!isNaN(Number(row.Police_offence_per10k))) ? Number(row.Police_offence_per10k) : 0;
      const sum = cnum + pnum;
      globalStats.both.min = Math.min(globalStats.both.min, sum);
      globalStats.both.max = Math.max(globalStats.both.max, sum);
    });
  });
  // normalize infinities to sensible defaults
  ['camera','police','both'].forEach(k => {
    if (globalStats[k].min === Infinity) globalStats[k].min = 0;
    if (globalStats[k].max === -Infinity) globalStats[k].max = 1;
  });
  console.log('Global stats computed:', globalStats);

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
      // if a feature is currently selected, refresh its info panel so the mini-chart updates
      const sel = g.select('.feature.selected');
      if (!sel.empty()) {
        const selDatum = sel.datum();
        if (selDatum && selDatum.properties) updateInfo(selDatum.properties);
      }
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
  
  const title = currentMode === 'both' ? 'Total Speeding Offences per 10k License Holders' : 
                currentMode === 'camera' ? 'Camera Offences per 10k License Holders' : 'Police Offences per 10k License Holders';
  
  legend.append('div')
    .style('font-weight', 'bold')
    .style('margin-bottom', '8px')
    .text(`Legend: ${title}`);

  const width = 400;
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