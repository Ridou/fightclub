const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // Use Cheerio to scrape the HTML
const { addCharacterToFirestore } = require('../firebaseConfig'); // Firestore function to store data

// URL of the page to scrape character data
const baseUrl = 'https://swordofconvallaria.co/characters/';

// Scrape character names and images using Cheerio
const scrapeCharacters = async () => {
    try {
        const response = await axios.get(baseUrl);
        const $ = cheerio.load(response.data);

        const characters = [];

        // Scrape character names and images from the class "characters-weapons-filtered"
        $('.characters-weapons-filtered').each(function () {
            const name = $(this).attr('data-character-name');
            const imageUrl = $(this).attr('data-background-image');

            characters.push({
                name,
                imageUrl,
            });
        });

        return characters;
    } catch (error) {
        console.error('Error scraping characters:', error);
    }
};

// Download the character images to the local folder
const downloadImage = async (url, filepath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(fs.createWriteStream(filepath));

    return new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
    });
};

// Main function to scrape, download, and store data
const scrapeAndStoreCharacters = async () => {
    const characters = await scrapeCharacters();

    for (const character of characters) {
        // Define file path to save image
        const filepath = path.resolve(__dirname, '../images', `${character.name}.webp`);

        // Download image
        await downloadImage(character.imageUrl, filepath);

        // Save character data to Firestore
        await addCharacterToFirestore(character);
        console.log(`Saved ${character.name} and downloaded image.`);
    }
};

// Execute the scraping function
scrapeAndStoreCharacters();
