/**
 * Game.js — Atıksız Çiftlik
 * Ana oyun kontrolcüsü. Tüm sistemleri yönetir.
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
import { MissionSystem } from '../systems/MissionSystem.js';
import { DayNightSystem } from '../systems/DayNightSystem.js';
import { EventSystem } from '../systems/EventSystem.js';
import { AnimalSystem } from '../systems/AnimalSystem.js';

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

function getPlacedUnique(tileMap) {
    const seen = new Set();
    const result = [];
    for (let gy = 0; gy < tileMap.height; gy++)
    for (let gx = 0; gx < tileMap.width;  gx++) {
        const obj = tileMap.objectAt(gx, gy);
        if (obj && !seen.has(obj.id)) {
            seen.add(obj.id);
            const def = ASSET_INDEX[obj.assetId] ?? {};
            result.push({ ...obj, farmType: def.farmType });
        }
    }
    return result;
}

function calculateScores(placedObjects, animalHappiness = 80) {
    const animals    = placedObjects.filter(o => o.farmType === 'animal');
    const composts   = placedObjects.filter(o => o.farmType === 'compost');
    const plants     = placedObjects.filter(o => o.farmType === 'plant');
    const recycles   = placedObjects.filter(o => o.farmType === 'recycle');
    const waters     = placedObjects.filter(o => o.farmType === 'water');
    const waterSaves = placedObjects.filter(o => o.farmType === 'watersave');
    const energies   = placedObjects.filter(o => o.farmType === 'energy');

    let wasteReduction = 0, soilFertility = 0, waterSavings = 0;
    let energySustain = 0, totalScore = 0;
    const warnings = [], bonuses = [];

    // Atık Azaltma
    if (recycles.length > 0) { wasteReduction += 30; bonuses.push('♻️ Geri dönüşüm kutusu aktif'); }
    if (animals.length > 0 && composts.length > 0) {
        wasteReduction += 40; totalScore += 20;
        bonuses.push('🐄→🌱 Gübre döngüsü kuruldu (+20)');
    }
    if (animals.length > 2 && composts.length === 0) {
        wasteReduction = Math.max(0, wasteReduction - 20);
        warnings.push('⚠️ Çok hayvan var ama kompost yok! Atık birikyor.');
    }
    if (recycles.length > 0 && waters.length > 0) {
        wasteReduction += 20; totalScore += 15;
        bonuses.push('🔄 Geri dönüşüm + sulama (+15)');
    }
    wasteReduction = Math.min(100, wasteReduction);

    // Toprak Verimliliği
    plants.forEach(plant => {
        composts.forEach(compost => {
            const dist = Math.abs(plant.gx - compost.gx) + Math.abs(plant.gy - compost.gy);
            if (dist <= 3) { soilFertility += 12; totalScore += 5; }
        });
    });
    soilFertility += plants.length * 8;
    if (animals.length > 0 && composts.length > 0 && plants.length > 0) soilFertility += 25;
    soilFertility = Math.min(100, soilFertility);

    // Su Tasarrufu
    if (waters.length > 0)     waterSavings += 40;
    waterSavings += waterSaves.length * 20;
    if (recycles.length > 0 && waters.length > 0) waterSavings += 20;
    waterSavings = Math.min(100, waterSavings);

    // Enerji
    if (energies.length > 0) {
        energySustain += energies.length * 35; totalScore += 10;
        bonuses.push('☀️ Güneş enerjisi aktif (+10)');
    }
    if (energies.length > 0 && waterSaves.length > 0) {
        energySustain += 20;
        bonuses.push('⚡+💧 Güneş + su deposu sinerji!');
    }
    energySustain = Math.min(100, energySustain);

    // Hayvan Mutluluğu skoru etkisi
    if (animalHappiness < 40) {
        totalScore = Math.max(0, totalScore - 10);
        warnings.push('😢 Hayvanlar mutsuz! Çevre iyileştirilmeli.');
    } else if (animalHappiness >= 80) {
        totalScore += 5;
        bonuses.push('😊 Mutlu hayvanlar bonus (+5)');
    }

    totalScore = Math.min(150, Math.max(0, totalScore));

    return { totalScore, wasteReduction, soilFertility, waterSavings, energySustain, animalHappiness, warnings, bonuses };
}

export class Game {
    constructor(canvas, ui = null) {
        this.canvas    = canvas;
        this.tileMap   = new TileMap();
        this.camera    = new Camera();
        this.renderer  = new Renderer(canvas, this.camera, this.tileMap);
        this.placement = new PlacementSystem(this.tileMap);
        this.input     = new InputManager(canvas, this.camera, this);
        this.camera.onChange(() => this.renderer.markDirty());

        this.tool            = 'place';
        this.category        = 'zemin';
        this.selectedAssetId = ASSET_MANIFEST.find(a => a.category === 'zemin')?.id ?? 'grass';
        this.ui              = ui;
        this.flipH           = false;
        this.flipV           = false;

        // Oyun durumu (sistemler init'ten önce)
        this.gameState = {
            dayCount: 1, hour: 6,
            completedMissions: [], xp: 0,
            animalHappiness: 80,
        };

        // Alt sistemler
        this.missionSystem = new MissionSystem(this);
        this.dayNight      = new DayNightSystem(this);
        this.eventSystem   = new EventSystem(this);
        this.animalSystem  = new AnimalSystem(this);

        this._cachedScores = null;
        this._systemTickInterval = setInterval(() => this._systemTick(), 5000);

        this._centerCamera();
        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    _centerCamera() {
        const c = cellToScreen(this.tileMap.width / 2, this.tileMap.height / 2);
        this.camera.centerOn(c.x, c.y, window.innerWidth, window.innerHeight);
    }

    /* ── Sistem tiki (her 5 sn) ───────────────────────────────── */
    _systemTick() {
        // Gün/gece
        const newDay = this.dayNight.tick();
        if (newDay !== null) {
            this._onNewDay(newDay);
        }

        // Night overlay
        this.renderer.nightAlpha = this.dayNight.nightOverlayAlpha;
        this.renderer.markDirty();

        // Hayvan sistemi
        const scores = this.getScores();
        const placed = getPlacedUnique(this.tileMap);
        const afkResult = this.animalSystem.tick(placed, scores);
        if (afkResult?.type === 'afk') {
            this.ui?.showToast('🐄 Çiftlik bakım bekliyor! Hayvanlar mutsuz.', 4000);
        }

        // UI güncelle
        this.ui?.updateScores?.();
        this.ui?.missionPanel?.render();
        this.ui?.updateDayClock?.();
    }

    _onNewDay(dayCount) {
        const placed = getPlacedUnique(this.tileMap);
        const result = this.eventSystem.onNewDay(dayCount, placed);
        if (result?.type === 'new') {
            const ev = result.event;
            this.ui?.showEvent?.(ev);
        }
        this.ui?.showToast(`📅 Gün ${dayCount} başladı — ${this.dayNight.periodLabel}`, 2500);
        this._autoSave();
    }

    _autoSave() {
        const gs = this._serializeGameState();
        SaveSystem.save(this.tileMap, this.camera, gs);
    }

    _serializeGameState() {
        return {
            ...this.dayNight.serialize(),
            ...this.missionSystem.serialize(),
            ...this.animalSystem.serialize(),
            ...this.eventSystem.serialize(),
        };
    }

    /* ── Puanlar ──────────────────────────────────────────────── */
    getScores() {
        const placed = getPlacedUnique(this.tileMap);
        const scores = calculateScores(placed, this.animalSystem?.happiness ?? 80);
        if (this.eventSystem?.activeEvent) {
            this.eventSystem.applyEffect(scores, placed);
        }
        this._cachedScores = scores;
        return scores;
    }

    /* ── Görev kontrolü ───────────────────────────────────────── */
    _checkMissions() {
        const placed = getPlacedUnique(this.tileMap);
        const scores = this._cachedScores ?? this.getScores();
        const newlyDone = this.missionSystem.check({ placed, scores });
        newlyDone.forEach(m => {
            this.ui?.missionPanel?.showCompletion(m);
            this.ui?.showToast(`🏅 ${m.title} tamamlandı! +${m.xp} XP`, 2500);
        });
        if (newlyDone.length > 0) this.ui?.missionPanel?.render();
    }

    /* ── İpuçları ─────────────────────────────────────────────── */
    getRandomTip() {
        return EDUCATIONAL_TIPS[Math.floor(Math.random() * EDUCATIONAL_TIPS.length)];
    }
    getAssetTip(assetId) {
        return ASSET_INDEX[assetId]?.tip ?? this.getRandomTip();
    }

    /* ── Tool API ─────────────────────────────────────────────── */
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
        this.selectedAssetId = id;
        this.category = a.category;
        this._resetFlip();
        if (this.tool === 'erase') this.setTool('place');
        this.renderer.markDirty();
        this.ui?.update();
    }
    toggleFlipH() { this.flipH = !this.flipH; this._syncPreviewFlip(); this.renderer.markDirty(); }
    toggleFlipV() { this.flipV = !this.flipV; this._syncPreviewFlip(); this.renderer.markDirty(); }
    _resetFlip()  { this.flipH = false; this.flipV = false; this._syncPreviewFlip(); }
    _syncPreviewFlip() { this.renderer.previewFlipH = this.flipH; this.renderer.previewFlipV = this.flipV; }

    toggleGrid() {
        this.renderer.showGrid = !this.renderer.showGrid;
        this.renderer.markDirty();
        this.ui?.hud?.syncToggles();
    }

    save() {
        const gs = this._serializeGameState();
        const ok = SaveSystem.save(this.tileMap, this.camera, gs);
        this.ui?.showToast(ok ? '💾 Çiftlik kaydedildi' : 'Kayıt başarısız');
    }

    load() {
        const gs = SaveSystem.load(this.tileMap, this.camera);
        if (gs !== null) {
            this.gameState = gs;
            this.missionSystem = new MissionSystem(this);
            this.dayNight      = new DayNightSystem(this);
            this.animalSystem  = new AnimalSystem(this);
            this.eventSystem.deserialize(gs);
            this.renderer.markDirty();
            return true;
        }
        return false;
    }

    reset() {
        this.tileMap.clearAll();
        SaveSystem.clear();
        this.gameState = { dayCount: 1, hour: 6, completedMissions: [], xp: 0, animalHappiness: 80 };
        this.missionSystem = new MissionSystem(this);
        this.dayNight      = new DayNightSystem(this);
        this.animalSystem  = new AnimalSystem(this);
        this._centerCamera();
        this.renderer.markDirty();
        this.ui?.showToast('🔄 Çiftlik sıfırlandı');
        this.ui?.updateScores?.();
        this.ui?.missionPanel?.render();
    }

    fillGrass() {
        const W = this.tileMap.width, H = this.tileMap.height;
        let filled = 0;
        for (let gy = 0; gy < H; gy++)
        for (let gx = 0; gx < W; gx++) {
            if (this.tileMap.getTerrain(gx, gy)) continue;
            if (this.placeAndAnimate('grass', gx, gy, { delay: (gx + gy) * 28 })) filled++;
        }
        if (filled > 0) { playPlacementFor('grass'); this.ui?.showToast(`🌿 ${filled} hücreye çayır eklendi`); }
        else this.ui?.showToast('Zemin zaten kaplı');
        return filled;
    }

    /* ── Mouse callback'leri ──────────────────────────────────── */
    onHover(cell) {
        this.renderer.hoverCell = cell;
        if (this.tool === 'erase') {
            this.renderer.previewAssetId = null;
            this.renderer.previewValid = !!this.tileMap.objectAt(cell.gx, cell.gy) || !!this.tileMap.getTerrain(cell.gx, cell.gy);
        } else if (this.tool === 'place') {
            this.renderer.previewAssetId = this.selectedAssetId;
            this.renderer.previewValid = this.placement.canPlace(this.selectedAssetId, cell.gx, cell.gy);
        } else {
            this.renderer.previewAssetId = null;
            this.renderer.previewValid = true;
        }
        this.renderer.markDirty();
    }

    onPrimaryClick(gx, gy) {
        if (!this.tileMap.inBounds(gx, gy)) return;
        this.animalSystem?.onPlayerAction();
        if (this.tool === 'erase') {
            const objHere = this.tileMap.objectAt(gx, gy);
            const terrainHere = this.tileMap.getTerrain(gx, gy);
            const targetId = objHere ? objHere.assetId : terrainHere;
            if (this.placement.erase(gx, gy)) {
                this.renderer.markDirty();
                playPlacementFor(targetId);
                this.ui?.updateScores?.();
                this._checkMissions();
            }
        } else if (this.tool === 'place') {
            const result = this.placement.place(this.selectedAssetId, gx, gy, { flipH: this.flipH, flipV: this.flipV });
            if (result?.kind === 'object') {
                const o = result.object;
                this.renderer.spawnAnim(`obj-${o.id}`, { gx: o.gx, gy: o.gy, w: o.footprint?.w ?? 1, d: o.footprint?.d ?? 1 });
                playPlacementFor(o.assetId);
                this.ui?.updateScores?.();
                this.ui?.showTip?.(this.getAssetTip(o.assetId));
                this._checkMissions();
            } else if (result?.kind === 'terrain') {
                this.renderer.spawnAnim(`t-${result.gx},${result.gy}`, { gx: result.gx, gy: result.gy, w: 1, d: 1 });
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
            this._checkMissions();
        }
    }

    placeAndAnimate(assetId, gx, gy, opts = {}) {
        const result = this.placement.place(assetId, gx, gy, { flipH: !!opts.flipH, flipV: !!opts.flipV });
        if (!result) return null;
        const startAt = performance.now() + (opts.delay ?? 0);
        const duration = opts.duration ?? 460;
        if (result.kind === 'object') {
            const o = result.object;
            this.renderer.spawnAnim(`obj-${o.id}`, { gx: o.gx, gy: o.gy, w: o.footprint?.w ?? 1, d: o.footprint?.d ?? 1 }, duration, startAt);
        } else if (result.kind === 'terrain') {
            this.renderer.spawnAnim(`t-${result.gx},${result.gy}`, { gx: result.gx, gy: result.gy, w: 1, d: 1 }, duration, startAt);
        }
        return result;
    }

    /* ── Gece overlay ─────────────────────────────────────────── */
    _drawNightOverlay() {
        const alpha = this.dayNight?.nightOverlayAlpha ?? 0;
        if (alpha <= 0) return;
        const ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = `rgba(20, 30, 60, ${alpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }

    /* ── Frame loop ───────────────────────────────────────────── */
    _loop() {
        this.renderer.draw();
        this._drawNightOverlay();
        requestAnimationFrame(this._loop);
    }
}
