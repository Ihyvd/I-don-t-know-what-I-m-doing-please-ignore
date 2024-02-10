// Listen for when the DOM content is fully loaded to ensure elements are accessible
document.addEventListener('DOMContentLoaded', function () {
    // Fetch character data from the server
    fetch('/characters')
        .then(response => {
            // Check if the response was successful, if not, throw an error
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Parse the JSON response body
            return response.json();
        })
        .then(data => {
            // Select the section of the document where results will be displayed
            const resultsSection = document.getElementById('results-section');
            resultsSection.innerHTML = ''; // Clear the section to ensure no previous results are displayed

            // Iterate over each character in the fetched data
            data.characters.forEach(character => {
                // Create a new div element for each character entry
                const div = document.createElement('div');
                div.className = 'character-entry'; // Assign a class for styling

                // Set the inner HTML of the div to display character information
                // Includes an image and a span with the character's name and bullet type
                div.innerHTML = `
                    <img src="${character.imageUrl}" alt="${character.name}" class="character-image">
                    <span>Name: ${character.name}, Bullet Type: ${character.bullet_type}</span>
                `;

                // Append the newly created div to the results section
                resultsSection.appendChild(div);
            });
        })
        .catch(error => {
            // Log any errors to the console and display an error message in the results section
            console.error('Error fetching character data:', error);
            const resultsSection = document.getElementById('results-section');
            resultsSection.innerHTML = `<div class="error-message">An error occurred while fetching the characters.</div>`;
        });
});

// Check if the Service Worker API is available in the navigator object
if ('serviceWorker' in navigator) {
    // If available, register the service worker when the window is loaded
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                // Log a message indicating successful registration, including the scope
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                // Log any errors that occurred during registration
                console.log('Service Worker registration failed:', error);
            });
    });
}
