import {Map} from 'leaflet/src/map/index.js'
import {LatLng} from 'leaflet/src/geo/LatLng.js'
import {tileLayer} from 'leaflet/src/layer/tile/TileLayer.js'
// import json from 'd3-request/src/json.js'
// import ticks from 'd3-array/src/ticks.js'
import select from 'd3-selection/src/select.js' 
import _  from './underscore-es.js'

  

var map = new Map('map', {
    center: new LatLng(50.455002, 30.511284),
    zoom: 12,
    layers : [
            new tileLayer('http://tms{s}.visicom.ua/2.0.0/planet3/base_ru/{z}/{x}/{y}.png',{
                    maxZoom : 19,
                    tms : true,
                    attribution : 'Данные компании © 2017 <a href="http://visicom.ua/">Визиком</a>',
                    subdomains : '123'
            })
    ]    
})

console.log(_.map([1,2,3,4], function(it) {return 'kino ' + it} ).join('\n')) 

// json('http://api.visicom.ua/data-api/3.0/ru/feature/POIA1KIGKN.json', it=>{
//         console.log(it); 
// }) 

// console.log(ticks(0,10,5))