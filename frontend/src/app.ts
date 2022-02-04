import Amplify, {
    Geo,
    API
} from 'aws-amplify';

import backendconfig from './backend-exports';
import awsconfig from './aws-exports';
Amplify.configure({
    ...awsconfig,
    ...{
        API: {
            endpoints: [{
                name: "PizzaDeliveryTrackerBackend",
                endpoint: backendconfig.pizza_delivery_tracker_backend_url,
            }]
        }
    }
});


import {
    createMap,
    drawPoints,
    createAmplifyGeocoder
} from "maplibre-gl-js-amplify";
import "maplibre-gl-js-amplify/dist/public/amplify-geocoder.css";

import {
    Map,
    Marker,
    NavigationControl,
    LngLatBounds,
} from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";

let pizza_places_buttons = {};
let map: Map;
let myself_marker: Marker;
let myself_satisfied_marker: Marker;
let pizza_marker: Marker;

async function initialize() {
    if (!navigator.geolocation) {
        window.alert("Geolocation is not supported by this browser. Using dummy location instead.");
        return;
    }
    navigator.geolocation.getCurrentPosition(async position => {
        const pos: [number, number] = [position.coords.longitude, position.coords.latitude];
        map = await createMap({
            container: "map",
            center: pos,
            zoom: 11,
        })
        map.addControl(createAmplifyGeocoder());
        map.addControl(new NavigationControl(), "top-left");
        map.on("load", function () {
            findPizzaPlaces(pos);
        })
    },
    async error => {
        alert("This demo requires your browser location data. You will only see a blank page until you grant access and reload the page.")
    });

    document.getElementById('map').addEventListener('click', orderPizzaHandler);
}

function findPizzaPlaces(pos: [number, number]) {
    map.flyTo({ center: pos });

    const searchOptionsWithBiasPosition = {
        biasPosition: pos
    }
    Geo.searchByText("pizza", searchOptionsWithBiasPosition).then(function (places) {
        const pizza_places = places.map(function (element, index) {
            pizza_places_buttons[index] = element
            return {
                coordinates: element.geometry.point,
                title: element.label,
                address: `<button id='pizza_place_${index}' class='hungry'>I am hungry!</button>`
            }
        })
        drawPoints(
            "pizza_places",
            pizza_places,
            map, {
            showCluster: false,
            unclusteredOptions: {
                showMarkerPopup: true,
                selectedColor: "#0033cf"
            }
        }
        );
        myself_marker = addMarker("hungry.svg", ...pos);
        myself_satisfied_marker = addMarker("satisfied.svg", ...pos).remove();

    })
}

function addMarker(image: string, longitude: number, latitude: number) {
    var el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = `url("${image}")`;

    return new Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(map)
}

function addRouteLine(lineString: number[][]) {
    cleanupOldRouteLine();
    map.addSource('pizzaRoute', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': lineString
                }
            }]
        }
    });
    map.addLayer({
        'id': 'pizzaRoute',
        'type': 'line',
        'source': 'pizzaRoute',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#004fff',
            'line-width': 5
        }
    });
}

function cleanupOldRouteLine() {
    if (map.getLayer('pizzaRoute')) {
        map.removeLayer('pizzaRoute');
    }
    try {
        map.removeSource('pizzaRoute');
    } catch (error) { }
}

function orderPizzaHandler(event) {
    // ignore all the events not related to the "I am hungry" button
    let target = (event.target as any)
    const isButton = target.nodeName === 'BUTTON';
    if (!isButton) {
        return;
    }
    const buttonId = target.id.substring(12);
    if (buttonId.length == 0) {
        return;
    }

    // close the pop-up before showing the route
    try {
        target.parentElement.parentElement.parentElement.querySelector(".maplibregl-popup-close-button").click()
    } catch (error) { }

    // look up location of pizza place
    const departurePosition = pizza_places_buttons[buttonId].geometry.point

    // order pizza from that place and ask for real-time tracking and route
    navigator.geolocation.getCurrentPosition(position => {
        // https://docs.amplify.aws/lib/restapi/fetch/q/platform/js/
        const query = {
            queryStringParameters: {
                departure_long: departurePosition[0],
                departure_lat: departurePosition[1],
                destination_long: position.coords.longitude,
                destination_lat: position.coords.latitude,
            }
        };
        API
            .get("PizzaDeliveryTrackerBackend", "/route_to_my_pizza", query)
            .then(response => {
                setTimeout(trackPizza, 1000, response.order_id);
                addRouteLine(response.Legs[0].Geometry.LineString);
                pizza_marker = addMarker("pizza.svg", departurePosition[0], departurePosition[1]);
                myself_marker.setLngLat([position.coords.longitude, position.coords.latitude]);
                myself_satisfied_marker.setLngLat([position.coords.longitude, position.coords.latitude]);

                const coordinates: [[number, number]] = response.Legs[0].Geometry.LineString;
                const bounds = coordinates.reduce(function (bounds, coord) {
                    return bounds.extend(coord);
                }, new LngLatBounds(coordinates[0], coordinates[0]));

                map.fitBounds(bounds, {
                    padding: 50
                });
            })

    });
}

function cleanupPreviousOrder() {
    cleanupOldRouteLine();
    myself_satisfied_marker.remove()
    myself_marker.addTo(map);
}

function pizzaArrived(order_id: string) {
    myself_satisfied_marker.addTo(map);
    myself_marker.remove();
    pizza_marker.remove();
    window.alert("🍕 Your pizza has arrived! 🍕");
    setTimeout(cleanupPreviousOrder, 1500);
}

function trackPizza(order_id: string) {
    const query = {
        queryStringParameters: {
            order_id: order_id
        }
    };
    API
        .get("PizzaDeliveryTrackerBackend", "/where_is_my_pizza", query)
        .then(response => {
            pizza_marker.setLngLat(response.Position);
            if (response.Delivered) {
                setTimeout(pizzaArrived, 1500, order_id);
            } else {
                setTimeout(trackPizza, 500, order_id);
            }
        })
}

initialize();
