/**
 * InfoCard.js — Atıksız Çiftlik
 * Nesneye tıklayınca açılan eğitsel bilgi kartı.
 */

import { ASSET_INDEX } from '../assets/assetManifest.js';

const INFO = {
    cow:           { realUse: 'Büyükbaş hayvancılık gıda ve tarım döngüsünün temelidir.', sustain: 'Gübre biyogaz ve kompost için kullanılabilir.', carbon: '1 inek/yıl ortalama 70 kg CH₄ üretir; kompostla bu azaltılabilir.' },
    chicken:       { realUse: 'Tavuk yumurta ve et üretiminin yanı sıra böcek kontrolü sağlar.', sustain: 'Tavuk gübresi azot açısından zengin doğal bir gübredir.', carbon: 'Kapalı sistemde yetiştirilen tavuklar %40 daha az karbon üretir.' },
    sheep:         { realUse: 'Koyun yün, et ve süt sağlar; mera yönetimine katkıda bulunur.', sustain: 'Koyun gübresi toprağı canlandırır ve organik madde artırır.', carbon: 'Otlayan koyunlar toprağın karbon tutma kapasitesini artırır.' },
    dog:           { realUse: 'Çiftlik köpeği hayvanları ve mahsulleri yırtıcılardan korur.', sustain: 'Pestisit kullanımını azaltarak ekosistemi korur.', carbon: 'Kimyasal kovucu yerine köpek kullanmak karbon ayak izini düşürür.' },
    farm_house:    { realUse: 'Çiftlik evi çiftçi ailesinin yaşam ve planlama merkezidir.', sustain: 'Enerji verimli yapılar ısıtma/soğutma maliyetini %50 azaltır.', carbon: 'Yalıtımlı çiftlik evi yıllık 2 ton CO₂ tasarrufu sağlar.' },
    barn:          { realUse: 'Ahır hayvanların barınması ve saman/ekipman depolaması için kullanılır.', sustain: 'Güneş paneli eklenen ahırlar kendi enerjilerini üretebilir.', carbon: 'Çatıya güneş paneli kurulan ahır yılda 3 ton CO₂ azaltır.' },
    chicken_coop:  { realUse: 'Tavuk kümesi yumurta üretimi ve tavuk sağlığı için gereklidir.', sustain: 'Doğal havalandırmalı kümesler enerji tüketimini minimize eder.', carbon: 'Doğal havalandırma ile kümes enerji maliyetini %60 azaltır.' },
    dog_kennel:    { realUse: 'Köpek kulübesi çiftlik köpeğinin güvenli barınma alanıdır.', sustain: 'Ahşap kulübe doğal ve biyobozunur bir barınaktır.', carbon: 'Geri dönüştürülmüş ahşap kulübe karbon nötr bir yapıdır.' },
    compost_unit:  { realUse: 'Kompost ünitesi organik atıkları 4-8 haftada zengin gübreye dönüştürür.', sustain: 'Kompost toprak nemini %20 artırır ve sulama ihtiyacını azaltır.', carbon: 'Yıllık 1 ton organik atığın kompostlanması 0.5 ton CO₂ tasarrufu sağlar.' },
    recycle_bin:   { realUse: 'Geri dönüşüm kutusu plastik, cam ve kağıdı ayrıştırarak yeniden kullanıma kazandırır.', sustain: 'Plastik geri dönüşümü ham petrol kullanımını direkt olarak azaltır.', carbon: '1 kg plastiğin geri dönüşümü 1.5 kg CO₂ tasarrufu sağlar.' },
    water_tank:    { realUse: 'Su deposu yağmur suyunu toplayarak sulama ve hayvancılıkta kullanılır.', sustain: 'Yağmur suyu hasadı şebeke su tüketimini %30-50 azaltır.', carbon: 'Pompalama enerjisi azaldığı için dolaylı karbon tasarrufu sağlar.' },
    drip_irrig:    { realUse: 'Damla sulama suyu doğrudan bitki köklerine ulaştırır; yüzey buharlaşmasını önler.', sustain: 'Geleneksel sulamaya göre %70 daha az su kullanır.', carbon: 'Su pompalaması azaldığı için yıllık 0.3 ton CO₂ tasarrufu.' },
    solar_panel:   { realUse: 'Güneş paneli ışığı doğrudan elektriğe dönüştürür; fosil yakıt gerektirmez.', sustain: '25 yıl ömürlü panel 30 yılda ürettiğinin %95\'ini geri kazandırır.', carbon: '1 kW güneş paneli yıllık 1.5 ton CO₂ emisyonunu önler.' },
    rain_collector:{ realUse: 'Çatıdan akan yağmur suyunu toplar ve depolarda biriktirir.', sustain: 'Kentsel su baskını riskini azaltır ve yeraltı suyunu destekler.', carbon: 'Su arıtma tesisine olan bağımlılığı azaltır; %20 enerji tasarrufu.' },
    tomato_field:  { realUse: 'Domates ılıman iklimde yıllık yetiştirilebilen çok yönlü bir sebzedir.', sustain: 'Kompostla beslenen domates %40 daha yüksek verim sağlar.', carbon: 'Yerel yetiştiricilikte domates taşıma kaynaklı karbonu %90 azaltır.' },
    wheat_field:   { realUse: 'Buğday dünyada en çok yetiştirilen tahıldır; ekmek ve un hammaddesidir.', sustain: 'Rotasyon ekimi buğday verimini %25 artırır.', carbon: 'Yerel buğday hasadı ithal una göre 0.4 ton CO₂ tasarrufu sağlar.' },
    apple_tree:    { realUse: 'Elma ağacı 30-50 yıl meyve verir; böcekler için habitat sağlar.', sustain: 'Çok yıllık ağaç toprak erozyonunu önler ve karbon depolar.', carbon: 'Olgun bir elma ağacı yılda 48 kg CO₂ emer.' },
    veg_garden:    { realUse: 'Sebze bahçesi aile beslenmesinde çeşitlilik ve taze ürün sağlar.', sustain: 'Karışık ekim zararlıları doğal yollarla uzak tutar.', carbon: 'Ev bahçesi marketten alınan ürüne göre %90 daha düşük karbon izine sahiptir.' },
    sunflower:     { realUse: 'Ayçiçeği hem yağ üretimi hem de arı dostu bir bitkidir.', sustain: 'Ağır metal kirliliğini topraktan temizleme özelliği vardır (fitoiyileştirme).', carbon: 'Ayçiçeği tarlası yıllık 2 ton CO₂ bağlar.' },
    well:          { realUse: 'Kuyu yeraltı suyuna erişim sağlar; tarihsel tarımın temel su kaynağıdır.', sustain: 'Yağmur suyuyla beslenen kuyular yenilenebilir su döngüsünü destekler.', carbon: 'Elektrik pompası yerine elle çalışan kuyu sıfır enerji kullanır.' },
    hay_bale:      { realUse: 'Saman balyası kış için hayvan yemi stoku ve yalıtım malzemesi olarak kullanılır.', sustain: 'Hasat artıklarından oluşan saman doğal biyokütle kaynağıdır.', carbon: 'Saman balyası doğal çürüme yerine depolanırsa metan salımı azalır.' },
    rooster:       { realUse: 'Horoz çiftlik düzeninin doğal saatidir; sabah vakitlerini düzenler.', sustain: 'Horoz varlığı tavukların stres seviyesini azaltarak yumurta verimini artırır.', carbon: 'Doğal üreme döngüsü kuluçka makinelerinin enerji tüketimini ortadan kaldırır.' },
    chick:         { realUse: 'Civcivler çiftliğin geleceğidir; doğal büyüme döngüsünü temsil eder.', sustain: 'Doğal kuluçka yöntemi enerji tasarrufu sağlar ve hayvan refahını destekler.', carbon: 'Kuluçka makinesi yerine doğal üreme %100 enerji tasarrufu demektir.' },
    duck:          { realUse: 'Ördekler hem yumurta hem et üretir, hem de böcek ve salyangoz kontrolü sağlar.', sustain: 'Pirinç tarlalarında ördek kullanımı pestisit ihtiyacını %80 azaltır.', carbon: 'Ördek-pirinç entegre sistemi tarımsal karbon ayak izini %60 düşürür.' },
    duckling:      { realUse: 'Ördek yavruları su ekosistemlerinin sağlıklı döngüsünü destekler.', sustain: 'Su kenarında büyüyen yavrular çevre biyoçeşitliliğine katkı sağlar.', carbon: 'Doğal su ekosistemi karbon döngüsünü destekler ve salma azaltır.' },
    goat:          { realUse: 'Keçi dağlık ve zorlu arazilerde bile yetişebilen çok yönlü bir çiftlik hayvanıdır.', sustain: 'Keçi sütünden üretilen peynir daha az işlem gerektirir ve düşük karbon bırakır.', carbon: 'İnek sütüne kıyasla keçi sütü üretimi %50 daha az sera gazı üretir.' },
    lamb:          { realUse: 'Kuzu sürünün sürdürülebilirliğini sağlar; yün ve et ekonomisinin temelidir.', sustain: 'Rotasyonel otlatma ile kuzular toprağın yenilenmesine katkı sağlar.', carbon: 'Otlayan kuzular toprağın karbon tutma kapasitesini %20 artırır.' },
    horse:         { realUse: 'At tarihsel olarak tarımın vazgeçilmez iş hayvanıdır; traktörden önce toprak sürüldü.', sustain: 'Çalışan at traktor yerine kullanıldığında sıfır yakıt tüketilir.', carbon: 'At çekişli tarım, traktöre kıyasla hektar başına 200 kg CO₂ tasarrufu sağlar.' },
    windmill:      { realUse: 'Yel değirmeni tahılı una dönüştürür; rüzgar enerjisini mekanik güce çevirir.', sustain: 'Fosil yakıt olmadan enerji üretiminin en eski yöntemlerinden biridir.', carbon: 'Rüzgar enerjisi diğer enerji kaynaklarına göre en düşük karbon izine sahiptir.' },
};

export class InfoCard {
    constructor() {
        this._el = this._createEl();
        document.body.appendChild(this._el);
        document.addEventListener('click', (e) => {
            if (!this._el.contains(e.target)) this.hide();
        });
    }

    _createEl() {
        const el = document.createElement('div');
        el.id = 'info-card';
        el.className = 'info-card hidden';
        el.innerHTML = `
            <button class="info-card-close" id="info-card-close">✕</button>
            <div class="info-card-icon" id="ic-icon"></div>
            <div class="info-card-name" id="ic-name"></div>
            <div class="info-card-sections">
                <div class="info-section">
                    <div class="info-section-label">🌍 Gerçek Kullanım</div>
                    <div class="info-section-text" id="ic-real"></div>
                </div>
                <div class="info-section">
                    <div class="info-section-label">♻️ Sürdürülebilirlik</div>
                    <div class="info-section-text" id="ic-sustain"></div>
                </div>
                <div class="info-section">
                    <div class="info-section-label">🌿 Karbon Etkisi</div>
                    <div class="info-section-text" id="ic-carbon"></div>
                </div>
            </div>
        `;
        el.querySelector('#info-card-close').addEventListener('click', () => this.hide());
        return el;
    }

    show(assetId, assetName, emoji = '📦') {
        const info = INFO[assetId];
        if (!info) return;

        this._el.querySelector('#ic-icon').textContent = emoji;
        this._el.querySelector('#ic-name').textContent = assetName;
        this._el.querySelector('#ic-real').textContent = info.realUse;
        this._el.querySelector('#ic-sustain').textContent = info.sustain;
        this._el.querySelector('#ic-carbon').textContent = info.carbon;

        this._el.classList.remove('hidden');
        this._el.classList.add('visible');
    }

    hide() {
        this._el.classList.remove('visible');
        this._el.classList.add('hidden');
    }
}

// Asset id → emoji eşleşmesi
export const ASSET_EMOJI = {
    cow: '🐄', chicken: '🐔', sheep: '🐑', dog: '🐕',
    farm_house: '🏡', barn: '🏚️', chicken_coop: '🐣', dog_kennel: '🏠',
    compost_unit: '🌿', recycle_bin: '♻️', water_tank: '💧',
    drip_irrig: '🚿', solar_panel: '☀️', rain_collector: '🌧️',
    tomato_field: '🍅', wheat_field: '🌾', apple_tree: '🍎',
    veg_garden: '🥬', sunflower: '🌻', well: '🪣', hay_bale: '🌾', windmill: '⚙️',
};
