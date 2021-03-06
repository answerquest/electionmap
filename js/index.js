'use strict';

var addMapControls = require('./addMapControls')
var ECILookup = require('./ECILookup')


// Enable Mapbox services
mapboxgl.accessToken = 'pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiY2p1M3JuNnRjMGZ2NzN6bGVqN3Z4bmVtOSJ9.Fx0kmfg-7ll2Oi-7ZVJrfQ';

function getTilequeryURL (lngLat) {
  return `https://api.mapbox.com/v4/planemad.3picr4b8/tilequery/${lngLat.lng},${lngLat.lat}.json?limit=5&radius=0&dedupe=true&access_token=${mapboxgl.accessToken}`
}

// App configuration
const _app = {
  map: {
    init: {
      container: 'map',
      style: 'mapbox://styles/planemad/cjoescdh20cl62spey0zj3v19',
      bounds: [66, 7, 99, 37],
      maxBounds: [50, 5, 114, 40],
      pitchWithRotate: false,
      hash: true
    }
  }
}

// Initialize GL map
var map = new mapboxgl.Map(_app.map.init);

map.on('load', ()=>{

  addMapControls(map, mapboxgl.accessToken, {
    MapboxGeocoder: {
      position:'top-right',
      country: 'in',
      bbox: _app.map.bounds
    },
    geoip: {
      server: 'https://publicmap-freegeoip.herokuapp.com/json/'
    }
  });

});

map.on('click', (e) => {
  const tilequeryURL = getTilequeryURL(e.lngLat)

  // Add a loading spinner to the infoPanel while we fetch data
  document.getElementById('infoPanel').innerHTML = '';
  document.getElementById('infoPanel').classList.add('loading','loading--s');

  // use fetch to fetch data - this maintains consistency with using fetch elsewhere
  // if we have browser considerations where `fetch` does not work,
  // we can replace this with $.getJSON or so
  fetch(tilequeryURL)
    .then(response => response.json())
    .then(data => {
      // In states, our data will be in second place in features array. For Union Territories, first.
      var holder = {};
      if( data.features.length > 1) {
        holder = data.features[1];
      } else {
        holder = data.features[0];
      }

      var ECI_code = ECILookup[String(holder.properties.st_code)]['ECI_code'];
      console.log(`state code lookup: ${holder.properties.st_code} maps to ${ECI_code}`);

      // Composing link to Official ECI candidates affidavits page: https://affidavit.eci.gov.in/showaffidavit/1/S13/34/PC
      var ECIAffidavit_URL = `https://affidavit.eci.gov.in/showaffidavit/1/${ECI_code}/${String(holder.properties.pc_no)}/PC`;

      // Composing info
      var info = `<big>2019 Lok Sabha Elections</big><br>
      <span class='txt-light'>Your Constituency: </span><b>${holder.properties.pc_name}</b> (${holder.properties.pc_no})<br>
      <span class='txt-light'>Voting is on: </span><b>${holder.properties['2019_election_date'].split('T')[0]}</b> (Phase ${holder.properties['2019_election_phase']})<br>
      <a href="${ECIAffidavit_URL}" target="_blank">Click here to see the Candidates</a> <br>
      State: ${holder.properties.st_name} (${ECI_code})<br>
      `;
      document.getElementById('infoPanel').classList.remove('loading');
      document.getElementById('infoPanel').innerHTML = info
    })
    .catch(err => {
      document.getElementById('infoPanel').classList.add('loading');
      document.getElementById('infoPanel').innerHTML = 'Error while fetching data for ${e.lngLat.lng},${e.lngLat.lat}'
    })
    
})
