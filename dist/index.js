var sporadic=function(e){"use strict";var t={defer:()=>{const e={},t={changed:!1};return t.promise=new Promise((t,s)=>{e.resolve=t,e.reject=s}),t.resolve=(s=>{t.changed||(t.changed=!0,e.resolve(s))}),t.reject=(s=>{t.changed||(t.changed=!0,e.reject(s))}),t},resolved:e=>new Promise(t=>t(e)),rejected:e=>new Promise((t,s)=>s(e)),ignorePromise:e=>e.then(()=>!0).catch(()=>!0)};let s=null;s=(e=>{const{promise:r,resolve:n,reject:a}=t.defer(),o=r.then(()=>s(e));return{current:r,next:o,resolve:n,reject:a,produced:!1,broken:!1,finalizer:e}});const r=e=>t.resolved(s(e)),n=async e=>{return{current:await e.current,next:await e.next}},a=async e=>{let t=e;for(;t.produced&&!t.broken;)t=await t.next;return{point:t}},o=async(e,t)=>{const{point:s}=await a(e);return s.resolve(t),s.produced=!0,await s.next},l=async e=>{const{point:t}=await a(e);if(t.broken)await t.next;else{t.reject((()=>Error("Stream is closed!"))()),t.produced=!0,t.broken=!0;try{t.finalizer&&t.finalizer()}catch(e){}await t.next}},i=e=>l(e).catch(()=>{}),c=async(e,s)=>{const r=t.defer();let a=e;try{for(;;){const e=await n(a);a=e.next;try{await s(e.current)}catch(e){throw r.reject(e),e}}}catch(e){r.resolve(!0)}return await r.promise};var u={open:r,push:o,pull:n,close:l,react:c,filter:async(e,t)=>{const r=s();let n=r;return c(e,e=>{try{t(e)&&o(n,e).then(e=>{n=e}).catch(e=>{i(n)})}catch(e){i(n)}}).then(()=>{i(n)}),r},map:async(e,t)=>{const r=s();let n=r;return c(e,e=>{try{o(n,t(e)).then(e=>{n=e}).catch(e=>{i(n)})}catch(e){i(n)}}).then(()=>{i(n)}),r},every:e=>{let r=null;const n=s(()=>r());let a=n;const l=setInterval(()=>{o(a,!0).then(e=>{a=e})},e);return r=(()=>{clearInterval(l)}),t.resolved(n)},merge:async(e,t)=>{const s=await r();let n=s;const a=async e=>{n=await o(n,e)},i=c(e,a),u=c(t,a);return Promise.all([i,u]).then(()=>{l(n)}),s}};const d=()=>Error("Channel is closed!");let p=null,h=null;var m={open:()=>t.resolved((()=>{const e={demands:[],supplies:[]};return e.closed=t.defer(),e.isClosed=!1,e})()),send:p=((e,s,r)=>{if(0===e.demands.length){if(e.isClosed)return t.rejected(d());const n=t.defer();return null!=r&&"number"==typeof r&&r>=1&&setTimeout(()=>{n.resolve(!1)},Math.floor(r)),e.supplies.push({received:n,message:s}),n.promise}{let r=e.demands.shift();for(;e.demands.length>0&&r.changed;)r=e.demands.shift();return r.changed?p(e,s):(r.resolve(s),t.resolved(!0))}}),receive:h=((e,s)=>{if(0===e.supplies.length){if(e.isClosed)return t.rejected(d());const r=t.defer();return e.demands.push(r),null!=s&&"number"==typeof s&&s>=0&&setTimeout(()=>{r.reject((()=>Error("Timeout while listening channel!"))())},Math.floor(s)),r.promise}{let r=e.supplies.shift();for(;e.supplies.length>0&&r.received.changed;)r=e.supplies.shift();return r.received.changed?h(e,s):(r.received.resolve(!0),t.resolved(r.message))}}),close:e=>e.isClosed?t.resolved(!1):(e.isClosed=!0,(e=>{for(;0!==e.demands.length;)e.demands.shift().reject(d())})(e),e.closed.resolve(!0),t.resolved(!0)),closed:e=>e.closed.promise,sendAfter:(e,t,s,r)=>new Promise((n,a)=>{setTimeout(()=>{p(t,s,r).then(n,a)},Math.floor(Math.max(0,e)))}),receiveAfter:(e,t,s)=>new Promise((r,n)=>{setTimeout(()=>{h(t,s).then(r,n)},Math.floor(Math.max(0,e)))})};const f=1,v=2,w=3,y=4,g=["<undefined>","CREATED","RUNNING","SUSPENDED","DEAD"],E=async e=>(e.computation=!0,await t.ignorePromise(m.close(e.supply)),await t.ignorePromise(m.close(e.demand)),await t.ignorePromise(u.close(e.demands)),await t.ignorePromise(u.close(e.supplies)),!0);let j=null,x=null,P=null,C=null,b=null,M=null,T=null;j=(async e=>{const s={};s.supplies=await u.open(),s.demands=await u.open(),s.supply=await m.open(),s.demand=await m.open(),s.computation=e,s.status=f,s.result=t.defer();const r={suspend:e=>x(s,e),status:()=>C(s),supplies:()=>M(s),demands:()=>b(s)};return s.computation=e.bind(r),s}),P=(async(e,t)=>{if(!(e&&e.status&&e.computation&&e.demands&&e.supplies&&e.supply&&e.demand&&e.result))throw Error("Expected a valid coroutine!");if(e.status===v)throw Error("Coroutine is already running!");if(e.status===y)throw Error("Coroutine is dead!");await u.push(e.demands,t),e.status===f?(e.status=v,e.computation(t).then(t=>{u.push(e.supplies,t).then(()=>{m.send(e.supply,{value:t,type:"return"})}),e.result.resolve(t)}).catch(t=>{m.send(e.supply,{value:t,type:"error"}),e.result.reject(t)})):(e.status=v,m.send(e.demand,t));const s=await m.receive(e.supply);if("error"===s.type)throw e.status=y,E(e),s.value;return"return"===s.type&&(e.status=y,E(e)),s.value}),x=(async(e,t)=>{if(e.status!==v)throw Error("Expected an active coroutine to yield from!");e.status=w;const s={value:t,type:"suspend"};return await u.push(e.supplies,t),await m.send(e.supply,s),await m.receive(e.demand)});var D=u,k=m,A={create:j,resume:P,status:C=(e=>g[e.status]),supplies:M=(e=>e.supplies),demands:b=(e=>e.demands),complete:T=(e=>e.result.promise)},N={streams:D,channels:k,coroutines:A};return e.default=N,e.streams=D,e.channels=k,e.coroutines=A,e}({});