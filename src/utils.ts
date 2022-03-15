export const cs = (...classes: Array<string | undefined | false>) =>
  classes.filter((a) => !!a).join(' ')
