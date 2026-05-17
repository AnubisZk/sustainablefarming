/**
 * UIManager.js  —  Atıksız Çiftlik
 *
 * Tüm UI alt sistemlerini (Toolbar, AssetPalette, HUD) toplar.
 * Sürdürülebilirlik göstergelerini ve eğitsel ipuçlarını günceller.
 */

import { Toolbar } from './Toolbar.js';
import { AssetPalette } from './AssetPalette.js';
import { HUD } from './HUD.js';
import { playUiClick } from './Audio.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.toolbar = new Toolbar(document.getElementById('toolbar'), game);
        this.palette = new AssetPalette(
            document.getElementById('palette-tabs'),
            document.getElementById('palette-grid'),
            game,
        );
        this.hud = new HUD(game);
        this.toast = document.getElementById('toast');

        // Kontrol detayları ses efekti
        const ins = document.getElementById('instructions');
        if (ins) ins.addEventListener('toggle', () => playUiClick());

        game.toolbar = this.toolbar;
        game.palette = this.palette;
        game.hud = this.hud;

        // İlk ipucu
        this._currentTip = game.getRandomTip();
        this._renderTip();

        // İlk skor
        this.updateScores();

        // Her 15 sn'de ipucu değiştir
        this._tipInterval = setInterval(() => {
            this._currentTip = game.getRandomTip();
            this._renderTip();
        }, 15000);
    }

    update() {
        this.toolbar.update();
        this.palette.update();
    }

    updateScores() {
        const scores = this.game.getScores();
        this._renderScores(scores);
    }

    showTip(tip) {
        this._currentTip = tip;
        this._renderTip();
    }

    showToast(text, ms = 1800) {
        if (!this.toast) return;
        this.toast.textContent = text;
        this.toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.toast.classList.remove('show');
        }, ms);
    }

    _renderTip() {
        const el = document.getElementById('edu-tip-text');
        if (el) el.textContent = this._currentTip;
    }

    _renderScores(scores) {
        // Ana puan
        const totalEl = document.getElementById('score-total');
        if (totalEl) {
            totalEl.textContent = scores.totalScore;
            totalEl.className = 'score-value score-' + (
                scores.totalScore >= 60 ? 'good' :
                scores.totalScore >= 30 ? 'mid'  : 'low'
            );
        }

        // 4 gösterge
        this._setBar('bar-waste',   scores.wasteReduction,   '♻️');
        this._setBar('bar-soil',    scores.soilFertility,    '🌱');
        this._setBar('bar-water',   scores.waterSavings,     '💧');
        this._setBar('bar-energy',  scores.energySustain,    '☀️');

        // Uyarılar
        const warnEl = document.getElementById('score-warnings');
        if (warnEl) {
            warnEl.innerHTML = '';
            scores.warnings.forEach(w => {
                const div = document.createElement('div');
                div.className = 'score-warning';
                div.textContent = w;
                warnEl.appendChild(div);
            });
        }

        // Bonuslar (son 2)
        const bonusEl = document.getElementById('score-bonuses');
        if (bonusEl) {
            bonusEl.innerHTML = '';
            scores.bonuses.slice(-2).forEach(b => {
                const div = document.createElement('div');
                div.className = 'score-bonus';
                div.textContent = b;
                bonusEl.appendChild(div);
            });
        }
    }

    _setBar(id, value, emoji) {
        const bar = document.getElementById(id);
        if (!bar) return;
        const fill = bar.querySelector('.indicator-fill');
        const label = bar.querySelector('.indicator-value');
        if (fill) {
            fill.style.width = `${value}%`;
            fill.style.background = value >= 60
                ? 'linear-gradient(90deg, #4a9a5a, #6ec87a)'
                : value >= 30
                ? 'linear-gradient(90deg, #b8a030, #e0c850)'
                : 'linear-gradient(90deg, #9a3020, #c84a38)';
        }
        if (label) label.textContent = `${value}%`;
    }
}
