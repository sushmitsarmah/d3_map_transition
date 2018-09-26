// zooming to Los Angeles, Dallas, Chicago, New York
// https://bl.ocks.org/mbostock/b783fbb2e673561d214e09c7fb5cedee
// https://bl.ocks.org/mbostock/4090848

const CITIES = ['Los Angeles', 'New York', 'Dallas', 'Chicago'];
const width = 960;
const height = 600;

let cities;
let city;
let index = 0;

const svg = d3.select('svg').append('g');
const projection = d3.geoMercator();

const path = d3.geoPath()
    .projection(projection);

const zoomed = () => {
    svg.attr('transform', `translate(${d3.event.transform.x}, ${d3.event.transform.y}) scale(${d3.event.transform.k}, ${d3.event.transform.k})`);
};

const transform = () => {
    // create a geojson point
    const cityPoint = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": city.lnglat
        },
        "properties": {
            "name": "Dinagat Islands"
        }
    };

    // get the center in pixels
    const centroid = path.centroid(cityPoint);
    const x = width / 2 - centroid[0];
    const y = height / 2 - centroid[1];

    // return the transform translate
    return d3.zoomIdentity
        .translate(x, y);
}

const transition = () => {
    index++;
    index = index % CITIES.length;

    city = cities[index];

    svg.transition()
        .delay(500)
        .duration(3000)
        .call(zoom.transform, transform)
        .on('end', () => { svg.call(transition); });
}

const zoom = d3.zoom()
    .on('zoom', zoomed);

const drawChart = (data) => {
    cities = data[0].filter( d => {
        return CITIES.indexOf(d.PlaceName) !== -1;
    })
    .map( d => {
        const lnglat = d.Geolocation.replace(/[\(\)\s]/g, '').split(',').map( d => +d).reverse();
        return {
            stateAbbr: d.StateAbbr,
            placeName: d.PlaceName,
            lng: lnglat[0],
            lat: lnglat[1],
            lnglat: lnglat
        };
    });

    city = cities[index];

    const us = data[1];

    const center = cities[3].lnglat;

    // svg.call(zoom.transform, transform);
    svg.call(transition);

    projection
        .scale(7000)
        .center(center)

    svg.append('g')
        .attr('class', 'states')
        .selectAll('path')
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append('path')
        .attr('d', path);

    svg.append('path')
        .attr('class', 'state-borders')
        .attr('d', path(topojson.mesh(us, us.objects.states, (a, b) => a !== b )));

    const point = svg.selectAll('.city')
        .data(cities).enter()
        .append('g')
        .classed('city', true)
        .attr('transform', d => `translate(${projection(d.lnglat)[0]},${projection(d.lnglat)[1]})`);

    // add circles to svg
    point.append('circle')
        .classed('city-circle', true)
        .attr('r', '8px');

    // add circles to svg
    point.append('text')
        .classed('city-text', true)
        .text(d => d.placeName);
};

const citiesRequest = d3.csv('us_cities.csv');
const mapRequest = d3.json('us.json');

Promise.all([citiesRequest, mapRequest])
.then( result => {
    drawChart(result);
})
.catch(error => {
    throw (error);
});

