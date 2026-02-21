/**
 * loadMerry.js — Load the Going Merry GLB
 *
 * Auto-scales via bounding box so the ship occupies ~12 world units.
 * Centers at origin, aligns to waterline, adds gentle bobbing.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const TARGET_SIZE = 12;

export function loadMerry(url, scene, onProgress) {
    return new Promise((resolve, reject) => {
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        loader.load(
            url,
            (gltf) => {
                const merry = gltf.scene;
                merry.name = 'merry';

                // ── Auto-scale ────────────────────────────────────────────────
                const box = new THREE.Box3().setFromObject(merry);
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = TARGET_SIZE / maxDim;
                merry.scale.setScalar(scale);

                // ── Center + waterline ────────────────────────────────────────
                box.setFromObject(merry);
                const center = new THREE.Vector3();
                box.getCenter(center);
                merry.position.sub(center);
                merry.position.y = -box.min.y - 0.3; // sink slightly into water

                // Enable shadows on all meshes
                merry.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Store base Y for bobbing animation
                merry.userData.baseY = merry.position.y;

                // Ship lantern light (warm glow for night visibility)
                const shipLight = new THREE.PointLight(0xffaa44, 4, 40);
                shipLight.position.set(0, 8, 0); // near the mast
                merry.add(shipLight);

                scene.add(merry);
                draco.dispose();

                console.log(`[Merry] loaded — raw: ${size.toArray().map(v => v.toFixed(1))} → scale: ${scale.toFixed(3)}`);
                resolve(merry);
            },
            (xhr) => {
                if (xhr.lengthComputable && onProgress) {
                    onProgress(xhr.loaded / xhr.total, 'merry');
                }
            },
            (err) => {
                console.error('[Merry] load error:', err);
                reject(err);
            }
        );
    });
}
