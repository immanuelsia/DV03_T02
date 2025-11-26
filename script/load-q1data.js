// load-q1data.js
// Loads `data/Q1.csv` and exposes the parsed rows to global hook functions.
// Intended to run after D3 is available on the page.

(function(){
  function parseRow(row){
    const JURISDICTION = (row.JURISDICTION === undefined || row.JURISDICTION === '') ? null : row.JURISDICTION.toString().toUpperCase().trim();

    function parseNumber(v){
      if(v === undefined || v === null || v === '') return null;
      const n = +v.toString().replace(/[^0-9.\-]/g, '');
      return Number.isFinite(n) ? n : null;
    }

    const Month = parseNumber(row.Month);
    const Sum_FINES = parseNumber(row['Sum(FINES)']);

    return {
      JURISDICTION,
      Month,
      Sum_FINES,
      // keep original row for debugging
      _raw: row
    };
  }

  function loadQ1Data(){
    return d3.csv('data/Q1.csv', parseRow)
      .then(data => {
        // Provide data to optional global handlers (if present)
        if(typeof window.onQ1DataLoaded === 'function'){
          try{ window.onQ1DataLoaded(data); }catch(e){ console.warn('onQ1DataLoaded failed', e); }
        }

        console.log('Q1 data loaded:', data.length, 'rows');
        return data;
      })
      .catch(err => {
        console.error('Error loading Q1.csv:', err);
        throw err;
      });
  }

  // Auto-run the loader when script is included (matches the example behaviour)
  if(typeof d3 !== 'undefined'){
    loadQ1Data();
  } else {
    console.warn('d3 not found: load-q1data.js did not auto-run. Call loadQ1Data() after d3 is available.');
  }

  // expose function globally so other scripts can call it on demand
  window.loadQ1Data = loadQ1Data;
})();
