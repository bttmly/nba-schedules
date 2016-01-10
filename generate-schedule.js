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

async.eachLimit(ids, 100,
  function (id, next) {
    nba.stats.boxScoreScoring({gameId: id}, function (err, data) {
      if (err) {
        console.log("errored on", id, err.message);
        return next();
      }

      console.log("finished", id);
      responses.push(_.pick(data.gameSummary[0], [
        "gameDateEst",
        "gameId",
        "gamecode",
        "homeTeamId",
        "visitorTeamId",
        "season",
      ]));
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



