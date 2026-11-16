# Deep Run: build report

## What it is

Deep Run is a browser game for the NASA Space Apps Challenge "Space Mission Design Game". The player builds a spacecraft through four stages, launches it, and then flies it through a day-by-day simulation. Four campaign missions unlock one at a time. Each is scored out of 100 with up to three stars. It is a static site with no dependencies.

## What the player does

1. **Campaign map.** Four missions: Earth Watch, Lunar Ice, Red Weather and Ocean Moon. Mission 1 is open. Each later mission opens when the previous one earns a star.
2. **Build bay.** Four stages (Launch, Spacecraft, Ground, Operations). Each stage has slot tiles and a parts tray. Each part shows its check status (Holds, Thin or Fails) and its budget change before the player picks it.
3. **Flight.** The clock runs one mission day at a time, at 1×, 2× or 4×, and can be paused. Solar storms, reaction-wheel faults and ground-antenna outages arrive on their own. Mars passes behind the Sun on a fixed schedule. The player controls two things: switching each instrument on or off, and entering or leaving safe mode. Gauges show power, the data recorder, the downlink, the computer, solar weather, pointing and the ground network. A timeline and a newest-first log record what happened and why.
4. **Debrief.** Stars, outcome, score breakdown, final numbers (science returned, data returned, storms), flight log, lessons from the mission, and the real NASA missions it resembles. Actions: fly again, change the build, or go to the next mission.

## How the flight simulation works

The simulation is in `js/sim.js`. It has no screen code, so it runs and is tested in Node.

- **Schedule before launch.** Every random event for the mission is drawn from the seed before the first day. A seed plus the same commands always replays the same flight. The player cannot change the dice.
- **Power.** Solar output falls with distance from the Sun (from the engine) and loses a little each year to ageing. Radioisotope generators do not age. If supply falls below what the bus needs, autonomy switches off instruments, starting with the last one in the build. The spacecraft falls silent only if the bus stays short for three days.
- **Data.** Instruments fill an onboard recorder (200 Gb). Data leaves only through ground contact, at the link rate from the engine. Science is credited only for data that reaches the ground. When the recorder is full, the oldest data is overwritten, and the science in it is lost.
- **Solar storms.** A storm is forecast two days ahead. When it arrives, each storm rolls once against the chance of upsetting the computer. Hardened parts and a vault lower that chance. Safe mode lowers it further, but no science is collected while safe mode is on. With a backup computer, the spare takes over within a day. A single computer reboots for two weeks, and one reboot in four never completes.
- **Reaction wheels.** Faults arrive at random. A spare wheel is used first. After that, each fault halves pointing, which halves the science rate for the rest of the mission.
- **Ground outages.** An antenna goes offline for two weeks. With one station, the spacecraft gets no contact during the outage, and the recorder fills.
- **Mars conjunction.** For Mars missions, commands are blocked and no data goes down for two weeks, about every two years. A switch thrown before the window stays thrown through it.
- **Score.** The 100-point score keeps its four parts: science returned (45), engineering margins (20), budget (20) and resilience (15). Resilience falls with each storm upset, wheel fault, outage and overflow. Stars use the same thresholds as before.

## Changes from the earlier build

- The previous build was a settings dashboard. It was replaced by the game described above.
- The earlier build scripted its incidents. Each one was a fixed event with a fixed choice. The flight is now a simulation: the state changes every day, and what the player does changes what happens.
- Removed: design-code sharing, the "load a shared design" field, the device hand-off between players, and the live NASA DONKI option. None of these were in the challenge brief.
- Budgets: Lunar Ice (Moon, medium) went from 140 to 160, and Ocean Moon (Jupiter, medium) from 415 to 500. The cheapest working designs for these missions cost more than the old budgets.
- Renamed from "Trade Space" to "Deep Run".

## What was verified

- **Automated tests:** 38 pass (`npm test`). The physics tests check the formulas against hand calculations. The design tests check the starter builds, the failure cases and the star thresholds. The simulation tests check that starters fly themselves, that seeds replay exactly, that switches and safe mode change the science, that power shedding works, that single-computer reboots can fail, that safe mode lowers upsets, that the recorder overflows, that Mars conjunction blocks commands and downlink, and that storms are forecast two days ahead and no earlier.
- **Source check:** 125 data entries tagged, 31 sources registered, 21 cited by data (`npm run check`).
- **Starter outcomes with no player input** (100 seeds each, from the same simulation the game runs):

| Mission | Lost | 0 stars | 1 star | 2 stars | 3 stars | Average score |
|---|---|---|---|---|---|---|
| Earth Watch | 0 | 0 | 0 | 6 | 94 | 89 |
| Lunar Ice | 0 | 0 | 0 | 3 | 97 | 97 |
| Red Weather | 0 | 2 | 0 | 11 | 87 | 93 |
| Ocean Moon | 0 | 12 | 0 | 27 | 61 | 82 |

- **Browser playthrough (headless Chromium, the system Chrome):** desktop 1280×860 and phone 390×844. Campaign, build, launch, instrument switch, safe mode, speed change, flight to the end, debrief. No console errors and no horizontal overflow at either size. The playtest switched the only instrument off early, so the debrief reported no science. That was intended as a check of the controls.

## What was not verified

- **The hazard rates are game assumptions.** Storms per year, upset chances, wheel-fault and outage rates, reboot failure, and the recorder size are tagged as game values in `js/data.js`. They are not calibrated against real storm or fault data. Real solar-storm statistics vary by solar cycle and were not used.
- **Starters are too easy to play without input.** Untouched, the starters earn two or three stars in nearly every run. That means the decisions in flight matter mainly for harder builds: weaker shielding, a single computer, or a single ground station. Options if you want the starters to need play: raise the hazard rates, raise the three-star bar, or make the starter shielding or backup systems thinner.
- **Firefox and Safari were not tested.** Real phones and touch input were not tested either; only Chromium emulation was used.
- **Not every source page was opened.** The official challenge page blocks automated access, so its requirements came from the text the team pasted. Other figures were checked against search results and the source pages' published numbers, not a full read of each page.
- **Flight dynamics are schematic.** The on-screen path is not to scale and does not show real transfer windows. The transfer times and Δv come from Hohmann formulas, not from GMAT.
- **Balance has not been tested with players.** The first useful test is whether a new player understands what the gauges mean without help.

## Known limits and next steps

- The three-star bar and the hazard rates may need tuning once people play.
- A Flagship class and the L2 mission exist in the data but not in the campaign.

## Sources

Figures and citations are listed in `CREDITS.md`. The challenge statement and resource list came from the challenge page. NASA Fact Sheets supply gravitational parameters and radii. JPL's Juno press kit and video supply solar-array figures. NASA's MMRTG fact sheet supplies the radioisotope generator figures. NASA's Mars solar conjunction article supplies the two-week pause.

## Disclosure

Built with AI assistance (Anthropic's Claude) for code, data assembly and text. NASA does not endorse this project.
