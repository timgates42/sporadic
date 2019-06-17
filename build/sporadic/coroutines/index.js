/* eslint-env node, es6 */'use strict';function _asyncToGenerator(fn){return function(){var gen=fn.apply(this,arguments);return new Promise(function(resolve,reject){function step(key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{return Promise.resolve(value).then(function(value){step('next',value)},function(err){step('throw',err)})}}return step('next')})}}const utils=require('../utils');const channels=require('../channels');const streams=require('../streams');const State={CREATED:1,RUNNING:2,SUSPENDED:3,DEAD:4};const PrintState=['<undefined>','CREATED','RUNNING','SUSPENDED','DEAD'];const dispose=(()=>{var _ref=_asyncToGenerator(function*(coroutine){coroutine.computation=true;yield utils.ignorePromise(channels.close(coroutine.supply));yield utils.ignorePromise(channels.close(coroutine.demand));yield utils.ignorePromise(streams.close(coroutine.demands));yield utils.ignorePromise(streams.close(coroutine.supplies));return true});return function dispose(_x){return _ref.apply(this,arguments)}})();let create=null;let _suspend=null;let resume=null;let _status=null;let _demands=null;let _supplies=null;let complete=null;create=(()=>{var _ref2=_asyncToGenerator(function*(computation){const coroutine={};coroutine.supplies=yield streams.open();coroutine.demands=yield streams.open();coroutine.supply=yield channels.open();coroutine.demand=yield channels.open();coroutine.computation=computation;coroutine.status=State.CREATED;coroutine.result=utils.defer();const self={suspend:function suspend(value){return _suspend(coroutine,value)},status:function status(){return _status(coroutine)},supplies:function supplies(){return _supplies(coroutine)},demands:function demands(){return _demands(coroutine)}};coroutine.computation=computation.bind(self);return coroutine});return function create(_x2){return _ref2.apply(this,arguments)}})();resume=(()=>{var _ref3=_asyncToGenerator(function*(coroutine,value){if(!coroutine||!coroutine.status||!coroutine.computation||!coroutine.demands||!coroutine.supplies||!coroutine.supply||!coroutine.demand||!coroutine.result){throw Error('Expected a valid coroutine!')}if(coroutine.status===State.RUNNING){throw Error('Coroutine is already running!')}else if(coroutine.status===State.DEAD){throw Error('Coroutine is dead!')}yield streams.push(coroutine.demands,value);if(coroutine.status===State.CREATED){coroutine.status=State.RUNNING;coroutine.computation(value).then(function(result){streams.push(coroutine.supplies,result).then(function(){channels.send(coroutine.supply,{value:result,type:'return'})});coroutine.result.resolve(result)}).catch(function(reason){channels.send(coroutine.supply,{value:reason,type:'error'});coroutine.result.reject(reason)})}else{coroutine.status=State.RUNNING;channels.send(coroutine.demand,value)}const output=yield channels.receive(coroutine.supply);if(output.type==='error'){coroutine.status=State.DEAD;dispose(coroutine);throw output.value}if(output.type==='return'){coroutine.status=State.DEAD;dispose(coroutine)}return output.value});return function resume(_x3,_x4){return _ref3.apply(this,arguments)}})();_suspend=(()=>{var _ref4=_asyncToGenerator(function*(coroutine,value){if(coroutine.status!==State.RUNNING){throw Error('Expected an active coroutine to yield from!')}coroutine.status=State.SUSPENDED;const output={value:value,type:'suspend'};yield streams.push(coroutine.supplies,value);yield channels.send(coroutine.supply,output);const input=yield channels.receive(coroutine.demand);return input});return function _suspend(_x5,_x6){return _ref4.apply(this,arguments)}})();_status=coroutine=>PrintState[coroutine.status];_demands=coroutine=>coroutine.demands;_supplies=coroutine=>coroutine.supplies;complete=coroutine=>coroutine.result.promise;module.exports.create=create;module.exports.resume=resume;module.exports.status=_status;module.exports.supplies=_supplies;module.exports.demands=_demands;module.exports.complete=complete;