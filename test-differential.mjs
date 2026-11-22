// Compare candidate to the reference from the official kit, obtained separately.
// Run: node --experimental-default-type=module test-differential.mjs /absolute/path/to/kit/baselines/csv-reader/solve.js
import { run as candidate } from './solve.js';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
if (!process.argv[2]) throw new Error('Informe o caminho absoluto do solve.js da referência do kit.');
const { run: reference } = await import(pathToFileURL(resolve(process.argv[2])).href);
const alphabet=['a',',','\r','\n','"']; let total=0, mismatchCount=0, failures=[];
function test(text, header) { const input={text,header}; const expected=reference(input); const actual=candidate(input); total++; if (!isDeepStrictEqual(expected,actual)) { mismatchCount++; if(failures.length<12) failures.push({input,expected,actual}); } }
function enumerate(text, remaining) { for(const h of [true,false]) test(text,h); if(remaining>0) for(const c of alphabet) enumerate(text+c,remaining-1); }
enumerate('',4);
let seed=0x12345678;
function next(){ seed^=seed<<13; seed^=seed>>>17; seed^=seed<<5; return seed>>>0; }
const chars=['a','b',',','\r','\n','"','\ufeff','é','😀'];
for(let i=0;i<10000;i++){let n=next()%101, text=''; for(let j=0;j<n;j++) text+=chars[next()%chars.length]; test(text,(next()%2)===1);}
console.log(JSON.stringify({exhaustive_0_to_4:1562,random_cases:10000,total,mismatchCount,failures_recorded:failures.length,failures},null,2));
if(mismatchCount) process.exitCode=1;
