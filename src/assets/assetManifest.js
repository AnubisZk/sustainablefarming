/**
 * assetManifest.js  —  Atıksız Çiftlik
 *
 * Tüm oyun içi asset'lerin tanımlı listesi.
 * Kategori sistemi oyunun sürdürülebilirlik mantığıyla uyumludur.
 */

import * as A from './assetDefinitions.js';

const T = (id, name, foot = { w: 1, d: 1 }) => ({
    id, name, category: 'terrain', footprint: foot, kind: 'terrain',
    filename: `${id}.png`, sizeScale: 1,
});
const O = (category, defaultScale = 1) =>
    (id, name, foot = { w: 1, d: 1 }, sizeScale = defaultScale) => ({
        id, name, category, footprint: foot, kind: 'object',
        filename: `${id}.png`, sizeScale,
    });

const An = O('hayvanlar', 0.85);
const Yp = O('yapılar',   1.00);
const Bi = O('bitkiler',  0.85);
const Su = O('sürdürülebilirlik', 0.90);
const Ze = O('zemin',     1.00);

export const ASSET_MANIFEST = [
    // ── ZEMİN (terrain) ─────────────────────────────────────────────
    { ...T('grass',      'Çayır'),          tileLike: true, builder: A.tileGrass },
    { ...T('farmsoil',   'Tarla Toprağı'),  tileLike: true, builder: A.tileFarmSoil },
    { ...T('dirt_path',  'Toprak Yol'),     tileLike: true, builder: A.tileDirtPath },
    { ...T('path',       'Taş Yol'),        tileLike: true, builder: A.tileStonePath },
    { ...T('sand',       'Kum'),            tileLike: true, builder: A.tileSand },
    { ...T('water',      'Su / Gölet'),     tileLike: true, builder: A.tileWater },
    { ...Ze('stairs', 'Merdiven', { w: 1, d: 1 }, 1.0), noShadow: true, builder: A.tileStairs },

    // ── HAYVANLAR ─────────────────────────────────────────────────────
    { ...An('cow',     'İnek',   { w: 1, d: 1 }, 0.90), builder: A.cow,     farmType: 'animal', wasteRate: 5,
      tip: 'İnek gübresi kompost için en güçlü doğal kaynaktır.' },
    { ...An('chicken', 'Tavuk',  { w: 1, d: 1 }, 0.65), builder: A.chicken, farmType: 'animal', wasteRate: 2,
      tip: 'Tavuk gübresi azot açısından zengindir ve toprağı besler.' },
    { ...An('sheep',   'Koyun',  { w: 1, d: 1 }, 0.85), builder: A.sheep,   farmType: 'animal', wasteRate: 3,
      tip: 'Koyun yünü ve gübresiyle çiftliğe çift katkı sağlar.' },
    { ...An('dog',     'Köpek',  { w: 1, d: 1 }, 0.75), builder: A.dog,     farmType: 'animal', wasteRate: 1,
      tip: 'Çiftlik köpeği diğer hayvanları ve mahsulleri korur.' },

    // ── YAPILAR ──────────────────────────────────────────────────────
    { ...Yp('farm_house',    'Çiftlik Evi',    { w: 2, d: 2 }, 1.0), builder: A.farmHouse,
      tip: 'Çiftlik evi çiftçinin ve ailesinin yaşam merkezidir.' },
    { ...Yp('barn',          'Ahır',           { w: 3, d: 2 }, 1.0), builder: A.barn,
      tip: 'Ahır, hayvanların barınmasını ve saman depolamayı sağlar.' },
    { ...Yp('chicken_coop',  'Tavuk Kümesi',   { w: 1, d: 2 }, 0.9), builder: A.chickenCoop,
      tip: 'Tavuk kümesi yumurta üretimi ve tavuk sağlığı için gereklidir.' },
    { ...Yp('dog_kennel',    'Köpek Kulübesi', { w: 1, d: 1 }, 0.8), builder: A.dogKennel,
      tip: 'Köpek kulübesi çiftlik köpeğinin barınma alanıdır.' },
    { ...Yp('well',          'Kuyu',           { w: 1, d: 1 }, 0.8), builder: A.well,
      tip: 'Kuyu, yağmur suyunu depolayarak kuraklıkta güvenlik sağlar.' },
    { ...Yp('hay_bale',      'Saman Balyası',  { w: 1, d: 1 }, 0.7), builder: A.hayBale,
      tip: 'Saman balyası kış için hayvan yemi stokunu sağlar.' },
    { ...Yp('windmill',      'Yel Değirmeni',  { w: 1, d: 1 }, 0.9), builder: A.windmillBuilding,
      tip: 'Yel değirmeni tahılı una dönüştürür, rüzgar enerjisini kullanır.' },

    // ── BİTKİLER ─────────────────────────────────────────────────────
    { ...Bi('tomato_field',  'Domates Tarlası', { w: 1, d: 1 }, 0.85), builder: A.tomatoField, farmType: 'plant',
      tip: 'Domates, kompostla beslenen zengin toprakta verimli büyür.' },
    { ...Bi('wheat_field',   'Buğday Alanı',   { w: 1, d: 1 }, 0.85), builder: A.wheatField, farmType: 'plant',
      tip: 'Buğday toprağın azot dengesine katkı sağlayan tahıldır.' },
    { ...Bi('apple_tree',    'Elma Ağacı',     { w: 1, d: 1 }, 0.90), builder: A.appleTree, farmType: 'plant',
      tip: 'Elma ağacı hem meyve verir hem de toprağı güçlendirir.' },
    { ...Bi('veg_garden',    'Sebze Bahçesi',  { w: 1, d: 1 }, 0.85), builder: A.vegetableGarden, farmType: 'plant',
      tip: 'Sebze bahçesi aile beslenmesinde ve sıfır atıkta kilit roldedir.' },
    { ...Bi('sunflower',     'Ayçiçeği Tarlası',{ w: 1, d: 1 }, 0.85), builder: A.sunflowerField, farmType: 'plant',
      tip: 'Ayçiçeği toprak iyileştirici ve arı dostu bir bitkidir.' },

    // ── SÜRDÜRÜLEBİLİRLİK SİSTEMLERİ ────────────────────────────────
    { ...Su('compost_unit',  'Kompost Ünitesi',        { w: 1, d: 1 }, 0.85), builder: A.compostUnit, farmType: 'compost',
      tip: 'Kompost ünitesi hayvansal ve bitkisel atıkları verimli gübreye dönüştürür.' },
    { ...Su('recycle_bin',   'Geri Dönüşüm Kutusu',   { w: 1, d: 1 }, 0.70), builder: A.recyclingBin, farmType: 'recycle',
      tip: 'Geri dönüşüm kutusu plastik ve diğer atıkları ayırarak yeniden kullanıma kazandırır.' },
    { ...Su('water_tank',    'Su Deposu',              { w: 1, d: 1 }, 0.85), builder: A.waterTank, farmType: 'watersave',
      tip: 'Su deposu yağmur suyunu toplayarak sulama ve hayvancılık için saklar.' },
    { ...Su('drip_irrig',    'Damla Sulama Sistemi',   { w: 1, d: 1 }, 0.85), builder: A.dripIrrigationSystem, farmType: 'water',
      tip: 'Plastik şişelerden yapılan damla sulama, suyu doğrudan kök bölgesine ulaştırır; %70 su tasarrufu sağlar.' },
    { ...Su('solar_panel',   'Güneş Paneli',           { w: 1, d: 1 }, 0.90), builder: A.solarPanel, farmType: 'energy',
      tip: 'Güneş paneli çiftliğin enerji ihtiyacını fosil yakıt olmadan karşılar.' },
    { ...Su('rain_collector','Yağmur Suyu Tankı',      { w: 1, d: 1 }, 0.80), builder: A.rainwaterCollector, farmType: 'watersave',
      tip: 'Yağmur suyu toplayıcı, kurak dönemlerde su kaynaklarını destekler.' },
];

// Kategori sırası — palette sekmeleri bu sırayı izler.
export const CATEGORIES = [
    'zemin',
    'hayvanlar',
    'yapılar',
    'bitkiler',
    'sürdürülebilirlik',
];

// Hızlı id → tanım erişimi için indeks.
export const ASSET_INDEX = Object.fromEntries(
    ASSET_MANIFEST.map(a => [a.id, a])
);
