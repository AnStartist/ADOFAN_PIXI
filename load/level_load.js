import { ColorType , ShiftType } from './ColorType';
class processing{
    fmol (a,b) {return a - b * Math.floor(a / b)};
    cos (a) {return Math.cos(a / 180 * Math.PI)};
    sin (a) {return Math.sin(a / 180 * Math.PI)}; 
}
export class loadlevel extends processing{
    constructor(actions , angledata , settings) {
        super();
        this.actions = actions;
        this.angledata = angledata;
        this.settings = settings;
    };
    actionTwirl = new Array;
    actionSpeed = new Array;
    actionScale = new Array;
    actionPause = new Array;
    actionPosTrack = new Array;
    actionSetHitSound = new Array;
    actionCamera = new Array;
    actionMoveTrack = new Array;
    actionColorTrack = new Array;
    actionRecolorTrack = new Array;
    scanactions() {
        const len = this.actions.length;
        for (let i = 0;i<len;i++) {
            const action = this.actions[i];
            if(![false,'Disabled'].includes(action['active'])){
                if (!(action['editorOnly'] === true)) {
                    switch(action['eventType']) {
                        case 'Twirl':
                            this.actionTwirl.push(action);
                            break;
                        case 'SetSpeed':
                            this.actionSpeed.push(action);
                            break;
                        case 'ScaleRadius':
                            this.actionScale.push(action);
                            break;
                        case 'Pause':
                            this.actionPause.push(action);
                            break;
                        case 'PositionTrack':
                            this.actionPosTrack.push(action);
                            break;
                        case 'SetHitsound':
                            this.actionSetHitSound.push(action);
                            break;
                        case 'MoveCamera':
                            this.actionCamera.push(action);
                            break;
                        case "MoveTrack":
                            this.actionMoveTrack.push(action);
                            break;
                        case "ColorTrack":
                            this.actionColorTrack.push(action);
                            break;
                        case 'RecolorTrack':
                            this.actionRecolorTrack.push(action);
                            break;
                    };
                };
            };
        };
    };
    rotatedir = new Array;
    loadtwirl() {
        let movingball = new Array,dir = 1,mov = 2,tick = 0;
        for (let i = 0;i < this.angledata.length; i++) {
            if (tick < this.actionTwirl.length) {
                if (i == this.actionTwirl[tick]['floor']) {
                    dir *= -1;
                    tick += 1;
                };
            };
            this.rotatedir.push(dir);
            movingball.push(mov);
            mov = 3 - mov;
        };
        return {rotatedir:this.rotatedir , movingball};
    };
    anglelist = new Array;
    loadangle() {
        let lastangle= 180;
        const len = this.angledata.length
        for (let i = 0;i<len;i++) {
            if (this.angledata[i] == 999) {
                this.anglelist.push(0);
                let minus = 1;
                while (this.angledata[i - minus] == 999 && i - minus >= 0) {
                    minus += 1;
                };
                lastangle = this.angledata[i - minus] + (minus - 1) * 180;
            } else {
                if (this.rotatedir[i] == 1) {
                    this.anglelist.push(this.fmol(lastangle - this.angledata[i] , 360));
                } else {
                    this.anglelist.push(360 - this.fmol(lastangle - this.angledata[i] , 360));
                };
                if (this.anglelist[this.anglelist.length - 1] == 0) {
                    this.anglelist[this.anglelist.length - 1] = 360;
                };
                lastangle = this.angledata[i] + 180;
            };
        };
        return this.anglelist;
    };
    tbpm = new Array;
    loadspeed() {
        let tempbpm = this.settings['bpm'],tick = 0;
        const len1 = this.anglelist.length , len2 = this.actionSpeed.length;
        for (let i = 0;i< len1;i++) {
            if (tick < len2) {
                if (this.actionSpeed[tick]['floor'] == i) {
                    while (this.actionSpeed[tick]['floor'] == i) {
                        let speedevent = this.actionSpeed[tick];
                        if (speedevent['speedType'] == 'Multiplier') {
                            tempbpm *= speedevent['bpmMultiplier'];
                        } else {
                            tempbpm = speedevent['beatsPerMinute'];
                        };
                        tick += 1;
                        if (tick == len2) {
                            break;
                        };
                    };
                }
            };
            this.tbpm.push(tempbpm);
        };
        return this.tbpm;
    };
    trackradius = new Array;
    loadradius() {
        let radius = 30,tick = 0;
        const len1 = this.anglelist.length , len2 = this.actionScale.length;
        for (let i = 0;i< len1;i++) {
            if (tick < len2) {
                if (this.actionScale[tick]['floor'] == i) {
                    while (this.actionScale[tick]['floor'] == i) {
                        radius = 30 * this.actionScale[tick]['scale'] / 100;
                        tick += 1;
                        if (tick == len2) {
                            break;
                        };
                    };
                };
            };
            this.trackradius.push(radius);
        };
        return this.trackradius;
    };
    trackpos = new Array;
    ballpos = new Array;
    trackscale = new Array;
    tracksro = new Array;
    trackcolor = new Array;
    hitsoundlist = new Array;
    hitsoundvol = new Array;
    loadtilepos() {
        let posX = 0,posY = 0,hitsoundvolume = this.settings['hitsoundVolume'];
        this.trackcolor.push('#ffffff');
        this.trackpos.push([0,0]);
        this.trackscale.push([100,100]);
        this.tracksro.push([100,0,100]);
        const len = this.angledata.length;
        for (let i = 0;i<len;i++) {
            if (this.angledata[i] == 999) {
                let minus = 1;
                while (this.angledata[i - minus] == 999 && i - minus >= 0) {
                    minus += 1;
                };
                let lastloadang = this.angledata[i - minus] + (minus - 1) * 180;
                posX += -1 * this.trackradius[i] * this.cos(lastloadang);
                posY += -1 * this.trackradius[i] * this.sin(lastloadang); 
            } else {
                posX += this.trackradius[i] * this.cos(this.angledata[i]);
                posY += this.trackradius[i] * this.sin(this.angledata[i]);
            };
            this.trackpos.push([posX,posY]);
            this.ballpos.push([posX,posY]);
            this.tracksro.push([100,0,100]);
            this.trackscale.push([100,100]);
            this.trackcolor.push('#ffffff');
        };
        this.trackpos.splice(this.trackpos.length - 1,1);
    };
    loadhitsound() {
        let hitsound = this.settings['hitsound'] , hitsoundvolume = this.settings['hitsoundVolume'];
        let tick = 0;
        const len1 = this.angledata.length , len2 = this.actionSetHitSound.length;
        for (let i = 0 ; i < len1 ; i++) {
            if (tick < len2) {
                if (this.actionSetHitSound[tick]['floor'] == i + 1) {
                    while (this.actionSetHitSound[tick]['floor'] == i + 1) {
                        hitsound = this.actionSetHitSound[tick]['hitsound'];
                        hitsoundvolume = this.actionSetHitSound[tick]['hitsoundVolume'];
                        tick++;
                        if (tick == len2) break;
                    };
                };
            };
            this.hitsoundlist.push(hitsound);
            this.hitsoundvol.push(hitsoundvolume);
        };
    };
    get g_tpos() {return this.trackpos;};
    get g_tsro() {return this.tracksro;};
    get g_tsca() {return this.trackscale;};
    get g_bpos() {return this.ballpos;};
    get g_trad() {return this.trackradius;};
    get g_harr() {return this.hitsoundlist};
    get g_hvol() {return this.hitsoundvol};
    pausebeat = new Array;
    loadpause() {
        let tick = 0;
        for (let i = 0;i < this.anglelist.length;i++) {
            let pause = 0;
            const len = this.actionPause.length;
            if (tick < len) {
                if (this.actionPause[tick]['floor'] == i) {
                    while (this.actionPause[tick]['floor'] == i) {
                        pause += this.actionPause[tick]['duration'];
                        tick += 1;
                        if (tick == len) {
                            break;
                        };
                    };
                };
            };
            this.pausebeat.push(pause);
        };
    };
    get g_pause() {return this.pausebeat;};
    time = new Array;
    loadtime() {
        this.time.push(0);
        let temptime = 0;
        const len = this.anglelist.length;
        for (let i = 0;i< len;i++) {
            let dbeat = 0;
            if (this.anglelist[i] == 360 && this.rotatedir[i] == -1 && this.pausebeat[i] > 0) {
                dbeat = this.pausebeat[i] + 1;
            } else {
                dbeat = this.anglelist[i] / 180 + this.pausebeat[i];
            };
            temptime += dbeat * 60 / this.tbpm[i];
            this.time.push(temptime);
        };
        return this.time;
    };
    loadpositiontrack() {
        const len = this.actionPosTrack.length;
        for (let i = 0;i< len;i++) {
            let event = this.actionPosTrack[i],floor = event['floor'],thistile = 0;
            if ('justThisTile' in event) {
                if (String(event['justThisTile']) == 'true') {
                    thistile = 1;
                };
            };
            let ct = new Array;
            if (thistile == 1) {
                ct.push(floor);
            } else {
                while (floor < this.anglelist.length) {
                    ct.push(floor);
                    floor++;
                };
            };
            let rela = '',changeX = 0,changeY = 0,changeS = null,changeR = null,changeO = null;
            if ('relativeTo' in event) {
                switch (event['relativeTo'][1]) {
                    case 'ThisTile':
                        rela = event['floor'] + event['relativeTo'][0];
                        break;
                    case 'Start':
                        rela = event['relativeTo'][0];
                        break;
                    case 'End':
                        rela = this.angledata.length - 1 + event['relativeTo'][0];
                        break;
                };
                changeX = this.trackpos[rela][0] - this.trackpos[event['floor']][0];
                changeY = this.trackpos[rela][1] - this.trackpos[event['floor']][1];
            };
            if ('positionOffset' in event) {
                changeX += this.trackradius[event['floor']] * event['positionOffset'][0];
                changeY += this.trackradius[event['floor']] * event['positionOffset'][1];
            };
            if ('scale' in event) {
                changeS = event['scale'];
            };
            if ('rotation' in event) {
                changeR = event['rotation'];
            };
            if ('opacity' in event) {
                changeO = event['opacity'];
            };
            for (let j = 0;j< ct.length;j++) {
                let change = ct[j];
                this.trackpos[change] = [this.trackpos[change][0] + changeX , this.trackpos[change][1] + changeY];
                if ('scale' in event) {
                    this.tracksro[change][0] = changeS;
                };
                if ('rotation' in event) {
                    this.tracksro[change][1] = changeR;
                };
                if ('opacity' in event) {
                    this.tracksro[change][2] = changeO;
                };
                if (event['stickToFloors'] !== false) {
                    this.ballpos[change - 1] = [this.ballpos[change - 1][0] + changeX , this.ballpos[change - 1][1] + changeY];
                };
            };
        };
    };
    moveCamTime = [];
    loadcamera () {
        for (let i = 0 ; i < this.actionCamera.length ; i++) {
            const event = this.actionCamera[i];
            const floor = event['floor'],angoff = event['angleOffset'];
            const Rtime = this.time[floor] + (angoff / 180) * 60 / this.tbpm[floor];
            if (this.moveCamTime.length != 0) {
                if (Rtime >= this.moveCamTime[this.moveCamTime.length - 1][0]) {
                    this.moveCamTime.push([Rtime,i]);
                } else {
                    let bignum = 1;
                    while (this.moveCamTime[bignum - 1][0] <= Rtime) {
                        bignum++;
                    };
                    this.moveCamTime.splice(bignum - 1 , 0 , [Rtime , i]);
                };
            } else {
                this.moveCamTime.push([Rtime , i]);
            };
        };
    };
    get g_movcam() {return this.actionCamera};
    get g_camord() {return this.moveCamTime};
    moveTrackTime = [];
    savingtrack = [];
    loadmovetrack () {
        const loadTimeList = new Object;
        loadTimeList.savingtime = performance.now();
        for (let i = 0 ; i < this.trackpos.length ; i++) {
            this.savingtrack.push([]);
            this.savingtrack[i].push(this.trackpos[i].slice());
            this.savingtrack[i].push([this.trackscale[i].slice() , this.tracksro[i][1] , this.tracksro[i][2]]);
            if (i > 0) this.savingtrack[i].push(this.ballpos[i - 1].slice());
        };
        //savingtrack [[x,y],[[sx,sy],r,o]]
        loadTimeList.step1 = performance.now() - loadTimeList.savingtime;
        loadTimeList.savingtime = performance.now();
        for (let i = 0 ; i < this.actionMoveTrack.length ; i++) {
            const event = this.actionMoveTrack[i];
            const floor = event['floor'];
            const T = this.time[floor] + (event['angleOffset'] / 180) * (60 / this.tbpm[floor]);
            if (this.moveTrackTime.length == 0) {
                this.moveTrackTime.push([i , T]);
            } else {
                let j = 0;
                while (this.moveTrackTime[j][1] <= T) {
                    j += 1;
                    if (j == this.moveTrackTime.length) {
                        j = -1;
                        break;
                    };
                };
                if (j == -1) this.moveTrackTime.push([i , T]); 
                else this.moveTrackTime.splice(j , 0 , [i ,T]);
            };
        };
        loadTimeList.step2 = performance.now() - loadTimeList.savingtime;
        loadTimeList.savingtime = performance.now();
        for (let i = 0; i < this.moveTrackTime.length; i++) {
            const event = this.actionMoveTrack[this.moveTrackTime[i][0]];
            const T = this.moveTrackTime[i][1];
            const moveEvent = this.trackCaculate(event , T);
            this.moveTrackTime[i][0] = moveEvent.slice();
        };
        loadTimeList.step3 = performance.now() - loadTimeList.savingtime;
        loadTimeList.savingtime = performance.now();
        //console.log(loadTimeList);
    };

    trackCaculate (event , startTime) {
        let st = 0 , ed = 0;
        const floor = event['floor'] , start = event['startTile'] , end = event['endTile'];
        switch (start[1]) {
            case 'ThisTile':
                st = floor + start[0];
                break;
            case 'Start':
                st = start[0];
                break;
            case 'End':
                st = start[0] + this.trackpos.length - 1;
                break;
        }; 
        switch (end[1]) {
            case 'ThisTile':
                ed = floor + end[0];
                break;
            case 'Start':
                ed = end[0];
                break;
            case 'End':
                ed = end[0] + this.trackpos.length - 1;
                break;
        };
        const gap = 'gapLength' in event ? event['gapLength'] : 0;
        let tiles = [] , g = 0;
        let s = st;
        if (st > ed) {
            st = ed;
            ed = s;
        };
        if (st >= 0 && st < this.trackpos.length) tiles.push(st);
        for (let i = st + 1 ; i < ed + 1 ; i++) {
            if (g == gap) {
                if (i < this.trackpos.length && i >= 0) tiles.push(i);
                g = 0;
            } else g++;
        };
        const dura = event['duration'] * 60 / this.tbpm[floor] , ease = event['ease'];
        let change = [] , cx = null , cy = null , cr = null , csx = null , csy = null , cop = null;
        if ('positionOffset' in event) {
            cx = event['positionOffset'][0] == null ? null : this.trackradius[floor] * event['positionOffset'][0];
            cy = event['positionOffset'][1] == null ? null : this.trackradius[floor] * event['positionOffset'][1];
        };
        if ('rotationOffset' in event) {
            cr = event['rotationOffset'];
        };
        if ('scale' in event) {
            if (String(event['scale']).includes(',')) {
                csx = event['scale'][0] == null ? null : event['scale'][0];
                csy = event['scale'][1] == null ? null : event['scale'][1];
            } else {
                csx = event['scale'];
                csy = event['scale'];
            };
        };
        if ('opacity' in event) {
            cop = event['opacity'] == null ? null : event['opacity'];
        };
        let target = [];
        for (let i = 0 ; i < tiles.length ; i++) {
            const F = tiles[i];
            target.push([null,null,null,null,null,null]);
            //console.log(F , this.trackpos.length)
            if (cx != null) target[i][0] = this.trackpos[F][0] + cx;
            if (cy != null) target[i][1] = this.trackpos[F][1] + cy;
            target[i][2] = cr;
            target[i][3] = csx;
            target[i][4] = csy;
            target[i][5] = cop;
        };
        let old = [] , moved = [];
        for (let i = 0 ; i < tiles.length ; i++) {
            const F = tiles[i] < this.savingtrack.length ? tiles[i] : this.savingtrack.length - 1;
            old.push([this.savingtrack[F][0][0] , this.savingtrack[F][0][1] , this.savingtrack[F][1][1] , this.savingtrack[F][1][0][0] , this.savingtrack[F][1][0][1] , this.savingtrack[F][1][2]]);
            change.push([]);
            if (cx == null) change[i].push(0);
            else {
                change[i].push(target[i][0] - old[i][0]);
                this.savingtrack[F][0][0] = target[i][0];
                if (this.savingtrack[F][2]) this.savingtrack[F][2][0] += change[i][0];
            };
            if (cy == null) change[i].push(0);
            else {
                change[i].push(target[i][1] - old[i][1]);
                this.savingtrack[F][0][1] = target[i][1];
                if (this.savingtrack[F][2]) this.savingtrack[F][2][1] += change[i][1];
            };
            if (cr == null) change[i].push(0);
            else {
                change[i].push(target[i][2] - old[i][2]);
                this.savingtrack[F][1][1] = target[i][2];
            };
            if (csx == null) change[i].push(0);
            else {
                change[i].push(target[i][3] - old[i][3]);
                this.savingtrack[F][1][0][0] = target[i][3];
            };
            if (csy == null) change[i].push(0);
            else {
                change[i].push(target[i][4] - old[i][4]);
                this.savingtrack[F][1][0][1] = target[i][4];
            };
            if (cop == null) change[i].push(0);
            else {
                change[i].push(target[i][5] - old[i][5]);
                this.savingtrack[F][1][2] = target[i][5];
            };
            moved.push([0,0,0,0,0,0]);
        };
        return[[change , tiles , dura , ease , startTime , 0 , event] , moved];
    };


    get g_movtra() {return this.actionMoveTrack};
    get g_traord() {return this.moveTrackTime};
    trackColorEvent = new Object;
    trackColorInfluencing = new Array;
    RecolorTime = new Array;
    loadtilecolor() {
        let eventOrder = 0;
        const TrackColorSetting = new Array;
        //colortype, color1, color2, type, startTime, startFloor, pulseLength, animationLength , floortype
        TrackColorSetting.push(this.settings['trackColorType'] , this.settings['trackColor'] , this.settings['secondaryTrackColor'] , this.settings['trackColorPulse'] , 0 , 0 , this.settings['trackPulseLength'] , this.settings['trackColorAnimDuration'] , this.settings['trackStyle']);
        this.trackColorEvent[eventOrder] = new ShiftType(...TrackColorSetting);
        const len = this.angledata.length , len2 = this.actionColorTrack.length , len3 = this.actionRecolorTrack.length;
        for (let i = 0; i < len ; i++) {
            this.trackColorInfluencing.push(eventOrder);
        };
        eventOrder++;
        for (let i = 0; i < len2 ; i++) {
            const event = this.actionColorTrack[i];
            const floor = event['floor'];
            const ColorEvent = [event['trackColorType'] , event['trackColor'] , event['secondaryTrackColor'] , event['trackColorPulse'] , 0 , floor , event['trackPulseLength'] , event['trackColorAnimDuration'] , event['trackStyle']];
            this.trackColorEvent[eventOrder] = new ShiftType(...ColorEvent);
            if (event['justThisTile'] == true) {
                this.trackColorInfluencing[floor] = eventOrder;
            } else {
                this.trackColorInfluencing.fill(eventOrder , floor , len);
            };
            eventOrder++;
        };
        for (let i = 0; i < len3 ; i++){
            const event = this.actionRecolorTrack[i];
            const floor = event['floor'];
            const T = this.time[floor] + (event['angleOffset'] / 180) * (60 / this.tbpm[floor]);
            if (this.RecolorTime.length == 0) {
                this.RecolorTime.push([eventOrder , T]);
            } else {
                let j = 0;
                while (this.RecolorTime[j][1] <= T) {
                    j += 1;
                    if (j == this.RecolorTime.length) {
                        j = -1;
                        break;
                    };
                };
                if (j == -1) this.RecolorTime.push([eventOrder , T]); 
                else this.RecolorTime.splice(j , 0 , [eventOrder , T]);
            };
            //colortype, color1, color2, type, startTime, startFloor, pulseLength, animationLength , floortype
            const colorEvent = [event['trackColorType'] , event['trackColor'] , event['secondaryTrackColor'] , event['trackColorPulse'] , T , floor , event['trackPulseLength'] , event['trackColorAnimDuration'] , event['trackStyle']];
            this.trackColorEvent[eventOrder] = new ShiftType(...colorEvent);
            let st = 0, ed = 0;
            const start = event['startTile'] , end = event['endTile'];
            switch (start[1]) {
                case 'ThisTile':
                    st = floor + start[0];
                    break;
                case 'Start':
                    st = start[0];
                    break;
                case 'End':
                    st = start[0] + this.trackpos.length - 1;
                    break;
            }; 
            switch (end[1]) {
                case 'ThisTile':
                    ed = floor + end[0];
                    break;
                case 'Start':
                    ed = end[0];
                    break;
                case 'End':
                    ed = end[0] + this.trackpos.length - 1;
                    break;
            };
            const gap = 'gapLength' in event ? event['gapLength'] : 0;
            this.trackColorEvent[eventOrder].gapLength = gap;
            let tiles = [] , g = 0;
            let s = st;
            if (st > ed) {
                st = ed;
                ed = s;
            };
            if (st >= 0 ) tiles.push(st);
            for (let i = st + 1 ; i < ed + 1 ; i++) {
                if (g == gap) {
                    if (i < this.trackpos.length && i >= 0) tiles.push(i);
                    g = 0;
                } else g++;
            };
            this.trackColorEvent[eventOrder].changeFloors = tiles;
            eventOrder++;
        };
    };
    get g_tracol() {return this.trackColorEvent};
    get g_tracolInfluence() {return this.trackColorInfluencing};
    get g_record() {return this.RecolorTime};
};

function cloneSavingTrack(arr) {
    const len = arr.length;
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
        const t = arr[i];
        result[i] = [
            [t[0][0], t[0][1]],
            [
                [t[1][0][0], t[1][0][1]],
                t[1][1],
                t[1][2]
            ],
            t[2]
                ? [t[2][0], t[2][1]]
                : undefined
        ];
    }
    return result;
};