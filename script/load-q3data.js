// load-q3data.js
// Loads `data/Q3DATA.csv` and exposes the parsed rows to global hook functions.
// Intended to run after D3 is available on the page.

(function(){
  function parseRow(row){
    const YEAR = (row.YEAR === undefined || row.YEAR === '') ? null : +row.YEAR;
    const JURISDICTION = (row.JURISDICTION === undefined || row.JURISDICTION === '') ? null : row.JURISDICTION.toString().toUpperCase().trim();

    function parseNumber(v){
      if(v === undefined || v === null || v === '') return null;
      const n = +v.toString().replace(/[^0-9.\-]/g, '');
      return Number.isFinite(n) ? n : null;
    }

    const Camera_offence_per10k = parseNumber(row.Camera_offence_per10k);
    const Police_offence_per10k = parseNumber(row.Police_offence_per10k);
    const Camera_Percentage = parseNumber(row.Camera_Percentage);
    const Police_Percentage = parseNumber(row.Police_Percentage);

    return {
      YEAR,
      JURISDICTION,
      Camera_offence_per10k,
      Police_offence_per10k,
      Camera_Percentage,
      Police_Percentage,
      // keep original row for debugging
      _raw: row
    };
  }

  function loadQ3Data(){
    return d3.csv('data/Q3DATA.csv', parseRow)
      .then(data => {
        // Provide data to optional global handlers (if present)
        if(typeof window.populateFilters === 'function'){
          try{ window.populateFilters(data); }catch(e){ console.warn('populateFilters failed', e); }
        }
        if(typeof window.onQ3DataLoaded === 'function'){
          try{ window.onQ3DataLoaded(data); }catch(e){ console.warn('onQ3DataLoaded failed', e); }
        }
        if(typeof window.initQ3Map === 'function'){
          try{ window.initQ3Map(data); }catch(e){ console.warn('initQ3Map failed', e); }
        }

        console.log('Q3 data loaded:', data.length, 'rows');
        return data;
      })
      .catch(err => {
        console.error('Error loading Q3DATA.csv:', err);
        throw err;
      });
  }

  // Auto-run the loader when script is included (matches the example behaviour)
  if(typeof d3 !== 'undefined'){
    loadQ3Data();
  } else {
    console.warn('d3 not found: load-q3data.js did not auto-run. Call loadQ3Data() after d3 is available.');
  }

  // expose function globally so other scripts can call it on demand
  window.loadQ3Data = loadQ3Data;
})();
