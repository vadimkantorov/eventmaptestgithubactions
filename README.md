# EventMap
**EventMap** is a website generator for showcasing real-world events/demonstrations driven by a common goal or a theme, along with a map and posted photos.

**EventMap** is based on [Jekyll](https://jekyllrb.com/) static website generator, and the events are described in YAML-like files following a specific directory structure. **EventMap** website generation can be run and served by [GitHub Pages](https://pages.github.com/).

An event map consists of the main page and of campaign pages. Each campaign consists of multiple events. The main page lists all events from all campaigns.

See an example of an event map at https://vadimkantorov.github.io/eventmaptest, and its contents at https://github.com/vadimkantorov/eventmaptest (its [`db`](https://github.com/vadimkantorov/eventmaptest/tree/gh-pages/db) is based on the content of https://taplink.cc/stopmurderization and https://www.facebook.com/freerussiansglobal).

Below are described the file formats and the directory structure providing information about campaigns, events and the main page.

## Setting up instructions and minimal directory structure of `db` directory

Fork this repo and create the `db` directory: `mkdir db`. This [GitHub docs link](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) has instructions on how to pull upstream changes into your fork.

```
# db/index/index.md


```

## Campaign pages
`db/campaigns/2022-my-campaign-name-for-url/2022-my-campaign-name-for-url.md`:
```yaml
---
title: campaign page header text
logo:  main page logo, absolute https-path or file path relative to db/index/ e.g. index.jpg would refer to db/index/index.jpg 
date: # one date in YYYY-MM-DD format or array of two dates
  - 2022-02-20
  - 2022-11-28

organizers: # array of following records
  - orgname: name of organizer
    orgurl: https-url of organizer announcement on the web or social media
    country: country name where an organizer is working, the same organizer may be included multiple times for different countries
    city: city name (optional)
# - orgname: ...
#   orgurl: ...
#   ...

events: # array of following records
  - city: city name (optional)
    country: country name (mandatory)
    date: 2022-09-27 (YYY-MM-DD format, mandatory)
    time: "15:00" (optional)
    address: (optional)
    location: (optional)
    eventurl: https-url (optional)
    orgname: organizer name (same as for organizer format)
    orgurl: organizer https-url (same as for organizer format)
    photos: photos/photo1.jpg; photos/photo2.jpg
    content: "(markdown) event page intro text"

  - city: Yerevan
    country: Armenia
    address: Freedom Square
    date: 2022-09-27
    time: "15:00"
    eventurl: https://t.me/freeyerevan
    orgname:
      - org1
      - org2
    orgurl: 
      - https://org1.com
      - https://org2.com
    photos:
      - photos/photo1.jpg
      - photos/photo2.jpg
    content: My Yerevan event

# - city: ...
#   address: ...
#   date: ...
  
---
(markdown) campaign page intro text
```

## Main page
`db/index/index.md`:
```yaml
---
title: same as for campaign pages
logo:  same as for campaign pages 
---
(markdown) same as for campaign pages
```

In general, main page file format is same as for campaign pages, but the paths are computed relative to `db/index/` instead of `db/campaigns/my-campaign-name`.


## Event info
`db/campaigns/2022-my-campaign-name-for-url/2022-09-27-yerevan/photo1.jpg`,
`db/campaigns/2022-my-campaign-name-for-url/2022-09-27-yerevan/2022-09-27-yerevan.md`:
```yaml
---
city: Yerevan
country: Armenia
address: Freedom Square
date: 2022-09-27
time: "15:00"
eventurl: https://t.me/freeyerevan/205
orgname: Протесты в Ереване
orgurl: https://t.me/freeyerevan
---
My Yerevan event
```

## Reference on Campaign, Event, Organizer fields
Index record fields:
- `title` (mandatory; string)
- `logo` (optional; string)
- `content` (optional; string for intro text markdown)
- `events` (optional; array of event records)
- `campaigns` (optional; array of campaign records)
- `organizers` (optional; array of organizer records)

Organizer record fields:
- `country` (mandatory; string)
- `city` (optional; string)
- `orgname` (optional; string)
- `orgurl` (optional; string)

Campaign record fields:
- `country` (mandatory; string)
- `title` (mandatory; string)
- `logo` (optional; string)
- `date` (mandatory; string in YYYY-MM-DD format)
- `events` (optional; array of event records)
- `organizers` (optional; array of organizer records)
- `content` (optional; string for intro text markdown)

Event record fields:
- `country` (mandatory; string)
- `city` (optional; string)
- `orgname` (optional; string or array of strings)
- `orgurl` (optional; string or array of strings)
- `date` (mandatory; string in YYYY-MM-DD format)
- `address` (optional; string)
- `location` (optional; string)
- `time` (optional; string)
- `eventurl` (optional; string)
- `photos` (optional; semicolon-delimited string or array of strings)
- `content` (optional; string for intro text markdown)
- `campaign` (optional; string for intro text markdown)

## Geocoding information
Sample lines from `geocoder.json`:
```json
{
    "London": "51.5073219,-0.1276474",
    "Paris": "48.8588897,2.3200410217200766"
}
```

Crude geocoding based on city is used if an event doesn't provide custom GPS coordinates. The geocoding JSON file was originally generated by `python3 geocoder.py > geocoder.json`.

## **EventMap** source files
- [`_jekyll/events.html`](_jekyll/events.html) contains all HTML for main page and for campaign pages
- [`_jekyll/style.css`](_jekyll/style.css) specifies all styles and can be modified for style customization
- [`_jekyll/script.js`](_jekyll/script.js) contains all JavaScript
- [`_jekyll/leaflet@1.8.0/dist/leaflet.css`](_jekyll/leaflet@1.8.0/dist/leaflet.css), [`_jekyll/leaflet@1.8.0/dist/leaflet.js`](_jekyll/leaflet@1.8.0/dist/leaflet.js) are the [LeafletJS](https://leafletjs.com/) script and style files
- [`geocoder.json`](assets/geocoder.json) contains the `"lat.itude,lon.gitude"` GPS coordinates for major cities
- [`timezone2country.json`](assets/timezone2country.json) contains the TimeZone:Country mapping to be used for showing events in the user's current country ([original method idea](https://www.techighness.com/post/get-user-country-and-region-on-browser-with-javascript-only))
- [`_config.yml`](_config.yml) is the config for Jekyll

## TODO
```
- photo crops
- link for adding custom events
- escape html
```
