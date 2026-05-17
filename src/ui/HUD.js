/**
 * HUD.js  —  Atıksız Çiftlik
 *
 * Sağ üst: 4 sürdürülebilirlik göstergesi + uyarılar + eğitsel ipucu.
 * Sol alt: Eğitsel ipucu bandı.
 */

import { playUiClick } from './Audio.js';

export class HUD {
    constructor(game) {
        this.game = game;

        // Renderer ayarları
        this.aoToggle      = document.getElementById('toggle-ao');
        this.gridToggle    = document.getElementById('toggle-grid');
        this.bordersToggle = document.getElementById('toggle-borders');

        if (this.aoToggle) {
            this.aoToggle.addEventListener('change', () => {
                playUiClick();
                game.renderer.ambientOcclusion = this.aoToggle.checked;
                game.renderer.markDirty();
            });
        }
        if (this.gridToggle) {
            this.gridToggle.addEventListener('change', () => {
                playUiClick();
                game.renderer.showGrid = this.gridToggle.checked;
                game.renderer.markDirty();
                game.toolbar?.update();
            });
        }
        if (this.bordersToggle) {
            this.bordersToggle.addEventListener('change', () => {
                playUiClick();
                game.renderer.showBorders = this.bordersToggle.checked;
                game.renderer.markDirty();
            });
        }

        this._tick();
        setInterval(() => this._tick(), 30000);
    }

    _tick() {
        const d = new Date();
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        const el = document.getElementById('hud-time');
        if (el) el.textContent = `${hh}:${mm}`;
    }

    syncToggles() {
        if (this.gridToggle)    this.gridToggle.checked    = this.game.renderer.showGrid;
        if (this.aoToggle)      this.aoToggle.checked      = this.game.renderer.ambientOcclusion;
        if (this.bordersToggle) this.bordersToggle.checked = this.game.renderer.showBorders;
    }
}
