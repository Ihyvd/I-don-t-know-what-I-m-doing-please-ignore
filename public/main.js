// Main JavaScript file for handling data fetching, displaying, and interactive functionalities

// Function to initiate data fetch from the server
function fetchData() {
    // Endpoint adjustment is needed if the server endpoint differs
    fetch('/api/data')
        .then(response => {
            if (!response.ok) {
                // Handle HTTP errors
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Call function to display data on the page
            displayData(data);
        })
        .catch(error => {
            // Log errors to the console
            console.error('Error fetching data:', error);
        });
}

// Fetch data once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchData);

// Function to display fetched data on the page
function displayData(data) {
    const matchesContainer = document.querySelector('#matches');
    // Clear existing content in the matches container
    matchesContainer.innerHTML = '';

    // Iterate through each record in the fetched data
    data.forEach((record, index) => {
        // Create a new div for each match entry
        const matchEntry = document.createElement('div');
        matchEntry.classList.add('match-entry'); // Add class for styling
        matchEntry.setAttribute('id', `match-${index}`); // Unique ID for each match entry

        // Construct the detailed view of the match with a toggle for the chart
        const matchDetail = `
            <div class="match-header" onclick="toggleChart('chart-${index}')">
                <time datetime="${record.Date}">${record.Date}</time>
                <h2>${record.Attacker} vs ${record.Defender}</h2>
                <div class="result-indicator">${record.Result}</div>
            </div>
            <div class="combat-report">
                <div class="combatant attacker">
                    <span class="name">Attacker: ${record.Attacker}</span>
                    <span class="level">Lv. ${record.AttackerLevel}</span>
                </div>
                <div class="vs">VS</div>
                <div class="combatant defender">
                    <span class="name">Defender: ${record.Defender}</span>
                    <span class="level">Lv. ${record.DefenderLevel}</span>
                </div>
                <div class="damage-chart" id="chart-${index}" style="display: none;">
                    <!-- Dynamic bar charts will be inserted here -->
                </div>
            </div>
        `;

        // Set the inner HTML of the match entry to the constructed details
        matchEntry.innerHTML = matchDetail;

        // Append the new match entry to the matches container
        matchesContainer.appendChild(matchEntry);
    });
}

// Function to toggle the visibility of the damage chart for a specific match
function toggleChart(chartId) {
    const chart = document.getElementById(chartId);
    chart.style.display = chart.style.display === 'none' ? 'block' : 'none';
}

// Functions related to fetching match data, populating tables, handling errors, and showing loading indicators are declared below

// Fetch match data with optional query parameters
function fetchMatchData(endpoint, queryParams = null) {
    let url = endpoint;
    // Append query parameters to the URL if provided
    if (queryParams) {
        url += `?${queryParams.toString()}`;
    }

    return fetch(url)
        .then(response => {
            // Check for HTTP errors
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            // Log and re-throw errors for handling in calling function
            console.error('Error fetching match data:', error);
            throw error;
        });
}

// Populate matches table with fetched data
function populateMatchesTable(matches) {
    const tableBody = document.querySelector('#pvp-matches tbody');
    // Clear existing table data
    tableBody.innerHTML = '';

    // Iterate through matches to populate table rows
    matches.forEach(match => {
        const row = tableBody.insertRow();
        // Populate cells with match details
        // Implementation for populating table cells with match data goes here
    });
}

// Handle errors encountered during data fetching
function handleFetchError() {
    const tableBody = document.querySelector('#pvp-matches tbody');
    tableBody.innerHTML = `<tr><td colspan="5">An error occurred while fetching the data.</td></tr>`;
}

// Show or hide the loading indicator based on data fetching status
function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// Example usage of fetchMatchData function to retrieve and display match data
fetchMatchData('/api/data')
    .then(data => {
        // Check if data contains matches and populate table
        if (data && data.matches) {
            populateMatchesTable(data.matches);
        } else {
            // Handle case where no match data is available
            console.error('No match data available');
            handleFetchError();
        }
    })
    .catch(handleFetchError);

// Fetching match data
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        if (data && data.matches) {
            populateMatchDetails(data.matches);
        } else {
            console.error('No match data available');
        }
    })
    .catch(error => console.error('Error fetching match data:', error));

function createTableHeaders(data) {
    const tableHead = document.querySelector('#pvp-matches thead');
    tableHead.innerHTML = '';
    const headerRow = tableHead.insertRow();

    let uniqueKeys = new Set();
    data.forEach(item => Object.keys(item).forEach(key => uniqueKeys.add(key)));

    uniqueKeys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key.toUpperCase().replace('_', ' ');
        headerRow.appendChild(th);
    });
}


function fetchFilteredData() {
    const filterParams = new URLSearchParams();
    // Add logic to collect filter values and append to filterParams

    fetchMatchData(`/api/data`, filterParams)
        .then(data => {
            // Update table with filtered data
        })
        .catch(error => {
            console.error('Error fetching filtered data:', error);
        });
}

function sortTableByColumn(columnIndex) {
    // Logic to sort the table data by the specified column
}

// Attach event listeners to sort buttons and all that