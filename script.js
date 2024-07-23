// DOM Elements
const searchForm = document.getElementById('search-form');
const destinationInput = document.getElementById('destination-input');
const weatherContainer = document.getElementById('weather-container');
const attractionsContainer = document.getElementById('attractions-container');
const itineraryContainer = document.getElementById('itinerary-container');

// API Keys (replace with your own)
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
window.addEventListener('load', loadItinerary);

// Global State
let itinerary = [];

// Functions
async function handleSearch(e) {
    e.preventDefault();
    const destination = destinationInput.value;
    
    try {
        const weatherData = await fetchWeatherData(destination);
        const attractions = await fetchAttractions(destination);
        
        displayWeather(weatherData);
        displayAttractions(attractions);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching data. Please try again.');
    }
}

async function fetchWeatherData(destination) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${destination}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`);
    if (!response.ok) throw new Error('Weather data not found');
    return await response.json();
}

async function fetchAttractions(destination) {
    const geonameResponse = await fetch(`https://api.opentripmap.com/0.1/en/places/geoname?name=${destination}&apikey=${OPENTRIPMAP_API_KEY}`);
    const geonameData = await geonameResponse.json();
    
    const attractionsResponse = await fetch(`https://api.opentripmap.com/0.1/en/places/radius?radius=1000&lon=${geonameData.lon}&lat=${geonameData.lat}&kinds=interesting_places&limit=5&apikey=${OPENTRIPMAP_API_KEY}`);
    return await attractionsResponse.json();
}

function displayWeather(weatherData) {
    weatherContainer.innerHTML = `
        <h3>Weather in ${weatherData.name}</h3>
        <p>${weatherData.weather[0].description}</p>
        <p>Temperature: ${weatherData.main.temp}°C</p>
    `;
}

function displayAttractions(attractions) {
    const attractionCards = attractions.features.map(attraction => `
        <div class="attraction-card">
            <h3>${attraction.properties.name}</h3>
            <p>${attraction.properties.kinds}</p>
            <button class="add-to-itinerary" data-xid="${attraction.properties.xid}">Add to Itinerary</button>
        </div>
    `).join('');
    
    attractionsContainer.innerHTML = attractionCards;
    addItineraryListeners();
}

function addItineraryListeners() {
    const addButtons = document.querySelectorAll('.add-to-itinerary');
    addButtons.forEach(button => {
        button.addEventListener('click', addToItinerary);
    });
}

async function addToItinerary(e) {
    const xid = e.target.dataset.xid;
    const attractionDetails = await fetchAttractionDetails(xid);
    attractionDetails.id = Date.now();
    itinerary.push(attractionDetails);
    saveItinerary();
    updateItineraryDisplay();
}

async function fetchAttractionDetails(xid) {
    const response = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${OPENTRIPMAP_API_KEY}`);
    return await response.json();
}

function updateItineraryDisplay() {
    const itineraryItems = itinerary.map(item => `
        <div class="itinerary-item" data-id="${item.id}">
            <h4>${item.name}</h4>
            <p>${item.kinds}</p>
            <div>
                <button class="edit-itinerary-item" data-id="${item.id}">Edit</button>
                <button class="remove-from-itinerary" data-id="${item.id}">Remove</button>
            </div>
        </div>
    `).join('');
    
    itineraryContainer.innerHTML = itineraryItems;
    addItineraryItemListeners();
}

function addItineraryItemListeners() {
    const removeButtons = document.querySelectorAll('.remove-from-itinerary');
    removeButtons.forEach(button => {
        button.addEventListener('click', removeFromItinerary);
    });

    const editButtons = document.querySelectorAll('.edit-itinerary-item');
    editButtons.forEach(button => {
        button.addEventListener('click', editItineraryItem);
    });
}

function removeFromItinerary(e) {
    const id = parseInt(e.target.dataset.id);
    itinerary = itinerary.filter(item => item.id !== id);
    saveItinerary();
    updateItineraryDisplay();
}

function editItineraryItem(e) {
    const id = parseInt(e.target.dataset.id);
    const item = itinerary.find(item => item.id === id);
    if (item) {
        const newName = prompt('Enter new name:', item.name);
        if (newName && newName !== item.name) {
            item.name = newName;
            saveItinerary();
            updateItineraryDisplay();
        }
    }
}

function saveItinerary() {
    localStorage.setItem('itinerary', JSON.stringify(itinerary));
}

function loadItinerary() {
    const savedItinerary = localStorage.getItem('itinerary');
    if (savedItinerary) {
        itinerary = JSON.parse(savedItinerary);
        updateItineraryDisplay();
    }
}
