export const RANKS = [
  { name: 'The Babysitter',    minXP: 0,    color: '#B4B2A9', flavor: "Heard a noise. Went back to the TV." },
  { name: 'Camp Counselor',    minXP: 100,  color: '#D85A30', flavor: "Knows the rules. Breaks them anyway." },
  { name: 'The Final Girl',    minXP: 300,  color: '#c0152a', flavor: "Survived the night. Barely." },
  { name: 'Sole Survivor',     minXP: 700,  color: '#E24B4A', flavor: "Everyone else is gone. You're still here." },
  { name: 'The Occultist',     minXP: 1000, color: '#1D9E75', flavor: "Knows things that shouldn't be known." },
  { name: 'The Possessed',     minXP: 1500, color: '#BA7517', flavor: "Something got in. It's not leaving." },
  { name: 'The Stalker',       minXP: 2200, color: '#D4537E', flavor: "Patient. Methodical. Always watching." },
  { name: 'Architect of Pain', minXP: 3000, color: '#3B8BD4', flavor: "Sets the trap. You walked right into it." },
  { name: 'The Undying',       minXP: 4000, color: '#7F77DD', flavor: "Killed three times. Still coming." },
  { name: 'The Entity',        minXP: 5000, color: '#2C2C2A', flavor: "Cannot be explained. Cannot be stopped." },
]

export function getRankForXP(xp) {
  return [...RANKS].reverse().find(r => xp >= r.minXP)
}

export function getNextRank(xp) {
  return RANKS.find(r => r.minXP > xp) || null
}
