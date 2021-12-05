const spreadsheetId = ""
const testUrl = ""
const productionUrl = ""
const testing = true
const humanObj = [
  { name: 'Joe', userName: 'JoeIsCool152', platform: 'xbl' },
  { name: 'Sarah', userName: 'SarahIsCool192', platform: 'xbl' },
  ]

//DO NOT EDIT ANYTHING BELOW THIS LINE

const ss = SpreadsheetApp.openById(spreadsheetId);
const matchesSheet = ss.getSheetByName("Matches")
const idsSheet = ss.getSheetByName('Ids')



function fetchMatches() {
  const baseUrl = `https://api.tracker.gg/api/v2/halo-infinite/standard/matches`

  const options = {
    "headers": {
      'Origin': "https://halotracker.com"
    },
  }
  const currentMatchArray = []
  const randomNum = Math.floor(Math.random() * 1001);
  const idArray = (idsSheet.getRange(2, 1, idsSheet.getLastRow(), 1).getValues()).map(m => m[0]);

  for(const human of humanObj) {
    const matchesUrl = `${baseUrl}/${human.platform}/${human.userName}?type=mp$experience=ranked&playlist=edfef3ac-9cbe-4fa2-b949-8f29deafd483&random=${randomNum}`
    const results = UrlFetchApp.fetch(matchesUrl, options).getContentText();
    const json = JSON.parse(results);
    if(json.data) {
      const matches = json.data.matches;

      for (const match of matches){
        const matchId = match.attributes.matchId
        if(idArray.includes(matchId) == false && currentMatchArray.includes(matchId) == false){ 
          currentMatchArray.push(matchId)
          const lastRow = idsSheet.getLastRow();
          idsSheet.getRange(lastRow + 1,1).setValue(matchId)

          const matchUrl = `${baseUrl}/${matchId}?random=${randomNum}`
          const matchResults = UrlFetchApp.fetch(matchUrl, options).getContentText();
          const matchJson = JSON.parse(matchResults);
          const matchData = matchJson.data
          const timestamp = new Date(matchData.metadata.timestamp).toLocaleString('en-US', {timezone: 'EST'})
          const modeName = matchData.metadata.modeName;
          const finalDataObj = {}
          for(const player of matchData.segments){
            let userHandle = player.metadata.platformUserHandle
            if(humanObj.map(h => h.userName).includes(userHandle)){
              const stats = player.stats;
              const statsObj = {
                'outcome' : player.metadata.outcome,
                //'ratingIcon' : stats.rating.metadata.iconUrl,
                //'ratingEmoji' : `:${stats.rating.metadata.iconUrl.match(/(onxy|diamond|platinum|gold|silver|bronze)-[0-9]/)[0].replace('-','')}:`,
                'kills' : stats.kills.displayValue,
                'deaths' : stats.deaths.displayValue,
                'kda' : stats.kda.displayValue,
                'score' : stats.score.displayValue,
                'accuracy' : stats.accuracy.displayValue,
                'shotsFired' : stats.shotsFired.displayValue,
                'damageDealt' : stats.damageDealt.displayValue,
                'assists' : stats.assists.displayValue
              }
              finalDataObj[userHandle] = statsObj
            }
          }
          const finalMessageData = []
          let outcome = ''
          for(const u in finalDataObj){
            const finalStats = finalDataObj[u]
            const messageRow = `${u} - Kills: ${finalStats.kills} | Dmg: ${finalStats.damageDealt} | Acc: ${finalStats.accuracy}% | KDA: ${finalStats.kda}`
            outcome = finalStats.outcome
            finalMessageData.push(messageRow)
          }
          const finalMessage = `🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮\nMode: ${modeName}\nOutcome: ${outcome}\nDate: ${timestamp}\n\n${finalMessageData.join("\n")}\n🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮🎮`
          sendMessage(finalMessage, testing ? test : production)
        }
      }
    }
  }
}

const webhooks = {
  test: testUrl,
  production: productionUrl
};

function sendMessage(message, channel) {
  if(webhooks.hasOwnProperty(channel))
    var url = webhooks[channel];
  else {
    Logger.log("Error Sending Message to Channel " + channel);
    return "NoStoredWebhookException";
  }

  const payload = JSON.stringify({ content: message });

  const params = {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    payload: payload,
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(url, params);
  Logger.log(res.getContentText());
}




