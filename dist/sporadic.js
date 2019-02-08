var sporadic=function(e){"use strict";var r={defer:()=>{const e={};return e.promise=new Promise((r,s)=>{e.resolve=r,e.reject=s}),e},resolved:e=>new Promise(r=>r(e)),rejected:e=>new Promise((r,s)=>s(e))};let s=null;s=(()=>{const{promise:e,resolve:n,reject:t}=r.defer(),o=e.then(s);return{current:e,next:o,resolve:n,reject:t,produced:!1,broken:!1}});const n=async e=>{return{current:await e.current,next:await e.next}},t=async e=>{let r=e;for(;r.produced&&!r.broken;){const{next:e}=await n(r);r=e}return r};const o=()=>Error("Channel is closed!");var d={open:()=>r.resolved(s()),push:async(e,r)=>{const s=await t(e);return s.resolve(r),s.produced=!0,await s.next},pull:n,close:async(e,r)=>{const s=await t(e);if(!s.broken)throw s.reject(r),s.produced=!0,s.broken=!0,r;await s.next}},c={open:()=>r.resolved((()=>{const e={demands:[],supplies:[]};return e.closed=r.defer(),e.isClosed=!1,e})()),send:(e,s)=>{if(0===e.demands.length){if(e.isClosed)return r.rejected(o());const n=r.defer();return e.supplies.push({received:n,message:s}),n.promise}return e.demands.shift().resolve(s),r.resolved(!0)},receive:e=>{if(0===e.supplies.length){if(e.isClosed)return r.rejected(o());const s=r.defer();return e.demands.push(s),s.promise}{const s=e.supplies.shift();return s.received.resolve(!0),r.resolved(s.message)}},close:e=>e.isClosed?r.resolved(!1):(e.isClosed=!0,(e=>{for(;0!==e.demands.length;)e.demands.shift().reject(o())})(e),e.closed.resolve(!0),r.resolved(!0)),closed:e=>e.closed.promise},l={streams:d,channels:c};return e.default=l,e.streams=d,e.channels=c,e}({});