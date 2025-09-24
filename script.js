// This function is called by the Google Maps script tag once the API is ready.
function initMap() {
    
    // Hardcoded sample data for bus routes in Ludhiana, Punjab
    const routes = [
        {
            name: "Route 101 (Station to Model Town)",
            color: "blue",
            stops: [
                { name: "Railway Station", location: { lat: 30.9143, lng: 75.8483 } },
                { name: "Clock Tower", location: { lat: 30.9100, lng: 75.8540 } },
                { name: "Model Town Market", location: { lat: 30.8870, lng: 75.8436 } }
            ]
        },
        {
            name: "Route 202 (Bus Stand to University)",
            color: "red",
            stops: [
                { name: "Main Bus Stand", location: { lat: 30.9025, lng: 75.8600 } },
                { name: "Fountain Chowk", location: { lat: 30.8950, lng: 75.8510 } },
                { name: "Punjab Agricultural University", location: { lat: 30.8872, lng: 75.8200 } }
            ]
        }
    ];

    // Initialize the map, centered on Ludhiana
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: { lat: 30.9010, lng: 75.8573 },
        // Optional: Add a custom Map ID for styling in Google Cloud Console
        // mapId: 'YOUR_CUSTOM_MAP_ID' 
    });

    // Loop through each route in our data
    routes.forEach(route => {
        // Create an array of coordinates for the route's path
        const pathCoordinates = route.stops.map(stop => stop.location);

        // Draw the colored line on the map
        const routePath = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: route.color,
            strokeOpacity: 0.8,
            strokeWeight: 5
        });
        routePath.setMap(map);

        // Add a marker for each stop on the route
        route.stops.forEach(stop => {
            const marker = new google.maps.Marker({
                position: stop.location,
                map: map,
                title: stop.name
            });

            // Create a popup window for each marker
            const infowindow = new google.maps.InfoWindow({
                content: `<b>${stop.name}</b><br>${route.name}`
            });

            // Make the popup appear when the marker is clicked
            marker.addListener("click", () => {
                infowindow.open(map, marker);
            });
        });
    });
}