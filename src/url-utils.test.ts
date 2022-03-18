import test from 'ava'

import { normalizeUrl, getCandidateIdForUrl } from './url-utils'

const a = [
  'amazon.com/gp/product/B01ITIOG5Y/ref=pd_alm_fs_merch_1_1_fs_dsk_sf_mw_img_Fr22804',
  'amazon.com/gp/product/B01ITIOG5Y/ref=pd_alm_fs_merch_1_1_fs_dsk_sf_mw_tcl_Fr22804',
  'amazon.com/gp/product-reviews/B01ITIOG5Y/ref=fs_dsk_sf_mw_rcl_Fr22804',
  'amazon.com/gp/product/B01NBF3784/ref=pd_alm_fs_merch_1_2_fs_dsk_sf_mw_img_Fr22804',
  'amazon.com/gp/product/B01NBF3784/ref=pd_alm_fs_merch_1_2_fs_dsk_sf_mw_tcl_Fr22804',
  'amazon.com/gp/product-reviews/B01NBF3784/ref=fs_dsk_sf_mw_rcl_Fr22804',
  'amazon.com/gp/product/B004Z0V000/ref=pd_alm_fs_merch_1_3_fs_dsk_sf_mw_img_Fr22804',
  'amazon.com/gp/product/B004Z0V000/ref=pd_alm_fs_merch_1_3_fs_dsk_sf_mw_tcl_Fr22804',
  'amazon.com/gp/product-reviews/B004Z0V000/ref=fs_dsk_sf_mw_rcl_Fr22804',
  'amazon.com/gp/product/B07GPWLXJV/ref=pd_alm_fs_merch_1_4_fs_dsk_sf_mw_img_Fr22804',
  'amazon.com/gp/product/B07GPWLXJV/ref=pd_alm_fs_merch_1_4_fs_dsk_sf_mw_tcl_Fr22804',
  'amazon.com/gp/product-reviews/B07GPWLXJV/ref=fs_dsk_sf_mw_rcl_Fr22804',
  'amazon.com/gp/product/B00C37SA9Q/ref=pd_alm_fs_merch_1_5_fs_dsk_sf_mw_img_Fr22804',
  'amazon.com/gp/product/B00C37SA9Q/ref=pd_alm_fs_merch_1_5_fs_dsk_sf_mw_tcl_Fr22804',
  'amazon.com/gp/product-reviews/B00C37SA9Q/ref=fs_dsk_sf_mw_rcl_Fr22804',
  'amazon.com/gp/product/B01K7N31XW/ref=pd_alm_fs_merch_1_6_fs_dsk_sf_mw_img_Fr22804',
  'amazon.com/gp/product/B01K7N31XW/ref=pd_alm_fs_merch_1_6_fs_dsk_sf_mw_tcl_Fr22804',
  'amazon.com/gp/product-reviews/B01K7N31XW/ref=fs_dsk_sf_mw_rcl_Fr22804',
  'amazon.com/gp/product/B01GXWVWVE/ref=pd_alm_fs_merch_1_7_fs_dsk_sf_mw_img_Fr22804',
  'amazon.com/gp/product/B01GXWVWVE/ref=pd_alm_fs_merch_1_7_fs_dsk_sf_mw_tcl_Fr22804',
  'amazon.com/gp/product-reviews/B01GXWVWVE/ref=fs_dsk_sf_mw_rcl_Fr22804'
]

const b = [
  '/objectid/5bf142459b72e12b2b1b2cd/foo/bar',
  '/menu/omaha-burgers-606-5th-ave-brooklyn/1447522',
  '/menu/day--night-deli-950-broadway-brooklyn/1284965',
  '/store/stop-1-deli/e8UstpdqRqSITq9weojBiA',
  '/store/atlantis-fresh-market-%239/INHLUM3iQ3mjycXlW2HuEg',
  '/store/starbucks-395-flatbush-ave-extension/uACJvRi0Qv2zMRdH4mt6_Q/01e381f0-adb1-5fb9-b65b-8414428a5811/01e381f0-adb1-5fb9-b65b-8414428a5811/6013c77c-1e89-58ea-8466-be46930e1b91',
  '/store/aldi/collections/600-nu-taxonomy-storefront/2528',
  '/store/items/item_51472338984',
  '/cities/brooklyn/categories/restaurant/tropic-juice-bar-grill',
  '/store/7th-avenue-donuts-park-slope/IVK5FvWYQrKsPjcc6xyJ-A',
  '/store/items/item_8329722843',
  '/store/items/item_107707463496'
]

const c = [
  'amazon.com/MS-Chocolate-Candy-Sharing-10-7-Ounce/dp/B071D4RJWC',
  'amazon.com/MS-Chocolate-Candy-Sharing-10-7-Ounce/dp/B071D4RJWC',
  'amazon.com/gp/customer-reviews/product/B071D4RJWC'
]

const negatives = ['consumer-reviews', '12345', '123456', '1234567']

test('normalizeUrl invalid', (t) => {
  t.is(normalizeUrl(), '')
  t.is(normalizeUrl(''), '')
  t.is(normalizeUrl('#'), '')
  t.is(normalizeUrl('#foo'), '')
  t.is(normalizeUrl('/foo'), '')
  t.is(normalizeUrl('/foo/bar'), '')
  t.is(normalizeUrl('://test.com'), '')
})

test('normalizeUrl valid', (t) => {
  t.snapshot(normalizeUrl('test.com'))
  t.snapshot(normalizeUrl('test.com/123'))
  t.snapshot(normalizeUrl('//test.com'))
  t.snapshot(normalizeUrl('https://test.com'))
  t.snapshot(normalizeUrl('https://www.test.com'))
  t.snapshot(normalizeUrl('https://test.com/foo/bar'))
  t.snapshot(normalizeUrl('https://test.com/foo/bar/'))
  t.snapshot(normalizeUrl('https://test.com/foo/bar?foo=bar&cat=dog'))
  t.snapshot(
    normalizeUrl(
      'https://www.seamless.com/menu/empanada-loca-606-5th-ave-brooklyn/310748'
    )
  )
})

test('getCandidateIdForUrl positives', (t) => {
  t.snapshot(a.map(getCandidateIdForUrl))
  t.snapshot(b.map(getCandidateIdForUrl))
  t.snapshot(c.map(getCandidateIdForUrl))
})

test('getCandidateIdForUrl negatives', (t) => {
  for (const s of negatives) {
    t.is(getCandidateIdForUrl(s), null)
  }
})
