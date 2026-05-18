/**
 * DayNightSystem.js — Atıksız Çiftlik
 * Gün sayacı ve zaman yönetimi.
 * Her gerçek dakika = 1 oyun saati. 24 saatte 1 gün.
 */

export class DayNightSystem {
    constructor(game) {
        this.game = game;
        this.dayCount  = game.gameState?.dayCount  ?? 1;
        this.hour      = game.gameState?.hour       ?? 6; // 06:00 ile başla
        this._lastTick = Date.now();
        this._msPerHour = 60 * 1000; // 1 gerçek dakika = 1 oyun saati
    }

    tick() {
        const now = Date.now();
        const elapsed = now - this._lastTick;
        if (elapsed < this._msPerHour) return null;

        const hours = Math.floor(elapsed / this._msPerHour);
        this._lastTick += hours * this._msPerHour;
        this.hour += hours;

        let newDay = false;
        while (this.hour >= 24) {
            this.hour -= 24;
            this.dayCount++;
            newDay = true;
        }
        return newDay ? this.dayCount : null;
    }

    // 0 = gece yarısı, 0.5 = öğlen, 1 = tekrar gece yarısı
    get dayProgress() {
        return this.hour / 24;
    }

    get timeLabel() {
        const h = Math.floor(this.hour).toString().padStart(2, '0');
        return `${h}:00`;
    }

    get periodLabel() {
        if (this.hour >= 5  && this.hour < 12) return '🌅 Sabah';
        if (this.hour >= 12 && this.hour < 17) return '☀️ Öğlen';
        if (this.hour >= 17 && this.hour < 21) return '🌇 Akşam';
        return '🌙 Gece';
    }

    // Canvas overlay için opaklık (0 = tam gündüz, 0.5 = gece)
    get nightOverlayAlpha() {
        const h = this.hour;
        if (h >= 6 && h <= 18) return 0;
        if (h > 18 && h <= 21) return ((h - 18) / 3) * 0.45;
        if (h > 21 || h < 4)  return 0.45;
        if (h >= 4 && h < 6)  return ((6 - h) / 2) * 0.45;
        return 0;
    }

    serialize() {
        return { dayCount: this.dayCount, hour: this.hour };
    }
}
