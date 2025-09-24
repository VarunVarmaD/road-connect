// Global variables
let map;
let watchId = null;
let recordedPath = [];
let livePolyline = null;
let drawnRoutePolylines = []; // NEW: To keep track of old routes

// This is the main function called by Google Maps API
function initMap() {
    const vizagCenter = { lat: 18.1150, lng: 83.4050 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: vizagCenter,
        disableDefaultUI: true,
        zoomControl: true,
    });

    const routes = [ /* ... Your routes data remains the same ... */ ];
    
    drawRoutes(routes);
    setupModeToggle();
    setupSearchDropdowns(routes);
    setupTrackingButtons();
}

function drawRoutes(routes) {
    routes.forEach(route => {
        const routeColor = (c) => c >= 1000 ? 'green' : c >= 100 ? 'orange' : 'red';
        const path = new google.maps.Polyline({ path: route.stops.map(s => s.location), geodesic: true, strokeColor: routeColor(route.contributions), strokeWeight: 5, strokeOpacity: 0.9 });
        path.setMap(map);
        drawnRoutePolylines.push(path); // NEW: Store the path
    });
}

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
            drawnRoutePolylines.forEach(p => p.setMap(map)); // NEW: Show old routes
        } else {
            viewModeUI.classList.add('hidden');
            trackingModeUI.classList.remove('hidden');
            toggleBtn.textContent = 'Back to Search';
            map.setTilt(45);
            map.setZoom(19);
            drawnRoutePolylines.forEach(p => p.setMap(null)); // NEW: Hide old routes
        }
    });
}

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

    document.getElementById('stopBtn').addEventListener('click', () => {
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        navigator.geolocation.clearWatch(watchId);
        
        alert("Thank you! Your route has been recorded.");
        console.log(JSON.stringify(recordedPath));
        recordedPath = [];
        livePolyline.setPath([]); // Clear the blue line
        
        // After stopping, automatically switch back to search view
        document.getElementById('toggle-mode-btn').click();
    });
}

// The setupSearchDropdowns function remains exactly the same.
function setupSearchDropdowns(routes) {
    const allStops = [...new Set(routes.flatMap(r => r.stops.map(s => s.name)))];
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