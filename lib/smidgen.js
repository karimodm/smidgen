'use strict'

const fs = require('fs')
const path = require('path')

const log = require('npmlog')
const IOTA = require('iota.lib.js')

const commandsDir = path.join(__dirname, 'cmds')

const smidgen = {
  config: null
}

module.exports = (exports = smidgen)

let commandFuncs = {}
let cliFuncs = {}

Object.defineProperty(smidgen, 'commands', {
  get: () => {
    if (!smidgen.config) {
      throw new Error('run smidgen.load before')
    }
    return commandFuncs
  }
})

Object.defineProperty(smidgen, 'cli', {
  get: () => {
    if (!smidgen.config) {
      throw new Error('run smidgen.load before')
    }
    return cliFuncs
  }
})

exports.load = load
function load (opts, cb) {
  fs.readdir(commandsDir, (err, res) => {
    if (err) return err
    const c = populateCommands(cliFuncs, commandFuncs, res)
    cliFuncs = c.cliFuncs
    commandFuncs = c.commandFuncs

    fs.readFile(opts.smidgenconf, 'utf8', (err, txt) => {
      if (err) return cb(err)

      let fileConf
      try {
        fileConf = JSON.parse(txt)
      } catch (e) {
        return cb(e)
      }

      const defaults = {
        balance: undefined,
        security: 2,
        amount: 25,
        threshold: 100,
        depth: 4,
        mwm: 14,
        provider: 'http://iota.bitfinex.com:80',
        validation: true
      }

      smidgen.config = Object.assign({}, defaults, fileConf, opts)
      smidgen.log = log

      smidgen.iota = new IOTA({
        'provider': smidgen.config.provider
      })

      smidgen.smidgenconf = opts.smidgenconf

      if (!smidgen.config.validation) {
        smidgen.log.info('', 'Online-Validations turned off. Take care!')
      }

      cb(null, smidgen)
    })
  })
}

exports.populateCommands = populateCommands
function populateCommands (cliFuncs, commandFuncs, list) {
  const cli = {}
  const command = {}

  list.filter((file) => {
    return /\.js$/.test(file)
  }).forEach((file) => {
    const cmdName = path.basename(file, '.js')
    const cmd = require(path.join(commandsDir, file))

    cli[cmdName] = cmd.cli
    command[cmdName] = cmd
  })

  return {
    cliFuncs: cli,
    commandFuncs: command
  }
}
