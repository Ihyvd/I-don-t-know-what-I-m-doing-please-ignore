/**
 * Main JavaScript file for handling data fetching, displaying, and interactive functionalities
 * for the PvP tracker project.
 */

/**
 * Initiates data fetch from the server.
 * Fetches data once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', fetchData);

async function fetchData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            // Handle HTTP errors
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Call function to display data on the page
        displayData(data);
    } catch (error) {
        // Log errors to the console
        console.error('Error fetching data:', error);
    }
}

/**
 * Displays fetched data on the page.
 * @param {Array} data - The data to be displayed.
 */
function displayData(data) {
    const matchesContainer = document.querySelector('#matches');
    matchesContainer.innerHTML = ''; // Clear existing content

    data.forEach((record, index) => {
        const matchEntry = document.createElement('div');
        matchEntry.classList.add('match-entry');
        matchEntry.setAttribute('id', `match-${index}`);

        const resultClass = record.Result === 'Win' ? 'win' : 'lose';
        const matchDetail = constructMatchDetail(record, index, resultClass);

        matchEntry.innerHTML = matchDetail;
        matchesContainer.appendChild(matchEntry);
    });
}

/**
 * Constructs HTML for a match detail.
 * @param {Object} record - The match record data.
 * @param {number} index - Index of the match in the data array.
 * @param {string} resultClass - CSS class based on match result.
 * @returns {string} HTML string for match detail.
 */
function constructMatchDetail(record, index, resultClass) {
    return `
        <div class="match-header ${resultClass}" onclick="toggleChart('chart-${index}')">
            <time datetime="${record.Date}">${record.Date}</time>
            <h2>${record.Player} vs ${record.Opponent}</h2>
            <div class="result-indicator ${resultClass}">${record.Result}</div>
        </div>
        <div class="combat-report">
            <div class="combatant Player">
                <span class="name">Player: ${record.Player}</span>
                <span class="level">Lv. ${record.PlayerLevel}</span>
            </div>
            <div class="vs">VS</div>
            <div class="combatant Opponent">
                <span class="name">Opponent: ${record.Opponent}</span>
                <span class="level">Lv. ${record.OpponentLevel}</span>
            </div>
            <div class="damage-chart" id="chart-${index}" style="display: none;">
                <!-- Dynamic bar charts will be inserted here -->
            </div>
        </div>
    `;
}

/**
 * Toggles the visibility of the damage chart for a specific match.
 * @param {string} chartId - The ID of the chart to toggle.
 */
function toggleChart(chartId) {
    const chart = document.getElementById(chartId);
    chart.style.display = chart.style.display === 'none' ? 'block' : 'none';
}

/**
 * Fetches match data with optional query parameters.
 * @param {string} endpoint - The API endpoint to fetch data from.
 * @param {URLSearchParams} [queryParams=null] - Optional query parameters for the request.
 * @returns {Promise<Object>} The fetched data.
 */
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

/**
 * Populates the matches table with data fetched from the server.
 * @param {Array} matches - The array of match records to populate the table with.
 */
function populateMatchesTable(matches) {
    const tableBody = document.querySelector('#pvp-matches tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    matches.forEach(match => {
        const row = tableBody.insertRow();
        Object.keys(match).forEach(key => {
            const cell = row.insertCell();
            cell.textContent = match[key];
        });
    });
}

/**
 * Handles errors encountered during data fetching, displaying an error message in the table.
 */
function handleFetchError() {
    const tableBody = document.querySelector('#pvp-matches tbody');
    tableBody.innerHTML = '<tr><td colspan="5">An error occurred while fetching the data.</td></tr>';
}

/**
 * Shows or hides a loading indicator based on the status of data fetching.
 * @param {boolean} show - Determines whether to show or hide the loading indicator.
 */
function showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = show ? 'block' : 'none';
}

/**
 * Fetches match data, including handling of loading indicators and error messages.
 */
async function fetchAndDisplayMatches() {
    showLoadingIndicator(true);
    try {
        const data = await fetchMatchData('/api/data');
        if (data && data.matches) {
            populateMatchesTable(data.matches);
        } else {
            console.error('No match data available');
            handleFetchError();
        }
    } catch (error) {
        handleFetchError();
    } finally {
        showLoadingIndicator(false);
    }
}

/**
 * Creates table headers dynamically based on the keys of the first item in the dataset.
 * @param {Array} data - The array of data objects to infer the table headers from.
 */
function createTableHeaders(data) {
    if (data.length > 0) {
        const tableHead = document.querySelector('#pvp-matches thead');
        tableHead.innerHTML = '';
        const headerRow = tableHead.insertRow();

        Object.keys(data[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
            headerRow.appendChild(th);
        });
    }
}

/**
 * Fetches and filters data based on specified parameters, then updates the table.
 */
function fetchFilteredData() {
    const filterParams = new URLSearchParams({
        // Example: 'key': 'value'
        // [TODO] I'll need to work on this eventually.
    });

    fetchMatchData('/api/data', filterParams)
        .then(data => {
            if (data && data.matches) {
                populateMatchesTable(data.matches);
            } else {
                console.error('Filtered data unavailable');
                handleFetchError();
            }
        })
        .catch(error => {
            console.error('Error fetching filtered data:', error);
            handleFetchError();
        });
}

/**
 * Sorts the table by a specific column.
 * @param {number} columnIndex - The index of the column to sort by.
 */
function sortTableByColumn(columnIndex) {
    // Logic to sort the table data by the specified column
    // This function would typically involve reading the current rows, sorting based on the cell content at columnIndex,
    // and then re-adding the rows to the table in the sorted order.
    // [TODO] I'll need to work on this eventually.
}

// Example usage of the fetchAndDisplayMatches function to retrieve and display match data on page load.
document.addEventListener('DOMContentLoaded', function () {
    fetchAndDisplayMatches();
});

// Insert logic to attach event listeners for filter and sort interactions here
// [Self-note] Ensure these are placed at the end, after the DOM content has fully loaded to attach listeners properly.

