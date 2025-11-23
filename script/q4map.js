// ---------------------------
// D3 Map Viewer (TopoJSON) - scoped to Q4
// ---------------------------
(function(){

// Use the map card inner dimensions so the SVG fills the card
const mapContainer = document.getElementById('map-q4') ? document.getElementById('map-q4').parentElement : (document.querySelector('#card-q4 .map-inner') || document.querySelector('.map-inner'));
let width = mapContainer ? Math.max(200, mapContainer.clientWidth) : window.innerWidth;
let height = mapContainer ? Math.max(200, mapContainer.clientHeight) : window.innerHeight;

const svg = d3.select("#map-q4")
  .attr("width", width)
  .attr("height", height)
  .style('cursor','grab');

const g = svg.append("g");

const infoPanel = d3.select("#infoPanel-q4");
const loading = d3.select("#loading-q4");

// Data holders for Q4
let q4Lookup = {};
let currentQ4Mode = 'all'; // 'all','17-25','26-39','40-64','65 and over'
let csvLoaded = false;
let topoLoaded = false;
let q4GlobalStats = {
  'all': {min: Infinity, max: -Infinity},
  '17-25': {min: Infinity, max: -Infinity},
  '26-39': {min: Infinity, max: -Infinity},
  '40-64': {min: Infinity, max: -Infinity},
  '65 and over': {min: Infinity, max: -Infinity}
};
// overall fixed legend domain (computed once after CSV load)
let q4OverallStats = { min: 0, max: 1 };

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

// Info panel update for Q4
function updateInfo(properties) {
  if (!properties) {
    infoPanel.html("<h3>Feature Info</h3><div class='hint'>Hover over features to see details</div>");
    return;
  }

  const jurisName = (properties && (properties.RA_NAME21 || properties.name || properties.NAME || properties.RA_CODE21 || properties.id)) || 'Region';
  const code = getJurisdictionFromProps(properties) || '';

  // Build the info HTML including a placeholder for the pie chart
  let html = `<h3>Feature Info</h3>`;
  html += `<div class="property"><div class="property-key">Jurisdiction:</div><div class="property-value">${jurisName}${code ? ` (${code})` : ''}</div></div>`;

  // show computed per10k rate if CSV is available
  if (csvLoaded && code) {
      const rate = computeQ4Value(code, currentQ4Mode);
      html += `<div class="property"><div class="property-key">Rate (per10k):</div><div class="property-value">${rate != null ? rate.toFixed(1) : 'N/A'}</div></div>`;
    }
  
    // Pie container: svg with legend placed beneath the pie (centered)
    html += `<div class="q4-pie-wrap" style="margin-top:8px;display:flex;flex-direction:column;align-items:center;">
      <svg class="q4-pie" width="180" height="180" aria-label="Age group distribution"></svg>
      <div class="q4-pie-legend" style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center"></div>
    </div>`;

  infoPanel.html(html);

  // Render pie chart of age-group offences (counts) for this jurisdiction
  const pieSvg = d3.select('#infoPanel-q4').select('svg.q4-pie');
  pieSvg.selectAll('*').remove();
  if (!csvLoaded || !code || !q4Lookup[code]) {
    // show placeholder text
    pieSvg.append('text').attr('x',110).attr('y',80).attr('text-anchor','middle').style('font-size','12px').text('No data');
    return;
  }

  // Age groups we care about (order controls pie slice order)
  const AGE_GROUPS = ['17-25','26-39','40-64','65 and over'];
  const entry = q4Lookup[code];
  // compute per10k values for each age group (value) and keep raw offences for display
  const pieData = AGE_GROUPS.map(age => {
    const e = entry[age] || { offences: 0, license: 0 };
    const offences = Number(e.offences) || 0;
    const license = Number(e.license) || 0;
    const value = license > 0 ? (offences / license) * 10000 : 0;
    return { age, offences, license, value };
  });
  const totalVal = pieData.reduce((s, d) => s + (d.value || 0), 0);

  const w = +pieSvg.attr('width');
  const h = +pieSvg.attr('height');
  const radius = Math.min(w, h) / 2 - 10;
  // center pie within its svg (small left nudge removed since svg width increased)
  const gPie = pieSvg.append('g').attr('transform', `translate(${w/2},${h/2})`);

  const color = d3.scaleOrdinal().domain(AGE_GROUPS).range(['#4daf4a','#377eb8','#ff7f00','#984ea3']);

  const pie = d3.pie().value(d => d.value).sort(null);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const slices = gPie.selectAll('path').data(pie(pieData)).enter().append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.age))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);

  // labels (percent)
  const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.9);
  gPie.selectAll('text').data(pie(pieData)).enter().append('text')
    .attr('transform', d => `translate(${labelArc.centroid(d)})`)
    .attr('text-anchor','middle')
    .style('font-size','10px')
    .style('fill','#ffffff')
    .text(d => {
      if (!totalVal) return '';
      const pct = (d.data.value / totalVal) * 100;
      return pct >= 5 ? `${Math.round(pct)}%` : '';
    });

  // legend placed centered beneath the pie
  // legend rendered as HTML beneath the pie; show only per10k number (no raw counts)
  const legendDiv = d3.select('#infoPanel-q4').select('.q4-pie-legend');
  legendDiv.html('');
  legendDiv.style('display','flex').style('gap','10px').style('flex-wrap','wrap').style('justify-content','center');
  pieData.forEach(d => {
    const item = legendDiv.append('div').style('display','flex').style('align-items','center').style('gap','6px').style('margin','4px 6px');
    item.append('div').style('width','12px').style('height','12px').style('background', color(d.age));
    const valText = d.value != null ? `${d.value.toFixed(1)}` : 'N/A';
    // include age group label before the per10k value
    item.append('div').style('font-size','12px').text(`${d.age}: ${valText}`);
  });
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

// Load and draw TopoJSON
d3.json("mapOfKangaroos.json")
  .then((topology) => {
    loading.style("display", "none");

    const objectKey = Object.keys(topology.objects)[0];
    console.log("Loaded TopoJSON object:", objectKey);

    const data = topojson.feature(topology, topology.objects[objectKey]);
    geojsonData = data;

  
    projection = d3.geoIdentity()
      .reflectY(true)
      .fitSize([width, height], data);

    path = d3.geoPath(projection);

    // Draw features
    const features = g.selectAll(".feature")
      .data(data.features)
      .enter()
      .append("path")
      .attr("class", "feature")
      .attr("d", path)
      .on("mouseenter", function (event, d) {
        const sel = d3.select(this);
        sel.classed("highlighted", true);
        sel.transition()
          .duration(150)
          .attr("fill-opacity", 0.55);
        updateInfo(d.properties);
      })
      .on("mouseleave", function () {
        const sel = d3.select(this);
        sel.classed("highlighted", false);
        sel.transition()
          .duration(150)
          .attr("fill-opacity", 0.3);
        updateInfo(null);
      });

    // Create a lightweight tooltip that follows the cursor on hover
    // Use fixed positioning and a very high z-index so it appears above the SVG layers
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'map-tooltip')
      .style('position', 'fixed')
      .style('pointer-events', 'none')
      .style('display', 'none')
      .style('z-index', 99999);

    // Click selects feature (no zoom) and shows properties in the info panel
    g.selectAll('.feature')
      .on('click', function(event, d){
        event.stopPropagation();
        // mark selected (single selection)
        g.selectAll('.feature').classed('selected', false);
        d3.select(this).classed('selected', true);
        updateInfo(d.properties);
      });

    // Hover: visual highlight is handled by CSS .highlighted; show tooltip and follow pointer
    g.selectAll('.feature')
      .on('mouseenter', function (event, d) {
        const sel = d3.select(this);
        sel.classed('highlighted', true);
        sel.transition()
          .duration(150)
          .attr('fill-opacity', 0.55);
        updateInfo(d.properties);
        const ttCode = getJurisdictionFromProps(d.properties) || '';
        const ttName = (d.properties && (d.properties.RA_NAME21 || d.properties.name || d.properties.NAME || d.properties.RA_CODE21 || d.properties.id)) || ttCode || 'Region';
        const ttRate = (csvLoaded && ttCode) ? computeQ4Value(ttCode, currentQ4Mode) : null;
        let ttHtml = `<strong>${ttName}${ttCode ? ` (${ttCode})` : ''}</strong>`;
        if (ttRate != null) ttHtml += `<div style="font-size:12px;margin-top:4px">Rate: ${ttRate.toFixed(1)} per 10k License Holders</div>`;
        tooltip.style('display', 'block').html(ttHtml);
      })
      .on('mousemove', function(event, d){
        // Use client coordinates so tooltip is placed relative to viewport
        const cx = event.clientX || (event.pageX - window.scrollX);
        const cy = event.clientY || (event.pageY - window.scrollY);
        tooltip.style('left', (cx + 12) + 'px')
               .style('top', (cy + 12) + 'px');
      })
      .on('mouseleave', function () {
        const sel = d3.select(this);
        sel.classed('highlighted', false);
        sel.transition()
          .duration(150)
          .attr('fill-opacity', 0.3);
        updateInfo(null);
        tooltip.style('display', 'none');
      });

    // Clicking on empty space clears selection/info
    svg.on('click', function(event){
      // Only clear if clicked directly on svg (not on a feature path)
      if(event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'svg'){
        g.selectAll('.feature').classed('selected', false);
        updateInfo(null);
      }
    });

    // Add labels (placed using the main projection so they align with the features)
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

    topoLoaded = true;
    tryUpdateQ4Choropleth();
    fitToMap();
    })
    .catch((err) => {
      loading.html(`Error: ${err.message}`);
      console.error("Error loading TopoJSON:", err);
    });

  // --- CSV loading for Q4 ---
  // Q4 CSV is loaded by `script/load-q4data.js`. That loader will call
  // `window.initQ4Map(rows)` when the data is ready. We expose that function
  // here so the loader can hand over the parsed rows and let this script
  // compute lookups and stats.
  window.initQ4Map = function(rows){
    // reset lookup and stats
    q4Lookup = {};
    q4GlobalStats = {
      'all': {min: Infinity, max: -Infinity},
      '17-25': {min: Infinity, max: -Infinity},
      '26-39': {min: Infinity, max: -Infinity},
      '40-64': {min: Infinity, max: -Infinity},
      '65 and over': {min: Infinity, max: -Infinity}
    };

    // build lookup: q4Lookup[jurisdiction][age_group] = { offences, license }
    rows.forEach(r => {
      const code = (''+r.JURISDICTION).toUpperCase().trim();
      const age = (''+r.AGE_GROUP).trim();
      q4Lookup[code] = q4Lookup[code] || {};
      q4Lookup[code][age] = { offences: Number(r['Sum(Combined Offences)'] || 0), license: Number(r.License_holder || 0) };
    });

    // compute global stats for each mode (per10k values)
    Object.keys(q4Lookup).forEach(code => {
      // per age groups
      ['17-25','26-39','40-64','65 and over'].forEach(age => {
        const entry = q4Lookup[code][age];
        if (entry && entry.license > 0) {
          const v = (entry.offences / entry.license) * 10000;
          q4GlobalStats[age].min = Math.min(q4GlobalStats[age].min, v);
          q4GlobalStats[age].max = Math.max(q4GlobalStats[age].max, v);
        }
      });
      // all ages: sum across ages
      const ages = Object.keys(q4Lookup[code]);
      let sOff = 0, sLic = 0;
      ages.forEach(a => {
        const e = q4Lookup[code][a];
        if (e) { sOff += (Number(e.offences) || 0); sLic += (Number(e.license) || 0); }
      });
      if (sLic > 0) {
        const v = (sOff / sLic) * 10000;
        q4GlobalStats['all'].min = Math.min(q4GlobalStats['all'].min, v);
        q4GlobalStats['all'].max = Math.max(q4GlobalStats['all'].max, v);
      }
    });
    // normalize
    Object.keys(q4GlobalStats).forEach(k => {
      if (q4GlobalStats[k].min === Infinity) q4GlobalStats[k].min = 0;
      if (q4GlobalStats[k].max === -Infinity) q4GlobalStats[k].max = 1;
    });

    // compute overall fixed domain across all modes so legend stays fixed
    let gmin = Infinity, gmax = -Infinity;
    Object.keys(q4GlobalStats).forEach(k => {
      gmin = Math.min(gmin, q4GlobalStats[k].min);
      gmax = Math.max(gmax, q4GlobalStats[k].max);
    });
    if (gmin === Infinity) gmin = 0;
    if (gmax === -Infinity) gmax = 1;
    // avoid degenerate domain
    if (gmin === gmax) { gmax = gmin + 1; }
    q4OverallStats = { min: gmin, max: gmax };

    csvLoaded = true;
    tryUpdateQ4Choropleth();

    // Buttons are provided in the HTML (bottom control row). Just mark default mode.
    setQ4Mode(currentQ4Mode);
  };

  function tryUpdateQ4Choropleth(){
    if (!topoLoaded || !csvLoaded) return;
    updateQ4Choropleth(currentQ4Mode);
  }

  function setQ4Mode(mode){
    currentQ4Mode = mode;
    d3.selectAll('#q4-mode-tabs .mode-tab').classed('active', false);
    d3.select(`#mode-${mode.replace(/\s+/g,'-')}-q4`).classed('active', true);
    updateQ4Choropleth(mode);
  }

  function getJurisdictionFromProps(props) {
    if (!props) return null;
    if (props.id) {
      const id = props.id.toUpperCase().trim();
      const validCodes = ['NSW', 'NT', 'QLD', 'WA', 'SA', 'TAS', 'VIC', 'ACT'];
      if (validCodes.includes(id)) return id;
    }
    if (props.name) {
      const name = props.name.trim().toUpperCase();
      const MAP = {
        'NEW SOUTH WALES': 'NSW', 'NORTHERN TERRITORY': 'NT', 'QUEENSLAND': 'QLD', 'WESTERN AUSTRALIA': 'WA',
        'SOUTH AUSTRALIA': 'SA', 'TASMANIA': 'TAS', 'VICTORIA': 'VIC', 'AUSTRALIAN CAPITAL TERRITORY': 'ACT'
      };
      return MAP[name] || null;
    }
    if (props.RA_CODE21) return (''+props.RA_CODE21).toUpperCase();
    return null;
  }

  function computeQ4Value(code, mode){
    const entry = q4Lookup[code];
    if (!entry) return null;
    if (mode === 'all'){
      let sOff=0, sLic=0;
      Object.keys(entry).forEach(a => { sOff += (Number(entry[a].offences)||0); sLic += (Number(entry[a].license)||0); });
      if (sLic <= 0) return null;
      return (sOff / sLic) * 10000;
    }
    const e = entry[mode];
    if (!e || e.license <= 0) return null;
    return (e.offences / e.license) * 10000;
  }

  function updateQ4Choropleth(mode){
    // Use the overall fixed domain (so legend doesn't change when switching modes)
    const min = q4OverallStats.min;
    const max = q4OverallStats.max;
    const color = d3.scaleSequential().domain([min, max]).interpolator(d3.interpolateYlOrRd);

    g.selectAll('.feature').transition().duration(300).attr('fill', function(d){
      const code = getJurisdictionFromProps(d.properties);
      const val = computeQ4Value(code, mode);
      return val != null ? color(val) : '#eee';
    });
    updateQ4Legend(min, max, color, mode);
  }

  function updateQ4Legend(min,max,color,mode){
    let legend = d3.select('#legend-q4');
    if (legend.empty()){
      legend = d3.select('#card-q4').append('div').attr('id','legend-q4').style('margin','12px 18px').style('padding','12px').style('background','#f9f9f9').style('border','1px solid #ddd').style('border-radius','4px');
    }
    legend.html('');
    const title = mode === 'all' ? 'Offences per 10k License Holders (All Ages)' : `Offences per 10k License Holders (${mode})`;
    legend.append('div').style('font-weight','bold').style('margin-bottom','8px').text(`Legend: ${title}`);
    const w = 400; const h = 18;
    const svgLegend = legend.append('svg').attr('width', w).attr('height', h+30);
    const gradient = svgLegend.append('defs').append('linearGradient').attr('id','legend-q4-gradient').attr('x1',0).attr('x2',1);
    gradient.append('stop').attr('offset','0%').attr('stop-color', color(min));
    gradient.append('stop').attr('offset','100%').attr('stop-color', color(max));
    svgLegend.append('rect').attr('width', w).attr('height', h).style('fill','url(#legend-q4-gradient)');
    svgLegend.append('text').attr('x',0).attr('y',h+15).style('font-size','12px').style('font-weight','bold').text(Math.round(min));
    svgLegend.append('text').attr('x', w-40).attr('y',h+15).style('font-size','12px').style('font-weight','bold').text(Math.round(max));
  }

// Zoom buttons only (scoped to Q4)
d3.select("#zoomIn-q4").on("click", () => {
  svg.transition().duration(300).call(zoom.scaleBy, 1.5);
});

d3.select("#zoomOut-q4").on("click", () => {
  svg.transition().duration(300).call(zoom.scaleBy, 0.67);
});

d3.select("#reset-q4").on("click", fitToMap);

// Mode buttons (Q4) - wire static HTML buttons to the mode setter
d3.select("#mode-all-q4").on("click", () => setQ4Mode('all'));
d3.select("#mode-17-25-q4").on("click", () => setQ4Mode('17-25'));
d3.select("#mode-26-39-q4").on("click", () => setQ4Mode('26-39'));
d3.select("#mode-40-64-q4").on("click", () => setQ4Mode('40-64'));
d3.select("#mode-65-and-over-q4").on("click", () => setQ4Mode('65 and over'));

// Handle resize
window.addEventListener("resize", () => {
  const newW = mapContainer ? Math.max(200, mapContainer.clientWidth) : window.innerWidth;
  const newH = mapContainer ? Math.max(200, mapContainer.clientHeight) : window.innerHeight;
  svg.attr("width", newW).attr("height", newH);

  if (geojsonData && projection) {
    projection.fitSize([newW, newH], geojsonData);
    g.selectAll(".feature").attr("d", path);
    // update labels positions too
    g.selectAll('.state-label')
      .attr('x', d => { const p = projection(d.coords); return p ? p[0] : 0; })
      .attr('y', d => { const p = projection(d.coords); return p ? p[1] : 0; });
    fitToMap();
  }
});

})();
