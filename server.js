const express = require('express');
const https = require('https');
const app = express();

let currentId = 1;
const maxId = 88;

app.use(express.json());
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get('/', (req, res) => {
  getCharacterData(currentId, (characterData) => {
    res.render("home", { character: characterData, currentId, maxId });
  });
});

app.get('/next', (req, res) => {
  getNextValidId(currentId, (validId) => {
    currentId = validId;
    getCharacterData(currentId, (character) => {
      res.render("home", { character, currentId, maxId });
    });
  });
});

app.get('/prev', (req, res) => {
  getPrevValidId(currentId, (validId) => {
    currentId = validId;
    getCharacterData(currentId, (character) => {
      res.render("home", { character, currentId, maxId });
    });
  });
});

app.get('/character/:id', (req, res) => {
  const id = parseInt(req.params.id);

  getValidCharacter(id, (validCharacter, validId) => {
    currentId = validId;
    res.render("home", { character: validCharacter, currentId, maxId });
  });
});

function getCharacterData(id, callback) {
  const url = `https://akabab.github.io/starwars-api/api/id/${id}.json`;

  https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode === 200) { 
        const character = JSON.parse(data);
        callback(character);
      } else {
        callback(null);
      }
    });

  }).on('error', (error) => {
    console.error("Error al hacer la solicitud: ", error);
    callback(null);
  });
}

function getNextValidId(id, callback) {
  id++;
  if (id > maxId) id = 1;

  getCharacterData(id, (character) => {
    if (character) {
      callback(id);
    } else {
      getNextValidId(id, callback);
    }
  });
}
function getPrevValidId(id, callback) {
  id--;
  if (id < 1) id = maxId;

  getCharacterData(id, (character) => {
    if (character) {
      callback(id);
    } else {
      getPrevValidId(id, callback); 
    }
  });
}

function getValidCharacter(id, callback) {
  getCharacterData(id, (character) => {
    if (character) {
      callback(character, id);
    } else {
      getNextValidId(id, (validId) => {
        callback(character, validId);
      });
    }
  });
}

app.get('/search', (req, res) => {
  const name = req.query.name;
  searchCharacterByName(name, (character, validId) => {
    if (character) {
      currentId = validId;
      res.render("home", { character, currentId, maxId });
    } else {
      res.render("error");
    }
  });
});

function searchCharacterByName(name, callback) {
  const url = `https://akabab.github.io/starwars-api/api/all.json`;

  https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode === 200) {
        const characters = JSON.parse(data);
        const foundCharacter = characters.find(character => character.name.toLowerCase() === name.toLowerCase());

        if (foundCharacter) {
          callback(foundCharacter, foundCharacter.id); 
        } else {
          callback(null, null);
        }
      } else {
        callback(null, null);
      }
    });

  }).on('error', (error) => {
    console.error("Error al hacer la solicitud: ", error);
    callback(null, null);
  });
}

app.listen(3000, () => {
  console.log("Aplicación escuchando en el puerto 3000");
});


