window.onload = () => {
    const statusDisplay = document.getElementById('status');
    const mainContent = document.getElementById('main-content');

    // Function to show error message and prevent access
    function blockAccess(message) {
        statusDisplay.textContent = message;
        statusDisplay.classList.add('error-message');
        mainContent.style.display = 'none'; // Keep main content hidden
    }

    // Check for geolocation support
    if (navigator.geolocation) {
        statusDisplay.textContent = 'Requesting permission to access your location...';

        // Request geolocation permission
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // If permission granted, show content and send location to server
                mainContent.style.display = 'block';
                statusDisplay.textContent = 'Permission granted! Loading content...';

                // Simulate sending location to the server
                fetch('/save-location', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ latitude, longitude })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            statusDisplay.textContent = data.message;
                        }
                    })
                    .catch(err => {
                        console.error('Error saving location:', err);
                        blockAccess('Error saving location.');
                    });
            },
            (error) => {
                blockAccess('Permission denied. Please enable location permissions to access this content.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        // Geolocation not supported by browser
        blockAccess('Geolocation is not supported by your browser.');
    }
};
