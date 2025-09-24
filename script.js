// Global variables
let map;
let watchId = null;
let recordedPath = [];
let livePolyline = null;
let drawnRoutePolylines = [];

// NEW: Add the URL of your deployed backend here
const BACKEND_URL = 'https://road-connect.onrender.com'; // IMPORTANT: Replace with your live backend URL

// This is the main function called by Google Maps API
async function initMap() {
    const vizagCenter = { lat: 18.1150, lng: 83.4050 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: vizagCenter,
        disableDefaultUI: true,
        zoomControl: true,
    });

    // UPDATED: Fetch routes from your backend instead of using hardcoded data
    try {
        const response = await fetch(`${BACKEND_URL}/api/routes`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const routes = await response.json();
        
        // The rest of the app initializes only after data is successfully loaded
        drawRoutes(routes);
        setupModeToggle();
        setupSearchDropdowns(routes);
        setupTrackingButtons();

    } catch (error) {
        console.error("Failed to load routes from backend:", error);
        alert("Could not connect to the server to load bus routes. Please check your connection and try again.");
    }
}

// This function draws the routes fetched from the backend
function drawRoutes(routes) {
    routes.forEach(route => {
        // We need to check if route.stops exists and has data
        if (route.stops && route.stops.length > 0) {
            const routeColor = (c) => c >= 1000 ? 'green' : c >= 100 ? 'orange' : 'red';
            const pathCoordinates = route.stops.map(s => s.location);
            const path = new google.maps.Polyline({ path: pathCoordinates, geodesic: true, strokeColor: routeColor(route.contributions), strokeWeight: 5, strokeOpacity: 0.9 });
            path.setMap(map);
            drawnRoutePolylines.push(path);
        }
    });
}

// This function handles switching between search and tracking views
function setupModeToggle() {
    const viewModeUI = document.getElementById('view-mode');
    const trackingModeUI = document.getElementById('tracking-mode');
    const toggleBtn = document.getElementById('toggle-mode-btn');

    toggleBtn.addEventListener('click', () => {
        const isTracking = !trackingModeUI.classList.contains('hidden');
        if (isTracking) {
            viewModeUI.classList.remove('hidden');
            trackingModeUI.classList.add('hidden');
            toggleBtn.textContent = 'Contribute New Route';
            map.setTilt(0);
            map.setZoom(14);
            drawnRoutePolylines.forEach(p => p.setMap(map));
        } else {
            viewModeUI.classList.add('hidden');
            trackingModeUI.classList.remove('hidden');
            toggleBtn.textContent = 'Back to Search';
            map.setTilt(45);
            map.setZoom(19);
            drawnRoutePolylines.forEach(p => p.setMap(null));
        }
    });
}

// This function handles the live GPS tracking
function setupTrackingButtons() {
    livePolyline = new google.maps.Polyline({ path: [], geodesic: true, strokeColor: '#0000FF', strokeWeight: 5, strokeOpacity: 1.0 });
    livePolyline.setMap(map);
    
    document.getElementById('startBtn').addEventListener('click', () => {
        if (!navigator.geolocation) { alert("Geolocation is not supported by your browser."); return; }
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        recordedPath = [];
        
        watchId = navigator.geolocation.watchPosition(pos => {
            const newPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.setCenter(newPoint);
            recordedPath.push(newPoint);
            livePolyline.setPath(recordedPath);
        }, () => alert("Geolocation service failed."), { enableHighAccuracy: true });
    });

    // UPDATED: The stop button now sends the data to the backend
    document.getElementById('stopBtn').addEventListener('click', () => {
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        navigator.geolocation.clearWatch(watchId);
        
        // Only send if the path has more than one point
        if (recordedPath.length > 1) {
            fetch(`${BACKEND_URL}/api/routes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: recordedPath }) // Send the array of coordinates
            })
            .then(response => response.json())
            .then(data => {
                console.log('Route saved successfully:', data);
                alert("Thank you! Your route has been saved.");
                window.location.reload(); // Reload the page to show the new route
            })
            .catch(error => {
                console.error('Error saving route:', error);
                alert("Sorry, there was an error saving your route.");
            });
        }
        
        recordedPath = [];
        livePolyline.setPath([]);
    });
}

// This function for search dropdowns remains the same
function setupSearchDropdowns(routes) {
    const allStops = [...new Set(routes.flatMap(r => (r.stops || []).map(s => s.name)))];
    const fromInput = document.getElementById('from-input');
    const toInput = document.getElementById('to-input');
    const fromDropdown = document.getElementById('from-dropdown');
    const toDropdown = document.getElementById('to-dropdown');

    const populateDropdown = (dropdown, input) => {
        dropdown.innerHTML = '';
        allStops.forEach(stop => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = stop;
            item.addEventListener('click', () => {
                input.value = stop;
                dropdown.classList.add('hidden');
            });
            dropdown.appendChild(item);
        });
    };

    fromInput.addEventListener('focus', () => { populateDropdown(fromDropdown, fromInput); fromDropdown.classList.remove('hidden'); });
    toInput.addEventListener('focus', () => { populateDropdown(toDropdown, toInput); toDropdown.classList.remove('hidden'); });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-group')) {
            fromDropdown.classList.add('hidden');
            toDropdown.classList.add('hidden');
        }
    });
}