// load-q4data.js
// Loads `data/Q4DATA.csv` and exposes the parsed rows to global hook functions.
// Intended to run after D3 is available on the page.

(function(){
  function parseRow(row){
    function parseNumber(v){
      if(v === undefined || v === null || v === '') return null;
      const n = +v.toString().replace(/[^0-9.\-]/g, '');
      return Number.isFinite(n) ? n : null;
    }

    const JURISDICTION = (row.JURISDICTION === undefined || row.JURISDICTION === '') ? null : row.JURISDICTION.toString().toUpperCase().trim();
    const AGE_GROUP = (row.AGE_GROUP === undefined || row.AGE_GROUP === '') ? null : row.AGE_GROUP.toString().trim();

    const SumCombinedOffences = parseNumber(row['Sum(Combined Offences)']);
    const License_holder = parseNumber(row['License_holder']);

    return {
      JURISDICTION,
      AGE_GROUP,
      'Sum(Combined Offences)': SumCombinedOffences,
      License_holder,
      _raw: row
    };
  }

  function loadQ4Data(){
    return d3.csv('data/Q4DATA.csv', parseRow)
      .then(data => {
        // Provide data to optional global handlers (if present)
        if(typeof window.onQ4DataLoaded === 'function'){
          try{ window.onQ4DataLoaded(data); }catch(e){ console.warn('onQ4DataLoaded failed', e); }
        }
        if(typeof window.initQ4Map === 'function'){
          try{ window.initQ4Map(data); }catch(e){ console.warn('initQ4Map failed', e); }
        }

        console.log('Q4 data loaded:', data.length, 'rows');
        return data;
      })
      .catch(err => {
        console.error('Error loading Q4DATA.csv:', err);
        throw err;
      });
  }

  // Auto-run the loader when script is included (matches the example behaviour)
  if(typeof d3 !== 'undefined'){
    loadQ4Data();
  } else {
    console.warn('d3 not found: load-q4data.js did not auto-run. Call loadQ4Data() after d3 is available.');
  }

  // expose function globally so other scripts can call it on demand
  window.loadQ4Data = loadQ4Data;
})();
