/* eslint-env node, es6, jest */

'use strict'

const support = require('../support')
const sporadic = support.sporadic
const randomDelay = support.utils.randomDelay

const {
  open, send, receive, close, closed
} = sporadic.channels

it('should open fresh channels', async () => {
  expect.assertions(3)

  const channel1 = await open()
  const channel2 = await open()
  const channel3 = await open()

  expect(channel1).not.toBe(channel2)
  expect(channel2).not.toBe(channel3)
  expect(channel3).not.toBe(channel1)
})

it('should close channels with pending receive calls', async () => {
  expect.assertions(7)

  const channel = await open()

  const receivePromise = receive(channel)
  const closedPromise = closed(channel)

  const closePromise01 = close(channel)
  const closePromise02 = close(channel)
  const closePromise03 = close(channel)

  await expect(receivePromise).rejects.toMatchObject({ message: 'Channel is closed!' })
  await expect(closedPromise).resolves.toBe(true)

  await expect(send(channel, 'Oops!')).rejects.toMatchObject({ message: 'Channel is closed!' })
  await expect(receive(channel)).rejects.toMatchObject({ message: 'Channel is closed!' })

  await expect(closePromise01).resolves.toBe(true)
  await expect(closePromise02).resolves.toBe(false)
  await expect(closePromise03).resolves.toBe(false)
})

it('should close channels with pending send calls', async () => {
  expect.assertions(5)

  const channel = await open()
  const sendPromise01 = send(channel, 'It is a received message!')
  const closePromise = close(channel)
  const sendPromise02 = send(channel, 'Never received message!')
  const receivePromise01 = receive(channel)
  const receivePromise02 = receive(channel)

  await expect(sendPromise02).rejects.toMatchObject({ message: 'Channel is closed!' })
  await expect(receivePromise01).resolves.toBe('It is a received message!')
  await expect(receivePromise02).rejects.toMatchObject({ message: 'Channel is closed!' })
  await expect(sendPromise01).resolves.toBe(true)
  await expect(closePromise).resolves.toBe(true)
})

it('should send and receive over open channels', async () => {
  expect.assertions(9)
  const channel = await open()

  const sent1 = send(channel, 8)
  const sent2 = send(channel, 17)
  const received1 = receive(channel)
  const received2 = receive(channel)
  const received3 = receive(channel)
  const sent3 = send(channel, 23)
  const sent4 = send(channel, 2)
  const received4 = receive(channel)

  await expect(received1).resolves.toBe(8)
  await expect(received2).resolves.toBe(17)
  await expect(received3).resolves.toBe(23)
  await expect(received4).resolves.toBe(2)

  await expect(sent1).resolves.toBe(true)
  await expect(sent2).resolves.toBe(true)
  await expect(sent3).resolves.toBe(true)
  await expect(sent4).resolves.toBe(true)

  await close(channel)
  await expect(closed(channel)).resolves.toBe(true)
})

it('should use channels for communication', async () => {
  expect.assertions(3)

  const channel = await open()

  const producer = (async (channel) => {
    const feedbacks = []

    await randomDelay()
    feedbacks.push(await send(channel, 'hello'))

    await randomDelay()
    feedbacks.push(await send(channel, 'world'))

    await randomDelay()
    feedbacks.push(await send(channel, 'byebye'))

    expect(feedbacks).toEqual([ true, true, true ])

    await randomDelay()
    return 'produced!'
  })(channel)

  const consumer = (async (channel) => {
    const results = []

    await randomDelay()
    results.push(await receive(channel))

    await randomDelay()
    results.push(await receive(channel))

    await randomDelay()
    results.push(await receive(channel))

    expect(results).toEqual([ 'hello', 'world', 'byebye' ])

    await randomDelay()
    return 'consumed!'
  })(channel)

  const tasks = Promise.all([ producer, consumer ])
  await expect(tasks).resolves.toEqual([ 'produced!', 'consumed!' ])
})
