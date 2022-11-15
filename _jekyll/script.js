var mapmarkers = {};
var slideshow = null;

function apply_geo_filter(search, update_filter_field = false)
{
    if(update_filter_field)
        document.getElementById('filter_area').value = search;
    
    if(search != '')
    {
        document.querySelectorAll(`li[data-search]:not([data-search*="${search.toLowerCase()}"])`).forEach(li => li.hidden = true);
        for(const ul of ['#allevents', '#upcomingeventseverywhere', '#allorganizers'])
        {
            if(document.querySelectorAll(`${ul} > li:not([hidden])`).length == 0)
                document.querySelector(`${ul} > li.none`).hidden = false;
        }
    }
}

function choose_random_event(markers_within_keys)
{
    return {
        toString: () => {
            const eventhashwithphoto = Array.from(document.querySelectorAll('li:not([hidden]) > a.event:not([data-photohrefs=""])')).filter(a => markers_within_keys.includes(a.dataset.mapmarkerkey)).map(a => a.dataset.eventhash);
            const eventhashall = Array.from(document.querySelectorAll('li:not([hidden]) > a.event')).filter(a => markers_within_keys.includes(a.dataset.mapmarkerkey)).map(a => a.dataset.eventhash);
            
            if(eventhashwithphoto.length > 0)
                return eventhashwithphoto[ Math.floor(eventhashwithphoto.length * Math.random()) ];
            
            if(eventhashall.length > 0)
                return eventhashall[ Math.floor(eventhashall.length * Math.random()) ];
            
            return '';
        }
    };
}

function marker_onclick(e, slideshow = true)
{
    const marker = e.target;
    let _icon = document.querySelector('.markerhighlighted');
    if(_icon != null)
        L.DomUtil.removeClass(_icon, 'markerhighlighted');

    _icon = marker._icon || marker._path;
    if(_icon != null)
        L.DomUtil.addClass(_icon, 'markerhighlighted');
    
    marker.bringToFront(); // marker.setZIndexOffset(1000);

    if(slideshow)
    {
        slideshow_stop();
        window.location.hash = marker.eventhash;
    }
}

function init_and_populate_map(id, events)
{
    const map = L.map(id);//.setView([20, 0], 2);
    L.tileLayer(decodeURI(document.getElementById('link_tiles').href), {attribution: document.getElementById('map_copyright').outerHTML.replace('hidden', ''), maxZoom: 19 }).addTo(map);
    map.on('popupopen', e =>
    {
        e.popup._closeButton.removeAttribute("href");
        e.popup._closeButton.style.cursor = "pointer";
    });

    let mapmarkers = {map : map};
    const markers = [];
    for(const a of events)
    {
        if(a.dataset.mapmarkerkey in mapmarkers)
            continue;

        const latlon = a.dataset.latlon.split(',').map(parseFloat);
        const marker = L.circleMarker(latlon, { radius: 1, className: a.parentElement.classList.contains('eventactive') ? 'markerupcoming' : 'markerpast' });
        marker.addTo(map);
        marker.bindPopup(format_event_popup(a).outerHTML);
        marker.on('click', marker_onclick);

        marker.eventhash = a.dataset.eventhash;
        marker.mapmarkerkey = a.dataset.mapmarkerkey;
        mapmarkers[a.dataset.mapmarkerkey] = marker;
        markers.push(marker);
    }

    const quantiles = (arr, p) => arr.sort((a, b) => a - b) && [arr[Math.floor(p * arr.length)], arr[Math.floor((1 - p) * arr.length)]];
    
    const [latl, latr] = quantiles(markers.map(marker => marker.getLatLng().lat), 0.1);
    const [lonl, lonr] = quantiles(markers.map(marker => marker.getLatLng().lng), 0.1);
    
    const markers_within = markers.filter(marker => latl <= marker.getLatLng().lat && marker.getLatLng().lat <= latr && lonl <= marker.getLatLng().lng && marker.getLatLng().lng <= lonr);
    const markers_within_keys = markers_within.map(marker => marker.mapmarkerkey);
    
    map.fitBounds(L.latLngBounds( markers_within.map(marker => ([marker.getLatLng().lat, marker.getLatLng().lng])) ));
    
    return [mapmarkers, markers_within_keys];
}

function switch_upcoming_campaigns(today_YYYY_MM_DD)
{
    Array.from(document.querySelectorAll('#allcampaigns > .campaign')).filter(li => li.dataset.dateend >= today_YYYY_MM_DD).forEach(li => li.classList.add('campaignactive') || li.classList.remove('campaigninactive'));
}

function switch_upcoming_events(today_YYYY_MM_DD)
{
    Array.from(document.querySelectorAll('.events>li:has(a.event)')).filter(li => li.dataset.date >= today_YYYY_MM_DD).forEach(li => li.classList.add('eventactive') || li.classList.remove('eventinactive'));
}

function populate_upcoming_events_everywhere(today_YYYY_MM_DD)
{
    const lis = Array.from(document.querySelectorAll(`#allevents>li:has(a.event)`)).filter(li => li.dataset.date >= today_YYYY_MM_DD).map(li => li.cloneNode(true));

    const ul = document.getElementById('upcomingeventseverywhere');
    if(ul == null)
        return;

    if(lis.length > 0)
        ul.append(...lis);
    else
        ul.querySelector('li[hidden]').hidden = false;
}

function populate_upcoming_events_in_country(today_YYYY_MM_DD, country)
{
    const lis = Array.from(document.querySelectorAll(`#allevents>li:has(a.event[data-country="${country}"])`)).filter(li => li.dataset.date >= today_YYYY_MM_DD).map(li => li.cloneNode(true));
    document.getElementById('country').innerText = country || document.getElementById('country').dataset.none;

    const ul = document.getElementById('upcomingeventsincountry');
    if(ul == null)
        return;

    if(lis.length > 0)
        ul.append(...lis);
    else
        ul.querySelector('li[hidden]').hidden = false;
}

function format_googlemaps_link(event_dataset, domain = 'https://maps.google.com')
{
    const place = [];
    if(event_dataset.address != '')
        place.push(event_dataset.address);
    if(event_dataset.location != '')
        place.push(event_dataset.location);
    if(event_dataset.city != '')
        place.push(event_dataset.city);
    if(event_dataset.country != '')
        place.push(event_dataset.country);
    
    const querystring = [];
    if(event_dataset.latlon != '')
        querystring.push('ll=' + event_dataset.latlon.replace(' ', ''));
    if(place.length > 0)
        querystring.push('q=' + encodeURIComponent(place.join(',').replace(' ', '+')));
        
    return domain + '/?' + querystring.join('&');
}

function format_applemaps_link(event_dataset)
{
    return format_googlemaps_link(event_dataset, 'https://maps.apple.com');
}

function format_event_info(a, div = null)
{
    if(div == null)
        div = document.getElementById('info').cloneNode(true);

    const place_name = div.querySelector('#place_name');
    const place_date = div.querySelector('#place_date');
    const eventurl = div.querySelector('#eventurl');
    const orgurls = div.querySelector('#orgurls');
    const link_maps_google = div.querySelector('#link_maps_google');
    const link_maps_apple = div.querySelector('#link_maps_apple');

    place_name.innerText = [a.dataset.city, a.dataset.country].filter(s => s != '').join(', ') || place_name.dataset.none;
    place_date.innerText = [a.dataset.date, a.dataset.time].filter(s => s != '').join(' ') || place_date.dataset.none;

    link_maps_google.querySelector('.none').hidden = link_maps_apple.querySelector('.none').hidden = a.dataset.latlng != '';
    if(a.dataset.latlng != '')
    {
        link_maps_google.href = format_googlemaps_link(a.dataset);
        link_maps_apple.href = format_applemaps_link(a.dataset);
    }
    else
    {
        link_maps_google.removeAttribute('href');
        link_maps_apple.removeAttribute('href');
    }
    
    eventurl.querySelector('.none').hidden = a.dataset.eventurl != ''
    if(a.dataset.eventurl != '')
        eventurl.href = a.dataset.eventurl;
    else
        eventurl.removeAttribute('href');
    
    const lis = [], orgnames = [a.dataset.orgname.split(';'), a.dataset.orgurl.split(';')];
    for(let i = 0; i < orgnames[0].length; i++)
    {
        const li = orgurls.firstElementChild.cloneNode(true);
        const lia = li.firstElementChild;
        lia.innerText = orgnames[0][i] || lia.dataset.none;
        if(orgnames[1][i] != '')
            lia.href = orgnames[1][i];
        else
            lia.removeAttribute('href');
        lis.push(li);
    }
    orgurls.innerHTML = '';
    orgurls.append(...lis);
    
    div.querySelector('#location').innerText = ([a.dataset.location, a.dataset.address].filter(s => s != '').join(', ') || ' ');
    
    div.querySelector('.eventdescription').innerHTML = '';
    div.querySelector('.eventdescription').appendChild(a.querySelector('.eventdescription').firstChild.cloneNode(true));

    const dateall = a.dataset.dateall.split(';');
    const eventhashall = a.dataset.eventhashall.split(';');
    const cur = eventhashall.indexOf(a.dataset.eventhash);
    const prev = dateall.findIndex(date => date < dateall[cur]);
    const next = dateall.findLastIndex(date => date > dateall[cur]);
    const aprev = div.querySelector('#prev');
    const anext = div.querySelector('#next');
    if(prev != -1)
        aprev.href = eventhashall[prev];
    else
        aprev.removeAttribute('href');
    if(next != -1)
        anext.href = eventhashall[next];
    else
        anext.removeAttribute('href');
    
    return div;
}

function format_event_popup(a)
{
    const elem = document.getElementById('popup').content.cloneNode(true);
    elem.querySelector('#place_name').innerText = [a.dataset.city, a.dataset.country].filter(s => s != '').join(', ');
    elem.querySelector('#place_date').innerText = [a.dataset.date, a.dataset.time].filter(s => s != '').join(', ');
    return elem.firstElementChild;
}

function slideshow_stop()
{
    const input = document.getElementById('slideshow_global_toggle');
    slideshow = clearInterval(slideshow);
    input.checked = false;
}

function slideshow_global_init(eventhash_list)
{
    document.getElementById('slideshow_global_toggle').dataset.eventhash = eventhash_list.join(';');
}

function slideshow_local_start(interval_millis = 7000)
{
    const img = document.getElementById('eventphoto');
    
    slideshow_stop();
    slideshow_local_tick();

    if(img.dataset.photohrefs.includes(';'))
        slideshow = setInterval(slideshow_local_tick, interval_millis);
}

function slideshow_local_tick()
{
    const img = document.getElementById('eventphoto');
    const ainfo = document.getElementById('picbox_overlay_link'), acredits = document.getElementById('picbox_overlay_credits');
    const photohrefs = (img.dataset.photohrefs || '').length == 0 ? [] : img.dataset.photohrefs.split(';');
    const photohrefsalt = (img.dataset.photohrefsalt || '').length == 0 ? [] : img.dataset.photohrefsalt.split(';');
    const photohrefscredits = (img.dataset.photohrefscredits || '').length == 0 ? [] : img.dataset.photohrefscredits.split(';');
    const photohrefshash = (img.dataset.photohrefshash || '').length == 0 ? [] : img.dataset.photohrefshash.split(';');
    
    if(!(img.parentElement.hidden = photohrefs.length == 0))
    {
        const photohrefsidx = img.dataset.photohrefsidx == '' ? 0 : ((1 + parseInt(img.dataset.photohrefsidx)) % photohrefs.length);
        img.src = photohrefs[photohrefsidx];
        img.title = img.alt = ainfo.innerText = photohrefsalt[photohrefsidx] + `: ${1 + photohrefsidx} / ${ photohrefs.length }`;
        img.dataset.photohrefsidx = photohrefsidx.toString();
        ainfo.href = ainfo.title = photohrefshash[photohrefsidx];
        
        if(photohrefscredits[photohrefsidx])
            acredits.href = photohrefscredits[photohrefsidx];
        else
            acredits.removeAttribute('href');
    }
}

function slideshow_global_tick()
{
    const img = document.getElementById('eventphoto');
    const div = document.getElementById('picbox_overlay');
    const input = document.getElementById('slideshow_global_toggle');

    const photohrefs = img.dataset.photohrefs.split(';');
    if(img.dataset.photohrefs != '' && (img.dataset.photohrefsidx == '' || (1 + parseInt(img.dataset.photohrefsidx)) < photohrefs.length))
        slideshow_local_tick();
    else
    {
        const hash = input.dataset.eventhash.split(';');
        input.dataset.eventidx = (input.dataset.eventidx == '' ? 0 : (1 + parseInt(input.dataset.eventidx)) % hash.length).toString();
        navigate(hash[parseInt(input.dataset.eventidx)]);
    }

    img.parentElement.hidden = false;
}

function slideshow_global_toggle(state = null, interval_millis = 7000)
{
    const input = document.getElementById('slideshow_global_toggle');
    const eventhash = input.dataset.eventhash;
    if(state === false || slideshow != null || eventhash == null || eventhash == '')
        slideshow_stop();
    else
    {
        slideshow = slideshow_global_tick() || setInterval(slideshow_global_tick, interval_millis);
        input.checked = true;
    }
}

function img_onclick()
{
    slideshow_stop(false);
    slideshow_local_tick();
}

function get_hash()
{
    return  decodeURIComponent(window.location.hash);
}

function get_search_query()
{
    return decodeURIComponent((new URLSearchParams(window.location.search).get('search') || '').replace('+', ' '));
}

function navigate(hash, search = '')
{
    if(search != '')
        apply_geo_filter(search, true);

    hash = hash.toString()

    if(hash == '' || hash == '#')
        return;

    const img = document.getElementById('eventphoto');
    const info = document.getElementById('info');
    const a = document.querySelector(`a[data-eventhash~="${hash}"]`);
    const input = document.getElementById('slideshow_global_toggle');

    if(a != null)
    {
        format_event_info(a, info);
        
        img.dataset.photohrefs = a.dataset.photohrefs || a.dataset.logo;
        img.dataset.photohrefsalt = new Array(img.dataset.photohrefs.split(';').length).fill(a.dataset.eventalt).join(';');
        img.dataset.photohrefshash = new Array(img.dataset.photohrefs.split(';').length).fill(a.dataset.eventhash).join(';');
        img.dataset.photohrefscredits = new Array(img.dataset.photohrefs.split(';').length).fill(a.dataset.reporturl).join(';');
        img.dataset.photohrefsidx = a.dataset.photohrefs == '' ? '' : (0).toString();
        
        info.classList.remove('visibilityhidden');

        const map = mapmarkers['map'];
        const marker = mapmarkers[a.dataset.mapmarkerkey];
        
        if(!map.getBounds().contains(marker.getLatLng()))
            map.flyTo(marker.getLatLng());
        
        marker_onclick({target: marker}, false);
        
        if(!input.checked)
            slideshow_local_start();
        else
            slideshow_local_tick();
    }
    else
    {
        img.parentElement.hidden = true;
        info.classList.add('visibilityhidden');
    }
}

function body_onload(timezone2country = {})
{
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current_country = timezone2country[timezone] || '';

    const today_YYYY_MM_DD = new Date().toISOString().slice(0, 10);

    slideshow_global_init(Array.from(document.querySelectorAll('a.event:not([data-photohrefs=""])')).map(a => a.dataset.eventhash));
    switch_upcoming_events(today_YYYY_MM_DD);
    if(document.body.dataset.isindex == 'true')
        switch_upcoming_campaigns(today_YYYY_MM_DD);
    populate_upcoming_events_in_country(today_YYYY_MM_DD, current_country);
    populate_upcoming_events_everywhere(today_YYYY_MM_DD);

    [mapmarkers, markers_within_keys] = init_and_populate_map('map', document.querySelectorAll('#allevents > li > a.event:not([data-latlon=""])'));

    navigate(get_hash() == '' || get_hash() == '#' ? choose_random_event(markers_within_keys) : get_hash(), get_search_query());
}
