/**
 * LandSystem.js — Atıksız Çiftlik
 * Arazi kilit ve genişleme sistemi.
 * Oyuncu puan kazandıkça yeni hücreler açılır.
 */

export const LAND_MILESTONES = [
    { score: 0,   activeW: 10, activeH: 10, msg: null },
    { score: 30,  activeW: 12, activeH: 12, msg: '🌿 Yeni arazi açıldı! (12×12)' },
    { score: 60,  activeW: 14, activeH: 12, msg: '🌾 Tarla genişledi! (14×12)' },
    { score: 100, activeW: 14, activeH: 14, msg: '🏆 Tüm arazi açıldı! (14×14)' },
];

export class LandSystem {
    constructor(game) {
        this.game    = game;
        this.activeW = game.gameState?.landW ?? 10;
        this.activeH = game.gameState?.landH ?? 10;
        this._lastMilestone = 0;
    }

    // Her skor güncellemesinde çağrılır
    checkExpansion(totalScore) {
        let expanded = null;
        for (const m of LAND_MILESTONES) {
            if (totalScore >= m.score && m.score > this._lastMilestone) {
                this.activeW = m.activeW;
                this.activeH = m.activeH;
                this._lastMilestone = m.score;
                if (m.msg) expanded = m;
            }
        }
        return expanded; // null veya milestone objesi
    }

    // Hücre aktif mi?
    isCellActive(gx, gy) {
        const offX = Math.floor((14 - this.activeW) / 2);
        const offY = Math.floor((14 - this.activeH) / 2);
        return gx >= offX && gx < offX + this.activeW &&
               gy >= offY && gy < offY + this.activeH;
    }

    // Sonraki milestone için kaç puan gerekiyor
    nextMilestone(totalScore) {
        return LAND_MILESTONES.find(m => m.score > totalScore) ?? null;
    }

    serialize() {
        return { landW: this.activeW, landH: this.activeH, lastMilestone: this._lastMilestone };
    }

    deserialize(data) {
        if (!data) return;
        this.activeW = data.landW ?? 10;
        this.activeH = data.landH ?? 10;
        this._lastMilestone = data.lastMilestone ?? 0;
    }
}
