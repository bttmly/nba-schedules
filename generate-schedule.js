// generates a schedule for an nba season

// TODO
// - make it configurable (which season to build)
// - figure out how to get playoff games
// - generate as many season as they have (or is reasonable) and make them separate npm modules
//   (being able to require("nba-schedule-2015") would be nice to avoid having to bundle them all together)


var async = require("async");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");

var nba = require("../nba");

var responses = [];
var season = process.argv[2];

// this should be the real number of games...
var COUNT = 30 * 82 * .5;

function pad (n) {
  var s = String(n);
  while (s.length < 4) s = "0" + s;
  return s;
}

var ids = [];
var i = 0;
while (++i <= COUNT) ids.push("002" + season + "0" + pad(i));

 // 'GameSummary'
 // 'OtherStats'
 // 'Officials'
 // 'InactivePlayers'
 // 'GameInfo'
 // 'LineScore'
 // 'LastMeeting'
 // 'SeasonSeries'
 // 'AvailableVideo'

async.eachLimit(ids, 100,
  function (id, next) {
    console.log("start", id);
    nba.stats.boxScoreSummary({GameID: id}).then(function (data) {
      console.log("finished", id);

      const out = _(data.resultSets)
        .map(rs => ({
          name: rs.name,
          data: collectify(rs.headers, rs.rowSet),
        }))
        .indexBy("name")
        .value();

      const x = out.GameSummary.data[0];

      responses.push({
        "gameDateEst": x.GAME_DATE_EST,
        "gameId": x.GAME_ID,
        "gamecode": x.GAMECODE,
        "homeTeamId": x.HOME_TEAM_ID,
        "visitorTeamId": x.VISITOR_TEAM_ID,
        "season": 2016,
      });
      next();
    });
  },
  function () {
    responses = _.sortBy(responses, "gameId");
    fs.writeFileSync(
      path.join(__dirname, "schedule-" + season +".json"),
      JSON.stringify(responses, null, 2)
    );
  });


function collectify (headers, rows) {
  return rows.map(function (row) {
    return row.reduce(function (cell, val, i) {
      cell[headers[i]] = val;
      return cell;
    }, {});
  });
};

process.on("unhandledRejection", err => {
  console.log("uh oh....");

  console.log(responses[responses.length - 1]);

  throw err;
});
