import * as monaco from 'monaco-editor'

export const tokens = <monaco.languages.IMonarchLanguage> {
  values: [
    'true', 'false',
  ],
  keywords: [
    'advancement', 'grant', 'everything', 'from', 'only', 'through', 'until',
    'revoke', 'attribute', 'base', 'get', 'set', 'modifier', 'add', 'multiply',
    'multiply_base', 'remove', 'value', 'ban', 'ban-ip', 'banlist', 'ips',
    'players', 'bossbar', 'max', 'visible', 'list', 'color', 'blue', 'green',
    'pink', 'purple', 'red', 'white', 'yellow', 'name', 'style', 'notched_10',
    'notched_12', 'notched_20', 'notched_6', 'progress', 'clear', 'clone',
    'filtered', 'force', 'move', 'normal', 'masked', 'replace', 'data', 'block',
    'entity', 'storage', 'merge', 'modify', 'append', 'insert', 'prepend',
    'datapack', 'disable', 'enable', 'after', 'before', 'first', 'last',
    'available', 'enabled', 'debug', 'report', 'start', 'stop',
    'defaultgamemode', 'adventure', 'creative', 'spectator', 'survival', 'deop',
    'difficulty', 'easy', 'hard', 'peaceful', 'effect', 'give', 'enchant',
    'execute', 'align', 'anchored', 'as', 'at', 'facing', 'if', 'blocks', 'all',
    'predicate', 'score', '<', '<=', '=', '>', '>=', 'matches', 'in',
    'positioned', 'rotated', 'run', 'store', 'result', 'byte', 'double',
    'float', 'int', 'long', 'short', 'success', 'unless', 'experience',
    'levels', 'points', 'query', 'fill', 'destroy', 'hollow', 'keep',
    'outline', 'forceload', 'function', 'gamemode', 'gamerule',
    'announceAdvancements', 'commandBlockOutput', 'disableElytraMovementCheck',
    'disableRaids', 'doDaylightCycle', 'doEntityDrops', 'doFireTick',
    'doImmediateRespawn', 'doInsomnia', 'doLimitedCrafting', 'doMobLoot',
    'doMobSpawning', 'doPatrolSpawning', 'doTileDrops', 'doTraderSpawning',
    'doWeatherCycle', 'drowningDamage', 'fallDamage', 'fireDamage',
    'forgiveDeadPlayers', 'keepInventory', 'logAdminCommands',
    'maxCommandChainLength', 'maxEntityCramming', 'mobGriefing',
    'naturalRegeneration', 'randomTickSpeed', 'reducedDebugInfo',
    'sendCommandFeedback', 'showDeathMessages', 'spawnRadius',
    'spectatorsGenerateChunks', 'universalAnger', 'help', 'kick', 'kill',
    'uuids', 'locate', 'bastion_remnant', 'buried_treasure', 'desert_pyramid',
    'endcity', 'fortress', 'igloo', 'jungle_pyramid', 'mansion', 'mineshaft',
    'monument', 'nether_fossil', 'ocean_ruin', 'pillager_outpost',
    'ruined_portal', 'shipwreck', 'stronghold', 'swamp_hut', 'village',
    'locatebiome', 'loot', 'fish', 'mainhand', 'offhand', 'mine', 'spawn', 'me',
    'msg', 'op', 'pardon', 'pardon-ip', 'particle', 'playsound', 'ambient',
    'hostile', 'master', 'music', 'neutral', 'player', 'record', 'voice',
    'weather', 'publish', 'recipe', '*', 'take', 'reload', 'replaceitem',
    'save-all', 'flush', 'save-off', 'save-on', 'say', 'schedule', 'scoreboard',
    'objectives', 'displayname', 'rendertype', 'hearts', 'integer',
    'setdisplay', 'operation', 'reset', 'seed', 'setblock', 'setidletimeout',
    'setworldspawn', 'spawnpoint', 'spectate', 'spreadplayers', 'under',
    'stopsound', 'summon', 'tag', 'team', 'empty', 'join', 'leave',
    'collisionRule', 'always', 'never', 'pushOtherTeams', 'pushOwnTeam',
    'deathMessageVisibility', 'hideForOtherTeams', 'hideForOwnTeam',
    'displayName', 'friendlyFire', 'nametagVisibility', 'prefix',
    'seeFriendlyInvisibles', 'suffix', 'teammsg', 'teleport', 'tell',
    'tellraw', 'time', 'day', 'daytime', 'gametime', 'midnight', 'night',
    'noon', 'title', 'actionbar', 'subtitle', 'times', 'tm', 'tp', 'trigger',
    'w', 'rain', 'thunder', 'whitelist', 'off', 'on', 'worldborder', 'center',
    'damage', 'amount', 'buffer', 'warning', 'distance', 'xp',
  ],

  relevantSymbols: [
    '=', ':', ',',
  ],

  symbols:  /[=><!~?:&|+*\/\^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      [/[A-Za-z_$][\w$]+/, {
        cases: {
          '@values': 'variable.predefined',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],

      // whitespace
      { include: '@whitespace' },

      // numbers
      [/-?\d+\.\.|(?:-?\d+)?\.\.-?\d+/, 'number.hex'],
      [/-?\d*\.\d+([eE][\-+]?\d+)?[fd]?/, 'number.float'],
      [/-?\d+[bslfd]?/, 'number'],

      [/@[aerps]/, 'attribute.name'],

      // delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@relevantSymbols': 'operator.sql',
          '@default': ''
        }
      }],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid' ],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' } ],

      // characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid']
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' } ]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/#.*$/, 'comment'],
    ],
  },
}
