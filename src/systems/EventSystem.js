/**
 * EventSystem.js — Atıksız Çiftlik
 * Rastgele çevresel olaylar sistemi.
 */

const EVENTS = [
    {
        id: 'drought',
        title: 'Kuraklık!',
        icon: '🌵',
        desc: 'Su kaynakları azalıyor. Su deposu ve yağmur tankı olmadan su verimliliği düşecek.',
        effect: (scores) => { scores.waterSavings = Math.max(0, scores.waterSavings - 20); },
        counterFarmType: 'watersave',
        counterMsg: 'Su deponuz kuraklığı atlattı! ✅',
        duration: 3, // gün
        color: '#e8a030',
    },
    {
        id: 'heavy_rain',
        title: 'Aşırı Yağmur!',
        icon: '⛈️',
        desc: 'Şiddetli yağmur toprak erozyonuna yol açıyor. Kompost sistemi toprağı koruyor.',
        effect: (scores) => { scores.soilFertility = Math.max(0, scores.soilFertility - 15); },
        counterFarmType: 'compost',
        counterMsg: 'Kompost toprağı korudu! 🌱',
        duration: 2,
        color: '#4a78c8',
    },
    {
        id: 'power_cut',
        title: 'Elektrik Kesintisi!',
        icon: '⚡',
        desc: 'Çiftlik enerjisiz kaldı. Güneş paneli olmadan enerji verimliliği düşüyor.',
        effect: (scores) => { scores.energySustain = Math.max(0, scores.energySustain - 25); },
        counterFarmType: 'energy',
        counterMsg: 'Güneş paneliniz devreye girdi! ☀️',
        duration: 2,
        color: '#8a4a8a',
    },
    {
        id: 'compost_bonus',
        title: 'Kompost Bonus Günü!',
        icon: '🎉',
        desc: 'Organik atıklar bugün çift verimle işleniyor! Toprak verimliliği artıyor.',
        effect: (scores) => { scores.soilFertility = Math.min(100, scores.soilFertility + 20); },
        counterFarmType: null,
        counterMsg: null,
        duration: 1,
        color: '#4a9a4a',
        positive: true,
    },
    {
        id: 'animal_disease',
        title: 'Hayvan Hastalığı!',
        icon: '🤒',
        desc: 'Bir hastalık yayılıyor. Temiz çevre ve düzenli bakım hayvanları koruyor.',
        effect: (scores) => { scores.animalHappiness = Math.max(0, (scores.animalHappiness ?? 50) - 30); },
        counterFarmType: 'compost',
        counterMsg: 'Temiz çevre hastalığı durdurdu! 🛡️',
        duration: 3,
        color: '#c84a38',
    },
    {
        id: 'sunny_week',
        title: 'Güneşli Hafta!',
        icon: '🌞',
        desc: 'Bu hafta güneş enerjisi üretimi iki kat! Güneş panelleri tam verimde çalışıyor.',
        effect: (scores) => { scores.energySustain = Math.min(100, scores.energySustain + 25); },
        counterFarmType: null,
        counterMsg: null,
        duration: 2,
        color: '#e8c030',
        positive: true,
    },
];

export class EventSystem {
    constructor(game) {
        this.game = game;
        this.activeEvent = null;
        this.eventDaysLeft = 0;
        this._nextEventDay = this._randomNextDay();
    }

    _randomNextDay() {
        return Math.floor(Math.random() * 5) + 3; // 3-7 gün arası
    }

    onNewDay(dayCount, placedObjects) {
        // Aktif olay süresi azalt
        if (this.activeEvent) {
            this.eventDaysLeft--;
            if (this.eventDaysLeft <= 0) {
                this.activeEvent = null;
            }
        }

        // Yeni olay tetikle
        if (!this.activeEvent && dayCount >= this._nextEventDay) {
            const pool = EVENTS.filter(e => !e.positive || Math.random() < 0.4);
            this.activeEvent = pool[Math.floor(Math.random() * pool.length)];
            this.eventDaysLeft = this.activeEvent.duration;
            this._nextEventDay = dayCount + this._randomNextDay();
            return { type: 'new', event: this.activeEvent };
        }

        return null;
    }

    applyEffect(scores, placedObjects) {
        if (!this.activeEvent) return;

        // Counter sistemi: doğru nesne varsa etki engellenir
        if (this.activeEvent.counterFarmType) {
            const hasCounter = placedObjects.some(
                o => o.farmType === this.activeEvent.counterFarmType
            );
            if (hasCounter) return; // etkiyi uygulama
        }

        this.activeEvent.effect(scores);
    }

    serialize() {
        return {
            activeEventId: this.activeEvent?.id ?? null,
            eventDaysLeft: this.eventDaysLeft,
            nextEventDay: this._nextEventDay,
        };
    }

    deserialize(data) {
        if (data?.activeEventId) {
            this.activeEvent = EVENTS.find(e => e.id === data.activeEventId) ?? null;
            this.eventDaysLeft = data.eventDaysLeft ?? 0;
        }
        if (data?.nextEventDay) this._nextEventDay = data.nextEventDay;
    }
}
