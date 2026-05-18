/**
 * MissionPanel.js — Atıksız Çiftlik
 * Görev paneli UI.
 */

export class MissionPanel {
    constructor(game) {
        this.game = game;
        this._el = document.getElementById('mission-panel');
        this._toggle = document.getElementById('mission-toggle');
        this._list   = document.getElementById('mission-list');
        this._xpEl   = document.getElementById('mission-xp');

        if (this._toggle) {
            this._toggle.addEventListener('click', () => {
                this._el?.classList.toggle('open');
            });
        }
        this.render();
    }

    render() {
        if (!this._list) return;
        const ms = this.game.missionSystem;
        if (!ms) return;

        const active    = ms.getActive();
        const completed = ms.getCompleted();

        this._list.innerHTML = '';

        // Aktif görevler
        active.forEach(m => {
            const div = document.createElement('div');
            div.className = 'mission-item mission-active';
            div.innerHTML = `
                <span class="mission-icon">${m.icon}</span>
                <div class="mission-body">
                    <div class="mission-title">${m.title}</div>
                    <div class="mission-desc">${m.desc}</div>
                </div>
                <span class="mission-xp">+${m.xp} XP</span>
            `;
            this._list.appendChild(div);
        });

        // Tamamlanan görevler (son 2)
        completed.slice(-2).forEach(m => {
            const div = document.createElement('div');
            div.className = 'mission-item mission-done';
            div.innerHTML = `
                <span class="mission-icon">✅</span>
                <div class="mission-body">
                    <div class="mission-title">${m.title}</div>
                </div>
                <span class="mission-xp done">+${m.xp} XP</span>
            `;
            this._list.appendChild(div);
        });

        if (active.length === 0 && completed.length === MISSIONS?.length) {
            const div = document.createElement('div');
            div.className = 'mission-complete-all';
            div.textContent = '🏆 Tüm görevler tamamlandı!';
            this._list.appendChild(div);
        }

        if (this._xpEl) {
            this._xpEl.textContent = `${ms.xp} XP`;
        }
    }

    showCompletion(mission) {
        // Toast benzeri bildirim
        const el = document.createElement('div');
        el.className = 'mission-toast';
        el.innerHTML = `
            <span>${mission.icon}</span>
            <div>
                <strong>Görev Tamamlandı!</strong><br>
                ${mission.title} — +${mission.xp} XP
            </div>
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 400);
        }, 3000);
    }
}
