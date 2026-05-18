/**
 * SaveSystem.js — Atıksız Çiftlik
 * Migration destekli kayıt sistemi. Eski v1 kayıtlar otomatik dönüştürülür.
 */

import { CONFIG } from '../config.js';
import { PlacedObject } from '../building/PlacedObject.js';

const KEY = CONFIG.storageKey;
const CURRENT_VERSION = 2;

function migrate(data) {
    // v1 → v2: gameState alanları ekle
    if (!data.v || data.v < 2) {
        data.v = 2;
        data.gameState = {
            dayCount: 1, hour: 6,
            completedMissions: [], xp: 0,
            animalHappiness: 80,
            activeEventId: null, eventDaysLeft: 0, nextEventDay: 5,
        };
    }
    return data;
}

export const SaveSystem = {
    save(tileMap, camera, gameState = {}) {
        const payload = {
            v: CURRENT_VERSION,
            tileMap: tileMap.serialize(),
            camera: {
                offsetX: camera.offsetX,
                offsetY: camera.offsetY,
                zoom: camera.zoom,
            },
            gameState,
        };
        try {
            localStorage.setItem(KEY, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },

    load(tileMap, camera) {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return null;
            let data = JSON.parse(raw);
            data = migrate(data);
            tileMap.deserialize(data.tileMap, d => new PlacedObject(d));
            if (data.camera) {
                camera.offsetX = data.camera.offsetX;
                camera.offsetY = data.camera.offsetY;
                camera.zoom    = data.camera.zoom;
            }
            return data.gameState ?? null;
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    },

    clear() {
        try { localStorage.removeItem(KEY); } catch {}
    },
};
