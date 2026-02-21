# Going Merry Experience

A pure, immersive 3D sailing experience built with Three.js, React (Vite), and custom WebGL shaders. Sail the iconic *Going Merry* across an endless ocean with a dynamic day/night cycle, atmospheric effects, and music.

## Features

- **Interactive Sailing:** Use `W` `A` `S` `D` to steer the ship across the ocean. The ship bobs and turns dynamically based on speed and heading.
- **Cinematic Orbit Camera:** Left-click and drag anywhere to orbit the camera smoothly around the ship with full horizontal and vertical freedom.
- **Dynamic Physics & Collision:** Momentum-based steering acceleration, friction drag, and a sphere-based collision system with the central glowing island.
- **Day/Night Cycle Engine:** Click the theme toggle to instantly transition between a vibrant sunset (day) and a dramatic thunderstorm (night) using GSAP for smooth color/light interpolation.
- **Atmospheric Particles:** Includes fireflies, birds, lanterns, starfields, and random lightning strikes paired with a CSS screen-flash overlay for dramatic impact.
- **PBR Water & Sky:** Utilizing Three.js official `Water` and `Sky` addons for realistic sun reflections and sky scattering.

## Controls

* **W**: Accelerate Forward
* **S**: Accelerate Backward
* **A / D**: Steer Left / Right
* **Mouse Left-Click Drag**: Orbit Camera Setup
* **UI Controls**: 
    * `Play/Pause`/`Next`: Cycle through custom audio tracks.
    * `Theme Toggle`: Switch between Day (Sunset) and Night (Storm) mode.

## Lightning Alternatives (For Better Visuals)

If the current lightning line-rendering isn't visually pleasing, there are three great ways to upgrade it depending on the desired aesthetic:
1. **Full-Screen Bloom Burst (Currently Used)**: Rely solely on the bright white screen-flash and a massive point light burst, but remove the jagged 3D lines completely. This leaves it to the user's imagination.
2. **Post-Processing God Rays (Volumetric)**: Use a post-processing pass (like Volumetric Light Scattering) combined with an emissive texture decal in the sky dome.
3. **Decals/Sprite Sheets**: Instead of drawing lines, use a 2D sprite plane with an emissive map of an actual high-res lightning photograph that randomly rotates and appears in the far distance.

## Running Locally

1. `npm install`
2. `npm run dev`
3. Navigate to `http://localhost:5173/`
