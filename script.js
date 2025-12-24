// API Configuration
const API_KEY = "026d8bcf9ed23fd1e793aedbd8244131";
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

// Video Configuration
const INTRO_VIDEO = "video/intro.mp4";
const DEFAULT_BACKGROUND_VIDEO = "video/bg.mp4";

// DOM Elements
const weatherBox = document.getElementById("weather-box");
const weatherInfo = document.getElementById("weather-info");
const mapContainer = document.getElementById("map-container");
const inputForm = document.getElementById("input-form");
const inputBar = document.getElementById("input-bar");
const searchBtn = document.getElementById("searchbtn");
const weatherToggle = document.getElementById("weather-toggle");
const mapToggle = document.getElementById("map-toggle");
const backgroundVideo = document.getElementById("background-video");
const introContainer = document.getElementById("intro-container");
const introVideo = document.getElementById("intro-video");
const loadingScreen = document.getElementById("loading-screen");

// Map Variables
let leafletMap = null;
let googleMap = null;
let googleMarker = null;
let leafletPopup = null;
let isMapVisible = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    playIntroVideo();
});

// Video Management Functions
function playIntroVideo() {
    console.log("Playing intro video");
    
    // Show intro video container
    introContainer.style.display = "flex";
    
    // Set up intro video
    introVideo.innerHTML = `
        <source src="${INTRO_VIDEO}" type="video/mp4">
        Your browser does not support the video tag.
    `;
    
    introVideo.load();
    
    // Play intro video
    introVideo.play().then(() => {
        console.log("Intro video playing successfully");
    }).catch(e => {
        console.log("Intro video play failed:", e);
        // If intro fails, show loading screen and then start background
        showLoadingScreen();
    });
    
    // When intro ends, show loading screen
    introVideo.onended = function() {
        console.log("Intro video ended, showing loading screen");
        showLoadingScreen();
    };
    
    // If intro has errors, show loading screen
    introVideo.onerror = function() {
        console.log("Intro video error, showing loading screen");
        showLoadingScreen();
    };
}

function showLoadingScreen() {
    console.log("Showing loading screen");
    
    // Hide intro container
    introContainer.style.display = "none";
    
    // Show loading screen
    loadingScreen.classList.add('active');
    
    // After 1 second, hide loading screen and start background video
    setTimeout(() => {
        console.log("Loading complete, starting background video");
        loadingScreen.classList.remove('active');
        startBackgroundVideo(DEFAULT_BACKGROUND_VIDEO);
    }, 1000);
}

function startBackgroundVideo(videoFile) {
    console.log("Starting background video:", videoFile);
    
    // Create a new video source
    backgroundVideo.innerHTML = `
        <source src="${videoFile}" type="video/mp4">
        Your browser does not support the video tag.
    `;
    
    backgroundVideo.load();
    
    // Set loop property for continuous playback
    backgroundVideo.loop = true;
    
    backgroundVideo.play().then(() => {
        console.log("Background video playing successfully:", videoFile);
    }).catch(e => {
        console.log("Background video play failed:", e);
        console.log("Video error details:", backgroundVideo.error);
        
        // Fallback to default background video if the specific one fails
        if (videoFile !== DEFAULT_BACKGROUND_VIDEO) {
            console.log("Trying fallback to default background video");
            startBackgroundVideo(DEFAULT_BACKGROUND_VIDEO);
        }
    });
}

// View Toggle Functionality
weatherToggle.addEventListener('click', showWeatherView);
mapToggle.addEventListener('click', showMapView);

function showWeatherView() {
    if (isMapVisible) {
        // Slide out the map
        mapContainer.classList.remove('slide-in');
        mapContainer.classList.add('slide-out');
        
        // Wait for slide out animation to complete before hiding
        setTimeout(() => {
            weatherBox.style.display = "block";
            mapContainer.style.display = "none";
            weatherToggle.classList.add('active');
            mapToggle.classList.remove('active');
            isMapVisible = false;
        }, 3000);
    } else {
        weatherBox.style.display = "block";
        mapContainer.style.display = "none";
        weatherToggle.classList.add('active');
        mapToggle.classList.remove('active');
    }
}

function showMapView() {
    weatherBox.style.display = "none";
    mapContainer.style.display = "block";
    
    // Force reflow to ensure display change is processed
    mapContainer.offsetHeight;
    
    // Slide in the map
    mapContainer.classList.remove('slide-out');
    mapContainer.classList.add('slide-in');
    
    weatherToggle.classList.remove('active');
    mapToggle.classList.add('active');
    isMapVisible = true;
    
    // Initialize maps if not already done
    if (!leafletMap) {
        initLeafletMap();
    }
    if (!googleMap) {
        // Google Maps is initialized via callback
    }
}

// Form Search Handling
inputForm.addEventListener("submit", function(event) {
    event.preventDefault();
    handleSearch();
});

searchBtn.addEventListener("click", function(event) {
    event.preventDefault();
    handleSearch();
});

function handleSearch() {
    const city = inputBar.value.trim();
    if (city) {
        getWeatherByCity(city);
        showWeatherView();
    } else {
        showError("Input Error", "Please enter the city name correctly");
    }
}

// Weather Functions
async function getWeatherByCity(city) {
    weatherBox.style.display = "block";
    weatherBox.style.visibility = "visible";
    showLoading(`Fetching weather for ${city}...`);

    try {
        const response = await fetch(
            `${API_URL}?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("City not found");
            } else if (response.status === 401) {
                throw new Error("Invalid API key");
            } else {
                throw new Error("Error - Failed to fetch data");
            }
        }

        const data = await response.json();
        displayWeather(data);
    } catch (err) {
        showError("Weather Error", err.message);
    }
}

function showLoading(message) {
    weatherInfo.innerHTML = `
        <div class='loading-spinner'>⏳</div>
        <p>${message}</p>`;
}

function showError(title, message) {
    weatherInfo.innerHTML = `
        <h2 style="color: #ff6b6b;">❌ ${title}</h2>
        <p>${message}</p>`;
}

function displayWeather(data) {
    const condition = data.weather[0].main.toLowerCase();
    const description = data.weather[0].description.toLowerCase();
    const { icon, video } = getWeatherAssets(condition, description);

    console.log("Weather condition:", condition);
    console.log("Weather description:", description);
    console.log("Selected background video:", video);

    // Change background video based on weather
    startBackgroundVideo(video);

    weatherInfo.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <div style="font-size: 3rem;">${icon}</div>
        <p class="temperature">${Math.round(data.main.temp)}°C</p>
        <p class="conditions">${data.weather[0].description}</p>
        <p class="feels-like">Feels like: ${Math.round(data.main.feels_like)}°C</p>
        <div class="weather-details">
            <div class="weather-detail-item">
                <span>Humidity</span>
                <span>${data.main.humidity}%</span>
            </div>
            <div class="weather-detail-item">
                <span>Wind</span>
                <span>${data.wind.speed} m/s</span>
            </div>
            <div class="weather-detail-item">
                <span>Pressure</span>
                <span>${data.main.pressure} hPa</span>
            </div>
        </div>
        <div class="sun-times">
            <p>🌅  Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p>🌇 Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    `;
}

// Weather Assets (Icon + Video) - Updated with correct video paths
function getWeatherAssets(condition, description) {
    const weatherAssets = {
        clear: { icon: "☀️", video: "video/sunny.mp4" },
        rain: { icon: "🌧️", video: "video/Rain.mp4" },
        drizzle: { icon: "🌦️", video: "video/rainy.mp4" },
        clouds: { icon: "☁️", video: "video/Cloudy2.mp4" },
        snow: { icon: "❄️", video: "video/snowy.mp4" },
        thunderstorm: { icon: "⛈️", video: "video/Thunder Strom.mp4" },
        mist: { icon: "🌫️", video: "video/Foggy2.mp4" },
        smoke: { icon: "💨 ", video: "video/Foggy2.mp4" },
        fog: { icon: "🌫️", video: "video/foggy.mp4" },
        haze: { icon: "💨 ", video: "video/foggy.mp4" },
        tornado: { icon: "🌪️", video: "video/Tornado-Strom.mp4" },
        default: { icon: "🌤️", video: DEFAULT_BACKGROUND_VIDEO },
    };
    
    // Additional mappings for different weather descriptions
    const additionalMappings = {
        "overcast clouds": { icon: "☁️", video: "video/Cloud.mp4" },
        "scattered clouds": { icon: "⛅", video: "video/cloudy.mp4" },
        "broken clouds": { icon: "☁️", video: "video/Cloudy2.mp4" },
        "few clouds": { icon: "🌤️", video: "video/cloudy.mp4" },
        "light rain": { icon: "🌦️", video: "video/Rain.mp4" },
        "moderate rain": { icon: "🌧️", video: "video/Rain.mp4" },
        "heavy rain": { icon: "🌧️", video: "video/rainy.mp4" },
        "light snow": { icon: "🌨️", video: "video/snowy.mp4" },
        "heavy snow": { icon: "❄️", video: "video/Snowy2.mp4" },
        "thunderstorm with rain": { icon: "⛈️", video: "video/Thunder Strom.mp4" },
        "thunderstorm with light rain": { icon: "⛈️", video: "video/thunderstorm.mp4" },
        "thunderstorm with heavy rain": { icon: "⛈️", video: "video/Thunder Strom.mp4" },
    };
    
    // First check if we have a specific mapping for this exact description
    if (additionalMappings[description]) {
        console.log("Using specific mapping for:", description);
        return additionalMappings[description];
    }
    
    // Then check for the main condition
    if (weatherAssets[condition]) {
        console.log("Using main condition mapping for:", condition);
        return weatherAssets[condition];
    }
    
    console.log("Using default video");
    return weatherAssets["default"];
}

// Leaflet Map Implementation
function initLeafletMap() {
    leafletMap = L.map("map", {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: true
    });

    // Add base map tiles
    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafletMap);

    // Handle map click for weather data
    leafletMap.on("click", function(e) {
        const { lat, lng } = e.latlng;
        fetchWeatherByCoords(lat, lng);
    });

    function fetchWeatherByCoords(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.cod !== 200) {
                    showLeafletPopup(lat, lon, "Weather data not found");
                    return;
                }

                const city = data.name || "Unknown Location";
                const temp = data.main.temp;
                const desc = data.weather[0].description;
                const humidity = data.main.humidity;

                // Update background video based on weather
                const condition = data.weather[0].main.toLowerCase();
                const description = data.weather[0].description.toLowerCase();
                const { video } = getWeatherAssets(condition, description);
                startBackgroundVideo(video);

                const info = `
                    <div style="font-size: 16px; color: #3b2525ff; padding: 10px;">
                        <h3 style="margin: 0 0 10px 0; color: #585858ff;">${city}</h3>
                        <p style="margin: 5px 0;"><strong>Temperature:</strong> ${temp.toFixed(2)}°C</p>
                        <p style="margin: 5px 0;"><strong>Weather:</strong> ${desc}</p>
                        <p style="margin: 5px 0;"><strong>Humidity:</strong> ${humidity}%</p>
                    </div>
                `;
                showLeafletPopup(lat, lon, info);
            })
            .catch(() => {
                showLeafletPopup(lat, lon, "Error fetching weather data");
            });
    }

    function showLeafletPopup(lat, lon, content) {
        // Close any existing popup
        if (leafletPopup) {
            leafletMap.closePopup(leafletPopup);
        }
        
        // Create new popup
        leafletPopup = L.popup()
            .setLatLng([lat, lon])
            .setContent(content)
            .openOn(leafletMap);
    }
}

// Google Maps Implementation
function initGoogleMap() {
    googleMap = new google.maps.Map(document.getElementById("map"), {
        zoom: 2,
        center: { lat: 20, lng: 0 },
    });

    // Listen for map clicks
    googleMap.addListener("click", async function(e) {
        const lat = e.latLng.lat();
        const lon = e.latLng.lng();

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            );
            if (!response.ok) throw new Error("Location weather not found");

            const data = await response.json();
            
            // Update background video based on weather
            const condition = data.weather[0].main.toLowerCase();
            const description = data.weather[0].description.toLowerCase();
            const { video } = getWeatherAssets(condition, description);
            startBackgroundVideo(video);
            
            // Add or move marker
            if (googleMarker) googleMarker.setMap(null);
            googleMarker = new google.maps.Marker({
                position: { lat, lng: lon },
                map: googleMap,
                title: `${data.name} (${Math.round(data.main.temp)}°C)`,
            });

            // Create info window with weather data
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 5px; font-size: 12px;">
                        <h3 style="margin: 0 0 10px 0; color:#585858ff;">${data.name}</h3>
                        <p style="margin: 2px 0;"><strong>Temperature:</strong> ${data.main.temp.toFixed(2)}°C</p>
                        <p style="margin: 2px 0;"><strong>Weather:</strong> ${data.weather[0].description}</p>
                        <p style="margin: 2px 0;"><strong>Humidity:</strong> ${data.main.humidity}%</p>
                    </div>
                `
            });

            infoWindow.open(googleMap, googleMarker);

        } catch (err) {
            console.error("Map Error:", err.message);
        }
    });
}