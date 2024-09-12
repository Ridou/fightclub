const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Replace with the correct path to your service account key
const serviceAccount = require('./config/socfightclub-firebase-adminsdk-z32np-b63b0c8e45.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore reference from Admin SDK
const db = admin.firestore();

// URL of the webpage to scrape
const url = 'https://swordofconvallaria.co';

// Scrape character data
const scrapeCharacters = async () => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const characters = [];

    // Select all character elements and extract name and image URL
    $('.post.character').each((index, element) => {
      const characterName = $(element).attr('data-character-name');
      const backgroundImage = $(element).find('.lozad').attr('data-background-image');

      const character = {
        name: characterName,
        imageUrl: backgroundImage,
      };

      characters.push(character);
    });

    // Sort characters alphabetically by name
    characters.sort((a, b) => a.name.localeCompare(b.name));

    // Store data in Firestore using Admin SDK
    await Promise.all(
      characters.map(async (character) => {
        await db.collection('characters').doc(character.name).set(character);
      })
    );

    console.log('Character data stored in Firebase Firestore.');
  } catch (error) {
    console.error('Error scraping character data:', error);
  }
};

scrapeCharacters();
