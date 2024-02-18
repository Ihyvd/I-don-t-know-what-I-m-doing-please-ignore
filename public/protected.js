/**
 * Utility and helper functions for a web application, including loading indicators,
 * error handling, data fetching, and WebSocket connections for real-time updates.
 * [Comment] Do I seriously need WebSocket? Whatever let's leave it here for now.
 */

// Show or hide the loading indicator
function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// Handle errors during fetch operations
function handleFetchError() {
    const matchesContainer = document.getElementById('matches'); // Container for displaying matches
    matchesContainer.innerHTML = `<div>An error occurred while fetching the data.</div>`;
}

// Fetch match data from a specific endpoint with optional query parameters
function fetchMatchData(endpoint, queryParams = null) {
    let url = endpoint;
    if (queryParams) {
        url += `?${queryParams.toString()}`;
    }

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching match data:', error);
            throw error;
        });
}

// Populate the matches list with data
function populateMatchesTable(matches) {
    const matchesList = document.getElementById('match-list'); // Ensure this is the correct ID (in case I change anything)
    matchesList.innerHTML = ''; // Clear existing matches

    matches.forEach(match => {
        const matchEntry = document.createElement('li');
        matchEntry.className = 'match-entry flex justify-between items-center py-4 my-2 rounded';

        // Change header color to green/red for win/lose
        const resultClass = match.Result === 'Win' ? 'win' : 'lose';

        // Populate match entry with relevant information
        matchEntry.innerHTML = `
            <div class="match-header ${resultClass} flex justify-between w-full p-4">
                <span class="text-white">${match.Date}: ${match.Player} vs ${match.Opponent}</span>
                <span class="result-indicator ${resultClass}">${match.Result}</span>
                <button class="toggle-collapse text-gray-400 hover:text-gray-300">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <!-- Additional details can be added here -->
        `;

        matchesList.appendChild(matchEntry);
    });
}

// Function to validate match data before processing
function validateMatchData(matchData) {
    // Example validation logic
    if (!matchData.player || !matchData.opponent) {
        console.error('Validation error: Match data is incomplete');
        return false;
    }
    return true;
}

// Save user preferences to localStorage
function saveUserPreferences(preferences) {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

// Retrieve user preferences from localStorage
function getUserPreferences() {
    const preferences = localStorage.getItem('userPreferences');
    return preferences ? JSON.parse(preferences) : {};
}

// Initialize WebSocket for real-time data updates
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('New data received:', data);
    // Update UI based on received data
};

ws.onclose = () => {
    console.log('Disconnected from the WebSocket server');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Example data fetching and caching logic
const cache = new Map();

function fetchWithCache(endpoint, queryParams = null) {
    const key = `${endpoint}?${queryParams ? queryParams.toString() : ''}`;
    if (cache.has(key)) {
        console.log('Retrieving data from cache for:', key);
        return Promise.resolve(cache.get(key));
    }

    return fetch(endpoint + (queryParams ? `?${queryParams}` : ''))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            cache.set(key, data);
            console.log('Data fetched and cached for:', key);
            return data;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            throw error;
        });
}

// Event listener for a filter button
document.getElementById('filter-button').addEventListener('click', () => {
    // Example filter logic here
    // [TODO] I'll need to work on this eventually.
    console.log('Filter button clicked');
    // Fetch and display filtered data
});

// Using fetchWithCache to demonstrate cached data fetching
document.addEventListener('DOMContentLoaded', function() {
    fetchWithCache('/api/data')
        .then(data => {
            if (data && data.matches) {
                populateMatchesTable(data.matches);
            } else {
                console.error('No match data available');
                handleFetchError();
            }
        })
        .catch(handleFetchError);
});
