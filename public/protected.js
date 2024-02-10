// Utility and helper functions

// Function to toggle the visibility of the loading indicator
function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// Function to handle errors during fetch operations
function handleFetchError() {
    const tableBody = document.querySelector('#matches tbody');
    tableBody.innerHTML = `<tr><td colspan="5">An error occurred while fetching the data.</td></tr>`;
}

// Function to fetch match data from a specific endpoint with optional query parameters
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

// Function to populate the matches table with data
function populateMatchesTable(matches) {
    const tableBody = document.querySelector('#matches tbody');
    tableBody.innerHTML = ''; // Clear existing table data

    matches.forEach(match => {
        const row = tableBody.insertRow();
        // Your existing code to populate the table goes here
    });
}

// Function to validate the data with a specific pattern
function isValidData(data) {
    return data && /^[\w\s]+$/.test(data);
}

// Function to validate match data before processing
function validateMatchData(matchData) {
    if (!isValidData(matchData.player) || !isValidData(matchData.result)) {
        console.error('Validation error: Match data is invalid');
        return false;
    }
    return true;
}

// Function to save user preferences to localStorage
function saveUserPreferences(preferences) {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

// Function to retrieve user preferences from localStorage
function getUserPreferences() {
    const preferences = localStorage.getItem('userPreferences');
    return preferences ? JSON.parse(preferences) : null;
}

// Event listeners and main logic
document.getElementById('filter-button').addEventListener('click', () => {
    // Handle filter button click event
    // Fetch and display filtered match data based on user input
    // Example code for setting up and handling filter logic
});

// Event listeners and main logic
document.getElementById('filter-button').addEventListener('click', () => {
    // Handle filter button click event
    // Fetch and display filtered match data based on user input
    const date = document.getElementById('date').value;
    const winner = document.getElementById('winner-filter').value;
    const characterSearch = document.getElementById('character-search').value;

    // Construct the query parameters
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (winner) queryParams.append('winner', winner);
    if (characterSearch) queryParams.append('characterSearch', characterSearch);

    fetch(`/api/data?${queryParams.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('#matches tbody');
            tableBody.innerHTML = ''; // Clear existing table data

            data.matches.forEach(match => {
                const row = tableBody.insertRow();

                // Create cells for match details
                const imgCell = row.insertCell();
                const dateCell = row.insertCell();
                const attackerCell = row.insertCell();
                const defenderCell = row.insertCell();
                const outcomeCell = row.insertCell();

                // Example of setting content for cells
                imgCell.innerHTML = `<img src="${match.attackerImage}" alt="Attacker"> vs <img src="${match.defenderImage}" alt="Defender">`;
                dateCell.textContent = match.date;
                attackerCell.textContent = match.attacker;
                defenderCell.textContent = match.defender;
                outcomeCell.textContent = match.Result;
            });
        })
        .catch(error => {
            console.error('Error fetching filtered data:', error);
            const tableBody = document.querySelector('#matches tbody');
            tableBody.innerHTML = `<tr><td colspan="5">An error occurred while fetching the data.</td></tr>`;
        });
});

window.onscroll = function () {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        showLoadingIndicator(true);
        // Handle infinite scroll logic
        // Show loading indicator and fetch additional data when user scrolls to the bottom of the page
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Apply user preferences when the document is fully loaded
    const preferences = getUserPreferences();
    if (preferences) {
        // Apply the preferences to the page
        if (preferences) {
            // Apply the preferences to the page
            if (preferences.someSetting) {
                // Set some control or UI element based on the saved preference
                document.querySelector('#somePreferenceControl').value = preferences.someSetting;
            }
            // ... apply other preferences as needed ...
        }
    }
});

document.querySelector('#somePreferenceControl').addEventListener('change', (event) => {
    // Save user preferences when they change a control
    const preferences = getUserPreferences() || {};
    preferences.someSetting = event.target.value;
    saveUserPreferences(preferences);
});

document.querySelector('#toggleButton').addEventListener('click', () => {
    // Toggle visibility of a section
    const detailsSection = document.querySelector('#detailsSection');
    detailsSection.classList.toggle('hidden');
});

const toggleButton = document.querySelector('#toggleButton');
const detailsSection = document.querySelector('#detailsSection');

toggleButton.addEventListener('click', () => {
    const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
    toggleButton.setAttribute('aria-expanded', !isExpanded);
    detailsSection.setAttribute('aria-hidden', isExpanded);
    detailsSection.classList.toggle('hidden');
});

// WebSocket logic for real-time data updates
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
};

// Data fetching and caching logic?
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('New data received:', data);
};

ws.onclose = () => {
    console.log('Disconnected from the WebSocket server');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Data fetching and caching
// Example usage of fetchMatchData to populate the matches table
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
            return data;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            throw error;
        });
}

// Example usage of fetchMatchData
fetchMatchData('/api/data')
    .then(data => {
        if (data && data.matches) {
            populateMatchesTable(data.matches);
        } else {
            console.error('No match data available');
            handleFetchError();
        }
    })
    .catch(handleFetchError);

// Additional functions and logic (if any)...
