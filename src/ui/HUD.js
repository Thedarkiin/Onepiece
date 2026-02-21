/**
 * HUD.js — Audio engine, day/night toggle, music selector
 *
 * No portfolio content — pure sailing experience controls.
 */

import { gsap } from 'gsap';
import * as THREE from 'three';
import { CONFIG } from '@/scene/SceneManager.js';

/* ── Track list ────────────────────────────────────────────────────── */
const TRACKS = [
  { name: 'Custom Track', file: './audio/music.mp3' },
  { name: "Bink's Sake", file: './audio/binks_sake.mp3' },
  { name: 'Gomu Gomu no Bazooka', file: './audio/gomu_gomu.mp3' },
];

/* ═══════════════════════════════════════════════════════════════════════
   AUDIO ENGINE
   ═══════════════════════════════════════════════════════════════════════ */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.audioElement = null;
    this.currentTrack = 0;
    this._ready = false;
  }

  init() {
    if (this._ready) return;
    this._ready = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.08;
    this.gainNode.connect(this.ctx.destination);

    this.audioElement = new Audio(TRACKS[0].file);
    this.audioElement.loop = true;
    this.audioElement.crossOrigin = 'anonymous';

    const track = this.ctx.createMediaElementSource(this.audioElement);
    track.connect(this.gainNode);
    this.audioElement.play().catch(() => { });
  }

  switchTrack(index) {
    if (!this.audioElement) return;
    this.currentTrack = index;
    const wasPlaying = !this.audioElement.paused;
    this.audioElement.src = TRACKS[index].file;
    if (wasPlaying) this.audioElement.play().catch(() => { });
  }

  nextTrack() {
    const next = (this.currentTrack + 1) % TRACKS.length;
    this.switchTrack(next);
    return TRACKS[next].name;
  }

  setVolume(val) {
    if (!this.ctx) return;
    this.gainNode.gain.setTargetAtTime(val / 100, this.ctx.currentTime, 0.1);
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   SAILING AMBIENCE (Web Audio — procedural ocean waves)
   ═══════════════════════════════════════════════════════════════════════ */
class SailingAmbience {
  constructor() { this._started = false; this.masterGain = null; this.ctx = null; }

  init(audioContext) {
    if (this._started) return;
    this._started = true;
    this.ctx = audioContext;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.08;
    this.masterGain.connect(this.ctx.destination);

    // Ocean waves: filtered noise + LFO
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 350; filt.Q.value = 0.7;
    const g = this.ctx.createGain(); g.gain.value = 0.4;

    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.12;
    const lg = this.ctx.createGain(); lg.gain.value = 0.2;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();

    noise.connect(filt); filt.connect(g); g.connect(this.masterGain);
    noise.start();
  }

  setVolume(val) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime((val / 100) * 0.2, this.ctx.currentTime, 0.1);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   INIT HUD
   ═══════════════════════════════════════════════════════════════════════ */
export function initHUD(sceneManager, world) {
  const audio = new AudioEngine();
  const ambience = new SailingAmbience();

  // ── Start button ─────────────────────────────────────────────────
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      audio.init();
      ambience.init(audio.ctx);
      gsap.to('#intro-screen', {
        opacity: 0, duration: 1.2,
        onComplete: () => {
          document.getElementById('intro-screen').style.display = 'none';
        },
      });
    });
  }

  // ── Volume slider ────────────────────────────────────────────────
  const slider = document.getElementById('volume-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      audio.init();
      audio.setVolume(e.target.value);
      ambience.setVolume(e.target.value);
    });
  }

  // ── Track switcher ───────────────────────────────────────────────
  const trackBtn = document.getElementById('track-btn');
  const trackLabel = document.getElementById('track-name');
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      audio.init();
      const name = audio.nextTrack();
      if (trackLabel) trackLabel.textContent = name;
    });
  }

  // ── Day/Night toggle ─────────────────────────────────────────────
  let isNight = false;
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      isNight = !isNight;
      world.isNight = isNight;
      const preset = isNight ? CONFIG.night : CONFIG.day;
      const dur = 2;

      themeBtn.textContent = isNight ? '🌙' : '☀️';
      document.getElementById('ww-status').textContent = isNight ? 'STATUS: STORM' : 'STATUS: SUNRISE';
      document.getElementById('ww-temp').textContent = isNight ? 'TEMP: 8°C' : 'TEMP: 14°C';

      // Lights
      gsap.to(sceneManager.lights.amb, { intensity: preset.ambient, duration: dur });
      gsap.to(sceneManager.lights.dir, { intensity: preset.dirIntensity, duration: dur });
      const sunC = new THREE.Color(preset.sunColor);
      gsap.to(sceneManager.lights.dir.color, { r: sunC.r, g: sunC.g, b: sunC.b, duration: dur });

      // Fog + background
      const fogC = new THREE.Color(preset.fog);
      gsap.to(sceneManager.scene.fog.color, { r: fogC.r, g: fogC.g, b: fogC.b, duration: dur });
      gsap.to(sceneManager.scene.background, { r: fogC.r, g: fogC.g, b: fogC.b, duration: dur });
      gsap.to(sceneManager.scene.fog, { density: preset.fogDensity, duration: dur });

      // Sky
      sceneManager.updateSky(preset.sky.elevation, preset.sky.azimuth);

      // Exposure
      gsap.to(sceneManager.renderer, {
        toneMappingExposure: isNight ? 0.6 : 0.5,
        duration: dur,
      });

      // Night elements
      if (world.moon) world.moon.visible = isNight;
      if (world.stars) gsap.to(world.stars.material, { opacity: isNight ? 0.8 : 0, duration: dur });
      if (world.fireflies) gsap.to(world.fireflies.material, { opacity: isNight ? 1 : 0, duration: dur });
      if (world.birds) world.birds.visible = !isNight;
      if (world.rain) gsap.to(world.rain.material, { opacity: isNight ? 0.5 : 0, duration: dur });

      // Lanterns
      if (world.lanterns) {
        world.lanterns.children.forEach(l => {
          gsap.to(l.material, { emissiveIntensity: isNight ? 2.5 : 0.5, duration: dur });
          const pl = l.children[0];
          if (pl) gsap.to(pl, { intensity: isNight ? 1.5 : 0.3, duration: dur });
        });
      }
    });
  }
}
