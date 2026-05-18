/**
 * Screenshot.js — Atıksız Çiftlik
 * Canvas PNG olarak indir.
 */

export function downloadScreenshot(canvas) {
    try {
        const url = canvas.toDataURL('image/png');
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `atıksız-çiftlik-${new Date().toISOString().slice(0,10)}.png`;
        a.click();
        return true;
    } catch (e) {
        console.error('Screenshot hatası:', e);
        return false;
    }
}
