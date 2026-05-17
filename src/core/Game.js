/**
 * Game.js  —  Atıksız Çiftlik
 *
 * Oyun kontrolcüsü. Dünyayı (TileMap), kamera, renderer, giriş yöneticisi,
 * yerleştirme sistemi ve UI'ı yönetir. Ayrıca sürdürülebilirlik puanlama
 * motoru burada çalışır.
 */

import { CONFIG } from '../config.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { TileMap } from '../grid/TileMap.js';
import { PlacementSystem } from '../building/PlacementSystem.js';
import { ASSET_INDEX, ASSET_MANIFEST } from '../assets/assetManifest.js';
import { SaveSystem } from '../storage/SaveSystem.js';
import { cellToScreen } from '../grid/IsoGrid.js';
import { playPlacementFor } from '../ui/Audio.js';

/* ── Eğitsel ipuçları ─────────────────────────────────────────── */
const EDUCATIONAL_TIPS = [
    "Hayvan gübresi doğru işlendiğinde atık değil, toprağı besleyen doğal bir kaynaktır.",
    "Kompost, organik atıkları bitkiler için besleyici gübreye dönüştürür.",
    "Geri dönüştürülmüş plastik şişeler damla sulama sisteminde kullanılabilir.",
    "Damla sulama, su kaybını azaltarak bitkilere doğrudan su ulaştırır.",
    "Güneş panelleri çiftlikte temiz enerji üretimi sağlar.",
    "Sıfır atık yaklaşımı, kaynakları yeniden kullanmayı ve döngüsel yaşamı öğretir.",
    "Yağmur suyu toplayıcı, kuraklık döneminde suyun verimliliğini artırır.",
    "Kompost ile beslenen bitkiler kimyasal gübre gerektirmez.",
    "Hayvanlar ve bitkiler bir arada döngüsel bir ekosistem oluşturur.",
    "Her geri dönüştürülen plastik şişe okyanusa gidecek bir atık anlamına gelir.",
];

/* ── Puanlama hesabı ──────────────────────────────────────────── */
function calculateScores(placedObjects) {
    const animals    = placedObjects.filter(o => ASSET_INDEX[o.assetId]?.farmType === 'animal');
    const composts   = placedObjects.filter(o => ASSET_INDEX[o.assetId]?.farmType === 'compost');
    const plants     = placedObjects.filter(o => ASSET_INDEX[o.assetId]?.farmType === 'plant');
    const recycles   = placedObjects.filter(o => ASSET_INDEX[o.assetId]?.farmType === 'recycle');
    const waters     = placedObjects.filter(o => ASSET_INDEX[o.assetId]?.farmType === 'water');
    const waterSaves = placedObjects.filter(o => ASSET_INDEX[o.assetId]?.farmType === 'watersave');
    const energies   = placedObjects.filter(o => ASSET_INDEX[o.assetId]?.farmType === 'energy');

    let wasteReduction    = 0; // Atık Azaltma (0–100)
    let soilFertility     = 0; // Toprak Verimliliği (0–100)
    let waterSavings      = 0; // Su Tasarrufu (0–100)
    let energySustain     = 0; // Enerji Sürdürülebilirliği (0–100)
    let totalScore        = 0;
    const warnings        = [];
    const bonuses         = [];

    // ── Atık Azaltma ──────────────────────────────────────────────
    if (recycles.length > 0) {
        wasteReduction += 30;
        bonuses.push('♻️ Geri dönüşüm kutusu atık azaltıyor');
    }
    if (animals.length > 0 && composts.length > 0) {
        wasteReduction += 40;
        bonuses.push('🐄→🌱 Hayvan gübresi komposta işleniyor (+40)');
        totalScore += 20;
    }
    if (animals.length > 2 && composts.length === 0) {
        wasteReduction = Math.max(0, wasteReduction - 20);
        warnings.push('⚠️ Çok hayvan var ama kompost ünitesi yok! İşlenmeyen atık birikyor.');
    }
    if (recycles.length > 0 && waters.length > 0) {
        wasteReduction += 20;
        totalScore += 15;
        bonuses.push('🔄 Geri dönüşüm + sulama sistemi: su tasarrufu (+15)');
    }
    wasteReduction = Math.min(100, wasteReduction);

    // ── Toprak Verimliliği ────────────────────────────────────────
    plants.forEach(plant => {
        composts.forEach(compost => {
            const dist = Math.abs(plant.gx - compost.gx) + Math.abs(plant.gy - compost.gy);
            if (dist <= 3) {
                soilFertility += 12;
                bonuses.push(`🌿 Bitki komposta yakın: verimlilik bonusu`);
                totalScore += 5;
            }
        });
    });
    if (plants.length > 0) soilFertility += plants.length * 8;
    if (animals.length > 0 && composts.length > 0 && plants.length > 0) {
        soilFertility += 25;
    }
    soilFertility = Math.min(100, soilFertility);

    // ── Su Tasarrufu ──────────────────────────────────────────────
    if (waters.length > 0) {
        waterSavings += 40;
    }
    if (waterSaves.length > 0) {
        waterSavings += waterSaves.length * 20;
    }
    if (recycles.length > 0 && waters.length > 0) {
        waterSavings += 20;
    }
    waterSavings = Math.min(100, waterSavings);

    // ── Enerji Sürdürülebilirliği ─────────────────────────────────
    if (energies.length > 0) {
        energySustain += energies.length * 35;
        totalScore += 10;
        bonuses.push('☀️ Güneş paneli temiz enerji üretiyor (+10)');
    }
    if (energies.length > 0 && waterSaves.length > 0) {
        energySustain += 20;
        bonuses.push('⚡+💧 Güneş + su deposu: sürdürülebilir çiftlik!');
    }
    energySustain = Math.min(100, energySustain);

    totalScore = Math.min(100, Math.max(0, totalScore));

    return {
        totalScore,
        wasteReduction,
        soilFertility,
        waterSavings,
        energySustain,
        warnings,
        bonuses,
    };
}

export class Game {
    constructor(canvas, ui = null) {
        this.canvas = canvas;
        this.tileMap = new TileMap();
        this.camera = new Camera();
        this.renderer = new Renderer(canvas, this.camera, this.tileMap);
        this.placement = new PlacementSystem(this.tileMap);
        this.input = new InputManager(canvas, this.camera, this);

        this.camera.onChange(() => this.renderer.markDirty());

        this.tool = 'place';
        this.category = 'zemin';
        this.selectedAssetId = ASSET_MANIFEST.find(a => a.category === 'zemin')?.id ?? 'grass';
        this.ui = ui;

        this.flipH = false;
        this.flipV = false;

        this._centerCamera();

        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    _centerCamera() {
        const c = cellToScreen(this.tileMap.width / 2, this.tileMap.height / 2);
        const { innerWidth: w, innerHeight: h } = window;
        this.camera.centerOn(c.x, c.y, w, h);
    }

    /* ── Puanlar ──────────────────────────────────────────────── */

    getScores() {
        const allPlaced = [];
        const W = this.tileMap.width;
        const H = this.tileMap.height;
        for (let gy = 0; gy < H; gy++) {
            for (let gx = 0; gx < W; gx++) {
                const obj = this.tileMap.objectAt(gx, gy);
                if (obj) allPlaced.push(obj);
            }
        }
        // Tekrar eden nesneleri kaldır (çok-hücreli footprint)
        const seen = new Set();
        const unique = allPlaced.filter(o => {
            if (seen.has(o.id)) return false;
            seen.add(o.id);
            return true;
        });
        return calculateScores(unique);
    }

    /* ── İpuçları ─────────────────────────────────────────────── */

    getRandomTip() {
        const idx = Math.floor(Math.random() * EDUCATIONAL_TIPS.length);
        return EDUCATIONAL_TIPS[idx];
    }

    getAssetTip(assetId) {
        return ASSET_INDEX[assetId]?.tip ?? this.getRandomTip();
    }

    /* ── Intent API (UI / InputManager tarafından çağrılır) ───── */

    setTool(t) {
        this.tool = t;
        this.renderer.eraseMode = (t === 'erase');
        this.canvas.style.cursor = t === 'pan' ? 'grab' : 'crosshair';
        this.renderer.markDirty();
        this.ui?.update();
    }

    setCategory(cat) {
        if (this.category === cat) return;
        this.category = cat;
        const first = ASSET_MANIFEST.find(a => a.category === cat);
        if (first) this.selectedAssetId = first.id;
        this._resetFlip();
        this.renderer.markDirty();
        this.ui?.update();
    }

    selectAsset(id) {
        const a = ASSET_INDEX[id];
        if (!a) return;
        const changed = this.selectedAssetId !== id;
        this.selectedAssetId = id;
        this.category = a.category;
        if (changed) this._resetFlip();
        if (this.tool === 'erase') this.setTool('place');
        this.renderer.markDirty();
        this.ui?.update();
    }

    toggleFlipH() {
        this.flipH = !this.flipH;
        this._syncPreviewFlip();
        this.renderer.markDirty();
        this.ui?.update();
    }

    toggleFlipV() {
        this.flipV = !this.flipV;
        this._syncPreviewFlip();
        this.renderer.markDirty();
        this.ui?.update();
    }

    _resetFlip() { this.flipH = false; this.flipV = false; this._syncPreviewFlip(); }
    _syncPreviewFlip() {
        this.renderer.previewFlipH = this.flipH;
        this.renderer.previewFlipV = this.flipV;
    }

    toggleGrid() {
        this.renderer.showGrid = !this.renderer.showGrid;
        this.renderer.markDirty();
        this.ui?.hud?.syncToggles();
        this.ui?.update();
    }

    save() {
        const ok = SaveSystem.save(this.tileMap, this.camera);
        this.ui?.showToast(ok ? '💾 Çiftlik kaydedildi' : 'Kayıt başarısız');
    }

    load() {
        const ok = SaveSystem.load(this.tileMap, this.camera);
        if (ok) this.renderer.markDirty();
        return ok;
    }

    reset() {
        this.tileMap.clearAll();
        SaveSystem.clear();
        this._centerCamera();
        this.renderer.markDirty();
        this.ui?.showToast('🔄 Çiftlik sıfırlandı');
        this.ui?.updateScores?.();
    }

    fillGrass() {
        const W = this.tileMap.width;
        const H = this.tileMap.height;
        const STEP_MS = 32;
        let filled = 0;
        for (let gy = 0; gy < H; gy++)
        for (let gx = 0; gx < W; gx++) {
            if (this.tileMap.getTerrain(gx, gy)) continue;
            if (this.placeAndAnimate('grass', gx, gy, { delay: (gx + gy) * STEP_MS })) {
                filled++;
            }
        }
        if (filled > 0) {
            playPlacementFor('grass');
            this.ui?.showToast(`🌿 ${filled} hücreye çayır eklendi`);
        } else {
            this.ui?.showToast('Zemin zaten kaplı');
        }
        return filled;
    }

    /* ── Mouse callback'leri ──────────────────────────────────── */

    onHover(cell) {
        const prev = this.renderer.hoverCell;
        const sameCell = prev && prev.gx === cell.gx && prev.gy === cell.gy;
        this.renderer.hoverCell = cell;
        if (this.tool === 'erase') {
            this.renderer.previewAssetId = null;
            this.renderer.previewValid = !!this.tileMap.objectAt(cell.gx, cell.gy)
                || !!this.tileMap.getTerrain(cell.gx, cell.gy);
        } else if (this.tool === 'place') {
            this.renderer.previewAssetId = this.selectedAssetId;
            this.renderer.previewValid = this.placement.canPlace(this.selectedAssetId, cell.gx, cell.gy);
        } else {
            this.renderer.previewAssetId = null;
            this.renderer.previewValid = true;
        }
        if (!sameCell) this.renderer.markDirty();
    }

    onPrimaryClick(gx, gy) {
        if (!this.tileMap.inBounds(gx, gy)) return;
        if (this.tool === 'erase') {
            const objHere = this.tileMap.objectAt(gx, gy);
            const terrainHere = this.tileMap.getTerrain(gx, gy);
            const targetId = objHere ? objHere.assetId : terrainHere;
            if (this.placement.erase(gx, gy)) {
                this.renderer.markDirty();
                playPlacementFor(targetId);
                this.ui?.updateScores?.();
            }
        } else if (this.tool === 'place') {
            const result = this.placement.place(this.selectedAssetId, gx, gy, {
                flipH: this.flipH, flipV: this.flipV,
            });
            if (result?.kind === 'object') {
                const o = result.object;
                this.renderer.spawnAnim(`obj-${o.id}`, {
                    gx: o.gx, gy: o.gy,
                    w: o.footprint?.w ?? 1,
                    d: o.footprint?.d ?? 1,
                });
                playPlacementFor(o.assetId);
                this.ui?.updateScores?.();
                // Asset'e özel ipucu göster
                const tip = this.getAssetTip(o.assetId);
                this.ui?.showTip?.(tip);
            } else if (result?.kind === 'terrain') {
                this.renderer.spawnAnim(`t-${result.gx},${result.gy}`, {
                    gx: result.gx, gy: result.gy, w: 1, d: 1,
                });
                playPlacementFor(result.assetId);
            }
        }
    }

    onSecondaryClick(gx, gy) {
        if (!this.tileMap.inBounds(gx, gy)) return;
        const objHere = this.tileMap.objectAt(gx, gy);
        const terrainHere = this.tileMap.getTerrain(gx, gy);
        const targetId = objHere ? objHere.assetId : terrainHere;
        if (this.placement.erase(gx, gy)) {
            this.renderer.markDirty();
            playPlacementFor(targetId);
            this.ui?.updateScores?.();
        }
    }

    placeAndAnimate(assetId, gx, gy, opts = {}) {
        const result = this.placement.place(assetId, gx, gy, {
            flipH: !!opts.flipH,
            flipV: !!opts.flipV,
        });
        if (!result) return null;
        const startAt = performance.now() + (opts.delay ?? 0);
        const duration = opts.duration ?? 460;
        if (result.kind === 'object') {
            const o = result.object;
            this.renderer.spawnAnim(`obj-${o.id}`, {
                gx: o.gx, gy: o.gy,
                w: o.footprint?.w ?? 1,
                d: o.footprint?.d ?? 1,
            }, duration, startAt);
        } else if (result.kind === 'terrain') {
            this.renderer.spawnAnim(`t-${result.gx},${result.gy}`, {
                gx: result.gx, gy: result.gy, w: 1, d: 1,
            }, duration, startAt);
        }
        return result;
    }

    /* ── Frame loop ───────────────────────────────────────────── */

    _loop() {
        this.renderer.draw();
        requestAnimationFrame(this._loop);
    }
}
