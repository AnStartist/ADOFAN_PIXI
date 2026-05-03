import * as PIXI from 'pixi.js';
import { tile , tileToGraphics , fmol } from './load/tile_svg.js';
import { toLegalJson } from './load/json_convert.js';
import { loadlevel } from './load/level_load.js';
import { sound } from '@pixi/sound';
import { mixAudio } from './load/audio_mix.js';
import * as Ease from 'd3-ease';

const easeQuartIn = Ease.easePolyIn.exponent(4.0);
const easeQuartOut = Ease.easePolyOut.exponent(4.0);
const easeQuartInOut = Ease.easePolyInOut.exponent(4.0);

let adofaifile = new String;
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.style.display = 'none'; // 隐藏
fileInput.accept=".adofai";
document.body.appendChild(fileInput);
let CX = window.innerWidth / 2, CY = window.innerHeight / 2;

const app = new PIXI.Application();

await app.init({ width: window.innerWidth,preference:'webgl' ,antialias: true , height: window.innerHeight, background: 0x000000 ,resolution: window.devicePixelRatio || 2, autoDensity: true});
document.body.appendChild(app.canvas);
window.addEventListener('resize' , resizeStage);
function resizeStage() {
    app.canvas.style.width = window.innerWidth + 'px';
    app.canvas.style.height = window.innerHeight  + 'px';
    app.renderer.resize(window.innerWidth,window.innerHeight);
    CX = window.innerWidth / 2;
    CY = window.innerHeight / 2;
};

function importfile() {
    if_play = false;
    beat = -114514;
    sound.stopAll();
    if_music = false;
    if_hitsound = false;
    fileInput.click();
};
window.importfile = importfile;
let isWaitingForAudio = false;

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    // 使用 FileReader 读取文件内容（以文本形式）
    if (!isWaitingForAudio) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            adofaifile = toLegalJson(content);
            await readadofai(adofaifile);
            isWaitingForAudio = true;
            fileInput.accept = 'audio/*';
            Notice.innerHTML = 'Please Click Import Again To Load Music File.'
        };
        reader.onerror = () => {Notice.innerHTML = "Error Loading File.";};
        reader.readAsText(file, 'UTF-8');
    } else {
        if (file.type.startsWith('audio/')) {
            const url = URL.createObjectURL(file);
            try {
                if (sound.context && sound.context.state === 'suspended') {
                    await sound.context.resume();
                };
                if (sound.exists('bgm')) sound.remove('bgm');
                sound.add('bgm' , url);
                sound.play('bgm');
                sound.play('hitsound');
                sound.stopAll();
                Notice.innerHTML = 'Successful loaded Music File!'
            } catch (err) {
                URL.revokeObjectURL(url);
                return;
            };
        };
        isWaitingForAudio = false;
        fileInput.value = '';
        fileInput.accept = '.adofai';
    };
});

let angledata = new Array;
let setting = new Object;
let actions = new Array;
let anglelist = new Array;
let rotatedir = new Array;
let movingball = new Array;
let tbpm = new Array;
let trackrad = new Array;
let time = new Array;
let tilepos = new Array;
let CamP,CamR,CamZ,CamRel;
let tilesro = new Array;
let tilescale = new Array;
let ballpos = new Array;
let beat = new Number , findTick = new Number , startTime = new Number;
let offset = new Number , Sbpm = new Number , countdownTicks = new Number;
let trackrange = 200;
let Notice = document.getElementById("Notice");
let hitsoundlist = new Array, hitsoundvol = new Array;
let actMovCam = new Array, actMovTime = new Array;

async function readadofai(adofai) {
    if ("pathData" in adofai) {
        let pathdata = adofai["pathData"];
        angledata = readPathData(pathdata);
    } else {
        angledata = adofai["angleData"];
    };
    if (angledata[angledata.length - 1] == 999) {
        angledata.push(angledata[angledata.length - 2] + 180);
    } else {
        angledata.push(angledata[angledata.length - 1]);
    };
    setting = adofai["settings"];
    actions = adofai["actions"];
    let level = new loadlevel(actions , angledata , setting);
    level.scanactions();
    let twirl = level.loadtwirl();
    movingball = twirl['movingball'];
    rotatedir = twirl['rotatedir'];
    anglelist = level.loadangle();
    tbpm = level.loadspeed();
    trackrad = level.loadradius();
    level.loadtilepos();
    level.loadpause();
    time = level.loadtime();
    level.loadpositiontrack();
    level.loadhitsound();
    level.loadcamera();
    tilepos = level.g_tpos;
    tilesro = level.g_tsro;
    tilescale = level.g_tsca;
    ballpos = level.g_bpos;
    trackrad = level.g_trad;
    hitsoundlist = level.g_harr;
    hitsoundvol = level.g_hvol;
    actMovCam = level.g_movcam;
    actMovTime = level.g_camord;
    CamP = setting['position'].slice();
    CamR = -1 * setting['rotation'];
    CamZ = setting['zoom'];
    CamRel = setting['relativeTo'];
    await loadalltrack();
    await loadball();
    offset = setting['offset'];
    Sbpm = setting['bpm'];
    countdownTicks = setting['countdownTicks'];
    Notice.innerHTML = 'Loading Hitsound!';
    await soundcaculate();
    Notice.innerHTML = 'Successful Loaded Level!';
};

function readPathData(pathData) {
    // 字符到角度的映射表
    const angleMap = {
        'R': 0, 'p': 15, 'J': 30, 'E': 45, 'T': 60, 'o': 75, 'U': 90,
        'q': 105, 'G': 120, 'Q': 135, 'H': 150, 'W': 165, 'L': 180,
        'x': 195, 'N': 210, 'Z': 225, 'F': 240, 'V': 255, 'D': 270,
        'Y': 285, 'B': 300, 'C': 315, 'M': 330, 'A': 345,
        '5': 555, '6': 666, '7': 777, '!': 999
    };
    const path = pathData;
    // 使用 map 和空值合并运算符，未知字符默认为 0
    return Array.from(path, ch => angleMap[ch] ?? 0);
};

let rectime = new Number;

document.addEventListener('keydown' ,async (event) => {
    switch (event.key) {
        case '0':
            if_all = true;
            if_play = false;
            beat = -114514;
            sound.stopAll();
            if_music = false;
            if_hitsound = false;
            renderalltrack();
            document.getElementById('Notice').innerHTML = '';
            partload(-100,10000);
            break;
        case 'ArrowRight':
            CamP[0] += 10;
            break;
        case 'ArrowUp':
            CamP[1] += 10;
            break;
        case 'ArrowLeft':
            CamP[0] -= 10;
            break;
        case 'ArrowDown':
            CamP[1] -= 10;
            break;
        case ' ':
            PlayInitialize();
            GameLoop();
            break;
        case 'Escape':
            if_play = false;
            beat = -114514;
            sound.stopAll();
            if_music = false;
            if_hitsound = false;
            break;
        //case '1':
        //    Notice.innerHTML = getEaseFunction('InQuad')(0.5);
    };
});

let lastCamP, lastCamZ , lastCamR , lastCamRel , waitingCam  = [], camDetail  = [], camord = 0 , relPlayer = [0,0];

function PlayInitialize() {
    if_all = false;
    visibleTrack = new Array;
    tileTime = [-10000] , ballTile = new Object;
    ballTile['ball#1'] = [[0,0]];
    ballTile['ball#2'] = [[0,0]];
    beat = -1 * countdownTicks;
    startTime = performance.now() / 1000 + countdownTicks * 60 / Sbpm;
    findTick = -1 * countdownTicks;

    rectime = performance.now();
    balls['ball1'].visible = true;
    balls['ball2'].visible = true;
    Notice.innerHTML = '';

    waitingCam = [];
    camDetail = [];

    //Camera Initialize.
    CamP = setting['position'].slice();
    CamR = -1 * setting['rotation'];
    CamZ = setting['zoom'];
    CamRel = setting['relativeTo'];
    camord = 0;
    lastCamP = CamP.slice();
    lastCamR = CamR;
    lastCamZ = CamZ;
    lastCamRel = CamRel;
    relPlayer = [0,0];
    lastRelP = CamP.slice();
    cambeat = 0;

    if_play = true;
};

function pointer(x,y) {
    const myGraphic = new PIXI.Graphics().svg(`<svg xmlns="https://www.o3.org/2000/svg"><polygon points="0,0 10,0 0,10" fill="#a1d5f0"></svg>`);
    app.stage.addChild(myGraphic);
    myGraphic.position.set(x,y);
};
//pointer(CX,CY);

const Container = new PIXI.Container;
Container.position.set(CX,CY);
app.stage.addChild(Container);
let tracks = new Object , balls = new Object;
async function loadalltrack() {
    clearalltracks();
    await loadeventtextures();
    for (let i = angledata.length - 1;i >= 0; i--) {
        let lastangle = i == 0 ? 180 : angledata[i - 1] + 180;
        let trackgra = singleTrack(i , lastangle);
        let trackname = 'track#' + String(i);
        tracks[trackname] = new PIXI.Container();
        tracks[trackname].addChild(trackgra);
        let sro = tilesro[i] , scale = tilescale[i] , posi = tilepos[i];
        tracks[trackname].position.set(posi[0] , -posi[1]);
        tracks[trackname].rotation = sro[1];
        tracks[trackname].opacity = sro[2];
        tracks[trackname].scale.set(sro[0] * scale[0] / 10000 , sro[0] * scale[1] / 10000 );
        let eventspr = singleEvent(i);
        if (eventspr != null) {tracks[trackname].addChild(eventspr);};
        Container.addChild(tracks[trackname]);
        tracks[trackname].visible = false;
    };
};

let balltxt , ballcolor = [0xff0000 , 0x0000ff];
async function loadball() {
    clearallballs();
    balltxt = await PIXI.Assets.load('images/ball3.png');
    balls['balltile#1'] = new PIXI.Graphics();
    balls['balltile#2'] = new PIXI.Graphics();
    Container.addChild(balls['balltile#1']);
    Container.addChild(balls['balltile#2']);
    balltxt.source.scaleMode = 'linear';
    ballInitaize('ball1' , ballcolor[0]);
    ballInitaize('ball2' , ballcolor[1]);
    balls['ball1'].position.set(CX,CY);
    balls['ball2'].position.set(CX+ 200,CY - 100);
    balls['ball1'].visible = false;
    balls['ball2'].visible = false;
};

function ballInitaize(name , color) {
    balls[name] = PIXI.Sprite.from(balltxt);
    balls[name].anchor.set(0.5,0.5);
    balls[name].scale = 0.03;
    balls[name].tint = color;
    Container.addChild(balls[name]);
};

function clearalltracks() {
    for (let key in tracks) {
    if (key in tracks) {
            const sprite = tracks[key];
            if (sprite && sprite.destroy) {app.stage.removeChild(sprite);sprite.destroy();};
        };
    };
    tracks = {};
};

function clearallballs() {
    for (let key in balls) {
    if (key in balls) {
            const sprite = balls[key];
            if (sprite && sprite.destroy) {app.stage.removeChild(sprite);sprite.destroy();};
        };
    };
    balls = {};
};


function singleTrack(tick , lastangle) {
    let lastloadangle , trackgra;
    if (lastangle == 1179 || angledata[tick] == 999) {
        let t = tick - 1,minus = 1;
        while (angledata[t-minus] == 999) {
            minus++;
        };
        lastloadangle = angledata[t - minus] + (minus - 1) * 180;
    };
    if (angledata[tick] != 999) {
        if (fmol(angledata[tick] , 360) != fmol(lastangle , 360)) {
            if (lastangle == 1179) {
                trackgra = tileToGraphics(lastloadangle , angledata[tick] , 7.5 , 15 , '#debb7b' , '#a58750' , 0);
            } else {
                trackgra = tileToGraphics(lastangle , angledata[tick] , 7.5 , 15 , '#debb7b' , '#a58750' , 0);
            };
        } else {
            trackgra = tileToGraphics(angledata[tick] , angledata[tick] , 7.5 , 7.5 , '#debb7b' , '#a58750' , 0);
        };
    } else {
        if (lastangle == 1179) {
            trackgra = tileToGraphics(lastloadangle , lastloadangle , 7.5, 7.5, '#debb7b' , '#a58750' , 1);
        } else {
            trackgra = tileToGraphics(lastangle , lastangle , 7.5, 7.5,'#debb7b' , '#a58750' , 1);
        };
    };
    return trackgra;
};

let if_all = false , if_play = false;
let animationId = null;
function renderalltrack() {
    let fps = 1000 / (performance.now() - fpstime);
    fpstime = performance.now();
    FPS.innerHTML = String(fps.toFixed(2)) + ' | FPS';
    if (!if_all) return;
    for (let i = angledata.length - 1;i>= 0 ; i--) {
        let trackname = 'track#' + String(i);
        if (Math.abs(tilepos[i][0] - CamP[0]) <= window.innerWidth / 2 + 20 && Math.abs(tilepos[i][1] - CamP[1]) <= window.innerHeight/2 +20) {
            tracks[trackname].visible = true;
        } else {
            tracks[trackname].visible = false;
        };
    };
    Container.position.set(-CamP[0] , CamP[1]);
    animationId = requestAnimationFrame(renderalltrack); 
};

let visibleTrack = []; // 不要每次 new Array

function partload(s, e) {
    // 隐藏旧轨道
    for (let i = 0; i < visibleTrack.length; i++) {
        tracks[visibleTrack[i]].visible = false;
    }
    visibleTrack.length = 0; // 清空但保留数组
    
    const start = Math.max(s, 0);
    const end = Math.min(e, angledata.length - 1);
    for (let i = end; i >= start; i--) {
        const name = 'track#' + i;
        visibleTrack.push(name);
        tracks[name].visible = true;
    }
};

const eventico = new Object;
async function loadeventtextures() {
    eventico['End'] = await PIXI.Assets.load('images/events-new/End.png');
    eventico['Speed-'] = await PIXI.Assets.load('images/events-new/Speed-.png');
    eventico['Speed+'] = await PIXI.Assets.load('images/events-new/Speed+.png');
    eventico['TwirlB-1'] = await PIXI.Assets.load('images/events-new/TwirlB-1.png');
    eventico['TwirlB1'] = await PIXI.Assets.load('images/events-new/TwirlB1.png');
    eventico['TwirlR-1'] = await PIXI.Assets.load('images/events-new/TwirlR-1.png');
    eventico['TwirlR1'] = await PIXI.Assets.load('images/events-new/TwirlR1.png');
};

function singleEvent(i) {
    let eventname = null;
    let rotation = 0 , scale = 0.035;
    if (tbpm[i] / tbpm[i - 1] > 1.05) {
        eventname = 'Speed+';
    } else if (tbpm[i] / tbpm[i - 1] < 0.95) {
        eventname = 'Speed-';
    };
    if (rotatedir[i] != rotatedir[i - 1]) {
        scale = 0.023;
        eventname = anglelist[i] < 180 ? 'TwirlR' : 'TwirlB';
        eventname += String(rotatedir[i]);
        rotation = CamZ > 0 ? 30 - angledata[i] : 210 - angledata[i];
    };
    if (i == 0) {eventname = null;};
    if (i == angledata.length - 1) {
        eventname = 'End';
        scale = 0.035;
    };
    if (eventname != null) {
        let eventSprite = new PIXI.Sprite(eventico[eventname]);
        eventSprite.anchor.set(0.5,0.5);
        eventSprite.scale.set(scale,scale);
        eventSprite.rotation = rotation / 180 * Math.PI;
        return eventSprite;
    } else return null;
};

function refreshState() {
    const aspox = -CamP[0], aspoy = -CamP[1];
    const rad = Math.hypot(aspox, aspoy); // 更快
    const camRad = CamR * (Math.PI / 180);
    let facing;
    if (rad === 0) {
        facing = 0;
    } else {
        const asinVal = Math.asin(aspoy / rad);
        facing = aspox > 0 ? asinVal + camRad : Math.PI - asinVal + camRad;
    }
    const cosFac = Math.cos(facing), sinFac = Math.sin(facing);
    const scaleFactor = Math.abs(200 / CamZ);
    Container.position.set(CX + scaleFactor * rad * cosFac, CY - scaleFactor * rad * sinFac);
    Container.rotation = CamZ > 0 ? -camRad : Math.PI - camRad;
    Container.scale.set(scaleFactor);
};

let if_music = false , if_hitsound = false;
let fpstime = performance.now();
let FPS = document.getElementById('FPS');
let BEAT = document.getElementById('Beat');
let WaitMusicTime = -114514;
let gametime = new Number;
let cambeat = new Number;
let lastFpsUpdate = 0;
function GameLoop() {
    if (!if_play) return;
    const now = performance.now();
    const fps = 1000 / (now - fpstime);
    fpstime = now;
    gametime = timeCaculate();
    if (!if_music && gametime > -1 * offset / 1000) {
        if (WaitMusicTime == -114514) WaitMusicTime = performance.now() / 1000;
        if (performance.now() / 1000 - WaitMusicTime > 60 / Sbpm) { 
            if (sound.exists('bgm')) {sound.play('bgm');
            sound.find('bgm').volume = setting['volume'] / 100;};
            if_music = true;
            WaitMusicTime = -114514;
        };
    };
    if (!if_hitsound && gametime > -1 * countdownTicks * 60 / Sbpm) {
            if (sound.exists('hitsound')) sound.play('hitsound');
            if_hitsound = true;
    };

    if (gametime > -1 * countdownTicks * 60 / Sbpm) {beatCaculate()};
    refreshState();
    partload(Math.floor(beat) - trackrange / 4 , Math.floor(beat) + trackrange / 4 * 3);
    renderballs();
    if (CamRel == 'Player' && beat >= 0 && findTick < time.length) cameraMove();
    if (beat >= 0 && camord < actMovTime.length) cameraEvent();
    cameraAction();
    // 降低 UI 更新频率
    if (now - lastFpsUpdate > 100) {
        FPS.textContent = fps.toFixed(2) + '| FPS';
        BEAT.textContent = beat.toFixed(3) + '| Beat';
        lastFpsUpdate = now;
    };
    animationId = requestAnimationFrame(GameLoop);
};

function timeCaculate() {return performance.now() / 1000 - startTime - offset / 1000};

function beatCaculate() {
    beat = intBeatCaculater(gametime) - 1 + floatBeatCaculater(gametime);
};

function intBeatCaculater(t) {
    if (findTick > 0) {
        while (findTick <= time.length && time[findTick - 1] < t) {findTick += 1;};
        return findTick - 1;
    } else {
        while (findTick * 60 / Sbpm <= t) {findTick += 1;};
        return findTick;
    };
};

function floatBeatCaculater(t) {
    let intime = findTick > time.length ? (60 / tbpm[tbpm.length - 1]) : (findTick > 0 ? (time[intBeatCaculater(t)] - time[intBeatCaculater(t) - 1]) : (60 / Sbpm));
    let tick = findTick > 0 ? time[intBeatCaculater(t) - 1] : findTick * 60 / Sbpm ;
    let afterdot = fmol((t - tick) / intime , 1);
    return afterdot;
};

function renderballs() {
    const intBeat = Math.floor(beat);
    const beatFrac = beat - intBeat;
    const movingLen = movingball.length;
    
    let Mball = beat > 0 ? (beat > movingLen ? movingball[intBeat - 1] : movingball[intBeat]) : movingball[0];
    
    let CenX, CenY, lastangle = 180, angle, radius;
    
    // 简化条件，缓存 length
    const angLen = angledata.length;
    if (beat > 1) {
        const idx = intBeat - 1;
        const ang = angledata[idx];
        if (ang == 999) {
            const idx2 = idx - 1;
            lastangle = (idx2 >= 0 && angledata[idx2] == 999) ? find999s(idx) : angledata[idx2];
        } else {
            lastangle = ang + 180;
        }
        radius = trackrad[idx];
    } else {
        radius = trackrad[0];
        lastangle = 180 + intBeat * 180;
    }
    
    if (beat > movingLen) {
        CenX = ballpos[intBeat - 2][0];
        CenY = ballpos[intBeat - 2][1];
        angle = lastangle + beatFrac * -360 * rotatedir[rotatedir.length - 1];
    } else if (beat > 1) {
        CenX = ballpos[intBeat - 1][0];
        CenY = ballpos[intBeat - 1][1];
        angle = lastangle + beatFrac * -1 * rotatedir[intBeat] * anglelist[intBeat];
    } else {
        CenX = 0; CenY = 0;
        angle = lastangle + beatFrac * -180;
    }
    
    const rad = angle * (Math.PI / 180);
    const cosVal = Math.cos(rad), sinVal = Math.sin(rad);
    const BallX = CenX + radius * cosVal;
    const BallY = CenY + radius * sinVal;
    
    balls['ball' + (3 - Mball)].position.set(BallX, -BallY);
    balls['ball' + Mball].position.set(CenX, -CenY);
    
    // 尾迹记录用临时数组避免重复创建
    recballtile([CenX, CenY], [BallX, BallY], Mball, 0.01);
    drawballtile(Mball);
    drawballtile(3 - Mball);
};

function find999s(num) {
    let tick = num;
    let minus = 1;
    while (angledata[tick - minus - 1] == 999 && tick - minus - 1 >= 0) minus += 1;
    let lastloadangle = angledata[tick - minus - 1] + minus * 180;
    return lastloadangle;
};

let tileTime = [-10000] , ballTile = new Object;
ballTile['ball#1'] = [[0,0]];
ballTile['ball#2'] = [[0,0]];
function recballtile(P,BP,Mball,fineness) {
    if (gametime - tileTime[tileTime.length - 1] > fineness) {
        ballTile['ball#' + String(Mball)].push(BP);
        ballTile['ball#' + String(3 - Mball)].push(P);
        tileTime.push(gametime);
    };
    while (gametime - tileTime[0] >= 0.4) {
        ballTile['ball#1'].shift();
        ballTile['ball#2'].shift();
        tileTime.shift();
    };
};
// 预先定义
const ballTileKey1 = 'ball#1', ballTileKey2 = 'ball#2';
const balltileKey1 = 'balltile#1', balltileKey2 = 'balltile#2';

function drawballtile(Mball) {
    const tile =  Mball === 1 ? balltileKey1 : balltileKey2;
    balls[tile].clear();
    const points = ballTile[Mball === 1 ? ballTileKey1 : ballTileKey2];
    if (points.length < 2) return;
    const p = points[points.length - 1];
    balls[tile].moveTo(p[0] , -p[1]);
    for (let i = points.length - 2 ; i > 0 ; i--) {
        const p1 = points[i - 1];
        balls[tile].lineTo(p1[0] , -p1[1]);
        balls[tile].stroke({width: (i / points.length) * 12 , color : ballcolor[2 - Mball] , cap : 'round' , alpha : 0.3});
    };
};

function cameraMove() {
    let intbeat = Math.floor(beat);
    if (intbeat != cambeat) {
        let dura = new Number , a = new Number;
        dura = time[intbeat] - time[intbeat - 1];
        a = piecewiseMap(clamp(tbpm[intbeat] / 1000 , 0.1 , 10000)) / (tbpm[intbeat] / 1000);
        a.toFixed(4);
        dura = clamp(dura / a , 0.1, Infinity);
        const playerPos = beat > 0
            ? (beat > movingball.length - 1
            ? [ballpos[intbeat - 1][0] + relPlayer[0] , ballpos[intbeat - 1][1] + relPlayer[1]]
            : [ballpos[intbeat][0] + relPlayer[0] , ballpos[intbeat][1] + relPlayer[1]])
            : relPlayer;
        waitingCam.push([dura * 4 , 'OutSine' , [playerPos[0] - lastCamP[0], playerPos[1] - lastCamP[1]] , 0 , 0]);
        camDetail.push([gametime,[0,0],0,0,0,0]);
        lastCamP = playerPos.slice();
        cambeat = intbeat;
    };
};

function piecewiseMap(x, p = 1.6) {
    if (x < 0) return 0;
    if (x <= 1) return Math.pow(x, p);
    return Math.exp(p * (x - 1));
};

function clamp(a, b, c) {
    return Math.min(Math.max(a, b), c);
};

async function soundcaculate() {
    let timeline = time.slice();
    timeline.pop();
    timeline.shift();
    let hiturl = [];
    for (let i = 0; i < hitsoundlist.length ; i++) hiturl.push(hitsound[hitsoundlist[i]]);
    const nocdhitsound = await mixAudio(timeline , hiturl , 44100 , hitsoundvol);
    let hittime = [], countdown = [], volume = [];
    for (let i = 1; i <= countdownTicks; i++) {
        hittime.push(i * 60 / Sbpm);
        countdown.push(hitsound['Hat']);
        volume.push(setting["hitsoundVolume"]);
    };
    hittime.push(hittime[countdownTicks - 1]);
    volume.push(100);
    countdown.push(nocdhitsound);
    const Lhitsound = await mixAudio(hittime , countdown , 44100 , volume);
    if (sound.exists('hitsound')) sound.remove('hitsound');
    sound.add('hitsound' , Lhitsound);
};

let hitsound = new Object;
loadhitsound();
function loadhitsound() {
    hitsound['Chunk'] = 'audios/Chuck.wav';
    hitsound['ClapHit'] = 'audios/ClapHit.wav';
    hitsound['ClapHitEcho'] = 'audios/ClapHitEcho.wav';
    hitsound['FireTile'] = 'audios/FireTile.wav';
    hitsound['Hammer'] = 'audios/Hammer.wav';
    hitsound['Hat'] = 'audios/Hat.wav';
    hitsound['HatHouse'] = 'audios/HatHouse.wav';
    hitsound['IceTile'] = 'audios/IceTile.wav';
    hitsound['Kick'] = 'audios/Kick.wav';
    hitsound['KickChroma'] = 'audios/KickChroma.wav';
    hitsound['KickHouse'] = 'audios/KickHouse.wav';
    hitsound['KickRupture'] = 'audios/KickRupture.wav';
    hitsound['PowerDown'] = 'audios/PowerDown.wav';
    hitsound['PowerUp'] = 'audios/PowerUp.wav';
    hitsound['ReverbClack'] = 'audios/ReverbClack.wav';
    hitsound['ReverbClap'] = 'audios/ReverbClap.wav';
    hitsound['Shaker'] = 'audios/Shaker.wav';
    hitsound['ShakerLoud'] = 'audios/ShakerLoud.wav';
    hitsound['Sidestick'] = 'audios/Sidestick.wav';
    hitsound['Sizzle'] = 'audios/Sizzle.wav';
    hitsound['SnareAcoustic2'] = 'audios/SnareAcoustic2.wav';
    hitsound['SnareHouse'] = 'audios/SnareHouse.wav';
    hitsound['SnareVapor'] = 'audios/SnareVapor.wav';
    hitsound['Squareshot'] = 'audios/Squareshot.wav';
    hitsound['Stick'] = 'audios/Stick.wav';
    hitsound['VehicleNegative'] = 'audios/VehicleNegative.wav';
    hitsound['VehiclePositive'] = 'audios/VehiclePositive.wav';
};

function cameraEvent () {
    if (gametime > actMovTime[camord][0]) {
        waitingCam.push(cameraCaculate(actMovCam[actMovTime[camord][1]]));
        camDetail.push([gametime,[0,0],0,0,0,0]);
        camord++;
    };
};

function cameraAction() {
    let order = 0;
    for (let i = 0 ; i < waitingCam.length ; i++) {
        if (gametime >= camDetail[order][0] + waitingCam[order][0]) {
            const moveAdjust = [waitingCam[order][2][0] - camDetail[order][1][0] , waitingCam[order][2][1] - camDetail[order][1][1]]
            CamP[0] += moveAdjust[0];
            CamP[1] += moveAdjust[1];
            CamR += waitingCam[order][4] - camDetail[order][3];
            CamZ += waitingCam[order][3] - camDetail[order][2];
            camDetail.splice(order,1);
            waitingCam.splice(order,1);
        } else {
            CamTickRush(order);
            order += 1;
        };
    };
};

let lastRelP = [0,0];
function cameraCaculate(event) {
    let floor = event['floor'];
    let dur = event['duration'] * 60 / tbpm[floor];
    let ease = event['ease'];
    let R = 0, Z = 0;
    if ('rotation' in event) {
        R = -1 * event['rotation'] - lastCamR;
        lastCamR = -1 * event['rotation'];
    };
    if ('zoom' in event) {
        Z = event['zoom'] - lastCamZ;
        lastCamZ = event['zoom'];
    };

    let P = [0, 0];
    const hasRelativeTo = ('relativeTo' in event);
    let rel = hasRelativeTo ? event['relativeTo'] : CamRel;

    if (hasRelativeTo) {
        switch (rel) {
            case 'Tile':
                P = tilepos[floor].slice();
                break;
            case 'Player': {
                const offX = event['position']?.[0] != null ? event['position'][0] * trackrad[floor] : 0;
                const offY = event['position']?.[1] != null ? event['position'][1] * trackrad[floor] : 0;
                relPlayer = [offX, offY];
                const playerPos = beat > 1
                    ? (beat > movingball.length
                        ? ballpos[Math.floor(beat) - 2].slice()
                        : ballpos[Math.floor(beat) - 1].slice())
                    : [0, 0];
                P = [playerPos[0] + offX, playerPos[1] + offY];
                break;
            };
            case 'Global':
                P = [0, 0];
                break;
            case 'LastPositionNoRotation':
            case 'LastPosition':
                P = lastCamP.slice();
                break;
        };
        lastRelP = P;
        if (rel !== 'LastPositionNoRotation' && rel !== 'LastPosition') {
            lastCamRel = rel;
        } else rel = lastCamRel;
        CamRel = rel;
    } else if (CamRel == 'Player') {
        const intbeat = Math.floor(beat);
        P = lastCamP.slice();
    } else {
        P = lastRelP.slice();
    };

    if ('position' in event) {
        const posX = event['position'][0] != null ? event['position'][0] * trackrad[floor] : 0;
        const posY = event['position'][1] != null ? event['position'][1] * trackrad[floor] : 0;
        P[0] += posX;
        P[1] += posY;
    };

    const RP = [P[0] - lastCamP[0], P[1] - lastCamP[1]];

    lastCamP = P.slice();
    return [dur, ease, RP, Z, R];
};

const easeMap = new Map([
    ['Linear',        Ease.easeLinear],
    ['InSine',        Ease.easeSinIn],
    ['OutSine',       Ease.easeSinOut],
    ['InOutSine',     Ease.easeSinInOut],
    ['InQuad',        Ease.easeQuadIn],
    ['OutQuad',       Ease.easeQuadOut],
    ['InOutQuad',     Ease.easeQuadInOut],
    ['InCubic',       Ease.easeCubicIn],
    ['OutCubic',      Ease.easeCubicOut],
    ['InOutCubic',    Ease.easeCubicInOut],
    ['InQuart',       easeQuartIn],
    ['OutQuart',      easeQuartOut],
    ['InOutQuart',    easeQuartInOut],
    ['InExpo',        Ease.easeExpIn],
    ['OutExpo',       Ease.easeExpOut],
    ['InOutExpo',     Ease.easeExpInOut],
    ['InCirc',        Ease.easeCircleIn],
    ['OutCirc',       Ease.easeCircleOut],
    ['InOutCirc',     Ease.easeCircleInOut],
    ['InBack',        Ease.easeBackIn],
    ['OutBack',       Ease.easeBackOut],
    ['InOutBack',     Ease.easeBackInOut],
    ['InElastic',     Ease.easeElasticIn],
    ['OutElastic',    Ease.easeElasticOut],
    ['InOutElastic',  Ease.easeElasticInOut],
    ['InBounce',      Ease.easeBounceIn],
    ['OutBounce',     Ease.easeBounceOut],
    ['InOutBounce',   Ease.easeBounceInOut],
    ['Flash',         Ease.easeLinear],
    ['InFlash',       Ease.easeLinear],
    ['OutFlash',      Ease.easeLinear],
    ['InOutFlash',    Ease.easeLinear]
]);

function getEaseFunction(type) {
    return easeMap.get(type) || Ease.easeLinear; // 默认线性
};

function CamTickRush(i) {
    camDetail[i][4] = waitingCam[i][0] == 0 ? 1 : ((gametime - camDetail[i][0]) / waitingCam[i][0]);
    const realper = getEaseFunction(waitingCam[i][1])(camDetail[i][4]);
    const movper = realper - camDetail[i][5];
    camDetail[i][5] = realper;
    const movX = waitingCam[i][2][0] * movper;
    const movY = waitingCam[i][2][1] * movper;
    const movZ = waitingCam[i][3] * movper;
    const movR = waitingCam[i][4] * movper;
    camDetail[i][1][0] += movX;
    camDetail[i][1][1] += movY;
    camDetail[i][2] += movZ;
    camDetail[i][3] += movR;
    CamP[0] += movX;
    CamP[1] += movY; 
    CamR += movR;
    CamZ += movZ;
};