// Colors chosen to meet ≥4.5:1 contrast on the app's ~#1a0e0e background
// so rank names remain legible without a heavy text-shadow.
export const RANKS = [
  { name: 'The Babysitter',    minXP: 0,    color: '#d4d0c2', flavor: "Heard a noise. Went back to the TV." },
  { name: 'Camp Counselor',    minXP: 100,  color: '#f08050', flavor: "Knows the rules. Breaks them anyway." },
  { name: 'The Final Girl',    minXP: 300,  color: '#e83550', flavor: "Survived the night. Barely." },
  { name: 'Sole Survivor',     minXP: 700,  color: '#ff6a68', flavor: "Everyone else is gone. You're still here." },
  { name: 'The Occultist',     minXP: 1000, color: '#3ec49a', flavor: "Knows things that shouldn't be known." },
  { name: 'The Possessed',     minXP: 1500, color: '#e0a040', flavor: "Something got in. It's not leaving." },
  { name: 'The Stalker',       minXP: 2200, color: '#f27aa0', flavor: "Patient. Methodical. Always watching." },
  { name: 'Architect of Pain', minXP: 3000, color: '#5aaee8', flavor: "Sets the trap. You walked right into it." },
  { name: 'The Undying',       minXP: 4000, color: '#9c95ee', flavor: "Killed three times. Still coming." },
  { name: 'The Entity',        minXP: 5000, color: '#c8c4d8', flavor: "Cannot be explained. Cannot be stopped." },
]

export function getRankForXP(xp) {
  return [...RANKS].reverse().find(r => xp >= r.minXP)
}

export function getNextRank(xp) {
  return RANKS.find(r => r.minXP > xp) || null
}
