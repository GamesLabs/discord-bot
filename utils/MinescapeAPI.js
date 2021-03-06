const Constants = require('../data/Constants.json')
const EventEmitter = require('events');
const request = require('request')

/**
 * Creates a connection to the Minescape API
 * @param {string} key - The API key to use
 * @property {string} key - The given API key to minescape
 * @extends EventEmitter
 */
class MinescapeAPI extends EventEmitter { // Extends an event emitter cause if we have some websocket stuff then we're going to want to emit events when we recieve them.
  constructor(key) {
    super();
    this.key = key;
  }

  /**
   * Gets a players MC UUID from their name
   * @param {String} username The player's minecraft username
   * @returns {Promise<String>} The player's full (untrimmed) UUID
   */
  _getUUID(username = "") {
    return new Promise((resolve, reject) => {
      let options = {
        method: "GET",
        uri: `${Constants.MOJANG_API}/users/profiles/minecraft/${username}`
      }
      request(options, (error, response) => {
        if(error) return reject(error)
        if(!response.body) return reject("User not found")
        let body = JSON.parse(response.body)

        if(body.error) {
          reject(response.body.errorMessage)
        } else {
          // We need to make this trimmed UUID a full UUID
          // something like xxxx to x-x-x-x
          resolve(
            body.id.slice(0, 8) + "-" +
            body.id.slice(8, 12) + "-" +
            body.id.slice(12, 16) + "-" +
            body.id.slice(16, 20) + "-" +
            body.id.slice(20)
          )
        }
      })
    })
  }

  /**
   * Get's the player's Gameslabs ID
   * @param {String} username The player's username to find
   * @param {Number} pos The profile to find
   * @returns {Promise<String>} A string of the user's minescape ID
   */
  _getProfileID(username, pos = "default") {
    return new Promise(async (resolve, reject) => {
      let UUID = await this._getUUID(username).catch(e => reject(e))
      if(!UUID) return
      let options = {
        method: "GET",
        uri: `${Constants.API_URL}/1.0.0/minecraft-java/${UUID}`
      }
      request(options, (error, response) => {
        if(error) return reject(error)
        let body = JSON.parse(response.body)

        if(body.message) {
          reject(body.message)
        } else {
          let profiles = body.profiles.list
          if(pos === "default") {
            for(let profile of profiles) {
              if(profile.default) return resolve(profile.id)
            }
            return reject("Couldn't find a default profile?")
          } else {
            if(profiles[pos]) {
              resolve(profiles[pos].id)
            } else {
              reject(`The user doesn't have these many profiles`)
            }
          }
        }
      })
    })
  }

  /**
   * Gets the user's stats. Can use either params
   * @param {String} userName The username to get the stats of
   * @param {String} profile The profile to get the stats of
   * @return {Promise<Object>} An Object of the user's stats
   */
  getStats(username = "", profile = "default"){
    if(!profile) profile = "default"
    // We return a Promise so that we are able to tell the process to pause for the API request
    return new Promise(async (resolve, reject) => {
      let profileID = await this._getProfileID(username, profile).catch(e => reject(e))
      if(!profileID) return

      let options = {
        method: "GET",
        uri: `${Constants.API_URL}/1.0.0/saves/game/gameslabs-minescape/profile/profile-${profileID}`,
      }
      request(options, (error, response) => {
        if(error) return reject(error)
        let body = JSON.parse(response.body)

        if(body.message){
          reject(body.message)
        } else {
          if(!body[0]) return reject("User not found")
          resolve(body[0].content.extra.skills)
        }
      })
    })
  }

  /**
   * Get's the top in a skill(s)
   * @param  {String} stat The stat to search for
   * @param  {String} game The game to search out of
   * @return {Promise<Object>} An object of the top for each stat
   */
  getTop(stat, game){
    return new Promise((resolve, reject) => {
      if(game != "minescape" || Constants.STAT_NAMES[stat]) {
        if(!Constants.STAT_NAMES[stat]) return reject(`Couldn't find the stat ${stat}`)
        stat = Constants.STAT_NAMES[stat]
      }

      let options = {
        method: "GET",
        uri: `${Constants.API_URL}/1.0.0/leaderboard/game/${Constants.API_LOCATIONS[game]}/${stat}`,
      }
      request(options, (error, response) => {
        if(error) return reject(error)
        let body = JSON.parse(response.body)
        if(body.message){
          reject(body.message)
        } else {
          resolve(body)
        }
      })
    })
  }

  /**
   * Gets the current online players
   * @return {Array<String>} An array of the users
   */
  getOnline(){
    return new Promise((resolve, reject) => {
      let options = {
        method: "GET",
        uri: `${Constants.API_URL}/1.0.0/servers`,
      }
      request(options, (error, response) => {
        if(error){
          reject(error)
        } else {
          try {
            let body = JSON.parse(response.body)
            return resolve(body)
          } catch(e) {
            return reject(e)
          }
        }
      })
    })
  }

  /**
   * Gets the current online players count
   * @return {Array<String>} An array of the users
   */
  getOnlineCount(){
    return new Promise((resolve, reject) => {
      let options = {
        method: "GET",
        uri: `${Constants.API_URL}/1.0.0/servers/gameslabs/count`,
      }
      request(options, (error, response) => {
        if(error){
          reject(error)
        } else {
          try {
            let body = JSON.parse(response.body)
            return resolve(body)
          } catch(e) {
            return reject(e)
          }
        }
      })
    })
  }
}

module.exports = MinescapeAPI
