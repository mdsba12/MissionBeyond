// Deep Run — the campaign. Each mission is a science question, a mission class and a starting build.
// The starting build is a sensible first attempt; the player changes it in the build bay.
export const MISSIONS = [
  {
    id: 'm1', name: 'Earth Watch', objective: 'earth', klass: 'small',
    brief: 'NASA wants a cheap, close look at how land, water and ice change from year to year. One camera, one year.',
    design: { orbit: 'leo500', launcher: 'small', propulsion: 'mono', instruments: ['imager'], power: { type: 'solar', areaM2: 4, units: 1 },
      antenna: 'patch', tx: 'tx10', shielding: 's1', redundancy: 'selective', ground: 'uni', tracking: 'light', team: 'small', pipeline: 'auto', policy: 'open' },
  },
  {
    id: 'm2', name: 'Lunar Ice', objective: 'moon', klass: 'medium',
    brief: 'Find water ice in the permanently shadowed craters at the Moon\'s poles. Two instruments, two years.',
    design: { orbit: 'llo', launcher: 'medlight', propulsion: 'mono', instruments: ['irspec', 'camera'], power: { type: 'solar', areaM2: 4, units: 1 },
      antenna: 'patch', tx: 'tx10', shielding: 's1', redundancy: 'selective', ground: 'comm', tracking: 'light', team: 'standard', pipeline: 'auto', policy: 'open' },
  },
  {
    id: 'm3', name: 'Red Weather', objective: 'mars', klass: 'medium',
    brief: 'Learn how Mars lost its air and what drives its weather today. Mars passes behind the Sun every two years, so plan for the pause.',
    design: { orbit: 'maero', launcher: 'medlight', propulsion: 'mono', instruments: ['irspec', 'sounder'], power: { type: 'solar', areaM2: 6, units: 1 },
      antenna: 'hga3', tx: 'tx35', shielding: 's1', redundancy: 'selective', ground: 'dsn34', tracking: 'light', team: 'standard', pipeline: 'auto', policy: 'open' },
  },
  {
    id: 'm4', name: 'Ocean Moon', objective: 'jupiter', klass: 'medium',
    brief: 'Jupiter\'s radiation belts are the harshest place this campaign goes. Probe Europa\'s ice for a hidden ocean and survive the belts.',
    design: { orbit: 'j53', launcher: 'medium', propulsion: 'biprop', instruments: ['mag', 'iceradar'], power: { type: 'rtg', areaM2: 1, units: 3 },
      antenna: 'hga3', tx: 'tx35', shielding: 's2', redundancy: 'selective', ground: 'dsn70', tracking: 'light', team: 'standard', pipeline: 'auto', policy: 'open' },
  },
];
