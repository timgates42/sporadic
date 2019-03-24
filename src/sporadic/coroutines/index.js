/* eslint-env node, es6 */

'use strict'

const utils = require('../utils')
const channels = require('../channels')
const streams = require('../streams')

const State = {
  CREATED: 1,
  RUNNING: 2,
  SUSPENDED: 3,
  DEAD: 4
}

const PrintState = [
  '<undefined>',
  'CREATED',
  'RUNNING',
  'SUSPENDED',
  'DEAD'
]

const stack = []

const current = (coroutine) => {
  if (coroutine) {
    stack.push(coroutine)
    return
  }

  return stack.pop()
}

const dispose = async coroutine => {
  coroutine.computation = null

  await utils.ignorePromise(channels.close(coroutine.supply))
  await utils.ignorePromise(channels.close(coroutine.demand))
  await utils.ignorePromise(streams.close(coroutine.demands))
  await utils.ignorePromise(streams.close(coroutine.supplies))

  return true
}

const create = async computation => {
  const coroutine = {}

  coroutine.supplies = await streams.open()
  coroutine.demands = await streams.open()
  coroutine.supply = await channels.open()
  coroutine.demand = await channels.open()
  coroutine.computation = computation
  coroutine.status = State.CREATED
  coroutine.result = utils.defer()

  return coroutine
}

const resume = async (coroutine, value) => {
  current(coroutine)

  if (coroutine.status === State.RUNNING) {
    throw Error('Coroutine is already running!')
  } else if (coroutine.status === State.DEAD) {
    throw Error('Coroutine is dead!')
  }

  await streams.push(coroutine.supplies, value)

  if (coroutine.status === State.CREATED) {
    coroutine.status = State.RUNNING
    coroutine.computation(value).then(result => {
      streams.push(coroutine.demands, result).then(() => {
        channels.send(coroutine.demand, {
          value: result,
          type: 'return'
        })
      })
      coroutine.result.resolve(result)
    }).catch(reason => {
      channels.send(coroutine.demand, {
        value: reason,
        type: 'error'
      })
      coroutine.result.reject(reason)
    })
  } else {
    coroutine.status = State.RUNNING
    channels.send(coroutine.supply, value)
  }

  const output = await channels.receive(coroutine.demand)

  if (output.type === 'error') {
    coroutine.status = State.DEAD
    dispose(coroutine)

    throw output.value
  }

  if (output.type === 'return') {
    coroutine.status = State.DEAD
    dispose(coroutine)
  }

  return output.value
}

const suspend = async value => {
  const coroutine = current()

  coroutine.status = State.SUSPENDED

  const output = {
    value: value,
    type: 'suspend'
  }

  await streams.push(coroutine.demands, value)
  await channels.send(coroutine.demand, output)

  const input = await channels.receive(coroutine.supply)
  return input
}

const status = coroutine =>
  PrintState[coroutine.status]

const demands = coroutine =>
  coroutine.demands

const supplies = coroutine =>
  coroutine.supplies

const complete = coroutine =>
  coroutine.result.promise

module.exports.create = create
module.exports.resume = resume
module.exports.status = status
module.exports.suspend = suspend
module.exports.supplies = supplies
module.exports.demands = demands
module.exports.complete = complete
