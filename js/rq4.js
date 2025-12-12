// RQ4: Age Group Offences by Jurisdiction
// D3 Map Visualization with real data from Q4DATA.csv

(function(){

    // Use the map card inner dimensions so the SVG fills the card
    const mapContainer = document.getElementById('rq4-map') ? document.getElementById('rq4-map').parentElement : document.querySelector('.map-container');
    const isMobile = window.innerWidth <= 768;
    let width = mapContainer ? Math.max(200, mapContainer.clientWidth) : 900;
    let height = mapContainer ? Math.max(200, mapContainer.clientHeight) : (isMobile ? 350 : 600);
    
    // Update hint text based on device type
    if (isMobile) {
        d3.select('#infoPanel-rq4 .hint').text('Tap on a region to see details');
    }

    const svg = d3.select("#rq4-map")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", isMobile ? "350px" : "100%")
      .style('cursor','grab');
    
    const g = svg.append("g");
    
    const infoPanel = d3.select("#infoPanel-rq4");
    const loading = d3.select("#loading-rq4");
    
    // Data holders for Q4
    let q4Lookup = {};
    let currentQ4Mode = 'all';
    let csvLoaded = false;
    let topoLoaded = false;
    let q4GlobalStats = {
      'all': {min: Infinity, max: -Infinity},
      '17-25': {min: Infinity, max: -Infinity},
      '26-39': {min: Infinity, max: -Infinity},
      '40-64': {min: Infinity, max: -Infinity},
      '65 and over': {min: Infinity, max: -Infinity}
    };
    let q4OverallStats = { min: 0, max: 1 };
    
    let projection, path, geojsonData;
    const horizontalShift = 200;
    
    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.8, 12])
      .on("zoom", (event) => g.attr("transform", event.transform))
      .on("start", () => svg.style('cursor','grabbing'))
      .on("end", () => svg.style('cursor','grab'));
    
    svg.call(zoom).on("wheel.zoom", null).on("dblclick.zoom", null);
    
    // State labels
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
      infoPanel.html('');
      const isMobileView = window.innerWidth <= 768;

      if (!properties) {
        const hintText = isMobileView ? "Tap on a region to see details" : "Hover over features to see details";
        infoPanel.html(`<h3>Feature Info</h3><div class='hint'>${hintText}</div>`);
        
        // Hide panel on mobile if no selection
        if (isMobileView) {
             infoPanel.style('display', 'none');
        }
        return;
      }
    
      const jurisName = (properties && (properties.RA_NAME21 || properties.name || properties.NAME || properties.RA_CODE21 || properties.id)) || 'Region';
      const code = getJurisdictionFromProps(properties) || '';
    
      // Build HTML with Close Button
      let html = `<div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3 style="margin:0;">Feature Info</h3>
                    <button id="rq4-close-btn" style="background:none; border:none; font-size:20px; cursor:pointer; padding:0 5px; color:#666; line-height:1;">&times;</button>
                  </div>`;
                  
      html += `<div class="property" style="margin-top:10px;"><div class="property-key">Jurisdiction:</div><div class="property-value">${jurisName}${code ? ` (${code})` : ''}</div></div>`;
    
      if (csvLoaded && code) {
          const rate = computeQ4Value(code, currentQ4Mode);
          html += `<div class="property"><div class="property-key">Rate (per10k):</div><div class="property-value">${rate != null ? rate.toFixed(1) : 'N/A'}</div></div>`;
      }
      
      // SCALING LOGIC FOR MOBILE PIE CHART
      // Standard: 180px, Mobile: 140px
      const chartSize = isMobileView ? 140 : 180;

      html += `<div class="q4-pie-wrap" style="margin-top:8px;display:flex;flex-direction:column;align-items:center;">
          <svg class="q4-pie" width="${chartSize}" height="${chartSize}" aria-label="Age group distribution"></svg>
          <div class="q4-pie-legend" style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center"></div>
        </div>`;
    
      infoPanel.html(html);

      // Add close button listener
      d3.select('#rq4-close-btn').on('click', function(e) {
        e.stopPropagation();
        g.selectAll('.feature').classed('selected', false);
        updateInfo(null);
        // Ensure it hides on mobile when closed
        if (window.innerWidth <= 768) {
            infoPanel.style('display', 'none');
        }
      });
    
      const pieSvg = d3.select('#infoPanel-rq4').select('svg.q4-pie');
      pieSvg.selectAll('*').remove();
      if (!csvLoaded || !code || !q4Lookup[code]) {
        pieSvg.append('text')
            .attr('x', chartSize/2)
            .attr('y', chartSize/2)
            .attr('text-anchor','middle')
            .style('font-size','12px')
            .text('No data');
        return;
      }
    
      const AGE_GROUPS = ['17-25','26-39','40-64','65 and over'];
      const entry = q4Lookup[code];
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
      const gPie = pieSvg.append('g').attr('transform', `translate(${w/2},${h/2})`);
    
      const color = d3.scaleOrdinal().domain(AGE_GROUPS).range(['#4daf4a','#377eb8','#ff7f00','#984ea3']);
    
      const pie = d3.pie().value(d => d.value).sort(null);
      const arc = d3.arc().innerRadius(0).outerRadius(radius);
    
      const slices = gPie.selectAll('path').data(pie(pieData)).enter().append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.age))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    
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
    
      const legendDiv = d3.select('#infoPanel-rq4').select('.q4-pie-legend');
      legendDiv.html('');
      legendDiv.style('display','flex').style('gap','10px').style('flex-wrap','wrap').style('justify-content','center');
      pieData.forEach(d => {
        const item = legendDiv.append('div').style('display','flex').style('align-items','center').style('gap','6px').style('margin','4px 6px');
        item.append('div').style('width','12px').style('height','12px').style('background', color(d.age));
        const valText = d.value != null ? `${d.value.toFixed(1)}` : 'N/A';
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
    
    // Load TopoJSON
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
          
          // CLICK HANDLER (Both Mobile and Desktop now)
          .on('click', function(event, d){
            event.stopPropagation();
            g.selectAll('.feature').classed('selected', false);
            d3.select(this).classed('selected', true);
            
            // MOBILE POPUP LOGIC
            if (window.innerWidth <= 768) {
                // FIXED POSITION BOTTOM CENTER
                infoPanel
                    .style('display', 'block')
                    .style('position', 'fixed')
                    .style('left', '50%')
                    .style('top', 'auto')
                    .style('bottom', '20px') // 20px from bottom
                    .style('transform', 'translateX(-50%)') // Centered horizontally
                    .style('z-index', '10000')
                    .style('width', '280px')
                    .style('background', 'white')
                    .style('box-shadow', '0 4px 15px rgba(0,0,0,0.3)')
                    .style('border-radius', '12px')
                    .style('padding', '16px');
                
                // Update content
                updateInfo(d.properties);
            } else {
                updateInfo(d.properties);
            }
          })
          
          // HOVER HANDLER (Desktop Only)
          .on('mouseenter', function (event, d) {
            if (window.innerWidth <= 768) return; // Disable hover on mobile
    
            const sel = d3.select(this);
            sel.classed('highlighted', true);
            sel.transition().duration(150).attr("fill-opacity", 0.55);
            updateInfo(d.properties);
          })
          
          .on('mouseleave', function () {
            if (window.innerWidth <= 768) return; // Disable hover on mobile
            const sel = d3.select(this);
            sel.classed('highlighted', false);
            sel.transition().duration(150).attr("fill-opacity", 0.3);
            // Don't clear info panel on mouseleave, keep last selection or hover state
          });
    
        // Click on empty space deselects
        svg.on('click', function(event){
          if(event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'svg'){
            g.selectAll('.feature').classed('selected', false);
            updateInfo(null);
          }
        });
        
        // Global Body Click to close mobile panel
        d3.select('body').on('click', function() {
            if (window.innerWidth <= 768) {
                infoPanel.style('display', 'none');
                g.selectAll('.feature').classed('selected', false);
            }
        });
        
        // Prevent clicks inside panel from closing it
        infoPanel.on('click', function(event) {
            event.stopPropagation();
        });
    
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
    
    // Load Q4 CSV
    window.initQ4Map = function(rows){
      q4Lookup = {};
      q4GlobalStats = {
        'all': {min: Infinity, max: -Infinity},
        '17-25': {min: Infinity, max: -Infinity},
        '26-39': {min: Infinity, max: -Infinity},
        '40-64': {min: Infinity, max: -Infinity},
        '65 and over': {min: Infinity, max: -Infinity}
      };
    
      rows.forEach(r => {
        const code = (''+r.JURISDICTION).toUpperCase().trim();
        const age = (''+r.AGE_GROUP).trim();
        q4Lookup[code] = q4Lookup[code] || {};
        q4Lookup[code][age] = { offences: Number(r['Sum(Combined Offences)'] || 0), license: Number(r.License_holder || 0) };
      });
    
      Object.keys(q4Lookup).forEach(code => {
        ['17-25','26-39','40-64','65 and over'].forEach(age => {
          const entry = q4Lookup[code][age];
          if (entry && entry.license > 0) {
            const v = (entry.offences / entry.license) * 10000;
            q4GlobalStats[age].min = Math.min(q4GlobalStats[age].min, v);
            q4GlobalStats[age].max = Math.max(q4GlobalStats[age].max, v);
          }
        });
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
      
      Object.keys(q4GlobalStats).forEach(k => {
        if (q4GlobalStats[k].min === Infinity) q4GlobalStats[k].min = 0;
        if (q4GlobalStats[k].max === -Infinity) q4GlobalStats[k].max = 1;
      });
    
      let gmin = Infinity, gmax = -Infinity;
      Object.keys(q4GlobalStats).forEach(k => {
        gmin = Math.min(gmin, q4GlobalStats[k].min);
        gmax = Math.max(gmax, q4GlobalStats[k].max);
      });
      if (gmin === Infinity) gmin = 0;
      if (gmax === -Infinity) gmax = 1;
      if (gmin === gmax) { gmax = gmin + 1; }
      q4OverallStats = { min: gmin, max: gmax };
    
      csvLoaded = true;
      tryUpdateQ4Choropleth();
    
      setQ4Mode(currentQ4Mode);
    };
    
    // Load CSV using d3
    d3.csv('data/Q4DATA.csv').then(rows => {
      console.log('Q4 CSV loaded:', rows.length, 'rows');
      
      // Parse data
      const parsedRows = rows.map(row => {
        return {
          JURISDICTION: row.JURISDICTION,
          AGE_GROUP: row.AGE_GROUP,
          'Sum(Combined Offences)': Number(row['Sum(Combined Offences)']) || 0,
          License_holder: Number(row.License_holder) || 0
        };
      });
      
      window.initQ4Map(parsedRows);
    }).catch(err => {
      console.error('Failed to load Q4 CSV:', err);
      loading.html(`CSV Error: ${err.message}`);
    });
    
    function tryUpdateQ4Choropleth(){
      if (!topoLoaded || !csvLoaded) return;
      updateQ4Choropleth(currentQ4Mode);
    }
    
    function setQ4Mode(mode){
      currentQ4Mode = mode;
      d3.selectAll('#q4-mode-tabs .mode-tab').classed('active', false);
      d3.select(`#mode-${mode.replace(/\s+/g,'-')}-rq4`).classed('active', true);
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
    
    // UPDATED: Using #legend-container-rq4 without absolute positioning
    function updateQ4Legend(min,max,color,mode){
      let legend = d3.select('#legend-container-rq4');
      
      // Clear content
      legend.html('');
      
      const title = mode === 'all' ? 'Offences per 10k License Holders (All Ages)' : `Offences per 10k License Holders (${mode})`;
      
      // Append title
      legend.append('div')
        .style('font-weight','bold')
        .style('margin-bottom','4px')
        .style('font-size','14px')
        .text(`Legend: ${title}`);
        
      const w = 350; 
      const h = 18;
      const svgLegend = legend.append('svg')
        .attr('width', w)
        .attr('height', h+30)
        .style('display', 'block');
        
      const gradient = svgLegend.append('defs')
        .append('linearGradient')
        .attr('id','legend-rq4-gradient')
        .attr('x1',0).attr('x2',1);
        
      gradient.append('stop').attr('offset','0%').attr('stop-color', color(min));
      gradient.append('stop').attr('offset','100%').attr('stop-color', color(max));
      
      svgLegend.append('rect').attr('width', w).attr('height', h).style('fill','url(#legend-rq4-gradient)');
      
      svgLegend.append('text').attr('x',0).attr('y',h+15).style('font-size','12px').style('font-weight','bold').text(Math.round(min));
      svgLegend.append('text').attr('x', w).attr('y',h+15).style('font-size','12px').style('font-weight','bold').style('text-anchor','end').text(Math.round(max));
    }
    
    // Zoom buttons
    d3.select("#zoomIn-rq4").on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    });
    
    d3.select("#zoomOut-rq4").on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.67);
    });
    
    d3.select("#reset-rq4").on("click", fitToMap);
    
    // Mode buttons
    d3.select("#mode-all-rq4").on("click", () => setQ4Mode('all'));
    d3.select("#mode-17-25-rq4").on("click", () => setQ4Mode('17-25'));
    d3.select("#mode-26-39-rq4").on("click", () => setQ4Mode('26-39'));
    d3.select("#mode-40-64-rq4").on("click", () => setQ4Mode('40-64'));
    d3.select("#mode-65-and-over-rq4").on("click", () => setQ4Mode('65 and over'));
    
    // Handle resize
    window.addEventListener("resize", () => {
      const newIsMobile = window.innerWidth <= 768;
      const newW = mapContainer ? Math.max(200, mapContainer.clientWidth) : window.innerWidth;
      const newH = mapContainer ? Math.max(200, mapContainer.clientHeight) : (newIsMobile ? 350 : window.innerHeight);
      svg.attr("viewBox", `0 0 ${newW} ${newH}`)
           .style("height", newIsMobile ? "350px" : "100%");
    
      if (geojsonData && projection) {
        projection.fitSize([newW, newH], geojsonData);
        g.selectAll(".feature").attr("d", path);
        g.selectAll('.state-label')
          .attr('x', d => { const p = projection(d.coords); return p ? p[0] : 0; })
          .attr('y', d => { const p = projection(d.coords); return p ? p[1] : 0; });
        fitToMap();
      }

      // RESET InfoPanel to Desktop State if resized
      if (!newIsMobile) {
        infoPanel
            .style('position', 'relative')
            .style('left', '')
            .style('top', '')
            .style('bottom', '') // Clear bottom property
            .style('transform', '')
            .style('z-index', '')
            .style('width', '')
            .style('box-shadow', '')
            .style('display', 'block')
            .style('border-radius', '')
            .style('padding', '');
      } else {
        // If resized to mobile and nothing selected, hide it
        if (g.select('.feature.selected').empty()) {
            infoPanel.style('display', 'none');
        }
      }
    });
    
    })();