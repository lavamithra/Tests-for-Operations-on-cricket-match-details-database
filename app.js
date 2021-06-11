const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const query = `select * from player_details;`;
  const result = await database.all(query);
  response.send(
    result.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const { playerName } = request.body;

  const updateQuery = `update 
  player_details 
 set 
 player_name = '${playerName}'
 where player_id = '${playerId}'; `;

  await database.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getmatchQuery = `
    SELECT 
      *
    FROM 
      match_details 
    WHERE 
      match_id = ${matchId};`;
  const match = await database.get(getmatchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(match));
  console.log(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const query = ` SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;

  const playerMatches = await database.all(query);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
