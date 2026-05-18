/**
 * AnimalSystem.js — Atıksız Çiftlik
 * Hayvan mutluluğu ve AFK sistemi.
 */

export class AnimalSystem {
    constructor(game) {
        this.game = game;
        this.happiness      = game.gameState?.animalHappiness ?? 80;
        this.lastActionTime = Date.now();
        this._afkWarned     = false;
        this.AFK_MS         = 10 * 60 * 1000; // 10 dakika
    }

    onPlayerAction() {
        this.lastActionTime = Date.now();
        this._afkWarned = false;
        // AFK sonrası geri döndüyse mutluluğu biraz artır
        if (this.happiness < 60) {
            this.happiness = Math.min(100, this.happiness + 5);
        }
    }

    tick(placedObjects, scores) {
        const now = Date.now();
        const afkMs = now - this.lastActionTime;

        // AFK uyarısı
        if (afkMs > this.AFK_MS && !this._afkWarned) {
            this._afkWarned = true;
            return { type: 'afk' };
        }

        // AFK cezası: her 5 dakikada mutluluk -5
        if (afkMs > this.AFK_MS) {
            const penalties = Math.floor((afkMs - this.AFK_MS) / (5 * 60 * 1000));
            this.happiness = Math.max(0, 80 - penalties * 5);
        }

        // Temiz çevre bonusu
        const hasCompost = placedObjects.some(o => o.farmType === 'compost');
        const hasWater   = placedObjects.some(o => o.farmType === 'water' || o.farmType === 'watersave');
        if (hasCompost && hasWater) {
            this.happiness = Math.min(100, this.happiness + 0.1);
        }

        // Fazla hayvan - kompost yok cezası
        const animals = placedObjects.filter(o => o.farmType === 'animal');
        if (animals.length > 2 && !hasCompost) {
            this.happiness = Math.max(0, this.happiness - 0.2);
        }

        // Skoru güncelle
        scores.animalHappiness = Math.round(this.happiness);
        return null;
    }

    serialize() {
        return { animalHappiness: Math.round(this.happiness) };
    }
}
