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
* **Mouse Left-Click Drag**: Orbit Camera

## Running Locally

1. `npm install`
2. `npm run dev`
3. Navigate to `http://localhost:5173/`

## Project Origins

I set a challenge for myself: **Could I vibe code a complete 3D engine?**

This project is **Prompt Engineered**. Coming from a little boy who once loved **RPG games**, I understood the logic (Object-Oriented Programming, game loops, physics), so I used this knowledge and some prompt engineering techniques, and Voilaa. I directed AI to build specific modules (Ocean, Sky, Physics), guided the architecture, and refined the "feel", while the AI handled the heavy lifting and rendering code.

### 🎮 The World

- **The Dragon:** A flying dragon that circles the sky above the ship.
- **The Island:** A floating diorama island acting as the centerpiece of the ocean.
- **Dynamic Cycle:** A full Day/Night system with Rayleigh scattering sky gradients and fog.
- **Physics & Interaction:** Sailable boat with momentum, drag, and OrbitControls.
- **Audio Engine:** Custom looping audio playlist.

## 🏴‍☠️ Song choice

*(External .mp3 custom tracks included in the build)*

## 📬 Contact

* **Student:** Yassin Asermouh (Find me on **[LinkedIn](https://www.linkedin.com/in/yassin-asermouh-984aa8249/)**)
* **Status:** Student Engineer @ INSEA in Data Science

---

❤️ **Made with love by a One Piece fan** 🏴‍☠️
