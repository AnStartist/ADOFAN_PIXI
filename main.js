import * as PIXI from 'pixi.js';
import { tileToGraphics , fmol , getTileTexture } from './load/tile_svg.js';
import { toLegalJson } from './load/json_convert.js';
import { loadlevel } from './load/level_load.js';
import { sound } from '@pixi/sound';
import { mixAudio } from './load/audio_mix.js';
import * as Ease from 'd3-ease';
import { ColorType , ShiftType } from './load/ColorType.js';
import { setRenderer } from './load/tile_svg.js';
import defaultLevel from './default_map/Rainbow_Chaser_Remake.adofai?raw';
import defaultLevelOgg from './default_map/Rainbow_Chaser.ogg?url';

const easeQuartIn = Ease.easePolyIn.exponent(4.0);
const easeQuartOut = Ease.easePolyOut.exponent(4.0);
const easeQuartInOut = Ease.easePolyInOut.exponent(4.0);
sound.disableAutoPause = true;
let music = undefined , hitsoundmusic = undefined;
let pitch = undefined;
let speed = 100;
const speedP = document.getElementById('speed');
speedP.innerHTML = speed.toString() + '%';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let adofaifile = new String;
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.style.display = 'none'; // 隐藏
fileInput.accept=".adofai, application/json, text/plain";
document.body.appendChild(fileInput);
let CX = window.innerWidth / 2, CY = window.innerHeight / 2;

const app = new PIXI.Application();
await app.init({ width: window.innerWidth,preference:'webgl' ,antialias: true , height: window.innerHeight, background: 0x000000 ,resolution: window.devicePixelRatio || 2, autoDensity: true});
document.body.appendChild(app.canvas);
setRenderer(app.renderer);
window.addEventListener('resize' , resizeStage);
function resizeStage() {
    app.canvas.style.width = window.innerWidth + 'px';
    app.canvas.style.height = window.innerHeight  + 'px';
    app.renderer.resize(window.innerWidth,window.innerHeight);
    CX = window.innerWidth / 2;
    CY = window.innerHeight / 2;
};

function importfile() {
    buttonSP.src = './images/Play.svg';
    buttonEscape.style.left = '-75px';
    if_play = false;
    beat = -114514;
    sound.stopAll();
    globalVideo.pause();
    videoSprite.visible = false;
    if_music = false;
    if_hitsound = false;
    if_video = false;
    fileInput.click();
};
window.importfile = importfile;
window.renderalltrack = await loadtrackclick;
window.playOnClick = await playOnClick;
window.escapeOnClick = await escapeOnclick;
window.speedUp = speedUp;
window.speedDown = speedDown;
const buttonEscape = document.getElementById('ButtonEscape');
const buttonSP = document.getElementById('ButtonSP');
let if_imported = false;
let isWaitingForAudio = false;
let if_pause = false , pauseTime = undefined , pauseTotal = 0;

async function loadtrackclick() {
    if (if_imported) {
        if_all = false;
        await delay(1);
        if_all = true;
        if_play = false;
        beat = -114514;
        sound.stopAll();
        globalVideo.pause();
        videoSprite.visible = false;
        if_music = false;
        if_hitsound = false;
        if_video = false;
        for (let i = 0 ; i < visibleTrack.length ; i++) {
            tracks[visibleTrack[i]].visible = false;
        };
        visibleTrack = [];
        for (let i = angledata.length - 1;i>= 0 ; i--) {
            let trackname = i;
            visibleTrack.push(trackname);
            tracks[trackname].visible = true;
        };
        Notice.innerHTML = '';
        renderalltrack();
        //partload(-100,10000);
    };
};

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    // 使用 FileReader 读取文件内容（以文本形式）
    if (!isWaitingForAudio) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            if_all = false;
            const content = e.target.result;
            if (sound.exists('bgm')) sound.remove('bgm');
            adofaifile = toLegalJson(content);
            await readadofai(adofaifile);
            isWaitingForAudio = true;
            fileInput.accept = 'audio/*';
            Notice.innerHTML = 'Please Click Import Again To Load Music File.'
            for (let i = 0 ; i < visibleTrack.length ; i++) {
                tracks[visibleTrack[i]].visible = false;
            };
            visibleTrack = [];
            for (let i = angledata.length - 1;i>= 0 ; i--) {
                let trackname = i;
                visibleTrack.push(trackname);
                tracks[trackname].visible = true;
            };
            if_all = true;
            renderalltrack();
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
                Notice.innerHTML = 'Successful loaded Music File!';
                if_all = false;
                await delay(1);
                if_all = true;
                renderalltrack();
            } catch (err) {
                URL.revokeObjectURL(url);
                Notice.innerHTML = 'Failed to load Music File!';
                return;
            };
        };
        isWaitingForAudio = false;
        fileInput.value = '';
        fileInput.accept = '.adofai, application/json, text/plain';
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
let CamP = [0,0],CamR = 0,CamZ = 100,CamRel = 'Player';
let tilesro = new Array;
let tilescale = new Array;
let ballpos = new Array;
let beat = new Number , findTick = new Number , startTime = new Number;
let offset = new Number , Sbpm = new Number , countdownTicks = new Number;
let trackrange = 200;
let Notice = document.getElementById("Notice");
let hitsoundlist = new Array, hitsoundvol = new Array;
let actMovCam = new Array, actMovTime = new Array;
let actMovTra = new Array, actTraTime = new Array;
let savingballpos = new Array;
let actTrackColorEvent = new Object , trackColorInfluencing = new Array;
let actRecolorTime = new Array , savingColorInfluencing = new Array;
let vidOffset = 0;
let startLoadTime = performance.now();
const loadTimeList = new Object;

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
    startLoadTime = performance.now();
    level.scanactions();
    recordLoadTime('step1');
    let twirl = level.loadtwirl();
    movingball = twirl['movingball'];
    rotatedir = twirl['rotatedir'];
    recordLoadTime('step2');
    anglelist = level.loadangle();
    tbpm = level.loadspeed();
    recordLoadTime('step3');
    trackrad = level.loadradius();
    level.loadtilepos();
    recordLoadTime('step4');
    level.loadpause();
    time = level.loadtime();
    recordLoadTime('step5');
    level.loadpositiontrack();
    recordLoadTime('step6');
    level.loadhitsound();
    recordLoadTime('step7');
    level.loadcamera();
    recordLoadTime('step8');
    level.loadmovetrack();
    recordLoadTime('step9');
    level.loadtilecolor();
    recordLoadTime('step10');
    tilepos = level.g_tpos;
    tilesro = level.g_tsro;
    tilescale = level.g_tsca;
    ballpos = level.g_bpos;
    trackrad = level.g_trad;
    hitsoundlist = level.g_harr;
    hitsoundvol = level.g_hvol;
    actMovCam = level.g_movcam;
    actMovTime = level.g_camord;
    actMovTra = level.g_movtra;
    actTraTime = level.g_traord;
    actTrackColorEvent = level.g_tracol;
    trackColorInfluencing = level.g_tracolInfluence;
    savingColorInfluencing = trackColorInfluencing.slice();
    actRecolorTime = level.g_record;
    savingballpos = ballpos.map(p => p.slice());
    CamP = setting['position'].slice();
    CamR = -1 * setting['rotation'];
    CamZ = setting['zoom'];
    CamRel = setting['relativeTo'];
    pitch = setting['pitch'];
    vidOffset = setting['vidOffset'];
    recordLoadTime('step11');
    await loadalltrack();
    await loadball();
    recordLoadTime('step12');
    offset = setting['offset'];
    Sbpm = setting['bpm'];
    countdownTicks = setting['countdownTicks']? setting['countdownTicks'] : 4;
    Notice.innerHTML = 'Loading Hitsound!';
    await soundcaculate();
    recordLoadTime('step13');
    Notice.innerHTML = 'Successful Loaded Level!';
    //console.log(loadTimeList);
    if_imported = true;
};

function recordLoadTime(action) {
    loadTimeList[action] = performance.now() - startLoadTime;
    startLoadTime = performance.now();
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
            if (if_imported) {
                if_all = false;
                await delay(1);
                if_all = true;
                if_play = false;
                beat = -114514;
                sound.stopAll();
                globalVideo.pause();
                videoSprite.visible = false;
                if_music = false;
                if_hitsound = false;
                if_video = false;
                for (let i = 0 ; i < visibleTrack.length ; i++) {
                    tracks[visibleTrack[i]].visible = false;
                };
                visibleTrack = [];
                for (let i = angledata.length - 1;i>= 0 ; i--) {
                    let trackname = i;
                    visibleTrack.push(trackname);
                    tracks[trackname].visible = true;
                };
                Notice.innerHTML = '';
                renderalltrack();
                //partload(-100,10000);
            };
            break;
        case ' ':
            if (if_imported) {
                buttonSP.src = './images/Pause.svg';
                buttonEscape.style.left = '75px';
                if_play = false;
                await delay(1);
                PlayInitialize();
                GameLoop();
            };
            break;
        case 'Escape':
            if_play = false;
            buttonSP.src = './images/Play.svg';
            buttonEscape.style.left = '-75px';
            beat = -114514;
            sound.stopAll();
            CamR = 0;
            globalVideo.pause();
            videoSprite.visible = false;
            if_music = false;
            if_hitsound = false;
            if_video = false;
            await delay(1);
            for (let i = 0 ; i < visibleTrack.length ; i++) {
                tracks[visibleTrack[i]].visible = false;
            };
            visibleTrack = [];
            for (let i = angledata.length - 1;i>= 0 ; i--) {
                const trackname = i;
                const sro = tilesro[i] , scale = tilescale[i] , posi = tilepos[i];
                tracks[trackname].position.set(posi[0] , -posi[1]);
                tracks[trackname].rotation = - sro[1] * Math.PI / 180;
                tracks[trackname].alpha = sro[2] / 100;
                tracks[trackname].scale.set(sro[0] * scale[0] / 10000 , sro[0] * scale[1] / 10000 );
                trackColor.push([undefined,undefined,true]);
                tracks[trackname].visible = true;
                visibleTrack.push(trackname);
            };
            updateSelectionColor(visibleTrack , ['debb7b','a58750','Standard']);
            if_all = true;
            beat = -114514;  
            balls[1].visible = false;
            balls[10].visible = false;
            balls[2].visible = false;
            balls[20].visible = false;          
            renderalltrack();
            break;
        case 'ArrowLeft':
            updateSelectionColor(selectRegion , ['debb7b','a58750','Standard']);
            if (selectTrack != undefined && selectTrack > 0) {
                selectRegion = [selectTrack - 1];
                selectTrack--;
            };
            break;
        case 'ArrowRight':
            updateSelectionColor(selectRegion , ['debb7b','a58750','Standard']);
            if (selectTrack != undefined && selectTrack < tilepos.length - 2) {
                selectRegion = [selectTrack + 1];
                selectTrack++;
            };
            break;
        case '1':
            console.log("DeBug Mode.");
    };
});

let lastCamP, lastCamZ , lastCamR , lastCamRel , waitingCam  = [], camDetail  = [], camord = 0 , relPlayer = [0,0];
let traord = 0 , waitingTra = [] , traDetail = [];
let record = 0;
let trackColor = new Array ;
let tracklen = angledata.length;
let selectOffset = 0;

function PlayInitialize() {
    sound.stopAll();
    globalVideo.pause();
    videoSprite.visible = false;
    if_pause = false;
    pauseTotal = 0;
    pauseTime = undefined;
    selectOffset = selectRegion.length == 1 ? time[selectRegion[0]] : 0;

    if_all = false;
    if_music = false;
    if_hitsound = false;
    if_video = false;
    tracklen = angledata.length
    visibleTrack = new Array;
    tileTime = [-10000] , ballTile = new Object;
    ballTile[1] = [[0,0]];
    ballTile[2] = [[0,0]];
    beat = -1 * countdownTicks;
    startTime = selectOffset == 0 ? (performance.now() / 1000 + countdownTicks * 60 / Sbpm) : (performance.now() / 1000 - (selectOffset + offset / 1000)/(pitch*speed/10000));
    findTick = -1 * countdownTicks;

    rectime = performance.now();
    balls[1].visible = true;
    balls[2].visible = true;
    balls[10].visible = true;
    balls[20].visible = true;
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

    //Track Initialize.
    traord = 0;
    record = 0;
    waitingTra = [];
    traDetail = [];
    trackColor = [];
    ballpos = savingballpos.map(p => p.slice());
    for (let i = angledata.length - 1;i >= 0; i--) {
        const trackname = i;
        const sro = tilesro[i] , scale = tilescale[i] , posi = tilepos[i];
        tracks[trackname].position.set(posi[0] , -posi[1]);
        tracks[trackname].rotation = - sro[1] * Math.PI / 180;
        tracks[trackname].alpha = sro[2] / 100;
        tracks[trackname].scale.set(sro[0] * scale[0] / 10000 , sro[0] * scale[1] / 10000 );
        trackColor.push([undefined,undefined,true]);
        tracks[trackname].visible = false;
    };
    trackColorInfluencing = savingColorInfluencing.slice();
    if(selectOffset != 0) {
        let i = 0;
        if (actMovTime.length > 0) while (selectOffset > actMovTime[i][0]) i++;
        camord = i;
        CamP = ballpos[selectRegion[0]].slice();
        CamR = 0;
        CamRel = 'Player';
        i = 0;
        if (actTraTime.length > 0) while (selectOffset > actTraTime[i][1]) i++;
        traord = i;
        i = 0; 
        if (actRecolorTime.length > 0) while (selectOffset > actRecolorTime[i][1]) i++;
        record = i;
    };
    
    selectRegion = [];

    if_play = true;
};

function pointer(x,y) {
    const myGraphic = new PIXI.Graphics().svg(`<svg xmlns="https://www.o3.org/2000/svg"><polygon points="0,0 10,0 0,10" fill="#a1d5f0"></svg>`);
    app.stage.addChild(myGraphic);
    myGraphic.position.set(x,y);
};
//pointer(CX,CY);
let clickTile = false , clickOnTile = false;
let selectRegion = [];
const selectColor = new ShiftType('Glow','8FBF60','ffffff','None',0,0,0,2,'Standard');
let lastSelectTrack = undefined , selectTrack = undefined;
let Container = {};
let tracks = new Object , balls = new Object , trackGraphics = new Object;
async function loadalltrack() {
    clearalltracks();
    Container = {};
    await loadeventtextures();
    for (let i = angledata.length - 1;i >= 0; i--) {
        const lastangle = i == 0 ? 180 : angledata[i - 1] + 180;
        const trackgra = singleTrack(i , lastangle);
        const trackname = i;
        tracks[trackname] = new PIXI.Container();
        trackGraphics[trackname] = trackgra;
        tracks[trackname].addChild(trackgra);
        let sro = tilesro[i] , scale = tilescale[i] , posi = tilepos[i];
        tracks[trackname].position.set(posi[0] , -posi[1]);
        tracks[trackname].rotation = - sro[1] * Math.PI / 180;
        tracks[trackname].alpha = sro[2] / 100;
        tracks[trackname].scale.set(sro[0] * scale[0] / 10000 , sro[0] * scale[1] / 10000 );
        const eventspr = singleEvent(i);
        if (eventspr != null) {tracks[trackname].addChild(eventspr);};
        const InContainerNum = Math.floor(i/200);
        if (!Container || !Container[InContainerNum]) {
            Container[InContainerNum] = new PIXI.Container;
            app.stage.addChild(Container[InContainerNum]);
            Container[InContainerNum].position.set(CX,CY);
        };
        Container[InContainerNum].addChild(tracks[trackname]);
        tracks[trackname].visible = false;
        tracks[trackname].interactive = true;
        tracks[trackname].number = trackname;
        trackGraphics[trackname].updateColors('debb7b','a58750',true);
        tracks[trackname].on('pointerup', async (event) => {
            selectTrack = event.currentTarget.number;
            await delay(1);
            if (!clickTile) return;
            clickOnTile = true;
            updateSelectionColor(selectRegion , ['debb7b','a58750','Standard']);
            selectRegion = [];
            if (event.shiftKey && lastSelectTrack != undefined && selectTrack != lastSelectTrack) {
                if (selectTrack > lastSelectTrack) {
                    for (let i = lastSelectTrack; i <= selectTrack; i++) selectRegion.push(i);
                } else {
                    for (let i = selectTrack; i <= lastSelectTrack; i++) selectRegion.push(i);
                };
            } else {
                selectRegion = [selectTrack];
                lastSelectTrack = selectTrack;
            };
        });
    };
};

let balltxt , ballcolor = [0xff0000 , 0x0000ff];
async function loadball() {
    clearallballs();
    balltxt = await PIXI.Assets.load('images/ball3.png');
    balls[10] = new PIXI.Graphics();
    balls[20] = new PIXI.Graphics();
    Container.balls = new PIXI.Container;
    app.stage.addChild(Container.balls);
    Container.balls.position.set(CX,CY);
    Container.balls.addChild(balls[10]);
    Container.balls.addChild(balls[20]);
    balltxt.source.scaleMode = 'linear';
    ballInitaize(1 , ballcolor[0]);
    ballInitaize(2 , ballcolor[1]);
    balls[1].position.set(CX,CY);
    balls[2].position.set(CX+ 200,CY - 100);
    balls[1].visible = false;
    balls[2].visible = false;
};

function ballInitaize(name , color) {
    balls[name] = PIXI.Sprite.from(balltxt);
    balls[name].anchor.set(0.5,0.5);
    balls[name].scale = 0.03;
    balls[name].tint = color;
    Container.balls.addChild(balls[name]);
};

function clearalltracks() {
    for (let key in tracks) {
    if (key in tracks) {
            const sprite = tracks[key];
            if (sprite && sprite.destroy) {app.stage.removeChild(sprite);sprite.destroy();};
        };
    };
    tracks = {};
    trackGraphics = {};
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
                if (lastloadangle == angledata[tick]) {trackgra = tileToGraphics(lastloadangle , angledata[tick] , 8.25 , 8.25 , '#debb7b' , '#a58750' , 0);} 
                else {trackgra = tileToGraphics(lastloadangle , angledata[tick] , 8.25 , 15 , '#debb7b' , '#a58750' , 0);};
            } else {
                trackgra = tileToGraphics(lastangle , angledata[tick] , 8.25 , 15 , '#debb7b' , '#a58750' , 0);
            };
        } else {
            trackgra = tileToGraphics(angledata[tick] , angledata[tick] , 8.25 , 8.25 , '#debb7b' , '#a58750' , 0);
        };
    } else {
        if (lastangle == 1179) {
            trackgra = tileToGraphics(lastloadangle , lastloadangle , 8.25, 8.25, '#debb7b' , '#a58750' , 1);
        } else {
            trackgra = tileToGraphics(lastangle , lastangle , 8.25, 8.25,'#debb7b' , '#a58750' , 1);
        };
    };
    return trackgra;
};

let if_all = false , if_play = false;
let animationId = null;
function renderalltrack() {
    if (!if_all) return;
    fpstime = performance.now();
    if (fpstime - fpscaltime > 1000) {
        fpscaltime = performance.now();
        TFPS.innerHTML = String(truefps) + ' | TFPS';
        truefps = 0;
    } else truefps++;
    refreshState([0,visibleTrack.length - 1]);
    const SelCol = selectColor.doCalculateColor(performance.now() / 1000 , 0);
    updateSelectionColor(selectRegion , SelCol);
    animationId = requestAnimationFrame(renderalltrack); 
};

function updateSelectionColor(region,color) {
    if (region.length <= 0) return;
    for(let i = 0 ; i < region.length ; i++) {
        trackGraphics[region[i]].updateColors(...color);
    };
};

let visibleTrack = [];
function partload(s, e) {
    const start = Math.max(s, 0);
    const end = Math.min(e, angledata.length - 1);
    // 移除不再显示的轨道
    for (let i = visibleTrack.length - 1; i >= 0; i--) {
        const tileIndex = visibleTrack[i];
        if (tileIndex < start || tileIndex > end) {
            tracks[tileIndex].visible = false;
            visibleTrack.splice(i, 1);
        }
    }
    // 添加新显示的轨道
    for (let i = start; i <= end; i++) {
        if (!visibleTrack.includes(i)) {
            visibleTrack.push(i);
            tracks[i].visible = true;
        }
    }
}

const eventico = new Object;
async function loadeventtextures() {
    eventico['End'] = await PIXI.Assets.load('images/events-new/End.png');
    eventico['Speed-'] = await PIXI.Assets.load('images/events-new/Speed-.png');
    eventico['Speed+'] = await PIXI.Assets.load('images/events-new/Speed+.png');
    eventico['TwirlB-1'] = await PIXI.Assets.load('images/events-new/TwirlB-1.png');
    eventico['TwirlB1'] = await PIXI.Assets.load('images/events-new/TwirlB1.png');
    eventico['TwirlR-1'] = await PIXI.Assets.load('images/events-new/TwirlR-1.png');
    eventico['TwirlR1'] = await PIXI.Assets.load('images/events-new/TwirlR1.png');
    const tiletexture = await PIXI.Assets.load('images/texture_compressed.png');
    getTileTexture(tiletexture);
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

function refreshState(renderRange) {
    const aspox =  - CamP[0] , aspoy =  - CamP[1];
    const rad = Math.sqrt(aspox * aspox + aspoy * aspoy);
    const facing = rad == 0 ? 0 : aspox > 0 ? Math.asin(aspoy / rad) + CamR / 180 * Math.PI : Math.PI - Math.asin(aspoy / rad) + CamR / 180 * Math.PI ;
    const realPosition = [CX + 200 / CamZ * rad * Math.cos(facing) , CY - 200 / CamZ * rad * Math.sin(facing)];
    const realRotation = CamZ > 0 ? ( - CamR ) / 180 * Math.PI : (180 - CamR ) / 180 * Math.PI;
    const realScale = 200 / Math.abs(CamZ);
    const startContainer = Math.floor(renderRange[0] / 200);
    const endContainer = Math.floor(renderRange[1] / 200);
    for (let i = startContainer; i<= endContainer; i++) {
        if (Container[i]) {
            const MoveContainer = Container[i];
            MoveContainer.position.set(...realPosition);
            MoveContainer.rotation = realRotation;
            MoveContainer.scale = realScale;
        };
    };
    Container.balls.position.set(...realPosition);
    Container.balls.rotation = realRotation;
    Container.balls.scale = realScale;
};

let if_music = false , if_hitsound = false , if_video = false;
let fpstime = performance.now();
const BEAT = document.getElementById('Beat');
const TFPS = document.getElementById('TFPS');
let fpscaltime = performance.now() , truefps;
let gametime = new Number;
let cambeat = new Number;
let ibeat;
function GameLoop() {
    fpstime = performance.now();
    if (!if_play) return;
    if (fpstime - fpscaltime > 1000) {
        fpscaltime = performance.now();
        TFPS.innerHTML = String(truefps) + ' | TFPS';
        truefps = 0;
    } else truefps++;
    BEAT.innerHTML = String(beat.toFixed(3)) + ' | Beat';
    gametime = timeCaculate();
    if (!if_music && gametime > -1 * offset / 1000 + (60 / Sbpm) * pitch * speed / 10000) {
        if (sound.exists('bgm')) {
            music = sound.play('bgm' , {start: selectOffset == 0? 0 : selectOffset + offset / 1000 - (60 / Sbpm)});
            music.volume = setting['volume'] / 100;
            music.speed = pitch * speed / 10000;
        };
        if_music = true;
    };
    if (!if_video && gametime > - vidOffset / 1000) {
        if (videoSprite && globalVideo.currentTime) {
            globalVideo.playbackRate = pitch * speed / 10000;
            globalVideo.currentTime = selectOffset == 0?0 : selectOffset + vidOffset / 1000;
            globalVideo.play();
            videoSprite.visible = true;
        };
        if_video = true;
    };
    if (!if_hitsound && gametime > -1 * countdownTicks * 60 / Sbpm) {
            if (sound.exists('hitsound')) {
                hitsoundmusic = sound.play('hitsound' ,{start: selectOffset == 0?0 : selectOffset + countdownTicks * 60 / Sbpm});
                hitsoundmusic.speed = pitch * speed / 10000;
            };
            if_hitsound = true;
    };

    if (gametime > -1 * countdownTicks * 60 / Sbpm) {beatCaculate()};
    let renderRange = [ibeat - trackrange / 4 , ibeat + trackrange / 4 * 3];
    refreshState(renderRange);
    partload(...renderRange);
    UpdateRenderTrackColor(...renderRange);
    renderballs();
    if (CamRel == 'Player') cameraMove();
    if (beat >= 0 && camord < actMovTime.length) cameraEvent();
    cameraAction();
    if (beat >= 0 && traord < actTraTime.length && actTraTime.length > 0) trackEvent();
    trackAction();
    if (beat >= 0 && record < actRecolorTime.length && actRecolorTime.length > 0) colorEvent();
    animationId = requestAnimationFrame(GameLoop);
};

function timeCaculate() {
    if (if_pause) {return pauseTime} else {
    return (performance.now() / 1000 - startTime) * pitch * speed / 10000 - offset / 1000 - pauseTotal};
};

function beatCaculate() {
    beat = intBeatCaculater(gametime) - 1 + floatBeatCaculater(gametime);
};

function intBeatCaculater(t) {
    if (findTick > 0) {
        while (findTick <= time.length && time[findTick - 1] < t) {findTick += 1;};
        ibeat = findTick - 2;
        return findTick - 1;
    } else {
        while (findTick * 60 / Sbpm <= t) {findTick += 1;};
        ibeat = findTick - 1;
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
    let Mball = beat > 0 ? (beat > movingball.length ? movingball[ibeat - 1] : movingball[ibeat] ) : movingball[0];
    let CenX , CenY , lastangle = 180 , angle , radius;
    lastangle = beat > 1 ? (angledata[ibeat - 1] == 999 ? (angledata[ibeat - 2] == 999 ? find999s(ibeat - 1) : angledata[ibeat - 2] ) : (angledata[ibeat - 1] + 180) ) : (180 + ibeat * 180) ;
    radius = beat > 1 ? trackrad[ibeat - 1] : trackrad[0];
    if (beat > movingball.length) {
        CenX = ballpos[ibeat - 2][0];
        CenY = ballpos[ibeat - 2][1]; 
        angle = lastangle + fmol(beat , 1) * -360 * rotatedir[rotatedir.length - 1] + 180;
    } else if (beat > 1) {
        CenX = ballpos[ibeat - 1][0];
        CenY = ballpos[ibeat - 1][1];
        angle = lastangle + fmol(beat , 1) * -1 * rotatedir[ibeat] * anglelist[ibeat];
    } else {
        CenX = 0;
        CenY = 0;
        angle = lastangle + fmol(beat , 1) * -180 + angledata[0];
    };
    angle -= beat > 0 && beat < tracklen ? tracks[ibeat].rotation / Math.PI * 180 : 0;
    let BallX = CenX + radius * Math.cos(angle / 180 * Math.PI);
    let BallY = CenY + radius * Math.sin(angle / 180 * Math.PI);
    balls[3 - Mball].position.set(BallX , -BallY );
    balls[Mball].position.set(CenX , -CenY );
    recballtile([CenX , CenY] , [BallX , BallY] , Mball , 0.01);
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
ballTile[1] = [[0,0]];
ballTile[2] = [[0,0]];
function recballtile(P,BP,Mball,fineness) {
    if (gametime - tileTime[tileTime.length - 1] > fineness) {
        ballTile[Mball].push(BP);
        ballTile[3 - Mball].push(P);
        tileTime.push(gametime);
    };
    while (gametime - tileTime[0] >= 0.4) {
        ballTile[1].shift();
        ballTile[2].shift();
        tileTime.shift();
    };
};

function drawballtile(Mball) {
    const tile = Mball * 10;
    balls[tile].clear();
    const points = ballTile[Mball];
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
    const target = beat > 1 ? (beat > movingball.length ? [ballpos[ibeat - 2][0] + relPlayer[0] , ballpos[ibeat - 2][1] + relPlayer[1] ] : [ballpos[ibeat - 1][0] + relPlayer[0] , ballpos[ibeat - 1][1] + relPlayer[1]]) : relPlayer;
    const Mbpm = beat > 1 ? (beat > movingball.length ? tbpm[tbpm.length - 1] : tbpm[ibeat - 1]) : Sbpm;
    const speed = clamp(3000 / Mbpm , 1 , Infinity);
    CamP[0] += (target[0] - CamP[0]) / speed * 0.25;
    CamP[1] += (target[1] - CamP[1]) / speed * 0.25;
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
    let nocdhitsound;
    try {
        nocdhitsound = await mixAudio(timeline , hiturl , 44100 , hitsoundvol);
    } catch (error) {Notice.innerHTML = error};
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
    if (camord < actMovTime.length) {
        while (gametime > actMovTime[camord][0]) {
            waitingCam.push(cameraCaculate(actMovCam[actMovTime[camord][1]]));
            camDetail.push([gametime,[0,0],0,0,0,0]);
            camord++;
            if (camord >= actMovTime.length) break;
        };
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
function cameraCaculate (event) {
    let floor = event['floor'] 
    let dur = event['duration'] * 60 / tbpm[floor] , ease = event['ease'];
    let R = 0 , Z = 0 , P = [0,0] , rel = '';
    if (CamRel == 'Player') {
        lastCamP = CamP.slice();
        lastRelP = CamP.slice();
    };
    if ('rotation' in event) {
        R = -1 * event['rotation'] - lastCamR;
        lastCamR = -1 * event['rotation'];
    };
    if ('zoom' in event) {
        Z = event['zoom'] - lastCamZ;
        lastCamZ = event['zoom'];
    };

    if ('relativeTo' in event) {
        rel = event['relativeTo']
        switch (rel) {
            case 'Tile':
                P = tilepos[floor].slice();
                break;
            case 'Player':
                if ('position' in event) {
                    relPlayer[0] = event['position'][0] != null ? event['position'][0] * trackrad[floor] : 0;
                    relPlayer[1] = event['position'][1] != null ? event['position'][1] * trackrad[floor] : 0;
                } else relPlayer = [0,0];
                P = beat > 1 ? (beat > movingball.length ? [ballpos[ibeat - 2][0] + relPlayer[0] , ballpos[ibeat - 2][1] + relPlayer[1] ] : [ballpos[ibeat - 1][0] + relPlayer[0] , ballpos[ibeat - 1][1] + relPlayer[1]]) : relPlayer;
                break;
            case 'Global':
                P = [0,0];
                break;
            case 'LastPositionNoRotation':
            case 'LastPosition':
                P = lastCamP.slice();
                break;                    
        };
        if (rel != 'LastPositionNoRotation' && rel != 'LastPosition') {lastCamRel = rel;}
        else {rel = lastCamRel};
        CamRel = rel;
        lastRelP = P.slice();
    } else {
        if (CamRel == "Player") {
            P = lastCamP.slice(); 
            lastRelP = P.slice();
            if ('position' in event) {
                relPlayer[0] = event['position'][0] != null ? event['position'][0] * trackrad[floor] : 0;
                relPlayer[1] = event['position'][1] != null ? event['position'][1] * trackrad[floor] : 0;
            };
        } else P = lastCamP.slice();
    };
    if ('position' in event) {
        P[0] += event['position'][0] != null ? event['position'][0] * trackrad[floor] : 0;
        P[1] += event['position'][1] != null ? event['position'][1] * trackrad[floor] : 0;
    };
    const RP = [P[0] - lastCamP[0] , P[1] - lastCamP[1]];
    lastCamP = P.slice();
    return [dur , ease , RP , Z , R];
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

function TrackTickRush (a) {
    const w = waitingTra[a];
    const ease = w[3];
    let realper = w[2] == 0 ? 1 : getEaseFunction(ease)((gametime - w[4]) / w[2]);
    const movper = realper - w[5];
    waitingTra[a][5] = realper;
    const len = w[1].length;
    const change = w[0];
    for (let i = 0 ; i < len ; i++) {
        const F = w[1][i];
        const trackname = F;
        const nowchange = change[i];
        if (trackname in tracks) {
            tracks[trackname].position.x += movper * nowchange[0];
            if (F > 0) ballpos[F - 1][0] += movper * nowchange[0];
            tracks[trackname].position.y -= movper * nowchange[1];
            if (F > 0) ballpos[F - 1][1] += movper * nowchange[1];
            traDetail[a][i][0] += movper * nowchange[0];
            traDetail[a][i][1] += movper * nowchange[1];
            tracks[trackname].rotation -= movper * nowchange[2] * Math.PI / 180;
            traDetail[a][i][2] += movper * nowchange[2];
            tracks[trackname].scale.x += movper * nowchange[3] * tilesro[F][0] / 10000;
            tracks[trackname].scale.y += movper * nowchange[4] * tilesro[F][0] / 10000;
            traDetail[a][i][3] += movper * nowchange[3];
            traDetail[a][i][4] += movper * nowchange[4];
            tracks[trackname].alpha += movper * nowchange[5] / 100;
            traDetail[a][i][5] += movper * nowchange[5];
        };
    };
};

function trackEvent() {
    while (gametime > actTraTime[traord][1]) {
        waitingTra.push(structuredClone(actTraTime[traord][0][0]));
        traDetail.push(structuredClone(actTraTime[traord][0][1]));
        traord++;
        if (traord >= actTraTime.length) break;
    };
};

function trackAction() {
    let order = 0;
    for (let i = 0 ; i < waitingTra.length ; i++) {
        if (gametime - waitingTra[order][4] > waitingTra[order][2]) {
            for (let j = 0 ; j < waitingTra[order][1].length ; j++) {
                const F = waitingTra[order][1][j];
                const moved = traDetail[order][j];
                const trackname = F;
                const lasting = waitingTra[order][0][j];
                if (trackname in tracks) {
                    tracks[trackname].position.x += lasting[0] - moved[0];
                    tracks[trackname].position.y -= lasting[1] - moved[1];
                    if (F > 0) ballpos[F - 1][0] += lasting[0] - moved[0];
                    if (F > 0) ballpos[F - 1][1] += lasting[1] - moved[1];
                    tracks[trackname].rotation -= (lasting[2] - moved[2]) * Math.PI / 180;
                    tracks[trackname].scale.x += (lasting[3] - moved[3]) * tilesro[F][0] / 10000;
                    tracks[trackname].scale.y += (lasting[4] - moved[4]) * tilesro[F][0] / 10000;
                    tracks[trackname].alpha += (lasting[5] - moved[5]) / 100;
                };
            };
            traDetail.splice(order , 1);
            waitingTra.splice(order , 1);
        } else {
            TrackTickRush(order);
            order++;
        };
    };
};

let dragging = false;
let startPos = { x: 0, y: 0 };
let currentPos = { x: 0, y: 0 };
let startCam, pointerDownTime = 0;
let deltaX,deltaY;

function onPointerDown(event) {
    pointerDownTime = performance.now();
    dragging = true;
    startPos = { x: event.clientX, y: event.clientY };
    currentPos = { ...startPos };
    startCam = CamP.slice();
    deltaX = 0;
    deltaY = 0;
};
function onPointerMove(event) {
    if (!dragging || !if_all) return;
    currentPos = { x: event.clientX, y: event.clientY };
    
    deltaX = currentPos.x - startPos.x;
    deltaY = currentPos.y - startPos.y;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    
    CamP[0] = startCam[0] - deltaX / 200 * CamZ;
    CamP[1] = startCam[1] + deltaY / 200 * CamZ;
};
async function onPointerUp() {
    if (performance.now() - pointerDownTime < 150 && Math.sqrt(deltaX*deltaX + deltaY*deltaY) < 20) {
        clickOnTile = false;
        clickTile = true;
        await delay(2);
        if (!clickOnTile) {
            updateSelectionColor(selectRegion , ['debb7b','a58750','Standard']);
            selectRegion = [];
            lastSelectTrack = undefined;
            selectTrack = undefined;
        };
    } else clickTile = false;
    dragging = false;
};
document.addEventListener('mousedown', onPointerDown);
document.addEventListener('mousemove', onPointerMove);
document.addEventListener('mouseup', await onPointerUp);
document.addEventListener('wheel', (event) => {
    if (!if_all) return;
    const deltaY = event.deltaY;
    if (CamZ > 10 && CamZ < 10000) CamZ += deltaY / 10;
});

function UpdateRenderTrackColor(s,e) {
    for (let i = s; i <= e; i++){
        if (i >= 0 && i < tracklen) {
            const trackStyle = actTrackColorEvent[trackColorInfluencing[i]].doCalculateColor(gametime,i);
            trackGraphics[i].updateColors(trackStyle[0] == trackColor[i][0] ? undefined : trackStyle[0] , trackStyle[1] == trackColor[i][1] ? undefined : trackStyle[1] , trackStyle[2]);
            trackColor[i] = trackStyle;
        };
    };
};

function colorEvent() {
    while (gametime > actRecolorTime[record][1]) {
        if (actRecolorTime[record][0] in actTrackColorEvent) {
            recolorCaculate(actRecolorTime[record][0]);            
        };
        record++;
        if (record >= actRecolorTime.length) break;
    };
};

function recolorCaculate(ord) {
    let changeStart,changeEnd,changeList;
    const event = actTrackColorEvent[ord];
    if (event.gapLength == 0) {
        changeStart = event.changeFloors[0];
        changeEnd = event.changeFloors[event.changeFloors.length - 1] + 1;
        trackColorInfluencing.fill(ord, changeStart, changeEnd);
    } else {
        changeList = event.changeFloors;
        for (let i = 0; i < changeList.length ; i++) {
            trackColorInfluencing[changeList[i]] = ord;
        };
    };
};

async function playOnClick() {
    if (if_imported && buttonSP.src.includes('Play.svg')) {
        if (if_play) {
            buttonSP.src = './images/Pause.svg';
            pauseTotal += (performance.now() / 1000 - startTime) * pitch * speed / 10000 - offset / 1000 - pauseTotal - pauseTime;
            pauseTime = undefined;
            if_pause = false;
            if (hitsoundmusic) hitsoundmusic.paused = false;
            if (music) music.paused = false;
            globalVideo.play();
        } else {
            buttonSP.src = './images/Pause.svg';
            buttonEscape.style.left = '75px';
            if_play = false;
            await delay(1);
            PlayInitialize();
            GameLoop();
        };
    } else {
        buttonSP.src = './images/Play.svg';
        pauseTime = gametime;
        if_pause = true;
        if (hitsoundmusic) hitsoundmusic.paused = true;
        if (music) music.paused = true;
        globalVideo.pause();
    };  
};

async function escapeOnclick() {
    buttonEscape.style.left = '-75px';
    buttonSP.src = './images/Play.svg';
    if_play = false;
    if_all = false;
    beat = -114514;
    sound.stopAll();
    globalVideo.pause();
    videoSprite.visible = false;
    if_music = false;
    if_hitsound = false;
    if_video = false;
    CamR = 0;
    await delay(1);
    trackColorInfluencing = savingColorInfluencing.slice();
    UpdateRenderTrackColor(0 , tilepos.length - 1);
    for (let i = 0 ; i < visibleTrack.length ; i++) {
        tracks[visibleTrack[i]].visible = false;
    };
    visibleTrack = [];
    for (let i = angledata.length - 1;i>= 0 ; i--) {
        const trackname = i;
        const sro = tilesro[i] , scale = tilescale[i] , posi = tilepos[i];
        tracks[trackname].position.set(posi[0] , -posi[1]);
        tracks[trackname].rotation = - sro[1] * Math.PI / 180;
        tracks[trackname].alpha = sro[2] / 100;
        tracks[trackname].scale.set(sro[0] * scale[0] / 10000 , sro[0] * scale[1] / 10000 );
        trackColor.push([undefined,undefined,true]);
        tracks[trackname].visible = true;
        visibleTrack.push(trackname);
    };
    updateSelectionColor(visibleTrack , ['debb7b','a58750','Standard']);
    if_all = true;
    beat = -114514;  
    balls[1].visible = false;
    balls[10].visible = false;
    balls[2].visible = false;
    balls[20].visible = false;          
    renderalltrack();
};

function speedUp () {
    if (!if_play) speed++;
    speedP.innerHTML = speed.toString() + '%';
};

function speedDown () {
    if (!if_play) speed--;
    speedP.innerHTML = speed.toString() + '%';
};

const videoInput = document.createElement('input');
videoInput.type = 'file';
videoInput.style.display = 'none'; // 隐藏
videoInput.accept="video/*";
document.body.appendChild(videoInput);
window.videoImport = videoImport;
function videoImport() {
    buttonSP.src = './images/Play.svg';
    buttonEscape.style.left = '-75px';
    videoInput.click();
};
let videoSprite = {visible : false , an : 0};
let globalVideo = {pause() {},play(){} , an:0};  // 保存背景视频元素
videoInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const videoURL = URL.createObjectURL(file);
    // 清理之前的视频资源（如果有）
    if (globalVideo && typeof globalVideo.pause === 'function') {
        globalVideo.pause();
        // 如果有旧的 objectURL，记得 revoke（需自行保存 url）
        if (globalVideo.src && globalVideo.src.startsWith('blob:')) {
            URL.revokeObjectURL(globalVideo.src);
        }
        globalVideo.src = '';
    }
    if (videoSprite && videoSprite.destroy) {
        app.stage.removeChild(videoSprite);
        videoSprite.destroy({ texture: true, baseTexture: true });
        videoSprite = null;
    }
    globalVideo = document.createElement('video');
    globalVideo.src = videoURL;
    globalVideo.crossOrigin = 'anonymous';
    globalVideo.loop = false;
    globalVideo.muted = true;          // 避免自动播放限制
    globalVideo.autoplay = true;
    globalVideo.setAttribute('playsinline', '');  // 移动端支持
    await new Promise((resolve) => {
        globalVideo.addEventListener('canplaythrough', resolve, { once: true });
        globalVideo.load();
    });

    const texture = PIXI.Texture.from(globalVideo);
    videoSprite = new PIXI.Sprite(texture);

    function updateVideoSize() {
        if (!videoSprite) return;
        const scaleX = window.innerWidth / globalVideo.videoWidth;
        const scaleY = window.innerHeight / globalVideo.videoHeight;
        const scale = Math.min(scaleX, scaleY);
        videoSprite.width = globalVideo.videoWidth * scale;
        videoSprite.height = globalVideo.videoHeight * scale;
        videoSprite.x = (window.innerWidth - videoSprite.width) / 2;
        videoSprite.y = (window.innerHeight - videoSprite.height) / 2;
    }
    updateVideoSize();
    window.addEventListener('resize', updateVideoSize, { once: false });
    app.stage.addChildAt(videoSprite, 0);
    videoSprite.visible = false;
    Notice.innerHTML = 'Successful Loaded Video!';
});

adofaifile = toLegalJson(defaultLevel);
await readadofai(adofaifile);
try {
    sound.add('bgm' , defaultLevelOgg);
    sound.play('bgm');
    sound.play('hitsound');
    sound.stopAll();
    Notice.innerHTML = 'Successful loaded Music File!'
} catch (err) {
    URL.revokeObjectURL(defaultLevelOgg);
};
if_all = true;
for (let i = 0 ; i < visibleTrack.length ; i++) {
    tracks[visibleTrack[i]].visible = false;
};
visibleTrack = [];
for (let i = angledata.length - 1;i>= 0 ; i--) {
    let trackname = i;
    visibleTrack.push(trackname);
    tracks[trackname].visible = true;
};
Notice.innerHTML = '';
beat = -114514;
renderalltrack();