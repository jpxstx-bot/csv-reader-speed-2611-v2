// Testes manuais independentes; não substituem o oracle/kit oficial.
// Executar: node --experimental-default-type=module test-local.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { run } from './solve.js';

const result = (columns, rows, errors = []) => ({ columns, rows, errors });
const err = (code, line, row, extra = {}) => ({ code, line, row, ...extra });
const cases = [
 ['vazio header', {text:'',header:true}, result([],[])],
 ['vazio sem header', {text:'',header:false}, result(null,[])],
 ['apenas linhas vazias', {text:'\n\r\n\n',header:true}, result([],[])],
 ['simples header', {text:'a,b\n1,2',header:true}, result(['a','b'],[['1','2']])],
 ['sem header', {text:'a,b\n1,2',header:false}, result(null,[['a','b'],['1','2']])],
 ['BOM inicial', {text:'\ufeffa,b\n1,2',header:true}, result(['a','b'],[['1','2']])],
 ['BOM interno', {text:'a,\ufeffb',header:true}, result(['a','\ufeffb'],[])],
 ['CRLF e linhas vazias', {text:'\r\na,b\r\n\r\n1,2\r\n',header:true}, result(['a','b'],[['1','2']])],
 ['campos vazios', {text:',\n,',header:true}, result(['',''],[['','']])],
 ['virgula final', {text:'a,b\n1,2,',header:true}, result(['a','b'],[['1','2']],[err('long_row',2,0,{extra:['']})])],
 ['short_row', {text:'a,b\n1,2\n3',header:true}, result(['a','b'],[['1','2'],['3','']],[err('short_row',3,1,{fields:1})])],
 ['long_row', {text:'a,b\n1,2,3',header:true}, result(['a','b'],[['1','2']],[err('long_row',2,0,{extra:['3']})])],
 ['aspas e vírgula', {text:'a,b\n"x,y",z',header:true}, result(['a','b'],[['x,y','z']])],
 ['aspas duplicadas', {text:'a\n"x""y"',header:true}, result(['a'],[['x"y']])],
 ['campo citado vazio', {text:'a\n""',header:true}, result(['a'],[['']])],
 ['aspa literal não citada', {text:'a\nq"r',header:true}, result(['a'],[['q"r']])],
 ['quebra LF citada', {text:'a,b\n"x\ny",z\n1',header:true}, result(['a','b'],[['x\ny','z'],['1','']],[err('short_row',4,1,{fields:1})])],
 ['quebra CRLF citada', {text:'a,b\n"x\r\ny",z',header:true}, result(['a','b'],[['x\ny','z']])],
 ['quebra CR citada', {text:'a,b\n"x\ry",z',header:true}, result(['a','b'],[['x\ny','z']])],
 ['CR isolado', {text:'a,b\n1\r2,3',header:true}, result(['a','b'],[['12','3']],[err('stray_cr',2,0)])],
 ['CR em header', {text:'a\rb,c\n1,2',header:true}, result(['ab','c'],[['1','2']],[err('stray_cr',1,null)])],
 ['quote_junk', {text:'a,b\n"x"junk,z',header:true}, result(['a','b'],[['xjunk','z']],[err('quote_junk',2,0)])],
 ['CR após citação', {text:'a\n"x"\r',header:true}, result(['a'],[['x']],[err('stray_cr',2,0)])],
 ['ordem CR e junk', {text:'a\n"x"\rfoo',header:true}, result(['a'],[['xfoo']],[err('stray_cr',2,0),err('quote_junk',2,0)])],
 ['aspas não fechadas', {text:'a,b\n"x,z',header:true}, result(['a','b'],[['"x','z']],[err('unterminated_quote',2,0)])],
 ['sem header com short', {text:'a,b\n1',header:false}, result(null,[['a','b'],['1','']],[err('short_row',2,1,{fields:1})])],
 ['ordem erro e short', {text:'a,b\n1\r2',header:true}, result(['a','b'],[['12','']],[err('stray_cr',2,0),err('short_row',2,0,{fields:1})])],
];
let passed = 0;
console.log('Node', process.version, process.platform, process.arch);
console.log('SHA256 solve.js',createHash('sha256').update(readFileSync(new URL('./solve.js',import.meta.url))).digest('hex'));
for (const [name, input, expected] of cases) {
  try { assert.deepStrictEqual(run(input), expected); passed++; console.log('PASS', name); }
  catch (e) { console.error('FAIL', name, '\ninput:', JSON.stringify(input),'\nexpected:', JSON.stringify(expected),'\nactual:', JSON.stringify(run(input))); }
}
console.log(`RESULTADO ${passed}/${cases.length} testes manuais passaram`);
if (passed !== cases.length) process.exitCode = 1;
