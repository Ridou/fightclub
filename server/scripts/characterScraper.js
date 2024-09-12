const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames

// Replace with the correct path to your service account key
const serviceAccount = require('../config/socfightclub-firebase-adminsdk-z32np-b63b0c8e45.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'socfightclub.appspot.com' // Replace with your Firebase Storage bucket name
});

// Firestore reference from Admin SDK
const db = admin.firestore();

// Get Firebase Storage reference
const bucket = admin.storage().bucket();

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
        console.log(`Scraping details for character: ${character.name}`);
        await scrapeCharacterDetails(character.name, character.imageUrl);
      })
    );

    console.log('Finished scraping all characters.');
  } catch (error) {
    console.error('Error scraping character data:', error);
  }
};

// Download image and upload to Firebase Storage in the appropriate folder
const downloadAndUploadImage = async (imageUrl, characterName, folder = 'characters') => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Generate a unique filename for Firebase Storage in the correct folder
    const fileName = `${folder}/${characterName.toLowerCase().replace(/\s+/g, '_')}_${uuidv4()}.png`;
    const file = bucket.file(fileName);

    // Upload the image to Firebase Storage
    await file.save(buffer, {
      metadata: { contentType: 'image/png' },
      public: true,
    });

    // Make the file publicly accessible
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return downloadURL;
  } catch (error) {
    console.error(`Error downloading and uploading image for ${characterName}:`, error);
    return null; // In case of failure, return null
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

    // Upload the character image to Firebase Storage in the "characters" folder
    const firebaseImageUrl = await downloadAndUploadImage(imageUrl, characterName, 'characters');
    if (!firebaseImageUrl) {
      console.log(`Skipping ${characterName}: Image upload failed.`);
      return; // Skip if image upload fails
    }

    const characterDetails = {
      name: characterName,
      imageUrl: firebaseImageUrl, // Store Firebase URL instead of original
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

    // Extract gear recommendations and upload images
    const gearElements = $('div.gear-recommendations table tr td');
    for (const element of gearElements) {
      const gearName = $(element).find('img').attr('alt');
      if (gearName) {
        characterDetails.gear.recommended.push(gearName);

        // Upload gear images to Firebase in the "gears" folder
        const gearImageUrl = $(element).find('img').attr('src');
        if (gearImageUrl) {
          const firebaseGearImageUrl = await downloadAndUploadImage(gearImageUrl, gearName, 'gears');
          console.log(`Uploaded gear image for ${gearName} to Firebase: ${firebaseGearImageUrl}`);
        }
      }
    }

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

    // Store detailed character data in Firestore (Overwrite the old content)
    await db.collection('characters').doc(characterName).set(characterDetails, { merge: false });
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
