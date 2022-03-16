<p align="center">
  <img alt="Internet Diet" src="assets/banner.jpg">
</p>

# Internet Diet

> Chrome extension to remove unhealthy foods from the web.

[![Build Status](https://github.com/transitive-bullshit/internet-diet/actions/workflows/test.yml/badge.svg)](https://github.com/transitive-bullshit/internet-diet/actions/workflows/test.yml) [![Prettier Code Formatting](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

## Intro

I order a lot of online food.

But there are so many unhealthy restaurants, foods, and options that I'd rather avoid.

So I built an easy way to block all of the unwanted crap.

## What can it block?

- individual restaurants
- specific menu items
- grocery items
- specific URLs
- entire websites

When blocking individual restaurants and menu items, they will be blurred out on the page so you can be sure it's working without being tempted by them.

## Example use cases

- block all mcdonalds restaurants on postmates
- block a particular chinese place on doordash
- block any soda menu items on grubhub
- block all candy results on amazon fresh
- block all of drizly.com
- etc.

## Which services does it support?

**Currently only a few sites are supported, but more will come soon.**

- [x] postmates
- [ ] grubhub
- [ ] seamless
- [ ] doordash
- [ ] uber eats
- [ ] caviar
- [ ] delivery.com
- [ ] instacart
- [x] amazon
- [ ] etc.

The extension is designed to work on any website where you want to restrict access to certain URL patterns and HTML elements containing keywords.

## TODO

This project is a WIP and lacks UI / polish / etc.

- [x] handle page updates and slow client-side refresh
- [x] add popup UI
- [x] add badge UI
- [x] add styles to default blocked page
- [ ] inject content script dynamically (using declarative content)
- [ ] add options UI
- [x] make block rules customizable
- [x] add UX for adding block link rules
- [x] dedupe block rules
- [ ] make block page customizable
- [x] track the number of links and items blocked
- [ ] add inline tooltip on blocked items for context and pausing
- [ ] add support for pausing a site
- [ ] add linting
- [x] add icon and design
- [ ] add examples

## Development

```bash
npm install
npm start
```

Then load the unpacked extension into chrome from the `build` folder.

## License

MIT © [Travis Fischer](https://transitivebullsh.it)

Support my open source work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
