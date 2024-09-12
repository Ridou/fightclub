const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Replace with the correct path to your service account key
const serviceAccount = require('../config/socfightclub-firebase-adminsdk-z32np-b63b0c8e45.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore reference from Admin SDK
const db = admin.firestore();

// Base URL of the webpage to scrape
const baseURL = 'https://swordofconvallaria.co';

// Define the scrapeCharacters function
const scrapeCharacters = async () => {
  try {
    const { data } = await axios.get(baseURL);
    const $ = cheerio.load(data);

    const characters = [];

    // Select all character elements and extract name and image URL
    $('.post.character').each((index, element) => {
      const characterName = $(element).attr('data-character-name');
      const backgroundImage = $(element).find('.lozad').attr('data-background-image');

      if (characterName) {
        const character = {
          name: characterName,
          imageUrl: backgroundImage,
        };
        characters.push(character);
      }
    });

    // Sort characters alphabetically by name
    characters.sort((a, b) => a.name.localeCompare(b.name));

    // Use Promise.all to wait for all character details to be scraped
    await Promise.all(
      characters.map(async (character) => {
        const docRef = db.collection('characters').doc(character.name);
        const docSnapshot = await docRef.get();

        // If character does not exist, proceed to scrape details
        if (!docSnapshot.exists) {
          console.log(`Scraping details for new character: ${character.name}`);
          await scrapeCharacterDetails(character.name, character.imageUrl);
        } else {
          console.log(`Character ${character.name} already exists in Firestore. Skipping...`);
        }
      })
    );

    console.log('Finished scraping all characters.');
  } catch (error) {
    console.error('Error scraping character data:', error);
  }
};

// Scrape detailed character data
const scrapeCharacterDetails = async (characterName, imageUrl) => {
  try {
    // Convert spaces in characterName to hyphens for the URL
    const formattedName = characterName.toLowerCase().replace(/\s+/g, '-');
    console.log(`Fetching details for ${characterName} at ${baseURL}/characters/${formattedName}/`);

    const { data } = await axios.get(`${baseURL}/characters/${formattedName}/`);
    const $ = cheerio.load(data);

    // Check if valid page content exists
    if ($('table').length === 0) {
      console.log(`Skipping ${characterName}: No valid table found.`);
      return; // Skip if no table found for the character
    }

    const characterDetails = {
      name: characterName,
      imageUrl: imageUrl,
      class: '', // Extracted from the table
      faction: '', // Extracted from the table
      rarity: '', // Extracted from the table
      role: '', // Extracted from the table
      releaseDate: '', // If available
      skills: {
        active: [], // List of active skills
        passive: [], // List of passive skills
        ultimate: '', // Ultimate skill
      },
      stats: {
        baseStats: {}, // Basic stats such as health, attack, defense, etc.
        growth: '', // Stat growth info if available
      },
      gear: {
        recommended: [], // Recommended gear
        tarots: '', // Recommended tarots
      },
      biography: '', // Character's backstory
    };

    // Extract class, faction, rarity, and role from the table
    $('table tr').each((index, element) => {
      const label = $(element).find('td').eq(0).text().trim();
      const value = $(element).find('td').eq(1).text().trim();

      switch (label.toLowerCase()) {
        case 'title':
          characterDetails.class = value;
          break;
        case 'faction':
          characterDetails.faction = value;
          break;
        case 'rarity':
          characterDetails.rarity = value;
          break;
        case 'role':
          characterDetails.role = value;
          break;
        // Add more cases for rank, mobility, etc.
        case 'hp':
          characterDetails.stats.baseStats.health = value;
          break;
        case 'physical atk':
          characterDetails.stats.baseStats.attack = value;
          break;
        case 'physical def':
          characterDetails.stats.baseStats.defense = value;
          break;
        case 'magic atk':
          characterDetails.stats.baseStats.magicAtk = value;
          break;
        case 'magic def':
          characterDetails.stats.baseStats.magicDef = value;
          break;
        case 'spd':
          characterDetails.stats.baseStats.speed = value;
          break;
      }
    });

    // Extract gear recommendations
    $('div.gear-recommendations table tr td').each((index, element) => {
      const gearName = $(element).find('img').attr('alt');
      characterDetails.gear.recommended.push(gearName);
    });

    // Extract skills
    $('div.skills-table tr td img').each((index, element) => {
      const skillName = $(element).attr('alt');
      if (index < 3) {
        characterDetails.skills.active.push(skillName);
      } else {
        characterDetails.skills.passive.push(skillName);
      }
    });

    // Log the extracted character details to verify correctness
    console.log(`Extracted details for ${characterName}:`, characterDetails);

    // Store detailed character data in Firestore
    await db.collection('characters').doc(characterName).set(characterDetails);
    console.log(`Stored detailed data for ${characterName}`);
  } catch (error) {
    console.error(`Error scraping details for ${characterName}:`, error);
  }
};

// Scrape all characters from the main page and get details for new characters
scrapeCharacters().then(() => {
  console.log('Scraping complete.');
}).catch((error) => {
  console.error('An error occurred during scraping:', error);
});
