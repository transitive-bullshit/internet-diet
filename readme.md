<p align="center">
  <img alt="Internet Diet" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/main/assets/banner.jpg"> 
</p>

# Internet Diet

> Chrome extension to remove unhealthy foods from the web.

[![Build Status](https://github.com/transitive-bullshit/internet-diet/actions/workflows/test.yml/badge.svg)](https://github.com/transitive-bullshit/internet-diet/actions/workflows/test.yml) [![Prettier Code Formatting](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

## Intro

I order a lot of online food.

But there are so many unhealthy restaurants, foods, and options that I'd rather avoid.

So I built an easy way to block all of the unwanted crap.

## Amazon Demo

<p align="center">
  <img alt="Internet Diet" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/main/.github/media/amazon-demo.gif" width="689">
</p>

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

The extension is designed to work on any website where you want to restrict access to certain URL patterns and HTML elements containing keywords.

With that being said, it has been thoroughly tested on the following services:

- [x] postmates
- [x] amazon
- [x] grubhub
- [x] seamless
- [x] uber eats
- [x] doordash
- [x] caviar
- [x] instacart
- [x] delivery.com

## TODO

This project is a WIP and lacks some polish and features.

- [x] handle page updates and slow client-side refresh
- [x] add popup UI
- [x] add badge UI
- [x] add styles to default blocked page
- [x] add icon and design
- [x] make block rules customizable
- [x] add UX for adding block link rules
- [x] dedupe block rules
- [x] track the number of links and items blocked
- [x] add block this page button in popup
- [x] add block this site button in popup
- [x] add linting
- [x] add confirmation dialogs for blocking pages and sites
- [x] add support for pausing / resuming
- [x] add support for all websites
- [x] fix popup confirmation modal overflow
- [x] inject content script dynamically
- [x] make link selection and blocking logic robust across sites
- [x] more cross-site testing
- [ ] fix bug with deduping block rules resulting in incorrect createdAt times
- [ ] add example gifs
- [ ] handle redirects
  - ex: `https://www.doordash.com/store/942804` gets expanded to `https://www.doordash.com/store/country-house-diner-clinton-hill-942804/`
  - popup isn't aware of the change
  - references to one don't block references to the other
  - doordash and caviar both have the same build
- [x] add options page
  - [x] view / edit block rules
  - [x] make block page customizable
  - [x] make block effect customizable (blur vs removal)
  - [x] view total stats
  - [x] pause / unpause
  - [ ] add new block rules
- [ ] add basic website
- [ ] add support FAQ
- [ ] publish to chrome store
- [ ] add support for firefox
- [ ] add support for safari
- [ ] add hotkey command for blocking a link
- [ ] add inline tooltip on blocked items for context and pausing
- [ ] refactor differences between handling of links vs items?
- [ ] linkify hostname in popup
- [ ] add context menu integration

## Development

```bash
npm install
npm start
```

Then load the unpacked extension into chrome from the `build` folder.

## License

MIT © [Travis Fischer](https://transitivebullsh.it)

Support my open source work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
