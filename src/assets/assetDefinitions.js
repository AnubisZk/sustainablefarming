/**
 * assetDefinitions.js  —  Atıksız Çiftlik
 *
 * Tüm prosedürel voxel asset tanımları. Her builder fonksiyonu
 * voxelRenderer.js'deki primitiflerle izometrik sprite üretir.
 *
 * Koordinatlar: ızgara-hücresi-göreli voxel koordinatları.
 * 1×1 ayak izi → voxel x,y ∈ [0..VPT) → VPT = 4
 */

import { CONFIG } from '../config.js';
import {
    box, shell, dome, cylinder, pyramidRoof, compose, paintAt,
} from './voxelRenderer.js';

const P = CONFIG.palette;
const VPT = CONFIG.voxel.perTile; // 4

/* ─────────────────── YARDIMCI FONKSİYONLAR ─────────────────── */

function flatTileFloor(color, accents = null) {
    const voxels = [];
    for (let ix = 0; ix < VPT; ix++)
    for (let iy = 0; iy < VPT; iy++) {
        let c = color;
        if (accents) c = accents(ix, iy) ?? color;
        voxels.push({ x: ix, y: iy, z: 0, c });
    }
    return voxels;
}

/* ─────────────────── ZEMIN KAROLARI ─────────────────────────── */

export function tileGrass() {
    return flatTileFloor(P.grass, (ix, iy) => {
        if ((ix + iy) % 3 === 0) return P.grassDark;
        if ((ix * 7 + iy * 13) % 5 === 0) return P.grassLight;
        return null;
    });
}

export function tileSand() {
    return flatTileFloor(P.sand, (ix, iy) => {
        if ((ix * 5 + iy * 3) % 7 === 0) return P.sandDark;
        return null;
    });
}

export function tileStonePath() {
    return flatTileFloor(P.path, (ix, iy) => {
        const brick = ((Math.floor(iy / 1) + (ix % 2 === 0 ? 0 : 1))) % 2;
        if (brick === 0) return P.pathDark;
        if ((ix === 1 && iy === 2) || (ix === 3 && iy === 0)) return P.pathLight;
        return null;
    });
}

export function tileDirtPath() {
    return flatTileFloor(P.soil, (ix, iy) => {
        if ((ix * 3 + iy * 7) % 5 === 0) return P.soilDark;
        if ((ix + iy * 2) % 4 === 0) return P.soilLight;
        return null;
    });
}

export function tileFarmSoil() {
    // Çapa iz deseni olan tarla toprağı
    return flatTileFloor(P.soilRich, (ix, iy) => {
        if (iy % 2 === 0) return P.soil;
        if ((ix + iy) % 4 === 0) return P.soilDark;
        return null;
    });
}

export function tileWater() {
    const voxels = flatTileFloor(P.pondBlue, (ix, iy) => {
        if ((ix * 13 + iy * 7) % 6 === 0) return P.pondShine;
        if ((ix + iy) % 3 === 0) return P.pondDeep;
        return null;
    });
    voxels.forEach(v => { v.water = true; });
    return voxels;
}

export function tileWhiteStone() {
    return flatTileFloor(P.white, (ix, iy) => {
        if ((ix + iy) % 4 === 0) return P.whiteShadow;
        return null;
    });
}

export function tileSeaWall() {
    return compose(
        box(0, 0, 0, VPT, 2, 1, P.sand),
        (() => {
            const w = box(0, 2, 0, VPT, 2, 1, P.pondBlue);
            w.forEach(v => { v.water = true; });
            return w;
        })(),
        box(0, 1, 1, VPT, 1, 1, P.stone),
    );
}

export function tileStairs() {
    return compose(
        box(0, 0, 0, VPT, VPT, 1, P.stone),
        box(VPT - 1, 0, 1, 1, VPT, 1, P.stone),
        box(VPT - 2, 0, 2, 2, VPT, 1, P.stoneDark),
    );
}

/* ─────────────────── ÇİT VE DUVARLAR ───────────────────────── */

export function woodenFence() {
    const out = [];
    // Dikey ahşap kazıklar
    out.push(...box(0, 1, 0, 1, 1, 4, P.woodDark));
    out.push(...box(VPT - 1, 1, 0, 1, 1, 4, P.woodDark));
    // Yatay çıtalar
    for (let ix = 0; ix < VPT; ix++) {
        out.push({ x: ix, y: 1, z: 1, c: P.wood });
        out.push({ x: ix, y: 1, z: 3, c: P.wood });
    }
    for (let ix = 1; ix < VPT - 1; ix++) {
        for (let iz = 0; iz < 4; iz++) out.push({ x: ix, y: 1, z: iz, c: P.woodLight });
    }
    return out;
}

export function lowWhiteWall() {
    return compose(
        box(0, 0, 0, VPT, 1, 2, P.white),
        box(0, 0, 2, VPT, 1, 1, P.whiteShadow),
    );
}

export function blueRailing() {
    const out = [];
    for (let ix = 0; ix < VPT; ix++) {
        if (ix === 0 || ix === VPT - 1 || ix === Math.floor(VPT / 2)) {
            for (let iz = 0; iz < 3; iz++) out.push({ x: ix, y: VPT - 1, z: iz, c: P.wood });
        }
    }
    for (let ix = 0; ix < VPT; ix++) out.push({ x: ix, y: VPT - 1, z: 2, c: P.woodLight });
    return out;
}

export function cornerWall() {
    return compose(
        box(0, 0, 0, VPT, 1, 3, P.stone),
        box(0, 0, 0, 1, VPT, 3, P.stone),
        box(0, 0, 3, VPT, 1, 1, P.stoneDark),
        box(0, 0, 3, 1, VPT, 1, P.stoneDark),
    );
}

export function woodenGateFence() {
    return woodenFence();
}

export function lanternPost() {
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    // Ahşap direk
    for (let iz = 0; iz < 6; iz++) out.push({ x: cx, y: cy, z: iz, c: P.woodDark });
    // Fener kafesi
    out.push({ x: cx - 1, y: cy,     z: 6, c: P.wood });
    out.push({ x: cx + 1, y: cy,     z: 6, c: P.wood });
    out.push({ x: cx,     y: cy - 1, z: 6, c: P.wood });
    out.push({ x: cx,     y: cy + 1, z: 6, c: P.wood });
    out.push({ x: cx,     y: cy,     z: 6, c: P.flame });
    out.push({ x: cx,     y: cy,     z: 7, c: P.wood });
    return out;
}

/* ─────────────────── AĞAÇLAR VE BİTKİLER ───────────────────── */

export function appleTree() {
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    // Gövde
    for (let iz = 0; iz < 5; iz++) {
        out.push({ x: cx, y: cy, z: iz, c: P.woodDark });
        if (iz < 3) out.push({ x: cx - 1, y: cy, z: iz, c: P.bark });
    }
    // Taç: koyu yeşil yapraklar
    const leaves = [
        [cx-2,cy,7],[cx+2,cy,7],[cx,cy-2,7],[cx,cy+2,7],
        [cx-1,cy,8],[cx+1,cy,8],[cx,cy-1,8],[cx,cy+1,8],[cx,cy,8],
        [cx-1,cy-1,8],[cx+1,cy+1,8],[cx-1,cy+1,8],[cx+1,cy-1,8],
        [cx,cy,9],[cx-1,cy,9],[cx+1,cy,9],[cx,cy-1,9],[cx,cy+1,9],
        [cx,cy,10],[cx-1,cy,10],[cx+1,cy,10],
    ];
    leaves.forEach(([x,y,z]) => out.push({ x, y, z, c: P.appleLeaf }));
    // Elmalar
    [[cx-1,cy,8],[cx+1,cy,9],[cx,cy-1,9],[cx,cy+1,8]].forEach(([x,y,z]) =>
        out.push({ x, y, z, c: P.apple })
    );
    return out;
}

export function cypressCluster() {
    return appleTree(); // Uyumluluk için
}

export function bougainvilleaTree() {
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    for (let iz = 0; iz < 4; iz++) out.push({ x: cx, y: cy, z: iz, c: P.woodDark });
    [[cx,cy,4],[cx-1,cy,5],[cx+1,cy,5],[cx,cy-1,5],[cx,cy+1,5],
     [cx-1,cy-1,5],[cx+1,cy+1,5],[cx,cy,6],[cx-1,cy,6],[cx+1,cy,6]].forEach(([x,y,z]) =>
        out.push({ x, y, z, c: P.leaf })
    );
    return out;
}

export function oliveTree() {
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    for (let iz = 0; iz < 4; iz++) out.push({ x: cx, y: cy, z: iz, c: P.bark });
    [[cx,cy,4],[cx-1,cy,5],[cx+1,cy,5],[cx,cy-1,5],[cx,cy+1,5],
     [cx,cy,6],[cx-1,cy,6]].forEach(([x,y,z]) =>
        out.push({ x, y, z, c: P.meadowDark })
    );
    return out;
}

export function agavePlant() {
    const out = [];
    [[1,2,0],[2,1,0],[0,2,1],[3,1,1],[1,1,2],[2,2,2],[1,2,2],[2,1,2]].forEach(([x,y,z]) =>
        out.push({ x, y, z, c: P.vegGreen })
    );
    [[1,2,3],[2,1,3]].forEach(([x,y,z]) => out.push({ x, y, z, c: P.vegDark }));
    return out;
}

export function dryGrassTuft() {
    const out = [];
    [[1,1,0],[2,1,0],[1,2,0],[2,2,0],
     [1,1,1],[2,2,1],[1,2,1],
     [1,1,2],[2,1,2]].forEach(([x,y,z]) =>
        out.push({ x, y, z, c: P.straw })
    );
    return out;
}

export function flowerPot() {
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    out.push(...box(cx - 1, cy - 1, 0, 2, 2, 2, P.clay));
    out.push({ x: cx, y: cy, z: 2, c: P.soil });
    out.push({ x: cx, y: cy, z: 3, c: P.vegGreen });
    out.push({ x: cx - 1, y: cy, z: 3, c: P.sunflower });
    return out;
}

export function stoneLantern() {
    return lanternPost();
}

export function hangingLantern() {
    return lanternPost();
}

export function whiteArchway() {
    return compose(
        box(0, 1, 0, 1, 1, 6, P.stone),
        box(VPT - 1, 1, 0, 1, 1, 6, P.stone),
        box(0, 1, 5, VPT, 1, 1, P.stoneDark),
    );
}

export function signpost() {
    const cx = Math.floor(VPT / 2);
    const out = [];
    for (let iz = 0; iz < 4; iz++) out.push({ x: cx, y: 2, z: iz, c: P.woodDark });
    out.push(...box(cx - 1, 1, 3, 3, 2, 1, P.wood));
    return out;
}

export function bannerFlag() {
    const out = [];
    for (let iz = 0; iz < 6; iz++) out.push({ x: 0, y: 2, z: iz, c: P.woodDark });
    for (let iy = 0; iy < 3; iy++) out.push({ x: 0, y: iy, z: 5, c: P.recycleGreen });
    return out;
}

export function smallChapelAltar() {
    return compose(
        box(1, 1, 0, 2, 2, 2, P.stone),
        box(0, 0, 0, VPT, VPT, 1, P.stoneDark),
    );
}

export function smallBridge() {
    return compose(
        box(0, 1, 0, VPT, 2, 1, P.plank),
        box(0, 1, 1, 1, 2, 1, P.plankDark),
        box(VPT - 1, 1, 1, 1, 2, 1, P.plankDark),
    );
}

export function well() {
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    out.push(...cylinder(cx, cy, 0, 2, 3, P.fieldStone));
    out.push(...box(cx - 1, cy, 3, 1, 1, 3, P.woodDark));
    out.push(...box(cx + 1, cy, 3, 1, 1, 3, P.woodDark));
    out.push(...box(cx - 1, cy, 5, 3, 1, 1, P.woodDark));
    return out;
}

export function plantedGardenBed() {
    return vegetableGarden();
}

export function cropPatch() {
    return tomatoField();
}

export function vegetableGarden() {
    const out = [];
    out.push(...flatTileFloor(P.soilRich));
    // Sebze sırası
    for (let ix = 0; ix < VPT; ix += 2) {
        out.push({ x: ix, y: 1, z: 1, c: P.vegGreen });
        out.push({ x: ix, y: 2, z: 1, c: P.vegLeaf });
        out.push({ x: ix, y: 1, z: 2, c: P.vegDark });
    }
    return out;
}

export function waterBucket() {
    const out = [];
    out.push(...box(1, 1, 0, 2, 2, 2, P.metalGray));
    out.push({ x: 1, y: 1, z: 2, c: P.waterBlue });
    out.push({ x: 2, y: 1, z: 2, c: P.waterBlue });
    out.push({ x: 1, y: 2, z: 2, c: P.waterBlue });
    return out;
}

export function potteryJar() {
    const cx = 2, cy = 2;
    const out = [];
    out.push(...cylinder(cx, cy, 0, 1, 3, P.clay));
    out.push({ x: cx, y: cy, z: 3, c: P.clayDark });
    return out;
}

export function woodenCrate() {
    return compose(
        box(0, 0, 0, VPT, VPT, 3, P.plank),
        box(0, 0, 0, VPT, 1, 3, P.woodDark),
        box(0, 0, 0, 1, VPT, 3, P.woodDark),
    );
}

export function blueBench() {
    return compose(
        box(0, 1, 0, VPT, 1, 1, P.woodDark),
        box(0, 1, 1, VPT, 1, 1, P.wood),
        box(0, 1, 2, 1, 1, 2, P.woodDark),
        box(VPT - 1, 1, 2, 1, 1, 2, P.woodDark),
    );
}

export function hayBale() {
    return compose(
        box(0, 0, 0, VPT, VPT, 3, P.hay),
        box(0, 0, 2, VPT, VPT, 1, P.strawDark),
        box(0, 0, 0, VPT, 1, 3, P.straw),
    );
}

export function rockCluster() {
    const out = [];
    [[0,0,0],[1,0,0],[0,1,0],[2,1,0],[1,2,0],[0,0,1],[1,0,1],[0,1,1]].forEach(([x,y,z]) =>
        out.push({ x, y, z, c: z === 0 ? P.fieldStone : P.stone })
    );
    return out;
}

export function largeRock() {
    return rockCluster();
}

export function mossyStone() {
    const out = [];
    out.push(...box(0, 0, 0, 3, 3, 2, P.fieldStone));
    [[0,0,2],[1,0,2],[0,1,2]].forEach(([x,y,z]) => out.push({ x, y, z, c: P.meadowDark }));
    return out;
}

export function flatStone() {
    return flatTileFloor(P.fieldStone);
}

export function pebbles() {
    const out = [];
    [[0,0],[2,1],[1,3],[3,0],[0,2],[3,3]].forEach(([x,y]) =>
        out.push({ x, y, z: 0, c: P.stone })
    );
    return out;
}

export function stonePile() {
    return rockCluster();
}

export function boulder() {
    return compose(
        box(0, 0, 0, VPT, VPT, 2, P.fieldStone),
        box(1, 1, 2, 2, 2, 1, P.stone),
    );
}

export function woodPile() {
    const out = [];
    for (let iz = 0; iz < 3; iz++) {
        for (let iy = 0; iy < VPT; iy++) {
            const c = iz % 2 === 0 ? P.wood : P.woodDark;
            out.push({ x: 1, y: iy, z: iz, c });
            out.push({ x: 2, y: iy, z: iz, c: P.bark });
        }
    }
    return out;
}

export function storageBox() {
    return woodenCrate();
}

export function stoneBasin() {
    return compose(
        box(0, 0, 0, VPT, VPT, 2, P.stone),
        box(1, 1, 1, 2, 2, 2, P.waterBlue),
    );
}

export function terracottaPot() {
    return potteryJar();
}

/* ─────────────────── HAYVANLAR ──────────────────────────────── */

export function cow() {
    const out = [];
    // Gövde
    out.push(...box(0, 1, 1, VPT, 2, 3, P.cowBody));
    // Siyah lekeler
    [[1,2,2],[3,1,3],[0,2,3]].forEach(([x,y,z]) => out.push({ x, y, z, c: P.cowSpot }));
    // Baş
    out.push(...box(VPT-1, 1, 3, 1, 2, 2, P.cowBody));
    out.push({ x: VPT-1, y: 2, z: 3, c: P.cowNose });
    // Bacaklar
    [[0,1],[0,2],[3,1],[3,2]].forEach(([x,y]) => {
        out.push({ x, y, z: 0, c: P.cowHoof });
        out.push({ x, y, z: 1, c: P.cowBody });
    });
    // Boynuzlar
    out.push({ x: VPT-1, y: 1, z: 5, c: P.straw });
    out.push({ x: VPT-1, y: 2, z: 5, c: P.straw });
    return out;
}

export function chicken() {
    const cx = 1, cy = 1;
    const out = [];
    // Gövde
    out.push(...box(cx, cy, 0, 2, 2, 2, P.chickenBody));
    // Kanat tüyleri
    out.push({ x: cx, y: cy, z: 1, c: P.straw });
    out.push({ x: cx+1, y: cy+1, z: 1, c: P.straw });
    // Baş
    out.push({ x: cx+1, y: cy, z: 2, c: P.chickenBody });
    out.push({ x: cx+1, y: cy, z: 3, c: P.chickenRed }); // ibik
    // Gaga
    out.push({ x: cx+1, y: cy-1, z: 2, c: P.straw });
    // Ayaklar
    out.push({ x: cx, y: cy+1, z: 0, c: P.straw });
    out.push({ x: cx+1, y: cy, z: 0, c: P.straw });
    return out;
}

export function sheep() {
    const out = [];
    // Yün gövde
    out.push(...box(0, 1, 1, VPT, 2, 3, P.sheepBody));
    // Yün doku
    [[0,1,3],[1,2,4],[2,1,4],[3,2,3],[0,2,4],[3,1,4]].forEach(([x,y,z]) =>
        out.push({ x, y, z, c: P.whiteShadow })
    );
    // Baş
    out.push(...box(VPT-1, 1, 2, 1, 2, 2, P.sheepFace));
    // Bacaklar
    [[0,1],[0,2],[3,1],[3,2]].forEach(([x,y]) => {
        out.push({ x, y, z: 0, c: P.sheepLeg });
    });
    return out;
}

export function dog() {
    const out = [];
    // Gövde
    out.push(...box(0, 1, 1, 3, 2, 2, P.dogBrown));
    // Baş
    out.push(...box(3, 1, 1, 1, 2, 2, P.dogBrown));
    out.push({ x: 3, y: 1, z: 1, c: P.dogSnout });
    out.push({ x: 3, y: 2, z: 2, c: P.dogDark }); // kulak
    // Bacaklar
    [[0,1],[0,2],[2,1],[2,2]].forEach(([x,y]) =>
        out.push({ x, y, z: 0, c: P.dogDark })
    );
    // Kuyruk
    out.push({ x: 0, y: 2, z: 2, c: P.dogBrown });
    out.push({ x: 0, y: 2, z: 3, c: P.dogBrown });
    return out;
}

/* ─────────────────── YAPILA R ───────────────────────────────── */

function addFarmWindow(out, x, y, z) {
    out.push({ x, y, z, c: P.glass });
    out.push({ x, y, z: z+1, c: P.woodDark });
}

function addFarmDoor(out, x, y, z) {
    out.push({ x, y, z, c: P.woodDark });
    out.push({ x, y, z: z+1, c: P.wood });
    out.push({ x, y, z: z+2, c: P.wood });
}

export function farmHouse() {
    // 2×2 sevimli çiftlik evi
    const W = VPT * 2, D = VPT * 2;
    const out = [];
    // Zemin
    out.push(...box(0, 0, 0, W, D, 1, P.fieldStone));
    // Duvarlar
    out.push(...shell(0, 0, 0, W, D, 5, P.cream));
    out.push(...box(0, 0, 5, W, D, 1, P.whiteShadow));
    // Üçgen çatı (kırmızı)
    out.push(...pyramidRoof(0, 0, 5, W, D, 4, P.roof));
    // Kapı
    addFarmDoor(out, W-2, D-1, 0);
    addFarmDoor(out, W-1, D-1, 0);
    // Pencereler
    addFarmWindow(out, 0, D-1, 2);
    addFarmWindow(out, W-1, 0, 2);
    // Baca
    out.push(...box(2, 1, 9, 2, 1, 3, P.fieldStone));
    out.push({ x: 2, y: 1, z: 12, c: P.metalDark });
    out.push({ x: 3, y: 1, z: 12, c: P.metalDark });
    return out;
}

export function smallMykonosHouse() {
    return farmHouse();
}

export function barn() {
    // 3×2 büyük ahır
    const W = VPT * 3, D = VPT * 2;
    const out = [];
    out.push(...box(0, 0, 0, W, D, 1, P.soilDark));
    out.push(...shell(0, 0, 0, W, D, 6, P.barn));
    out.push(...box(0, 0, 6, W, D, 1, P.barnDark));
    // Çatı: yuvarlak/kemerli ahır çatısı
    for (let ix = 0; ix < W; ix++) {
        const h = ix <= W/2 ? ix : W - ix;
        for (let iz = 0; iz <= h; iz++) {
            out.push({ x: ix, y: 0, z: 6 + iz, c: iz === h ? P.barnLight : P.barnDark });
            out.push({ x: ix, y: D-1, z: 6 + iz, c: iz === h ? P.barnLight : P.barnDark });
        }
        out.push(...box(ix, 0, 6, 1, D, 1, P.barn));
    }
    out.push(...pyramidRoof(0, 0, 6, W, D, 4, P.barnDark));
    // Büyük ahır kapısı
    out.push(...box(W/2-1, D-1, 0, 2, 1, 5, P.woodDark));
    out.push(...box(W/2-1, D-1, 0, 1, 1, 5, P.plank));
    // Yan pencereler
    addFarmWindow(out, 1, D-1, 3);
    addFarmWindow(out, W-2, D-1, 3);
    return out;
}

export function chickenCoop() {
    // 1×2 tavuk kümesi
    const W = VPT, D = VPT * 2;
    const out = [];
    out.push(...box(0, 0, 0, W, D, 1, P.plankDark));
    out.push(...shell(0, 0, 0, W, D, 4, P.plank));
    out.push(...pyramidRoof(0, 0, 4, W, D, 3, P.roof));
    // Küçük kapı
    out.push({ x: 1, y: D-1, z: 0, c: P.woodDark });
    out.push({ x: 1, y: D-1, z: 1, c: P.wood });
    // Tel kafes ön yüz
    for (let iz = 1; iz < 4; iz++) {
        out.push({ x: 0, y: D-1, z: iz, c: P.metalGray });
        out.push({ x: W-1, y: D-1, z: iz, c: P.metalGray });
    }
    return out;
}

export function dogKennel() {
    // 1×1 köpek kulübesi
    const out = [];
    out.push(...box(0, 0, 0, VPT, VPT, 1, P.plankDark));
    out.push(...shell(0, 0, 0, VPT, VPT, 3, P.plank));
    out.push(...pyramidRoof(0, 0, 3, VPT, VPT, 3, P.roofDark));
    // Kapı açıklığı
    out.push(...box(1, VPT-1, 0, 2, 1, 3, P.soilDark));
    return out;
}

export function twoStoryHouse() {
    return farmHouse();
}

export function mainVilla() {
    return barn();
}

export function windmillBuilding() {
    // Küçük yel değirmeni (1×1)
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    out.push(...cylinder(cx, cy, 0, 2, 8, P.stone));
    out.push(...cylinder(cx, cy, 8, 2, 2, P.stoneDark));
    // Kanatlar
    [[-3,0,6],[3,0,6],[0,-3,6],[0,3,6]].forEach(([dx,dy,dz]) => {
        out.push({ x: cx+dx, y: cy+dy, z: dz, c: P.plank });
    });
    return out;
}

export function towerChapel() {
    return farmHouse();
}

export function mainChapel() {
    return farmHouse();
}

export function whiteCubeHouse() {
    return farmHouse();
}

export function terraceHouse() {
    return farmHouse();
}

export function pergolaHouse() {
    return barn();
}

/* ─────────────────── SÜRDÜRÜLEBİLİRLİK SİSTEMLERİ ─────────── */

export function compostUnit() {
    // 1×1 kompost ünitesi: kasalı, kahverengi
    const out = [];
    out.push(...box(0, 0, 0, VPT, VPT, 1, P.soilDark));
    out.push(...shell(0, 0, 0, VPT, VPT, 4, P.compostBrown));
    out.push(...box(0, 0, 3, VPT, VPT, 1, P.compostRich));
    // Gıcırdayan tahta levhalar
    out.push({ x: 0, y: 0, z: 2, c: P.woodDark });
    out.push({ x: VPT-1, y: 0, z: 2, c: P.woodDark });
    out.push({ x: 0, y: VPT-1, z: 2, c: P.woodDark });
    out.push({ x: VPT-1, y: VPT-1, z: 2, c: P.woodDark });
    // Kompost içeriği görünümü (üst)
    out.push({ x: 1, y: 1, z: 4, c: P.soilRich });
    out.push({ x: 2, y: 2, z: 4, c: P.vegDark });
    out.push({ x: 1, y: 2, z: 4, c: P.soilRich });
    return out;
}

export function recyclingBin() {
    // 1×1 geri dönüşüm kutusu: yeşil
    const cx = 1, cy = 1;
    const out = [];
    out.push(...box(cx, cy, 0, 2, 2, 4, P.recycleGreen));
    out.push(...box(cx, cy, 3, 2, 2, 1, P.recycleDark));
    // Geri dönüşüm sembolü (üstte)
    out.push({ x: cx, y: cy, z: 4, c: P.grassLight });
    out.push({ x: cx+1, y: cy+1, z: 4, c: P.grassLight });
    // Kapaklı
    out.push(...box(cx-0, cy-0, 4, 2, 2, 1, P.recycleDark));
    return out;
}

export function waterTank() {
    // 1×1 su deposu: silindirik mavi
    const cx = Math.floor(VPT / 2);
    const cy = Math.floor(VPT / 2);
    const out = [];
    out.push(...cylinder(cx, cy, 0, 2, 6, P.waterTank));
    out.push(...cylinder(cx, cy, 6, 2, 1, P.waterTankDark));
    // Su yüzeyi (üstte mavi)
    out.push({ x: cx, y: cy, z: 5, c: P.waterShine });
    // Çember çember detay
    for (let iz = 1; iz < 6; iz += 2) {
        out.push({ x: cx-1, y: cy, z: iz, c: P.waterTankDark });
        out.push({ x: cx, y: cy-1, z: iz, c: P.waterTankDark });
    }
    // Musluk
    out.push({ x: cx+1, y: cy, z: 1, c: P.metalGray });
    return out;
}

export function rainwaterCollector() {
    return waterTank();
}

export function dripIrrigationSystem() {
    // Plastik şişeden damla sulama sistemi
    const out = [];
    out.push(...box(0, 0, 0, VPT, VPT, 1, P.soil));
    // Plastik şişeler
    [[0,0],[0,2],[2,0],[2,2]].forEach(([ix,iy]) => {
        out.push(...box(ix, iy, 1, 1, 1, 4, P.plastic));
        out.push({ x: ix, y: iy, z: 5, c: P.plasticLight });
    });
    // Boru hattı
    for (let ix = 0; ix < VPT; ix++) out.push({ x: ix, y: 1, z: 1, c: P.metalGray });
    for (let iy = 0; iy < VPT; iy++) out.push({ x: 1, y: iy, z: 1, c: P.metalGray });
    return out;
}

export function solarPanel() {
    // 1×1 güneş paneli
    const out = [];
    // Destek ayağı
    out.push(...box(1, 1, 0, 2, 2, 3, P.metalGray));
    // Panel yüzeyi (eğimli)
    out.push(...box(0, 0, 3, VPT, VPT, 1, P.solarBlue));
    // Panel hücreleri
    for (let ix = 0; ix < VPT; ix += 2)
    for (let iy = 0; iy < VPT; iy += 2) {
        out.push({ x: ix, y: iy, z: 4, c: P.solarCell });
        out.push({ x: ix+1, y: iy+1, z: 4, c: P.solarDark });
        out.push({ x: ix, y: iy+1, z: 4, c: P.solarLight });
    }
    return out;
}

/* ─────────────────── TARLA VE BİTKİLER ─────────────────────── */

export function tomatoField() {
    const out = [];
    out.push(...flatTileFloor(P.soilRich));
    // Domates bitkileri
    [[0,0],[0,2],[2,0],[2,2]].forEach(([ix,iy]) => {
        // Kazık
        out.push({ x: ix+1, y: iy+1, z: 1, c: P.woodDark });
        out.push({ x: ix+1, y: iy+1, z: 2, c: P.woodDark });
        // Yapraklar
        out.push({ x: ix, y: iy+1, z: 2, c: P.vegGreen });
        out.push({ x: ix+1, y: iy, z: 2, c: P.vegLeaf });
        // Kırmızı domatesler
        out.push({ x: ix, y: iy, z: 2, c: P.tomato });
        out.push({ x: ix+1, y: iy+1, z: 3, c: P.tomatoLight });
    });
    return out;
}

export function wheatField() {
    const out = [];
    out.push(...flatTileFloor(P.soil));
    // Buğday sapları
    for (let ix = 0; ix < VPT; ix++) {
        for (let iy = 0; iy < VPT; iy++) {
            const h = 2 + ((ix * 3 + iy * 7) % 2);
            out.push({ x: ix, y: iy, z: 1, c: P.vegGreen });
            out.push({ x: ix, y: iy, z: h, c: P.wheat });
            if ((ix + iy) % 2 === 0) out.push({ x: ix, y: iy, z: h+1, c: P.strawLight });
        }
    }
    return out;
}

export function vegetableGardenBed() {
    return vegetableGarden();
}

export function sunflowerField() {
    const out = [];
    out.push(...flatTileFloor(P.soilRich));
    [[1,1],[1,3],[3,1],[3,3]].forEach(([ix,iy]) => {
        // Sap
        for (let iz = 1; iz < 5; iz++) out.push({ x: ix, y: iy, z: iz, c: P.vegGreen });
        // Çiçek başı
        [[0,0],[1,0],[0,1],[-1,0],[0,-1]].forEach(([dx,dy]) => {
            out.push({ x: ix+dx, y: iy+dy, z: 5, c: P.sunflower });
        });
        out.push({ x: ix, y: iy, z: 5, c: P.sunflowerDark });
    });
    return out;
}
