const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames

// Replace with the correct path to your service account key
const serviceAccount = require('../config/socfightclub-firebase-adminsdk-z32np-b63b0c8e45.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'socfightclub.appspot.com', // Replace with your Firebase Storage bucket name
});

// Firestore reference from Admin SDK
const db = admin.firestore();

// Get Firebase Storage reference
const bucket = admin.storage().bucket();

// Base URL for gear page
const gearUrl = 'https://swordofconvallaria.co/gear/';

// Scrape gear list from the main page
const scrapeGear = async () => {
  try {
    console.log('Starting gear scraping...');
    const { data } = await axios.get(gearUrl);
    const $ = cheerio.load(data);

    const gearList = [];

    // Scrape gear items by targeting the appropriate classes
    $('.post.sword-of-convallaria.character').each((index, element) => {
      const name = $(element).attr('data-character-name');
      const imageUrl = $(element).find('.lozad').attr('data-background-image');
      const detailsUrl = $(element).find('a').attr('href');

      // Make sure we have a valid name and detailsUrl
      if (name && detailsUrl) {
        const gear = {
          name,
          imageUrl,
          detailsUrl,
        };
        gearList.push(gear);
        console.log(`Found gear: ${name}`);
      } else {
        console.log('Incomplete gear data found, skipping...');
      }
    });

    console.log(`Total gear items found: ${gearList.length}`);

    if (gearList.length === 0) {
      console.error('No gear items were found. Exiting.');
      return;
    }

    // For each gear, scrape detailed information
    await Promise.all(
      gearList.map(async (gear) => {
        const gearDetails = await scrapeGearDetails(gear.detailsUrl);
        if (gearDetails) {
          Object.assign(gear, gearDetails);

          // Upload gear image to Firebase and get the new URL
          const firebaseImageUrl = await downloadAndUploadImage(gear.imageUrl, gear.name, 'gears');
          if (firebaseImageUrl) {
            gear.imageUrl = firebaseImageUrl; // Replace the original image URL with Firebase URL
          }

          // Save gear data to Firestore
          console.log(`Saving gear data for ${gear.name} to Firestore...`);
          await db.collection('gear').doc(gear.name).set(gear);
          console.log(`Stored gear: ${gear.name}`);
        } else {
          console.log(`Failed to scrape details for gear: ${gear.name}`);
        }
      })
    );

    console.log('Finished scraping all gear.');
  } catch (error) {
    console.error('Error scraping gear data:', error);
  }
};

// Download image and upload to Firebase Storage in the appropriate folder (now 'gears')
const downloadAndUploadImage = async (imageUrl, gearName, folder = 'gears') => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Generate a unique filename for Firebase Storage in the correct folder
    const fileName = `${folder}/${gearName.toLowerCase().replace(/\s+/g, '_')}_${uuidv4()}.png`;
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
    console.error(`Error downloading and uploading image for ${gearName}:`, error);
    return null; // In case of failure, return null
  }
};

// Scrape detailed gear stats from the gear page
const scrapeGearDetails = async (url) => {
  try {
    console.log(`Fetching details for gear at: ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const gearDetails = {
      stats: {
        hp: '',
        physicalAtk: '',
        physicalDef: '',
        magicAtk: '',
        magicDef: '',
      },
      rarity: '',
      skills: [],
      source: '',
    };

    // Extract gear stats from the table
    $('table tbody tr').each((index, element) => {
      const label = $(element).find('td').eq(0).text().trim();
      const value = $(element).find('td').eq(1).text().trim();

      switch (label.toLowerCase()) {
        case 'hp':
          gearDetails.stats.hp = value;
          break;
        case 'physical atk':
          gearDetails.stats.physicalAtk = value;
          break;
        case 'physical def':
          gearDetails.stats.physicalDef = value;
          break;
        case 'magic atk':
          gearDetails.stats.magicAtk = value;
          break;
        case 'magic def':
          gearDetails.stats.magicDef = value;
          break;
        case 'rarity':
          gearDetails.rarity = value;
          break;
        case 'source':
          gearDetails.source = value;
          break;
        default:
          console.log(`Unrecognized stat label: ${label}`);
      }
    });

    // Extract gear skills if available
    $('div.wp-block-table tr').each((index, element) => {
      const skillName = $(element).find('img').attr('alt');
      if (skillName) {
        gearDetails.skills.push(skillName);
      }
    });

    console.log(`Scraped gear details:`, gearDetails);
    return gearDetails;
  } catch (error) {
    console.error(`Error scraping details for gear at ${url}:`, error);
    return null;
  }
};

// Scrape all gear from the main page and get details for each gear
scrapeGear()
  .then(() => {
    console.log('Scraping complete.');
  })
  .catch((error) => {
    console.error('An error occurred during scraping:', error);
  });
