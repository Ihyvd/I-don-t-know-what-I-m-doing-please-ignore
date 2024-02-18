/**
 * Scripts for fetching character data and managing Service Worker registration.
 * [Self-note] Do I really need Service Workers?
 */

// Fetch character data after DOM content has fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchCharacterData();
});

/**
 * Fetches character data from the server and displays it on the page.
 */
function fetchCharacterData() {
    fetch('/characters')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => displayCharacters(data))
        .catch(error => handleFetchError(error));
}

/**
 * Displays character data on the page.
 * @param {Object} data - The fetched character data.
 */
function displayCharacters(data) {
    const resultsSection = document.getElementById('results-section');
    resultsSection.innerHTML = ''; // Clear previous results

    data.characters.forEach(character => {
        const characterEntry = document.createElement('div');
        characterEntry.className = 'character-entry';
        characterEntry.innerHTML = `
            <img src="${character.imageUrl}" alt="${character.name}" class="character-image">
            <span>Name: ${character.name}, Bullet Type: ${character.bullet_type}</span>
        `;
        resultsSection.appendChild(characterEntry);
    });
}

/**
 * Handles errors encountered during the fetch operation.
 * @param {Error} error - The error object.
 */
function handleFetchError(error) {
    console.error('Error fetching character data:', error);
    const resultsSection = document.getElementById('results-section');
    resultsSection.innerHTML = `<div class="error-message">An error occurred while fetching the characters.</div>`;
}

// Service Worker registration for offline capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        registerServiceWorker();
    });
}

/**
 * Registers a Service Worker to enable offline functionality.
 */
function registerServiceWorker() {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            console.log('Service Worker registration failed:', error);
        });
}
