// load-q2data.js
// Loads `data/Q2.csv` and exposes the parsed rows to global hook functions.
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

    const Month = parseNumber(row.Month);
    const Sum_FINES = parseNumber(row['Sum(FINES)']);

    return {
      YEAR,
      JURISDICTION,
      Month,
      Sum_FINES,
      // keep original row for debugging
      _raw: row
    };
  }

  function loadQ2Data(){
    return d3.csv('data/Q2.csv', parseRow)
      .then(data => {
        // Provide data to optional global handlers (if present)
        if(typeof window.onQ2DataLoaded === 'function'){
          try{ window.onQ2DataLoaded(data); }catch(e){ console.warn('onQ2DataLoaded failed', e); }
        }

        console.log('Q2 data loaded:', data.length, 'rows');
        return data;
      })
      .catch(err => {
        console.error('Error loading Q2.csv:', err);
        throw err;
      });
  }

  // Auto-run the loader when script is included (matches the example behaviour)
  if(typeof d3 !== 'undefined'){
    loadQ2Data();
  } else {
    console.warn('d3 not found: load-q2data.js did not auto-run. Call loadQ2Data() after d3 is available.');
  }

  // expose function globally so other scripts can call it on demand
  window.loadQ2Data = loadQ2Data;
})();
