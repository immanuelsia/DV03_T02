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
  .attr("height", height);

const g = svg.append("g");

const infoPanel = d3.select("#infoPanel-q4");
const loading = d3.select("#loading-q4");

let projection, path, geojsonData;

// Disable all zoom gestures, allow only programmatic zoom
const zoom = d3.zoom()
  .scaleExtent([0.8, 12])
  .on("zoom", (event) => g.attr("transform", event.transform));

svg.call(zoom)
  .on("wheel.zoom", null)
  .on("dblclick.zoom", null)
  .on("mousedown.zoom", null);

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

// Info panel update
function updateInfo(properties) {
  if (!properties) {
    infoPanel.html("<h3>Feature Info</h3><div class='hint'>Hover over features to see details</div>");
    return;
  }

  const props = Object.entries(properties)
    .map(([k, v]) => `<div class="property">
        <div class="property-key">${k}:</div>
        <div class="property-value">${v}</div>
      </div>`)
    .join("");

  infoPanel.html(`<h3>Feature Info</h3>${props}`);
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
  const translate = [width / 2 - scale * x, height / 2 - scale * y];

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
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill-opacity", 0.55)
          .classed("highlighted", true);
        updateInfo(d.properties);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill-opacity", 0.3)
          .classed("highlighted", false);
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
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill-opacity', 0.55)
          .classed('highlighted', true);
        updateInfo(d.properties);
        const name = (d.properties && (d.properties.RA_NAME21 || d.properties.RA_CODE21)) || 'Region';
        tooltip.style('display', 'block').html(`<strong>${name}</strong>`);
      })
      .on('mousemove', function(event, d){
        // Use client coordinates so tooltip is placed relative to viewport
        const cx = event.clientX || (event.pageX - window.scrollX);
        const cy = event.clientY || (event.pageY - window.scrollY);
        tooltip.style('left', (cx + 12) + 'px')
               .style('top', (cy + 12) + 'px');
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill-opacity', 0.3)
          .classed('highlighted', false);
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

    fitToMap();
  })
  .catch((err) => {
    loading.html(`Error: ${err.message}`);
    console.error("Error loading TopoJSON:", err);
  });

// Zoom buttons only (scoped to Q4)
d3.select("#zoomIn-q4").on("click", () => {
  svg.transition().duration(300).call(zoom.scaleBy, 1.5);
});

d3.select("#zoomOut-q4").on("click", () => {
  svg.transition().duration(300).call(zoom.scaleBy, 0.67);
});

d3.select("#reset-q4").on("click", fitToMap);

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
