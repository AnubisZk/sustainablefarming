/**
 * MissionSystem.js — Atıksız Çiftlik
 * Görev/Misyon sistemi. Öğrencileri yönlendiren mini hedefler.
 */

export const MISSIONS = [
    {
        id: 'first_compost',
        title: 'Kompost Kur!',
        desc: 'Bir kompost ünitesi yerleştir.',
        icon: '🌿',
        xp: 20,
        check: (state) => state.placed.some(o => o.farmType === 'compost'),
    },
    {
        id: 'first_solar',
        title: 'Temiz Enerji',
        desc: 'Bir güneş paneli kur.',
        icon: '☀️',
        xp: 20,
        check: (state) => state.placed.some(o => o.farmType === 'energy'),
    },
    {
        id: 'three_plants',
        title: 'Çiftçi Ol!',
        desc: '3 farklı bitki yetiştir.',
        icon: '🌱',
        xp: 30,
        check: (state) => {
            const plants = new Set(state.placed.filter(o => o.farmType === 'plant').map(o => o.assetId));
            return plants.size >= 3;
        },
    },
    {
        id: 'low_waste',
        title: 'Sıfır Atık',
        desc: 'Atık azaltma skorunu %60 üzerine çıkar.',
        icon: '♻️',
        xp: 40,
        check: (state) => state.scores.wasteReduction >= 60,
    },
    {
        id: 'animal_compost',
        title: 'Döngü Tamamlandı',
        desc: 'Hayvan + kompost + bitki zinciri kur.',
        icon: '🔄',
        xp: 50,
        check: (state) => {
            const hasAnimal  = state.placed.some(o => o.farmType === 'animal');
            const hasCompost = state.placed.some(o => o.farmType === 'compost');
            const hasPlant   = state.placed.some(o => o.farmType === 'plant');
            return hasAnimal && hasCompost && hasPlant;
        },
    },
    {
        id: 'water_system',
        title: 'Su Tasarrufu',
        desc: 'Geri dönüşüm kutusu + damla sulama sistemi kur.',
        icon: '💧',
        xp: 30,
        check: (state) => {
            const hasRecycle = state.placed.some(o => o.farmType === 'recycle');
            const hasWater   = state.placed.some(o => o.farmType === 'water');
            return hasRecycle && hasWater;
        },
    },
    {
        id: 'full_energy',
        title: 'Enerji Bağımsızlığı',
        desc: 'Güneş paneli + su deposu kur.',
        icon: '⚡',
        xp: 40,
        check: (state) => {
            const hasEnergy    = state.placed.some(o => o.farmType === 'energy');
            const hasWaterSave = state.placed.some(o => o.farmType === 'watersave');
            return hasEnergy && hasWaterSave;
        },
    },
    {
        id: 'five_animals',
        title: 'Çiftlik Canlıları',
        desc: '4 farklı hayvan türü yerleştir.',
        icon: '🐄',
        xp: 35,
        check: (state) => {
            const types = new Set(state.placed.filter(o => o.farmType === 'animal').map(o => o.assetId));
            return types.size >= 4;
        },
    },
    {
        id: 'score_100',
        title: 'Sürdürülebilir Çiftçi',
        desc: 'Sürdürülebilirlik puanını 100\'e ulaştır.',
        icon: '🏆',
        xp: 100,
        check: (state) => state.scores.totalScore >= 100,
    },
];

export class MissionSystem {
    constructor(game) {
        this.game = game;
        this.completed = new Set(game.gameState?.completedMissions ?? []);
        this.xp = game.gameState?.xp ?? 0;
    }

    check(state) {
        const newlyCompleted = [];
        for (const mission of MISSIONS) {
            if (this.completed.has(mission.id)) continue;
            if (mission.check(state)) {
                this.completed.add(mission.id);
                this.xp += mission.xp;
                newlyCompleted.push(mission);
            }
        }
        return newlyCompleted;
    }

    getActive() {
        return MISSIONS.filter(m => !this.completed.has(m.id)).slice(0, 3);
    }

    getCompleted() {
        return MISSIONS.filter(m => this.completed.has(m.id));
    }

    serialize() {
        return { completed: [...this.completed], xp: this.xp };
    }
}
