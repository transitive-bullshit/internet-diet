const prefix = 'internet diet'

export function log(...args: any[]) {
  console.log(prefix, ...args)
}

export function info(...args: any[]) {
  console.info(prefix, ...args)
}

export function warn(...args: any[]) {
  console.warn(prefix, ...args)
}

export function error(...args: any[]) {
  console.error(prefix, ...args)
}

export function debug(...args: any[]) {
  console.debug(prefix, ...args)
}

export function time(label: string) {
  console.time(`${prefix} ${label}`)
}

export function timeEnd(label: string) {
  console.timeEnd(`${prefix} ${label}`)
}
