const express = require('express');
const https = require('https');
const app = express();

let currentId = 1; // Initialize the current character ID
const maxId = 88; // Set the maximum character ID

app.use(express.json());
app.engine("ejs", require("ejs").renderFile); // Set EJS as the templating engine
app.set("view engine", "ejs");
app.use(express.static("public")); // Serve static files from the 'public' directory

// Route for the home page
app.get('/', (req, res) => {
  getCharacterData(currentId, (characterData) => {
    res.render("home", { character: characterData, currentId, maxId }); // Render the home template with character data
  });
});

// Route for the 'Next' button
app.get('/next', (req, res) => {
  getNextValidId(currentId, (validId) => {
    currentId = validId; // Update currentId to the valid next ID
    getCharacterData(currentId, (character) => {
      res.render("home", { character, currentId, maxId }); // Render the home template with the new character
    });
  });
});

// Route for the 'Previous' button
app.get('/prev', (req, res) => {
  getPrevValidId(currentId, (validId) => {
    currentId = validId; // Update currentId to the valid previous ID
    getCharacterData(currentId, (character) => {
      res.render("home", { character, currentId, maxId }); // Render the home template with the new character
    });
  });
});

// Route for fetching a character by ID
app.get('/character/:id', (req, res) => {
  const id = parseInt(req.params.id); // Get the ID from the URL parameters

  getValidCharacter(id, (validCharacter, validId) => {
    currentId = validId; // Update currentId to the valid character ID
    res.render("home", { character: validCharacter, currentId, maxId }); // Render the home template with the character data
  });
});

// Function to fetch character data from the API
function getCharacterData(id, callback) {
  const url = `https://akabab.github.io/starwars-api/api/id/${id}.json`;

  https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk; // Accumulate data chunks
    });

    response.on('end', () => {
      if (response.statusCode === 200) { 
        const character = JSON.parse(data); // Parse the JSON data
        callback(character); // Call the callback with the character data
      } else {
        callback(null); // Call the callback with null if not successful
      }
    });

  }).on('error', (error) => {
    console.error("Error making the request: ", error);
    callback(null); // Call the callback with null on error
  });
}

// Function to find the next valid character ID
function getNextValidId(id, callback) {
  id++;
  if (id > maxId) id = 1; // Wrap around to the first ID if exceeding maxId

  getCharacterData(id, (character) => {
    if (character) {
      callback(id); // If the character is valid, call the callback with the new ID
    } else {
      getNextValidId(id, callback); // Recursively find the next valid ID
    }
  });
}

// Function to find the previous valid character ID
function getPrevValidId(id, callback) {
  id--;
  if (id < 1) id = maxId; // Wrap around to the last ID if going below 1

  getCharacterData(id, (character) => {
    if (character) {
      callback(id); // If the character is valid, call the callback with the new ID
    } else {
      getPrevValidId(id, callback); // Recursively find the previous valid ID
    }
  });
}

// Function to validate a character by ID
function getValidCharacter(id, callback) {
  getCharacterData(id, (character) => {
    if (character) {
      callback(character, id); // Call the callback with the character and its ID
    } else {
      getNextValidId(id, (validId) => {
        callback(character, validId); // If invalid, find the next valid character ID
      });
    }
  });
}

// Route for searching characters by name
app.get('/search', (req, res) => {
  const name = req.query.name; // Get the name from the query parameters
  searchCharacterByName(name, (character, validId) => {
    if (character) {
      currentId = validId; // Update currentId to the valid character ID
      res.render("home", { character, currentId, maxId }); // Render the home template with the character data
    } else {
      res.render("error"); // Render an error template if not found
    }
  });
});

// Function to search for a character by name
function searchCharacterByName(name, callback) {
  const url = `https://akabab.github.io/starwars-api/api/all.json`;

  https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk; // Accumulate data chunks
    });

    response.on('end', () => {
      if (response.statusCode === 200) {
        const characters = JSON.parse(data); // Parse the JSON data
        const foundCharacter = characters.find(character => character.name.toLowerCase() === name.toLowerCase()); // Find the character by name

        if (foundCharacter) {
          callback(foundCharacter, foundCharacter.id); // Call the callback with the found character and its ID
        } else {
          callback(null, null); // Call the callback with null if not found
        }
      } else {
        callback(null, null); // Call the callback with null if not successful
      }
    });

  }).on('error', (error) => {
    console.error("Error making the request: ", error);
    callback(null, null); // Call the callback with null on error
  });
}

// Start the Express application
app.listen(3000, () => {
  console.log("Application listening on port 3000"); // Log to the console
});
