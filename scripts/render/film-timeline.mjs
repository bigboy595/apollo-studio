import {logoState} from '../../src/experience/motion.js';
console.log(JSON.stringify(Array.from({length:150},(_,i)=>logoState(i/24*1000))));
