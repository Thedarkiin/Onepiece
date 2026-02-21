/**
 * main.js — Application entry point
 *
 * Scene → Load Models (Merry, Island, Dragon) → Ship Controls → HUD → Loop
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { SceneManager } from '@/scene/SceneManager.js';
import { AnimationLoop } from '@/scene/AnimationLoop.js';
import { World } from '@/scene/World.js';
import { loadMerry } from '@/models/loadMerry.js';
import { ShipController } from '@/controls/ShipController.js';
import { Loader } from '@/ui/Loader.js';
import { initHUD } from '@/ui/HUD.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

/* ── Scene bootstrap ───────────────────────────────────────────────── */
const container = document.getElementById('canvas-container');
const sm = new SceneManager(container);
const world = new World(sm);
const loop = new AnimationLoop(sm);
loop.addTicker(world);

// Setup smooth OrbitControls exactly like old_index.html
const controls = new OrbitControls(sm.camera, sm.renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.minDistance = 20;
controls.maxDistance = 150; // give them more zoom freedom too

/* ── Shared loaders ────────────────────────────────────────────────── */
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);

const loader = new Loader();

/* ── Load Island ───────────────────────────────────────────────────── */
function loadIsland() {
    return new Promise((resolve, reject) => {
        gltfLoader.load('/models/floating_island_diorama.glb',
            (gltf) => {
                const island = gltf.scene;
                island.name = 'island';

                // Scale + position in the ocean
                const box = new THREE.Box3().setFromObject(island);
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxD = Math.max(size.x, size.y, size.z);
                const scale = 80 / maxD;
                island.scale.setScalar(scale);

                island.position.set(180, 10, -80);

                // Strong warm light so island is clearly visible at night
                const islandLight = new THREE.PointLight(0xffcc66, 8, 200);
                islandLight.position.set(0, 25, 0);
                island.add(islandLight);

                island.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                sm.scene.add(island);
                console.log(`[Island] loaded — scale: ${scale.toFixed(3)}`);
                resolve(island);
            },
            (xhr) => {
                if (xhr.lengthComputable) loader.update(xhr.loaded / xhr.total, 'island');
            },
            (err) => { console.error('[Island] load error:', err); reject(err); }
        );
    });
}

/* ── Load Dragon ───────────────────────────────────────────────────── */
function loadDragon() {
    return new Promise((resolve, reject) => {
        gltfLoader.load('/models/dragon_flying.glb',
            (gltf) => {
                const dragon = gltf.scene;
                dragon.name = 'dragon';

                // Scale
                const box = new THREE.Box3().setFromObject(dragon);
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxD = Math.max(size.x, size.y, size.z);
                const scale = 35 / maxD;
                dragon.scale.setScalar(scale);

                // Position above island
                dragon.position.set(180, 45, -80);

                dragon.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                sm.scene.add(dragon);

                // Play animations if the model has them (wing flap etc.)
                let mixer = null;
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(dragon);
                    gltf.animations.forEach(clip => {
                        mixer.clipAction(clip).play();
                    });
                    loop.addMixer(mixer);
                    console.log(`[Dragon] loaded with ${gltf.animations.length} animation(s)`);
                } else {
                    console.log('[Dragon] loaded (no baked animations — will float)');
                }

                resolve({ dragon, mixer });
            },
            (xhr) => {
                if (xhr.lengthComputable) loader.update(xhr.loaded / xhr.total, 'dragon');
            },
            (err) => { console.error('[Dragon] load error:', err); reject(err); }
        );
    });
}

/* ── Dragon floating animation (always active) ────────────────────── */
class DragonFloat {
    constructor(dragon) {
        this.dragon = dragon;
        this.baseY = dragon.position.y;
        this.baseX = dragon.position.x;
        this.baseZ = dragon.position.z;
    }
    tick(elapsed) {
        // Gentle bobbing up/down (larger amplitude for bigger dragon)
        this.dragon.position.y = this.baseY + Math.sin(elapsed * 0.6) * 4;
        // Slow circular drift
        const radius = 25;
        const x = this.baseX + Math.cos(elapsed * 0.15) * radius;
        const z = this.baseZ + Math.sin(elapsed * 0.15) * radius;

        // Calculate heading (tangent to the circle)
        // Derivative of cos(t) is -sin(t), derivative of sin(t) is cos(t)
        const dx = -Math.sin(elapsed * 0.15);
        const dz = Math.cos(elapsed * 0.15);
        this.dragon.position.x = x;
        this.dragon.position.z = z;
        // Face the direction of movement
        this.dragon.rotation.y = -elapsed * 0.15 + Math.PI / 2;
    }
}

/* ── Boot ──────────────────────────────────────────────────────────── */
Promise.all([
    loadMerry('/models/merry.glb', sm.scene, (f, n) => loader.update(f, n)),
    loadIsland(),
    loadDragon(),
]).then(([merry, island, { dragon, mixer }]) => {

    loader.complete();

    // Ship controls with OrbitControls injected
    const shipCtrl = new ShipController(merry, sm.camera, controls);
    loop.addTicker(shipCtrl);

    // Dragon float animation
    const dragonFloat = new DragonFloat(dragon);
    loop.addTicker(dragonFloat);

    // HUD (audio, theme toggle)
    initHUD(sm, world);

    // Start render loop
    loop.start();

    draco.dispose();

}).catch(err => {
    console.error('[main] Asset loading failed:', err);
    const loaderText = document.querySelector('.loader-text');
    if (loaderText) loaderText.textContent = 'LOADING FAILED — CHECK CONSOLE';
});
