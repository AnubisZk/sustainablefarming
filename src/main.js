/**
 * main.js  —  Atıksız Çiftlik: Döngüsel Yaşam Simülasyonu
 *
 * Giriş noktası. Asset paketini oluşturur, ardından oyunu başlatır.
 */

import { loadAssets } from './assets/assetLoader.js';
import { Game } from './core/Game.js';
import { UIManager } from './ui/UIManager.js';
import { loadUiAudio } from './ui/Audio.js';

async function main() {
    const fill         = document.getElementById('loading-fill');
    const status       = document.getElementById('loading-status');
    const loadingScreen= document.getElementById('loading-screen');
    const app          = document.getElementById('app');

    await loadAssets((p, label) => {
        fill.style.width = `${Math.round(p * 100)}%`;
        status.textContent = `hazırlanıyor: ${label}…`;
    });

    loadUiAudio();

    fill.style.width = '100%';
    status.textContent = 'çiftliğe hoş geldiniz';

    await new Promise(r => setTimeout(r, 250));

    const canvas = document.getElementById('game-canvas');
    const game   = new Game(canvas);
    const ui     = new UIManager(game);
    game.ui = ui;
    ui.update();

    if (game.load()) {
        ui.showToast('🌿 Önceki çiftliğin yüklendi');
        ui.updateScores();
    } else {
        seedStarterFarm(game);
    }

    loadingScreen.classList.add('hidden');
    app.classList.remove('hidden');

    // Yükleme sonrası ilk skor
    setTimeout(() => ui.updateScores(), 800);
}

/**
 * Başlangıç çiftlik sahnesi.
 * Oyuncuya örnek bir düzen gösterir; döngüsel sistemi temsil eder.
 */
function seedStarterFarm(game) {
    const W = game.tileMap.width;
    const H = game.tileMap.height;
    const STEP_MS      = 28;
    const OBJECT_DELAY = 80;

    const placeT = (id, gx, gy) => {
        const delay = (gx + gy) * STEP_MS;
        game.placeAndAnimate(id, gx, gy, { delay });
    };
    const placeO = (id, gx, gy) => {
        const delay = (gx + gy) * STEP_MS + OBJECT_DELAY;
        game.placeAndAnimate(id, gx, gy, { delay });
    };

    // Tüm zemine çayır
    for (let gy = 0; gy < H; gy++)
    for (let gx = 0; gx < W; gx++) {
        placeT('grass', gx, gy);
    }

    // Orta toprak yollar (çapraz)
    const midX = Math.floor(W / 2);
    const midY = Math.floor(H / 2);
    for (let gx = 1; gx < W - 1; gx++) placeT('dirt_path', gx, midY);
    for (let gy = 1; gy < H - 1; gy++) placeT('dirt_path', midX, gy);

    // Küçük gölet
    for (let gx = 0; gx < 3; gx++) placeT('water', gx, H - 1);

    // Çiftlik evi (sol üst)
    placeO('farm_house', 1, 1);

    // Ahır (sağ üst)
    placeO('barn', 8, 1);

    // Hayvanlar
    placeO('cow',     3, 3);
    placeO('chicken', 5, 2);
    placeO('sheep',   4, 5);

    // Sürdürülebilirlik
    placeO('compost_unit',  6, 5);
    placeO('solar_panel',   11, 2);
    placeO('recycle_bin',   11, 5);
    placeO('water_tank',    12, 8);

    // Bitkiler
    placeO('tomato_field',  2, 7);
    placeO('wheat_field',   4, 8);
    placeO('apple_tree',    6, 8);
    placeO('veg_garden',    8, 8);

    // Saman balyası
    placeO('hay_bale', 7, 3);

    // Damla sulama
    placeO('drip_irrig', 3, 10);
}

main().catch(err => {
    console.error(err);
    document.getElementById('loading-status').textContent =
        `Hata oluştu: ${err.message}`;
});
