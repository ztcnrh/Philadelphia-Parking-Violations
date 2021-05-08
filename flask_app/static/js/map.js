// Configure a parseTime() function which will return a datetime object from a string
var parseTime = d3.timeParse("%a, %d %b %Y %H:%M:%S GMT");
// Configure a formatTime() function which will return a string from a datetime object
var formatTime = d3.timeFormat("%a, %B %d %H:%M:%S");
// -------------------------------------------------------------
// -------------------------------------------------------------


// Create the tile layers that will be the background of our map
var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/streets-v11",
    accessToken: API_KEY
})

var dark = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "dark-v10",
  accessToken: API_KEY
});

var light = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "light-v10",
  accessToken: API_KEY
});

// Initialize all of the LayerGroups we'll be using
var layers = {
    HEATMAP: new L.LayerGroup(),
    ZIP: new L.LayerGroup(),
    UNREG_ABANDONED_VEH: new L.LayerGroup(),
    STOP_BLOCK_HIGHWAY: new L.LayerGroup(),
    BLOCKNG_MASS_TRANSIT: new L.LayerGroup(),
    PARKED_ON_GRASS: new L.LayerGroup(),
    EXCESSIVE_NOISE: new L.LayerGroup()
};

// Create a base layer for different mapbox style options
var baseMaps = {
  Street: streetmap,
  Light: light,
  Dark: dark
};

// Create the map with our layers
var map = L.map("map", {
    center: [39.96510, -75.14963],
    zoom: 12,
    zoomControl: false,
    layers: [
        streetmap,
        // layers.HEATMAP,
        layers.ZIP,
        // layers.UNREG_ABANDONED_VEH,
        layers.STOP_BLOCK_HIGHWAY,
        layers.BLOCKNG_MASS_TRANSIT,
        layers.PARKED_ON_GRASS,
        layers.EXCESSIVE_NOISE
    ]
});

// Create an overlays object to add to the layer control
var overlays = {
  "All Violation Heatmap": layers.HEATMAP,
  "Philadelphia Zip Codes": layers.ZIP,
  "Unregistered/Abandoned Vehicle": layers.UNREG_ABANDONED_VEH,
  "Stop/Block Highway": layers.STOP_BLOCK_HIGHWAY,
  "Blocking Mass Transit": layers.BLOCKNG_MASS_TRANSIT,
  "Parked on Grass": layers.PARKED_ON_GRASS,
  "Excessive Noise": layers.EXCESSIVE_NOISE
};

// Create a control for our layers, add our overlay layers to it
L.control.layers(baseMaps, overlays).addTo(map);

// Create a legend to display information about our map
var info = L.control({
  position: "bottomright"
});

// When the layer control is added, insert a div with the class of "legend"
info.onAdd = function() {
  var div = L.DomUtil.create("div", "legend");
  return div;
};
// Add the info legend to the map
info.addTo(map);

// Initialize an object containing icons for each layer group
var icons = {
    UNREG_ABANDONED_VEH: L.ExtraMarkers.icon({
        icon: "ion-android-car",
        iconColor: "#D3D3D3",
        markerColor: "blue-dark",
        shape: "circle"
    }),
    STOP_BLOCK_HIGHWAY: L.ExtraMarkers.icon({
        icon: "ion-android-car",
        iconColor: "#D3D3D3",
        markerColor: "black",
        shape: "circle"
    }),
    BLOCKNG_MASS_TRANSIT: L.ExtraMarkers.icon({
        icon: "ion-android-car",
        iconColor: "#D3D3D3",
        markerColor: "red",
        shape: "star"
    }),
    PARKED_ON_GRASS: L.ExtraMarkers.icon({
        icon: "ion-android-car",
        iconColor: "#D3D3D3",
        markerColor: "green",
        shape: "circle"
    }),
    EXCESSIVE_NOISE: L.ExtraMarkers.icon({
        icon: "ion-android-car",
        iconColor: "#D3D3D3",
        markerColor: "pink",
        shape: "circle"
    })
};

// Perform an API call to the violations route to retrieve our data for plotting violation types and their locations
d3.json("/api/violations").then(function(violationTypes) {

  // When the first API call is complete, perform another call to the heatmap route to retrieve coordinates data for all tickets
  d3.json("/api/heatmap").then(function(heatmapResponse) {

    // Lastly, we will need to call OpenDataPhilly's API route to get a geoJSON that provides Philly zip codes information
    d3.json("https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zipcodes_Poly/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=").then(function(geoZip) {
      
      // Make issue_datetime a datetime object for further parsing for popup info
      violationTypes.forEach((data) => {
        data.issue_datetime = parseTime(data.issue_datetime);
      });

      // console.log(violationTypes);
      // console.log(heatmapResponse);
      // console.log(geoZip);

      // ------------------------------------------
      // 1. Create a zip code layer:
      // ------------------------------------------

      // Create a style object for our zip code layer
      var zipStyle = {
        color: "white",
        fillColor: "#708090",
        fillOpacity: 0.5,
        opacity: 0.5,
        weight: 1.6
      };

      // Create a geoJSON layer with the retrieved data
      var zip = L.geoJson(geoZip, {
        style: function() {
          return {
            color: "#F0FFFF",
            fillColor: "#708090",
            fillOpacity: 0.4,
            opacity: 0.5,
            weight: 1.4
          };
        },
        // Create interactivities
        onEachFeature: function(feature, layer) {
          // Set mouse events to change map styling
          layer.on({
            mouseover: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.8,
                opacity: 0.8,
                weight: 1.9
              });
            },
            mouseout: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.4,
                opacity: 0.5,
                weight: 1.4
              });
            },
            click: function(event) {
              map.fitBounds(event.target.getBounds());
            }
          });
          // Show the zip code when the area is clicked on
          layer.bindPopup("<h5>" + feature.properties.CODE + "</h5> <hr>");
        }
      });

      // Add to our ZIP layer group
      zip.addTo(layers["ZIP"]);

      // ------------------------------------------
      // 2. Create a heatmap layer:
      // ------------------------------------------

      // Define our coordinates data
      var coordinates = heatmapResponse.heatmap_coordinates;
      // console.log(coordinates);

      // Create a heatmap layer with our coordinates data
      var heat = L.heatLayer(coordinates, {
          radius: 5,
          blur: 6
      });
      
      // Add to our HEATMAP layer group
      heat.addTo(layers["HEATMAP"]);

      // ------------------------------------------
      // 3. Create a multiple violation layers and a legend to display their counts:
      // ------------------------------------------

      // Create an object to keep of the number of markers in each layer
      var violationCount = {
        UNREG_ABANDONED_VEH: 0,
        STOP_BLOCK_HIGHWAY: 0,
        BLOCKNG_MASS_TRANSIT: 0,
        PARKED_ON_GRASS: 0,
        EXCESSIVE_NOISE: 0
      };
      
      // Initialize a violationTypeCode, which will be used as a key to access the appropriate layers, icons, and violation count for each layer group
      var violationTypeCode;

      // Loop through the violations (they're the same size and have partially matching data)
      for (var i = 0; i < violationTypes.length; i++) {

        var violation = violationTypes[i];

        // Define violationTypeCode based on the violation's code from the data
        if (violation.violation_desc === "UNREG/ABANDONED VEH") {
          violationTypeCode = "UNREG_ABANDONED_VEH";
        }
        else if (violation.violation_desc === "STOP/BLOCK HIGHWAY") {
          violationTypeCode = "STOP_BLOCK_HIGHWAY";
        }
        else if (violation.violation_desc === "BLOCKNG MASS TRANSIT") {
          violationTypeCode = "BLOCKNG_MASS_TRANSIT";
        }
        else if (violation.violation_desc === "PARKED ON GRASS") {
          violationTypeCode = "PARKED_ON_GRASS";
        }
        else if (violation.violation_desc === "EXCESSIVE NOISE") {
          violationTypeCode = "EXCESSIVE_NOISE";
        }

        // Increment the station count
        violationCount[violationTypeCode]++;

        // Create a new marker with the appropriate icon and coordinates
        var newMarker = L.marker([violation.lat, violation.lon], {
          icon: icons[violationTypeCode]
        });

        // Add the new marker to the appropriate layer
        newMarker.addTo(layers[violationTypeCode]);

        // Bind a popup to the marker that will  display on click. This will be rendered as HTML
        newMarker.bindPopup("<strong><p>" + formatTime(violation.issue_datetime) + "</p></strong>"
                          + "<hr> <strong>Location: </strong>" + violation.location
                          + "<br> <strong>Violation: </strong>" + violation.violation_desc
                          + "<br> <strong>Fine: </strong>" + "$" + violation.fine
                          + "<br> <strong>Issuing Agency: </strong>" + violation.issuing_agency
                          );
      }

      // Call the createLegend() function to create the legend
      createLegend(violationCount);

    });
  });
});

// Update the legend's innerHTML with the last updated time and station count
function createLegend(violationCount) {
  document.querySelector(".legend").innerHTML = [
    "<p class='unregAbanV'><strong>Unregistered/Abandoned Vehicles</strong>: " + violationCount.UNREG_ABANDONED_VEH + "</p>",
    "<p class='highway'><strong>Stop/Block Highway: </strong>" + violationCount.STOP_BLOCK_HIGHWAY + "</p>",
    "<p class='massTransit'><strong>Blocking Mass Transit: </strong>" + violationCount.BLOCKNG_MASS_TRANSIT + "</p>",
    "<p class='grass'><strong>Parked on Grass: </strong>" + violationCount.PARKED_ON_GRASS + "</p>",
    "<p class='noise'><strong>Excessive Noise: </strong>" + violationCount.EXCESSIVE_NOISE + "</p>"
  ].join("");
}
