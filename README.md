# Solar System

An interactive 3D model of the Solar System you can travel through. The planets sit where they really are on today's date. You can fly to any planet or major moon and visit specific places on its surface, such as Apollo 11's landing site, Olympus Mons or the Great Red Spot.

**Live:** https://solar-3js.pages.dev/ · **Source:** https://github.com/LHarsha/Solar-3js · Part of my [portfolio](https://harsha-lolewar.pages.dev/)

## Features

- **Real positions.** The planets are computed for the current date from JPL Keplerian elements. You can pause time or run it at real time, 1 hour/s, 1 day/s, 1 week/s or 1 month/s, and jump back to now.
- **Real rotation.** Earth turns with real sidereal time, so its day/night line and city lights match UTC. The Moon's phase follows the real lunar cycle. Planets rotate at their real day lengths and axial tilts, Venus and Uranus included, and Saturn's rings lie in its equatorial plane with the planet's shadow across them.
- **Free camera.** Fly to the Sun, eight planets and thirteen major moons, and the camera follows the body as it moves. Drag to orbit all the way round, over the poles included; right-drag to look around the full sky from where you are. Scroll zooms smoothly, and a flick keeps turning for a moment.
- **Places to visit.** Choose a landmark and the camera settles above that latitude and longitude, then turns with the ground beneath it.
- **Fact sheets.** Each body has NASA physical data, plus live distance from Earth and light travel time for the simulated date.
- **Venus.** Switch between its cloud tops and the radar map of its surface.
- **Sky.** The Milky Way sits where it really is, converted from galactic to scene coordinates. Stars are rendered as sharp points, and the Sun has limb darkening. There is no full-screen post-processing, so it stays smooth on integrated graphics.
- **Accessibility.** Keyboard shortcuts (`1`–`8` planets, `0` Sun, `Esc` overview, `Space` pause). The layout works on phones, and the HUD still works without WebGL.

Sizes and distances are compressed so everything fits on screen. Directions, orbital shapes and timing are real.

## Stack

React 19 · Vite · three.js via `@react-three/fiber` / `drei` · custom GLSL · Zustand · Framer Motion · Tailwind

## Credits

- Textures: [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0
- Physical data: [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- Orbital elements: [JPL Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html)

## Run locally

```bash
npm install
npm run dev
```

`npm run build` creates a production bundle; `npm run lint` runs oxlint.
