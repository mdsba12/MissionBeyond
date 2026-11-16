// Deep Run — mission data.
// RULE: every number in this file carries exactly one provenance tag:
//   src:        id of an entry in SOURCES (a published reference)
//   defined:    an exact SI / IAU defined constant
//   assumption: a game-design value that is NOT real data (with the reason)
// scripts/check-sources.mjs fails the build if any entry breaks this rule.

export const SOURCES = {
  // --- Challenge resources (NASA Space Apps 2026, Space Mission Design Game) ---
  'challenge': { title: 'Space Mission Design Game — 2026 NASA Space Apps Challenge statement', publisher: 'NASA Space Apps', url: 'https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/', usedFor: 'Requirements the game is built against.' },
  'res-design': { title: 'Design and Develop Science Missions', publisher: 'NASA', url: 'https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf', usedFor: 'The four mission segments (launch, space, ground, user) that structure the design screens.' },
  'res-cml': { title: 'Space Mission Concept Development Using Concept Maturity Levels', publisher: 'NASA Jet Propulsion Laboratory', url: 'https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299', usedFor: 'The four game stages (CML 1 to CML 4).' },
  'res-mdl': { title: 'Mission Design Lab (MDL)', publisher: 'NASA Goddard Space Flight Center', url: 'https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/', usedFor: 'Study levels (concept, trade study, point design) and the list of disciplines checked in the design review.' },
  'res-webb-game': { title: 'Build It Yourself: Satellite! (a learning game about telescopes)', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/webb/game-build-it-yourself/', usedFor: 'Design inspiration only: levels of rising complexity, constrained choices, and matching the result to real missions. No assets or text copied.' },
  'res-cubesat101': { title: 'CubeSat 101: Basic Concepts and Processes for First-Time CubeSat Developers', publisher: 'NASA CubeSat Launch Initiative', url: 'https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf', usedFor: 'Mission phases from concept of operations to launch and operations.' },
  'res-gmat': { title: 'General Mission Analysis Tool (GMAT)', publisher: 'NASA Goddard Space Flight Center', url: 'https://software.nasa.gov/software/GSC-19468-1', usedFor: 'Recommended tool for checking the game\'s trajectory numbers. Not run for this build: the game uses patched-conic formulas instead.' },
  'res-missionviz': { title: 'NASA Mission Viz', publisher: 'NASA', url: 'https://nasa.github.io/mission-viz/', usedFor: 'Reference for the idea of a web-based trajectory view. No code reused.' },
  // --- Physical data ---
  'nssdc-sun': { title: 'Sun Fact Sheet', publisher: 'NASA NSSDCA', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html', usedFor: 'Gravitational parameter of the Sun.' },
  'nssdc-earth': { title: 'Earth Fact Sheet', publisher: 'NASA NSSDCA', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html', usedFor: 'Earth GM, radius, orbit size.' },
  'nssdc-moon': { title: 'Moon Fact Sheet', publisher: 'NASA NSSDCA', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html', usedFor: 'Moon GM, radius, distance from Earth.' },
  'nssdc-mars': { title: 'Mars Fact Sheet', publisher: 'NASA NSSDCA', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html', usedFor: 'Mars GM, radius, orbit size.' },
  'nssdc-jupiter': { title: 'Jupiter Fact Sheet', publisher: 'NASA NSSDCA', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html', usedFor: 'Jupiter GM, radius, orbit size.' },
  'tsi': { title: 'Solar Irradiance Science', publisher: 'NASA Goddard Space Flight Center', url: 'https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science', usedFor: 'Total solar irradiance at 1 AU (1361 W/m²).' },
  'mmrtg': { title: 'Multi-Mission Radioisotope Thermoelectric Generator (MMRTG) fact sheet', publisher: 'NASA', url: 'https://science.nasa.gov/wp-content/uploads/2024/02/mmrtg-factsheet-updated-5-18-20-1.pdf', usedFor: 'MMRTG power (110 W at beginning of life) and mass (about 45 kg).' },
  'juno-presskit': { title: 'Juno: Jupiter Orbit Insertion press kit', publisher: 'NASA Jet Propulsion Laboratory', url: 'https://www.jpl.nasa.gov/news/press_kits/juno/pdf/juno-lores.pdf', usedFor: 'Solar array area (more than 60 m²) and output (about 14 kW at Earth, about 500 W at Jupiter), used to derive array-level efficiency.' },
  'juno-video': { title: 'Crazy Engineering: Flying Solar to Jupiter', publisher: 'NASA Jet Propulsion Laboratory', url: 'https://www.jpl.nasa.gov/videos/crazy-engineering-flying-solar-to-jupiter/', usedFor: 'Solar array mass (about 250 pounds per wing, three wings), used to derive kg per m².' },
  'mars-conjunction': { title: "NASA's Mars Fleet Will Still Conduct Science While Lying Low", publisher: 'NASA', url: 'https://www.nasa.gov/solar-system/planets/mars/nasas-mars-fleet-will-still-conduct-science-while-lying-low', usedFor: 'Mars solar conjunction: a two-week commanding pause about every two years.' },
  'soa-power': { title: 'State-of-the-Art of Small Spacecraft Technology: Power', publisher: 'NASA Small Spacecraft Systems Virtual Institute', url: 'https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems', usedFor: 'Solar power falls with the inverse square of distance from the Sun; multi-junction cells are standard.' },
  'soa-prop': { title: 'Smallsat Propulsion Survey (State-of-the-Art report propulsion table)', publisher: 'NASA Ames Research Center', url: 'https://colorado.edu/event/ippw2018/smallsat-propulsion-bruce-yost-nasaames', usedFor: 'Hydrazine monopropellant specific impulse range (200 to 235 s).' },
  'dsn': { title: 'Deep Space Network', publisher: 'NASA', url: 'https://www.nasa.gov/communicating-with-missions/dsn/', usedFor: 'Three DSN sites spaced around the Earth with 34 m and 70 m antennas.' },
  'webb-orbit': { title: "Webb's Orbit", publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/webb/orbit/', usedFor: 'Sun–Earth L2 lies about 1.5 million km from Earth.' },
  'donki': { title: 'Space Weather Database Of Notifications, Knowledge, Information (DONKI)', publisher: 'NASA Community Coordinated Modeling Center', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', usedFor: 'Reference for real solar-storm activity. Not connected in this build: storm timing is a game assumption.' },
  'open-science': { title: 'NASA Open Science', publisher: 'NASA Science', url: 'https://science.nasa.gov/open-science/', usedFor: 'The open-data option in the user segment.' },
  // --- Real missions shown in the debrief ---
  'm-landsat9': { title: 'Landsat 9', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/landsat-9/', usedFor: 'Real-mission match.' },
  'm-lro': { title: 'Lunar Reconnaissance Orbiter', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/lro/', usedFor: 'Real-mission match.' },
  'm-maven': { title: 'MAVEN', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/maven/', usedFor: 'Real-mission match.' },
  'm-mro': { title: 'Mars Reconnaissance Orbiter', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/', usedFor: 'Real-mission match.' },
  'm-webb': { title: 'James Webb Space Telescope', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/webb/', usedFor: 'Real-mission match.' },
  'm-juno': { title: 'Juno', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/juno/', usedFor: 'Real-mission match.' },
  'm-clipper': { title: 'Europa Clipper', publisher: 'NASA Science', url: 'https://science.nasa.gov/mission/europa-clipper/', usedFor: 'Real-mission match.' },
};

const GAME = 'Game-balance value, not real data.';

export const CONST = {
  c:        { value: 299792.458, unit: 'km/s', defined: 'Speed of light, exact SI definition.' },
  g0:       { value: 9.80665, unit: 'm/s²', defined: 'Standard gravity, exact conventional value.' },
  kB:       { value: 1.380649e-23, unit: 'J/K', defined: 'Boltzmann constant, exact SI definition.' },
  muSun:    { value: 132712e6, unit: 'km³/s²', src: 'nssdc-sun' },
  muEarth:  { value: 0.39860e6, unit: 'km³/s²', src: 'nssdc-earth' },
  rEarth:   { value: 6378.1, unit: 'km', src: 'nssdc-earth' },
  aEarth:   { value: 149.598e6, unit: 'km', src: 'nssdc-earth' },
  muMoon:   { value: 0.00490e6, unit: 'km³/s²', src: 'nssdc-moon' },
  rMoon:    { value: 1737.4, unit: 'km', src: 'nssdc-moon' },
  aMoon:    { value: 0.3844e6, unit: 'km', src: 'nssdc-moon' },
  muMars:   { value: 0.042828e6, unit: 'km³/s²', src: 'nssdc-mars' },
  rMars:    { value: 3396.2, unit: 'km', src: 'nssdc-mars' },
  aMars:    { value: 227.956e6, unit: 'km', src: 'nssdc-mars' },
  muJupiter:{ value: 126.687e6, unit: 'km³/s²', src: 'nssdc-jupiter' },
  rJupiter: { value: 71492, unit: 'km', src: 'nssdc-jupiter' },
  aJupiter: { value: 778.479e6, unit: 'km', src: 'nssdc-jupiter' },
  l2Dist:   { value: 1.5e6, unit: 'km', src: 'webb-orbit' },
  tsi:      { value: 1361, unit: 'W/m²', src: 'tsi' },
  // Derived from Juno: 14 kW / (60 m² × 1361 W/m²) = 0.171
  arrayEff: { value: 0.171, unit: '', src: 'juno-presskit', note: 'Array-level efficiency derived from Juno: about 14 kW from about 60 m² at 1 AU.' },
  // Derived from Juno: 3 wings × 250 lb (113.4 kg) / 60 m² = 5.7 kg/m²
  arrayKgM2:{ value: 5.7, unit: 'kg/m²', src: 'juno-video', note: 'Derived from Juno: three wings of about 250 lb each over about 60 m².' },
  rtgW:     { value: 110, unit: 'W', src: 'mmrtg' },
  rtgKg:    { value: 45, unit: 'kg', src: 'mmrtg' },
  conjDays: { value: 14, unit: 'days', src: 'mars-conjunction' },
  conjEveryYears: { value: 2, unit: 'years', src: 'mars-conjunction' },
  parkAltKm:{ value: 300, unit: 'km', assumption: 'Reference parking orbit. All departure Δv is measured from here so every figure shares one frame.' },
  upperIsp: { value: 450, unit: 's', assumption: 'Representative hydrogen/oxygen upper stage; real stages vary.' },
  upperLoss:{ value: 0.10, unit: '', assumption: 'Share of throw mass lost to upper-stage structure and adapter. ' + GAME },
  tankFrac: { value: 0.10, unit: '', assumption: 'Tank and feed-system mass as a share of propellant. ' + GAME },
  busBaseKg:{ value: 80, unit: 'kg', assumption: 'Fixed bus mass (structure, avionics, thermal). ' + GAME },
  busPerPayload: { value: 1.5, unit: 'kg/kg', assumption: 'Bus mass per kg of payload. ' + GAME },
  busPowerW:{ value: 120, unit: 'W', assumption: 'Avionics, thermal and attitude-control load. ' + GAME },
  txEff:    { value: 0.4, unit: '', assumption: 'Transmitter DC-to-RF efficiency. ' + GAME },
  dishEff:  { value: 0.55, unit: '', assumption: 'Typical aperture efficiency for a parabolic dish; real antennas vary.' },
  freqHz:   { value: 8.4e9, unit: 'Hz', assumption: 'X-band downlink, the band most science missions use; exact channel not modelled.' },
  ebn0:     { value: 2.5, unit: '', assumption: 'Required Eb/N0 of about 1 dB plus 3 dB margin, as a linear ratio. ' + GAME },
  rateCapBps:{ value: 300e6, unit: 'bit/s', assumption: 'Radio bandwidth limit. ' + GAME },
  l2InsertKmS:{ value: 0.10, unit: 'km/s', assumption: 'Allowance for L2 course corrections and station keeping. ' + GAME },
  l2TransitDays:{ value: 30, unit: 'days', assumption: 'About a month to reach L2; not computed.' },
  leoSlantKm:{ value: 2000, unit: 'km', assumption: 'Typical slant range from low Earth orbit to a ground station near the horizon.' },
  aerobrakeDays:{ value: 180, unit: 'days', assumption: 'About six months of aerobraking; real campaigns vary.' },
  aerobrakeKmS:{ value: 0.10, unit: 'km/s', assumption: 'Allowance for aerobraking walk-in and final circularisation. ' + GAME },
  costPerDryKg:{ value: 0.05, unit: 'pts/kg', assumption: 'Spacecraft cost per kg of dry mass. ' + GAME },
  solarCostM2:{ value: 0.5, unit: 'pts/m²', assumption: 'Solar array cost. ' + GAME },
  rtgCost:  { value: 40, unit: 'pts', assumption: 'Cost of one radioisotope generator, reflecting scarce fuel and launch approval. ' + GAME },
  deepHoursPerSite:{ value: 8, unit: 'h/day', assumption: 'One site sees a distant spacecraft for about a third of each day as Earth turns.' },
  // Flight hazards and recorder. No public data is used for these: they are game assumptions that set how often things go wrong.
  bufferGb: { value: 200, unit: 'Gb', assumption: 'Onboard data recorder size. ' + GAME },
  arrayDegPerYear: { value: 0.015, unit: '', assumption: 'Solar array output lost each year to radiation and thermal ageing. ' + GAME },
  stormDays: { value: 2, unit: 'days', assumption: 'How long a solar storm lasts once it arrives. ' + GAME },
  forecastDays: { value: 2, unit: 'days', assumption: 'How far ahead a storm is forecast. Real space-weather forecasts vary. ' + GAME },
  safeUpsetFactor: { value: 0.15, unit: '', assumption: 'Share of storm upset risk left while the craft sits in safe mode. ' + GAME },
  stressUpsetFactor: { value: 1.5, unit: '', assumption: 'Extra upset risk for demanding orbits (aerobraking, short orbits). ' + GAME },
  rebootDays: { value: 14, unit: 'days', assumption: 'Time a single flight computer is offline after an upset. ' + GAME },
  rebootFailChance: { value: 0.25, unit: '', assumption: 'Chance that a single-computer reboot never completes. ' + GAME },
  backupSwitchDays: { value: 1, unit: 'days', assumption: 'Time for the backup computer to take over. ' + GAME },
  wheelsPerYear: { value: 0.3, unit: '/yr', assumption: 'Expected reaction-wheel failures per year across the whole wheel set. ' + GAME },
  outagesPerYear: { value: 0.6, unit: '/yr', assumption: 'Expected ground-antenna outages per year at one site. ' + GAME },
  outageDays: { value: 14, unit: 'days', assumption: 'Length of one ground-antenna outage. ' + GAME },
  brownoutDays: { value: 3, unit: 'days', assumption: 'Days the bus can run short of power before the spacecraft falls silent. ' + GAME },
};

// Solar storms per year, by the target's radiation level (1 to 3). Jupiter's belts add storm-like exposure.
export const STORM_RATE = [
  { level: 1, perYear: 1.0, assumption: 'Expected storms per year in a quiet radiation environment. ' + GAME },
  { level: 2, perYear: 2.0, assumption: 'Expected storms per year in a moderate radiation environment. ' + GAME },
  { level: 3, perYear: 3.0, assumption: 'Expected storms per year where the radiation belts are strong. ' + GAME },
];

// Chance that one storm upsets the flight computer, by shielding level (0 standard parts, 1 hardened, 2 vault).
export const UPSET = [
  { shield: 0, chance: 0.35, assumption: 'Upset chance per storm with standard parts. ' + GAME },
  { shield: 1, chance: 0.10, assumption: 'Upset chance per storm with radiation-hardened parts. ' + GAME },
  { shield: 2, chance: 0.02, assumption: 'Upset chance per storm inside a radiation vault. ' + GAME },
];

export const CLASSES = [
  { id: 'small', name: 'Small', level: 1, scienceYears: 1, sciMin: 0.5, sciFull: 1.0, maxInstruments: 1,
    desc: 'One instrument, one year of science, tight budget.', assumption: GAME },
  { id: 'medium', name: 'Medium', level: 2, scienceYears: 2, sciMin: 1.0, sciFull: 2.0, maxInstruments: 2,
    desc: 'Two instruments, two years of science.', assumption: GAME },
  { id: 'flagship', name: 'Flagship', level: 3, scienceYears: 4, sciMin: 1.5, sciFull: 3.0, maxInstruments: 3,
    desc: 'Three instruments, four years of science, the most to coordinate.', assumption: GAME },
];

export const OBJECTIVES = [
  { id: 'earth', dest: 'earth', budget: { small: 100, medium: 230, flagship: 290 }, name: 'Watch Earth change', question: 'How are land, water and ice changing year to year?',
    radiation: 1, missions: ['m-landsat9'], assumption: 'Radiation level is a 1-to-3 game scale. Budgets are game values set about 15% above the cheapest robust design found by search.' },
  { id: 'moon', dest: 'moon', budget: { small: 110, medium: 160, flagship: 180 }, name: 'Map lunar water ice', question: 'Where is water ice near the Moon\'s poles, and how much is there?',
    radiation: 1, missions: ['m-lro'], assumption: 'Radiation level is a 1-to-3 game scale. Budgets are game values set about 15% above the cheapest robust design found by search.' },
  { id: 'mars', dest: 'mars', budget: { small: 175, medium: 225, flagship: 260 }, name: 'Study Mars\' climate', question: 'How did Mars lose its atmosphere, and what drives its weather today?',
    radiation: 1, missions: ['m-maven', 'm-mro'], assumption: 'Radiation level is a 1-to-3 game scale. Budgets are game values set about 15% above the cheapest robust design found by search.' },
  { id: 'l2', dest: 'l2', budget: { small: 520, medium: 590, flagship: 755 }, name: 'See the early universe', question: 'What did the first galaxies look like in infrared light?',
    radiation: 1, missions: ['m-webb'], assumption: 'Radiation level is a 1-to-3 game scale. Budgets are game values set about 15% above the cheapest robust design found by search.' },
  { id: 'jupiter', dest: 'jupiter', budget: { small: 290, medium: 500, flagship: 530 }, name: 'Probe an ocean world', question: 'Is there a habitable ocean under the ice of Jupiter\'s moon Europa?',
    radiation: 3, missions: ['m-juno', 'm-clipper'], assumption: 'Radiation level is a 1-to-3 game scale; Jupiter\'s belts are the harshest case. Budgets are game values set about 15% above the cheapest robust design found by search.' },
];

// Orbit options. Geometry is computed in engine.js from CONST; the fields here are choices and game multipliers.
export const ORBITS = {
  earth: [
    { id: 'leo500', name: '500 km circular', altKm: 500, sciMult: 1.1, sunFrac: 0.62, desc: 'Closer for sharper images.', assumption: 'Altitude is a design choice. Science multiplier and sunlit fraction are game values.' },
    { id: 'leo700', name: '700 km circular', altKm: 700, sciMult: 1.0, sunFrac: 0.65, desc: 'Wider view, slightly more launch effort.', assumption: 'Altitude is a design choice. Science multiplier and sunlit fraction are game values.' },
  ],
  moon: [
    { id: 'llo', name: '100 km polar orbit', periAltKm: 100, apoAltKm: 100, sciMult: 1.2, sunFrac: 0.6, desc: 'Low and circular: best mapping, largest braking burn.', assumption: 'Altitudes are design choices. Science multiplier and sunlit fraction are game values.' },
    { id: 'lelliptic', name: '100 × 10,000 km orbit', periAltKm: 100, apoAltKm: 10000, sciMult: 0.8, sunFrac: 0.9, desc: 'Cheaper to enter, but most of each orbit is far from the surface.', assumption: 'Altitudes are design choices. Science multiplier and sunlit fraction are game values.' },
  ],
  mars: [
    { id: 'mlow', name: '400 km circular, propulsive', periAltKm: 400, sciMult: 1.2, sunFrac: 0.62, desc: 'Brake straight into the science orbit with a large burn.', assumption: 'Altitude is a design choice. Science multiplier and sunlit fraction are game values.' },
    { id: 'maero', name: '400 km circular, aerobraked', periAltKm: 400, capturePeriodH: 35, aerobrake: true, sciMult: 1.2, sunFrac: 0.62, extraRisk: 1, desc: 'Small capture burn into a 35-hour orbit, then months of dipping through the atmosphere to shrink it.', assumption: 'Capture period is a design choice. Multipliers and risk are game values.' },
  ],
  l2: [
    { id: 'halo', name: 'Sun–Earth L2 halo orbit', sciMult: 1.0, sunFrac: 1.0, desc: 'Cold, stable and always in sunlight for power.', assumption: 'Science multiplier and sunlit fraction are game values.' },
  ],
  jupiter: [
    { id: 'j53', name: '53-day polar orbit', periRj: 1.06, periodDays: 53, sciMult: 1.0, sunFrac: 0.95, desc: 'Long looping orbit: small capture burn, brief passes through the radiation belts.', assumption: 'Orbit shape is a design choice. Multipliers are game values.' },
    { id: 'j14', name: '14-day orbit', periRj: 1.06, periodDays: 14, sciMult: 1.3, sunFrac: 0.95, extraRisk: 1, desc: 'More flybys per year, bigger burn, more time in radiation.', assumption: 'Orbit shape is a design choice. Multipliers and risk are game values.' },
  ],
};

export const LAUNCHERS = [
  { id: 'small', name: 'Small launcher', leoKg: 300, cost: 15, assumption: 'Generic class, not a real vehicle. ' + GAME },
  { id: 'medlight', name: 'Medium-light launcher', leoKg: 2000, cost: 35, assumption: 'Generic class, not a real vehicle. ' + GAME },
  { id: 'medium', name: 'Medium launcher', leoKg: 8000, cost: 70, assumption: 'Generic class, not a real vehicle. ' + GAME },
  { id: 'heavy', name: 'Heavy launcher', leoKg: 20000, cost: 130, assumption: 'Generic class, not a real vehicle. ' + GAME },
  { id: 'super', name: 'Super-heavy launcher', leoKg: 60000, cost: 320, assumption: 'Generic class, not a real vehicle. ' + GAME },
];

export const PROPULSION = [
  { id: 'mono', name: 'Hydrazine monopropellant', isp: 230, cost: 3, src: 'soa-prop', note: 'Isp within the 200–235 s range in the source. Cost is a game value.' },
  { id: 'biprop', name: 'Storable bipropellant', isp: 320, cost: 9, assumption: 'Representative specific impulse for a storable bipropellant main engine; real engines vary. Cost is a game value.' },
];

// fit: how well the instrument answers each objective (1 = built for it, 0.5 = partly useful).
const INST = 'Representative order of magnitude, not a real instrument. ' + GAME;
export const INSTRUMENTS = [
  { id: 'imager', name: 'Multispectral imager', massKg: 40, powerW: 60, gbDay: 40, cost: 15, fit: { earth: 1, mars: 0.5, moon: 0.5 }, assumption: INST },
  { id: 'sar', name: 'Imaging radar', massKg: 150, powerW: 400, gbDay: 200, cost: 45, fit: { earth: 1, moon: 0.5 }, assumption: INST },
  { id: 'neutron', name: 'Neutron spectrometer', massKg: 15, powerW: 15, gbDay: 0.2, cost: 12, fit: { moon: 1, mars: 0.5 }, assumption: INST },
  { id: 'irspec', name: 'Infrared spectrometer', massKg: 30, powerW: 40, gbDay: 4, cost: 22, fit: { moon: 1, mars: 1, jupiter: 1, earth: 0.5 }, assumption: INST },
  { id: 'sounder', name: 'Atmospheric sounder', massKg: 25, powerW: 35, gbDay: 2, cost: 18, fit: { mars: 1, earth: 0.5 }, assumption: INST },
  { id: 'mag', name: 'Magnetometer', massKg: 5, powerW: 5, gbDay: 0.05, cost: 8, fit: { jupiter: 1, mars: 0.5 }, assumption: INST },
  { id: 'iceradar', name: 'Ice-penetrating radar', massKg: 35, powerW: 55, gbDay: 5, cost: 30, fit: { jupiter: 1, moon: 0.5 }, assumption: INST },
  { id: 'camera', name: 'High-resolution camera', massKg: 20, powerW: 30, gbDay: 8, cost: 14, fit: { moon: 1, mars: 1, jupiter: 0.5, earth: 0.5 }, assumption: INST },
  { id: 'telescope', name: 'Infrared telescope (2.4 m)', massKg: 900, powerW: 500, gbDay: 30, cost: 160, fit: { l2: 1 }, assumption: INST },
  { id: 'nirspec', name: 'Near-infrared spectrograph', massKg: 120, powerW: 120, gbDay: 6, cost: 50, fit: { l2: 1 }, assumption: INST + ' Needs the telescope to feed it.', needs: 'telescope' },
  { id: 'fgs', name: 'Wide-field infrared camera', massKg: 90, powerW: 90, gbDay: 20, cost: 40, fit: { l2: 1 }, assumption: INST + ' Needs the telescope to feed it.', needs: 'telescope' },
];

export const ANTENNAS = [
  { id: 'patch', name: 'Low-gain patch antenna', dishM: 0.1, massKg: 1, cost: 1, assumption: GAME },
  { id: 'hga1', name: '1 m high-gain dish', dishM: 1, massKg: 12, cost: 6, assumption: GAME },
  { id: 'hga3', name: '3 m high-gain dish', dishM: 3, massKg: 40, cost: 18, assumption: GAME },
];

export const TRANSMITTERS = [
  { id: 'tx10', name: '10 W transmitter', rfW: 10, massKg: 3, cost: 2, assumption: GAME },
  { id: 'tx35', name: '35 W transmitter', rfW: 35, massKg: 8, cost: 6, assumption: GAME },
  { id: 'tx100', name: '100 W transmitter', rfW: 100, massKg: 15, cost: 14, assumption: GAME },
];

export const SHIELDING = [
  { id: 's0', name: 'Standard parts', level: 0, massKg: 0, cost: 0, assumption: GAME },
  { id: 's1', name: 'Radiation-hardened parts', level: 1, massKg: 30, cost: 15, assumption: GAME },
  { id: 's2', name: 'Radiation vault', level: 2, massKg: 200, cost: 45, assumption: 'Mass loosely based on reports of Juno\'s vault weighing a few hundred pounds; cost is a game value.' },
];

export const REDUNDANCY = [
  { id: 'single', name: 'Single-string', level: 0, massFrac: 0, costFrac: 0, powerW: 0, assumption: GAME },
  { id: 'selective', name: 'Selective redundancy', level: 1, massFrac: 0.08, costFrac: 0.12, powerW: 15, assumption: GAME },
  { id: 'full', name: 'Fully redundant', level: 2, massFrac: 0.20, costFrac: 0.30, powerW: 30, assumption: GAME },
];

export const GROUND = [
  { id: 'uni', name: 'University ground station (3.7 m)', dishM: 3.7, sites: 1, tsK: 150, leoHoursPerSite: 0.5, costPerYear: 1, assumption: 'Generic station. Noise temperature, pass time and cost are game values.' },
  { id: 'comm', name: 'Commercial network (13 m, 3 sites)', dishM: 13, sites: 3, tsK: 80, leoHoursPerSite: 0.5, costPerYear: 5, assumption: 'Generic network. Noise temperature, pass time and cost are game values.' },
  { id: 'dsn34', name: 'Deep Space Network 34 m', dishM: 34, sites: 3, tsK: 30, leoHoursPerSite: 0.5, costPerYear: 12, src: 'dsn', note: 'Antenna size and three sites from the source. Noise temperature, pass time and cost are game values.' },
  { id: 'dsn70', name: 'Deep Space Network 70 m', dishM: 70, sites: 3, tsK: 25, leoHoursPerSite: 0.5, costPerYear: 30, src: 'dsn', note: 'Antenna size and three sites from the source. Noise temperature, pass time and cost are game values.' },
];

export const TRACKING = [
  { id: 'light', name: 'Light: a quarter of available passes', frac: 0.25, costMult: 0.5, assumption: GAME },
  { id: 'standard', name: 'Standard: half of available passes', frac: 0.5, costMult: 1, assumption: GAME },
  { id: 'intensive', name: 'Intensive: every available pass', frac: 1.0, costMult: 2, assumption: GAME },
];

export const TEAMS = [
  { id: 'small', name: 'Small science team', mult: 0.8, cost: 4, assumption: GAME },
  { id: 'standard', name: 'Standard science team', mult: 1.0, cost: 12, assumption: GAME },
  { id: 'large', name: 'Large team with guest investigators', mult: 1.1, cost: 28, assumption: GAME },
];

export const PIPELINES = [
  { id: 'manual', name: 'Manual processing', frac: 0.6, cost: 0, assumption: GAME },
  { id: 'auto', name: 'Automated pipeline', frac: 1.0, cost: 10, assumption: GAME },
];

export const POLICIES = [
  { id: 'closed', name: 'Team-only data', mult: 1.0, cost: 0, assumption: GAME },
  { id: 'open', name: 'Open public archive', mult: 1.1, cost: 4, src: 'open-science', note: 'NASA releases science data openly. The multiplier and cost are game values.' },
];

export const REAL_MISSIONS = {
  'm-landsat9': { name: 'Landsat 9', fact: 'A NASA and USGS satellite launched in 2021 that images Earth\'s land surface from low Earth orbit.', src: 'm-landsat9' },
  'm-lro': { name: 'Lunar Reconnaissance Orbiter', fact: 'Has mapped the Moon from lunar orbit since 2009.', src: 'm-lro' },
  'm-maven': { name: 'MAVEN', fact: 'Launched in 2013 to study how Mars\' upper atmosphere escapes to space.', src: 'm-maven' },
  'm-mro': { name: 'Mars Reconnaissance Orbiter', fact: 'Launched in 2005; it aerobraked into its science orbit and carries a 3 m high-gain dish.', src: 'm-mro' },
  'm-webb': { name: 'James Webb Space Telescope', fact: 'An infrared observatory launched in December 2021 that orbits Sun–Earth L2, about 1.5 million km from Earth.', src: 'm-webb' },
  'm-juno': { name: 'Juno', fact: 'A solar-powered Jupiter orbiter launched in 2011; its arrays make about 500 W at Jupiter.', src: 'm-juno' },
  'm-clipper': { name: 'Europa Clipper', fact: 'Launched in October 2024 to study Jupiter\'s moon Europa through repeated flybys, on solar power.', src: 'm-clipper' },
};

export const SEGMENTS = [
  { id: 'launch', name: 'Launch segment', role: 'Launch lead' },
  { id: 'space', name: 'Space segment', role: 'Spacecraft lead' },
  { id: 'ground', name: 'Ground segment', role: 'Ground lead' },
  { id: 'user', name: 'User segment', role: 'Science lead' },
];
