import stableStringify from 'fast-json-stable-stringify'
import { sha256 } from 'crypto-hash'

export const cs = (...classes: Array<string | undefined | false>) =>
  classes.filter((a) => !!a).join(' ')

// stable JSON hashing
export function getStableObjectHash(input: any): Promise<string> {
  const text = stableStringify(input)
  return sha256(text)
}
