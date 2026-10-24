/* Pure dashboard tests: run with node --test tests/*.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {sanitize,circuitCurrent,readingMinutes,remainingSeconds} = require('../src/dashboard.js');

test('220 ohm LED model produces 5.909 mA',()=>assert.ok(Math.abs(circuitCurrent(220)-5.90909090909)<1e-8));
test('Increasing resistance lowers estimated LED current',()=>assert.ok(circuitCurrent(1000)<circuitCurrent(220)));
test('100 ohms exceeds the 10 mA learning target',()=>assert.ok(circuitCurrent(100)>10));
test('LED model does not produce a negative current',()=>assert.equal(circuitCurrent(220,1,2),0));
test('LED model rejects zero resistance',()=>assert.throws(()=>circuitCurrent(0),RangeError));
test('LED model rejects NaN and negative resistance',()=>{assert.throws(()=>circuitCurrent(NaN));assert.throws(()=>circuitCurrent(-4));});
test('Empty dashboard receives independent defaults',()=>{const a=sanitize(null),b=sanitize({});a.saved.push('01');assert.deepEqual(b.saved,[]);assert.equal(b.timer.remaining,900);});
test('Only real module IDs survive import',()=>assert.deepEqual(sanitize({saved:['01','01','12','99','00','<script>']}).saved,['01','12']));
test('Invalid view preferences revert to defaults',()=>{const d=sanitize({filter:'not-real',layout:'javascript:'});assert.equal(d.filter,'all');assert.equal(d.layout,'grid');});
test('Saved learning track and list layout survive import',()=>{const d=sanitize({filter:'saved',layout:'list'});assert.equal(d.filter,'saved');assert.equal(d.layout,'list');});
test('Timer import clamps remaining time',()=>{const d=sanitize({timer:{duration:25,remaining:999999,deadline:-5}});assert.equal(d.timer.remaining,1500);assert.equal(d.timer.deadline,0);});
test('Invalid timer duration falls back to 15 minutes',()=>assert.equal(sanitize({timer:{duration:99,remaining:30}}).timer.duration,15));
test('Past deadline returns zero rather than a negative display',()=>assert.equal(remainingSeconds({deadline:100,remaining:60},200),0));
test('Running timer uses deadline and ceil, not interval tick count',()=>assert.equal(remainingSeconds({deadline:10250,remaining:100},9000),2));
test('Paused timer preserves remaining seconds',()=>assert.equal(remainingSeconds({deadline:0,remaining:64},1000000),64));
test('Reading estimate strips tags and rounds up',()=>assert.equal(readingMinutes('<p>'+Array(201).fill('word').join(' ')+'</p>'),2));
test('Empty lesson has a minimum 1 minute estimate',()=>assert.equal(readingMinutes(''),1));
test('Session import removes malformed records',()=>{const d=sanitize({sessions:[{finishedAt:1,minutes:25},{finishedAt:3,minutes:-2},{finishedAt:4,minutes:500},null]});assert.deepEqual(d.sessions,[{finishedAt:1,minutes:25}]);});
test('Evidence import truncates oversized notes and coerces checks',()=>{const d=sanitize({evidence:{'02':{note:'a'.repeat(12000),checks:[true,false,'yes']},'99':{note:'invalid'}}});assert.equal(d.evidence['02'].note.length,10000);assert.deepEqual(d.evidence['02'].checks,[true,false,true]);assert.equal(d.evidence['99'],undefined);});
test('Dashboard state round trips without losing evidence or bookmarks',()=>{const d=sanitize({saved:['03'],evidence:{'03':{note:'Measured the latency.',checks:[true,false,false]}},challenge:{passed:true,resistance:330,prediction:'less'}});assert.deepEqual(sanitize(JSON.parse(JSON.stringify(d))),d);});
