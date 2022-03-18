import test from 'ava'

import { getStableObjectHash } from './utils'

test('getStableObjectHash', async (t) => {
  const obj = {
    foo: '123',
    blockRule: {
      hostname: 'postmates.com',
      type: 'pathname',
      pathname: 'burger-king'
    },
    arr: [1, 3, 2]
  }

  const result = await getStableObjectHash(obj)
  t.is(result, await getStableObjectHash(obj))
  t.is(result, await getStableObjectHash({ ...obj }))
  obj.arr = [1, 3, 2]
  t.is(result, await getStableObjectHash(obj))
  t.snapshot(result)
})

test('getStableObjectHash omit', async (t) => {
  const obj = {
    foo: '123',
    blockRule: {
      hostname: 'postmates.com',
      type: 'pathname',
      pathname: 'burger-king'
    },
    arr: [1, 3, 2]
  }
  const result = await getStableObjectHash(obj, { omit: ['foo'] })
  t.is(result, await getStableObjectHash({ ...obj, foo: undefined }))
  t.snapshot(result)
})
