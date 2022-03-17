import stableStringify from 'fast-json-stable-stringify'
import lodashOmit from 'lodash.omit'
import { sha256 } from 'crypto-hash'

export const cs = (...classes: Array<string | undefined | false>) =>
  classes.filter((a) => !!a).join(' ')

// stable JSON hashing
export function getStableObjectHash(
  input: any,
  { omit = [] }: { omit?: string[] } = {}
): Promise<string> {
  const text = stableStringify(lodashOmit(input, omit))
  return sha256(text)
}
