const CONSTANTS = require('../../data/Constants.json')
const BaseFunctions = require("../../utils/BaseFunctions")

class Online {
  constructor(bot, api){
    this.bot = bot;
    this.api = api;

    // Data
    this.name = "Online"
    this.description = "The current online users"
    this.usage = "online {name/server}"
    this.example = "online MatsDeKerel"
    this.aliases = []
  }

  _getOnlinePerson(people, person) {
    for(let server of Object.keys(people)) {
      if((people[server].filter(user => user.toLowerCase() == person.toLowerCase())).length > 0) {
        return `${person} is currently playing on ${BaseFunctions.capitalizeString(server)}`
      }
    }
    return `Could not find person or server ${person}`
  }

  _getOnlineServer(people, server) {
    let msgString = ""

    if(people[server.toLowerCase()]) {
      if(people[server.toLowerCase()].length > 100) return `There are currently too many people in ${BaseFunctions.capitalizeString(server)} to return the users.`
      msgString = `There ${people[server.toLowerCase()].length == 1 ? "is" : "are"} currently ${people[server.toLowerCase()].length} ${people[server.toLowerCase()].length == 1 ? "player" : "players"} online in ${BaseFunctions.capitalizeString(server)}:`
      msgString += "\n" + people[server.toLowerCase()].join(", ")
    } else {
      return this._getOnlinePerson(people, server)
    }

    return msgString
  }

  _getOnlineAllServers(totals, totalOnline) {
    let msgString = ""

    for(let game of Object.keys(totals)) {
      msgString += `${totals[game]} in ${BaseFunctions.capitalizeString(game)}, `
    }

    // Here we prepend this string to msgString and then cut off the final space and comma from the final option (x, x, x, -> x, x, x)
    msgString = `There ${totalOnline == 1 ? "is" : "are"} currently ${totalOnline} ${totalOnline == 1 ? "player" : "players"} online:\n` + msgString.slice(0, -2)

    return msgString
  }

  async execute(message, args) {
    let online = await this.api.getOnline().catch(e => {
      console.error(e)
    })

    if(!online) {
      return message.channel.send("Error trying to find the online players")
    }

    let totalOnline = 0
    let totals = {}
    let people = {}
    let msgString = ""
    // let server of online defines every value of array online to server
    for(let server of online) {
      // Let's not include the dev servers or member-less servers
      if(server.namespace != "gameslabs" || server.users.length == 0) continue

      let game = server.game.toLowerCase().replace(/-/g, " ")

      totalOnline += server.users.length

      if(totals[game]) {
        totals[game] += server.users.length
      } else {
        totals[game] = server.users.length
      }

      if(people[game]) {
        // A lot of juice happens here:
        // ... makes it so that it appends the array elements to the array, not the array
        // i.e. [1, 2, 3, 4, 5] not [1, 2, 3, [4, 5]]
        // the .map turns the user object with properties name and id to just an array of name strings
        people[game].push(...(server.users.map(user => user.name)))
      } else {
        people[game] = server.users.map(user => user.name)
      }
    }

    if(!args) {
      msgString = this._getOnlineAllServers(totals, totalOnline)
    } else {
      msgString = this._getOnlineServer(people, args)
    }
    
    message.channel.send(msgString)

  }
}

module.exports = Online
