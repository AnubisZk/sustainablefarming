/**
 * UIManager.js — Atıksız Çiftlik
 * Tüm UI alt sistemlerini yönetir.
 */

import { Toolbar } from './Toolbar.js';
import { AssetPalette } from './AssetPalette.js';
import { HUD } from './HUD.js';
import { MissionPanel } from './MissionPanel.js';
import { InfoCard, ASSET_EMOJI } from './InfoCard.js';
import { downloadScreenshot } from './Screenshot.js';
import { playUiClick } from './Audio.js';

export class UIManager {
    constructor(game) {
        this.game    = game;
        this.toolbar = new Toolbar(document.getElementById('toolbar'), game);
        this.palette = new AssetPalette(
            document.getElementById('palette-tabs'),
            document.getElementById('palette-grid'),
            game,
        );
        this.hud          = new HUD(game);
        this.missionPanel = new MissionPanel(game);
        this.infoCard     = new InfoCard();
        this.toast        = document.getElementById('toast');

        const ins = document.getElementById('instructions');
        if (ins) ins.addEventListener('toggle', () => playUiClick());

        // Screenshot butonu
        const ssBtn = document.getElementById('btn-screenshot');
        if (ssBtn) ssBtn.addEventListener('click', () => {
            playUiClick();
            const ok = downloadScreenshot(game.canvas);
            this.showToast(ok ? '📸 Çiftlik görüntüsü indirildi!' : 'Screenshot alınamadı');
        });

        // Bilgi kartı: canvas üzerinde sağ tık → tıklanan hücredeki nesne
        game.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // InputManager aracılığıyla hücre hesapla
            // Basit: canvas koordinatından grid hücresi bul
            const rect = game.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (game.canvas.width / rect.width);
            const my = (e.clientY - rect.top)  * (game.canvas.height / rect.height);
            // Erase aracı açıksa bilgi kartı gösterme
            if (game.tool === 'erase') return;
            this._tryShowInfoCard(mx, my);
        });

        game.toolbar = this.toolbar;
        game.palette = this.palette;
        game.hud     = this.hud;

        this._currentTip = game.getRandomTip();
        this._renderTip();
        this.updateScores();
        this.updateDayClock();

        setInterval(() => {
            this._currentTip = game.getRandomTip();
            this._renderTip();
        }, 15000);
    }

    _tryShowInfoCard(mx, my) {
        // Ekran koordinatından grid hücresini bul
        const cam  = this.game.camera;
        const tile = { w: 64, h: 32 };
        const sx = (mx - cam.offsetX) / cam.zoom;
        const sy = (my - cam.offsetY) / cam.zoom;
        const gx = Math.round((sx / (tile.w / 2) + sy / (tile.h / 2)) / 2);
        const gy = Math.round((sy / (tile.h / 2) - sx / (tile.w / 2)) / 2);
        const obj = this.game.tileMap.objectAt(gx, gy);
        if (!obj) return;
        const { ASSET_INDEX } = window._assetIndex ?? {};
        const name = obj.name ?? obj.assetId;
        const emoji = ASSET_EMOJI[obj.assetId] ?? '📦';
        this.infoCard.show(obj.assetId, name, emoji);
    }

    update() {
        this.toolbar.update();
        this.palette.update();
    }

    updateScores() {
        const scores = this.game.getScores();
        this._renderScores(scores);
    }

    updateDayClock() {
        const dn = this.game.dayNight;
        if (!dn) return;
        const dayEl = document.getElementById('day-count');
        const timeEl = document.getElementById('hud-time');
        const periodEl = document.getElementById('day-period');
        if (dayEl)    dayEl.textContent   = `Gün ${dn.dayCount}`;
        if (timeEl)   timeEl.textContent  = dn.timeLabel;
        if (periodEl) periodEl.textContent = dn.periodLabel;
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
        this._toastTimer = setTimeout(() => this.toast.classList.remove('show'), ms);
    }

    showEvent(event) {
        // Olay bildirim kartı
        const existing = document.getElementById('event-card');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = 'event-card';
        el.className = 'event-card';
        el.style.borderColor = event.color ?? '#888';
        el.innerHTML = `
            <div class="event-icon">${event.icon}</div>
            <div class="event-body">
                <div class="event-title">${event.title}</div>
                <div class="event-desc">${event.desc}</div>
            </div>
            <button class="event-close">✕</button>
        `;
        el.querySelector('.event-close').addEventListener('click', () => el.remove());
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 500); }, 6000);
    }

    _renderTip() {
        const el = document.getElementById('edu-tip-text');
        if (el) el.textContent = this._currentTip;
    }

    _renderScores(scores) {
        const totalEl = document.getElementById('score-total');
        if (totalEl) {
            totalEl.textContent = scores.totalScore;
            totalEl.className = 'score-value score-' + (
                scores.totalScore >= 60 ? 'good' : scores.totalScore >= 30 ? 'mid' : 'low'
            );
        }

        this._setBar('bar-waste',   scores.wasteReduction,  '♻️');
        this._setBar('bar-soil',    scores.soilFertility,   '🌱');
        this._setBar('bar-water',   scores.waterSavings,    '💧');
        this._setBar('bar-energy',  scores.energySustain,   '☀️');
        this._setBar('bar-animals', scores.animalHappiness ?? 80, '😊');

        const xpEl = document.getElementById('mission-xp');
        if (xpEl) xpEl.textContent = `${this.game.missionSystem?.xp ?? 0} XP`;

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

        // Aktif çevresel olay göstergesi
        const evEl = document.getElementById('active-event-indicator');
        const ev = this.game.eventSystem?.activeEvent;
        if (evEl) {
            if (ev) {
                evEl.textContent = `${ev.icon} ${ev.title} (${this.game.eventSystem.eventDaysLeft} gün)`;
                evEl.style.display = 'block';
            } else {
                evEl.style.display = 'none';
            }
        }
    }

    _setBar(id, value, emoji) {
        const bar = document.getElementById(id);
        if (!bar) return;
        const fill  = bar.querySelector('.indicator-fill');
        const label = bar.querySelector('.indicator-value');
        const v = Math.round(value ?? 0);
        if (fill) {
            fill.style.width = `${v}%`;
            fill.style.background = v >= 60
                ? 'linear-gradient(90deg, #4a9a5a, #6ec87a)'
                : v >= 30
                ? 'linear-gradient(90deg, #b8a030, #e0c850)'
                : 'linear-gradient(90deg, #9a3020, #c84a38)';
        }
        if (label) label.textContent = `${v}%`;
    }
}
