// Single source of truth for XP values, act metadata, and clue config.

export const PAST_RITUAL_MULT = 0.5

export const BASE_XP = {
  act1:    25,
  act2perQ: 10,
  act3:    35,
  act4:    100,
}

export const ACT1_CLUES = [
  { key: 'year',     label: 'Year',      penalty: 5 },
  { key: 'director', label: 'Director',  penalty: 8 },
  { key: 'subgenre', label: 'Sub-genre', penalty: 5 },
]

export const ACTS = [
  { num: 1, key: 'act1', badge: 'ACT I',   numeral: 'I',   name: 'Scene of the Crime', desc: 'Identify the film from a horror still.',  maxXP: BASE_XP.act1            },
  { num: 2, key: 'act2', badge: 'ACT II',  numeral: 'II',  name: 'The Inquisition',    desc: '5 multiple choice trivia questions.',      maxXP: BASE_XP.act2perQ * 5    },
  { num: 3, key: 'act3', badge: 'ACT III', numeral: 'III', name: 'Speak of the Devil', desc: 'Name the film from a famous quote.',       maxXP: BASE_XP.act3            },
  { num: 4, key: 'act4', badge: 'ACT IV',  numeral: 'IV',  name: 'Final Reckoning',    desc: 'Open answer — no multiple choice.',        maxXP: BASE_XP.act4            },
]
