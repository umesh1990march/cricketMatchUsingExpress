const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
let db = null;
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Started"));
  } catch (err) {
    console.log(err.message);
  }
};

initializeDBServer();
const covertToPlayerList = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const playersDetails = `select * from player_details;`;
  const playerList = await db.all(playersDetails);
  response.send(playerList.map((obj) => covertToPlayerList(obj)));
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playersDetails = `select * from player_details where player_id = ${playerId};`;
  const playerList = await db.get(playersDetails);
  response.send({
    playerId: playerList.player_id,
    playerName: playerList.player_name,
  });
});

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetail = request.body;
  console.log(playerDetail);
  const playersDetails = `update player_details 
        set player_name = '${playerDetail.playerName}'  
  where player_id = ${playerId};`;
  await db.run(playersDetails);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const matchDetail = `select * from match_details where match_id = ${matchId};`;
  const match = await db.get(matchDetail);

  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  });
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const match = `select match_details.match_id,
                          match_details.match,
                          match_details.year 
                           from match_details 
                    natural join 
                    player_match_score
                    where player_id = ${playerId};`;
  const resultList = await db.all(match);
  console.log(resultList);
  const res = resultList.map((obj) => {
    return {
      matchId: obj.match_id,
      match: obj.match,
      year: obj.year,
    };
  });
  response.send(res);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const match = `select player_details.player_id,
  player_details.player_name
   from player_details
    natural join
   player_match_score
   where match_id = ${matchId};`;
  const resultList = await db.all(match);
  console.log(resultList);
  response.send(
    resultList.map((obj) => {
      return {
        playerId: obj.player_id,
        playerName: obj.player_name,
      };
    })
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const detail = `select player_details.player_id,
    player_details.player_name,
    sum(player_match_score.score)as total_score,
    sum(player_match_score.fours)as total_fours,
    sum(player_match_score.sixes)as total_sixes
    from player_details
    inner join player_match_score 
    on player_details.player_id = player_match_score.player_id
    where player_match_score.player_id = ${playerId};`;
  const res = await db.get(detail);
  response.send({
    playerId: res.player_id,
    playerName: res.player_name,
    totalScore: res.total_score,
    totalFours: res.total_fours,
    totalSixes: res.total_sixes,
  });
});

module.exports = app;
