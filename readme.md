<p align="center">
  <img alt="Internet Diet" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/assets/banner.jpg"> 
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
  <img alt="Internet Diet" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/amazon-demo.gif" width="689">
</p>

## What can you block?

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
- [x] grubhub
- [x] seamless
- [x] doordash
- [x] caviar
- [x] uber eats
- [x] delivery.com
- [x] instacart
- [x] amazon fresh
- [x] amazon products

### Postmates

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/postmates-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/postmates-after.jpg" width="45%">
</p>

### Grubhub

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/grubhub-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/grubhub-after.jpg" width="45%">
</p>

### Seamless

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/seamless-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/seamless-after.jpg" width="45%">
</p>

### Doordash

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/doordash-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/doordash-after.jpg" width="45%">
</p>

### Caviar

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/caviar-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/caviar-after.jpg" width="45%">
</p>

### Uber Eats

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/ubereats-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/ubereats-after.jpg" width="45%">
</p>

### Delivery.com

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/delivery-com-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/delivery-com-after.jpg" width="45%">
</p>

### Instacart

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/instacart-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/instacart-after.jpg" width="45%">
</p>

### Amazon Fresh

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/amazon-fresh-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/amazon-fresh-after.jpg" width="45%">
</p>

### Amazon Products

<p align="center">
  <img alt="Before" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/amazon-products-before.jpg" width="45%"> 
&nbsp; &nbsp; &nbsp; &nbsp;
  <img alt="After" src="https://raw.githubusercontent.com/transitive-bullshit/internet-diet/master/.github/media/amazon-products-after.jpg" width="45%">
</p>

## Status

This extension is a WIP and has not been launched publicly on the Chrome extensions store yet.

Progress towards a v1 launch is being tracked in this [issue](https://github.com/transitive-bullshit/internet-diet/issues/1).

## Development

If you want to check out the repo locally, make sure you're running a recent version of Node.js.

```bash
npm install
npm start
```

Then load the unpacked extension into chrome from the `build` folder.

## License

MIT © [Travis Fischer](https://transitivebullsh.it)

Support my open source work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
