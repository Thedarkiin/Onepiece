/**
 * SceneManager.js — Core Three.js scene with Water + Sky + Bloom
 *
 * Creates the renderer, camera, and post-processing pipeline.
 * The Water and Sky addons provide the realistic ocean environment.
 */

import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ── Day / Night presets ──────────────────────────────────────────────── */
export const CONFIG = {
    day: {
        ambient: 0.5,
        dirIntensity: 1.2,
        sunColor: 0xffaa33,
        fog: 0x8899aa,
        fogDensity: 0.0015,
        sky: { elevation: 7, azimuth: 180 },
    },
    night: {
        ambient: 0.1,
        dirIntensity: 0.2,
        sunColor: 0x6677aa,
        fog: 0x05070a,
        fogDensity: 0.012,
        sky: { elevation: -5, azimuth: 180 },
    },
};

export class SceneManager {
    constructor(container) {
        /* ── Renderer ───────────────────────────────────────────────────── */
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        /* ── Scene ──────────────────────────────────────────────────────── */
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.day.fog);
        this.scene.fog = new THREE.FogExp2(CONFIG.day.fog, CONFIG.day.fogDensity);

        /* ── Camera ─────────────────────────────────────────────────────── */
        this.camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            1,
            20000
        );
        this.camera.position.set(0, 15, 50);

        /* ── Lighting ───────────────────────────────────────────────────── */
        this.lights = {};
        this.lights.amb = new THREE.AmbientLight(0xffffff, CONFIG.day.ambient);
        this.scene.add(this.lights.amb);

        this.lights.dir = new THREE.DirectionalLight(CONFIG.day.sunColor, CONFIG.day.dirIntensity);
        this.lights.dir.position.set(100, 50, -50);
        this.lights.dir.castShadow = true;
        this.lights.dir.shadow.mapSize.set(2048, 2048);
        this.scene.add(this.lights.dir);

        /* ── Water ──────────────────────────────────────────────────────── */
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
        this.water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
                (tex) => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
            ),
            sunDirection: this.lights.dir.position.clone().normalize(),
            sunColor: CONFIG.day.sunColor,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: this.scene.fog !== undefined,
        });
        this.water.rotation.x = -Math.PI / 2;
        this.scene.add(this.water);

        /* ── Sky ─────────────────────────────────────────────────────────── */
        this.sky = new Sky();
        this.sky.scale.setScalar(10000);
        this.sky.material.uniforms.turbidity.value = 10;
        this.sky.material.uniforms.rayleigh.value = 3;
        this.sky.material.uniforms.mieCoefficient.value = 0.005;
        this.sky.material.uniforms.mieDirectionalG.value = 0.7;
        this.scene.add(this.sky);

        this.sun = new THREE.Vector3();
        this.updateSky(CONFIG.day.sky.elevation, CONFIG.day.sky.azimuth);

        /* ── Post-processing ────────────────────────────────────────────── */
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.3,   // strength
            0.4,   // radius
            0.85   // threshold
        );
        this.composer.addPass(bloom);
        this.composer.addPass(new OutputPass());

        /* ── Resize ─────────────────────────────────────────────────────── */
        window.addEventListener('resize', () => this._onResize());
    }

    updateSky(elevation, azimuth = 180) {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        this.sun.setFromSphericalCoords(1, phi, theta);
        this.sky.material.uniforms.sunPosition.value.copy(this.sun);
        this.water.material.uniforms.sunDirection.value.copy(this.sun).normalize();

        // Update environment map for PBR reflections
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmremGenerator.fromScene(this.sky).texture;
        pmremGenerator.dispose();
    }

    render() {
        this.water.material.uniforms['time'].value += 1.0 / 60.0;
        this.composer.render();
    }

    _onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
    }
}
