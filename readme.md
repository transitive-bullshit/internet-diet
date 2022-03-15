# Internet Diet

> Chrome extension to remove unhealthy food options from the web.

[![Build Status](https://github.com/transitive-bullshit/internet-diet/actions/workflows/test.yml/badge.svg)](https://github.com/transitive-bullshit/internet-diet/actions/workflows/test.yml) [![Prettier Code Formatting](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

## Intro

I order online food all the time.

But a lot of the options are unhealthy — which is a constant temptation.

So I built an easy way to block all the unwanted crap.

## What can it block?

- individual restaurants
- individual menu items
- individual grocery items
- individual URLs
- entire websites

When blocking individual restaurants and menu items, it will blur them on the page so you won't even see them as options.

## Example use cases

- block all mcdonalds restaurants on postmates
- block that one chinese place on doordash
- block any soda menu items on grubhub
- block all candy results on amazon fresh
- block all of drizly.com
- etc.

## Which services does it support?

- postmates
- grubhub
- seamless
- doordash
- uber eats
- caviar
- delivery.com
- instacart
- amazon
- etc.

The extension is designed to work on any website where you want to restrict access to certain URL patterns and HTML elements containing keywords.

## TODO

This project is a WIP and lacks UI / polish / tests / etc.

- [x] handle page updates and slow client-side refresh
- [x] add popup UI
- [x] add badge UI
- [ ] add options UI
- [ ] make block rules customizable
- [ ] make block redirect customizable
- [ ] track the number of links and items blocked
- [ ] add inline tooltip on blocked items for context and undo
- [x] add icon and design
- [ ] add styles to default blocked page
- [ ] inject content script dynamically
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
