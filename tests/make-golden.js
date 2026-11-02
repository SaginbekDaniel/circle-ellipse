'use strict';
/* Regenerate ONLY when the maths is deliberately changed:  node tests/make-golden.js */
require('fs').writeFileSync(__dirname + '/engine.golden.json', JSON.stringify(require('./probe.js')(), null, 1));
console.log('golden written');
