const { ClassicLevel } = require('classic-level');
const path = process.argv[2];

const db = new ClassicLevel(path, { readOnly: true, valueEncoding: 'utf8' });

(async () => {
  try {
    await db.open();
    const it = db.iterator();
    let found = false;
    await it.forEach((key, value) => {
      const k = key.toString();
      if (k.includes('cap-finanzas-journal')) {
        found = true;
        console.log('=== KEY:', JSON.stringify(k));
        console.log('=== VALUE (first 300 chars):', String(value).slice(0, 300));
        // Try to parse as JSON
        try {
          const arr = JSON.parse(value);
          console.log('=== PARSED: array of', arr.length, 'transactions');
          if (arr.length > 0) {
            console.log('first id/date:', arr[0].id, arr[0].date);
            console.log('last id/date:', arr[arr.length-1].id, arr[arr.length-1].date);
          }
        } catch (e) {
          console.log('=== NOT direct JSON, raw length:', String(value).length);
          console.log('=== raw tail:', String(value).slice(-200));
        }
      }
    });
    if (!found) {
      console.log('=== KEY cap-finanzas-journal NOT FOUND. Listing all keys:');
      const it2 = db.iterator();
      let count = 0;
      await it2.forEach((key, value) => {
        const k = key.toString();
        console.log('KEY:', JSON.stringify(k), 'len=', k.length);
        count++;
        if (count > 30) { throw new Error('STOP listing'); }
      }).catch(e => { if (e.message !== 'STOP listing') throw e; });
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await db.close();
  }
})();