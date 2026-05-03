// ========== 模块级常量 ==========
const HEX = {
    0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,
    A:10,B:11,C:12,D:13,E:14,F:15,
    a:10,b:11,c:12,d:13,e:14,f:15
};
const SIXTH = [1/6, 1/3, 1/2, 2/3, 5/6];
const BLACK = {R:0, G:0, B:0}; // 仅用于常量，实际直接使用0

const RAINBOW_PROCESS = {
    "RB": ["G", 1, 0],
    "GB": ["R", -1, 0.16666666],
    "GR": ["B", 1, 0.3333333333],
    "BR": ["G", -1, 0.5],
    "BG": ["R", 1, 0.66666666666],
    "RG": ["B", -1, 0.83333333333]
};

// 颜色类型计算函数表 (接收 ShiftType 实例和百分比, 返回颜色字符串)
const COLOR_FUNCS = {
    Single: (inst, p) => inst.colorString.slice(0,6),
    Stripes: (inst, p) => p < 0.5 ? inst.colorString.slice(0,6) : inst.seccolorString.slice(0,6),
    Glow: (inst, p) => {
        const pp = 1 - Math.abs(1 - 2 * p);
        const r = inst.r + (inst.r2 - inst.r) * pp;
        const g = inst.g + (inst.g2 - inst.g) * pp;
        const b = inst.b + (inst.b2 - inst.b) * pp;
        return toHex(r) + toHex(g) + toHex(b);
    },
    Blink: (inst, p) => {
        const r = inst.r + (inst.r2 - inst.r) * p;
        const g = inst.g + (inst.g2 - inst.g) * p;
        const b = inst.b + (inst.b2 - inst.b) * p;
        return toHex(r) + toHex(g) + toHex(b);
    },
    Switch: (inst, p) => p < 0.5 ? inst.colorString.slice(0,6) : inst.seccolorString.slice(0,6),
    Rainbow: (inst, p) => inst._rainbow(p),
    Volume: (inst, p) => inst.colorString.slice(0,6),
    undefined: (inst, p) => inst.colorString.slice(0,6)
};

// 地板样式处理函数表 (接收 ShiftType 实例和填充色字符串, 返回 [fill, stroke, useTexture])
const FLOOR_FUNCS = {
    Standard: (inst, fc) => [fc, inst.addBlack(0.7, fc), true],
    Neon: (inst, fc) => ['000000', fc, false],
    NeonLight: (inst, fc) => [inst.halfColor(fc), fc, false],
    Basic: (inst, fc) => [fc, '000000', false],
    Gems: (inst, fc) => [fc, inst.addBlack(0.7, fc), false],
    Minimal: (inst, fc) => [fc, fc, false],
    undefined: (inst, fc) => [fc, inst.addBlack(0.7, fc), false]
};

// 高效数字转2位十六进制
function toHex(n) {
    return Math.round(n).toString(16).padStart(2, '0');
}

// ========== RGBcolor 基类 ==========
class RGBcolor {
    constructor(colorString, seccolorString) {
        this.colorString = colorString;
        this.seccolorString = seccolorString;
    }

    // 预解析颜色分量到实例数字字段
    convert() {
        const c = HEX;
        this.r = c[this.colorString[0]]*16 + c[this.colorString[1]];
        this.g = c[this.colorString[2]]*16 + c[this.colorString[3]];
        this.b = c[this.colorString[4]]*16 + c[this.colorString[5]];
        this.r2 = c[this.seccolorString[0]]*16 + c[this.seccolorString[1]];
        this.g2 = c[this.seccolorString[2]]*16 + c[this.seccolorString[3]];
        this.b2 = c[this.seccolorString[4]]*16 + c[this.seccolorString[5]];
    }

    // 直接返回 RGB 数组（如有需要）
    get g_rgb() { return [this.r, this.g, this.b]; }

    // 叠加黑色透明度
    addBlack(opa, frontColor) {
        const fr = HEX[frontColor[0]]*16 + HEX[frontColor[1]];
        const fg = HEX[frontColor[2]]*16 + HEX[frontColor[3]];
        const fb = HEX[frontColor[4]]*16 + HEX[frontColor[5]];
        const r = opa * fr;
        const g = opa * fg;
        const b = opa * fb;
        return toHex(r) + toHex(g) + toHex(b);
    }

    // 半亮度
    halfColor(color) {
        const hr = (HEX[color[0]]*16 + HEX[color[1]]) / 2;
        const hg = (HEX[color[2]]*16 + HEX[color[3]]) / 2;
        const hb = (HEX[color[4]]*16 + HEX[color[5]]) / 2;
        return toHex(hr) + toHex(hg) + toHex(hb);
    }
}

// ========== ColorType 基类 ==========
export class ColorType extends RGBcolor {
    constructor(color, seccolor) {
        super(color, seccolor);
        this.convert();
    }

    // 彩虹颜色（内部方法）
    _rainbow(percent) {
        let max = 'R', min = 'R';
        if (this.g > this.r) max = 'G';
        if (this.b > this[max === 'R' ? 'r' : max === 'G' ? 'g' : 'b']) max = 'B';
        if (this.g < this.r) min = 'G';
        if (this.b < this[min === 'R' ? 'r' : min === 'G' ? 'g' : 'b']) min = 'B';
        if (max === min) return this.colorString.slice(0,6);

        const deal = RAINBOW_PROCESS[max + min];
        const range = this[max === 'R' ? 'r' : max === 'G' ? 'g' : 'b'] - this[min === 'R' ? 'r' : min === 'G' ? 'g' : 'b'];
        let per;
        if (deal[1] === 1) {
            per = deal[2] + (this[deal[0] === 'R' ? 'r' : deal[0] === 'G' ? 'g' : 'b'] - this[min === 'R' ? 'r' : min === 'G' ? 'g' : 'b']) / range / 6;
        } else {
            per = deal[2] + (this[max === 'R' ? 'r' : max === 'G' ? 'g' : 'b'] - this[deal[0] === 'R' ? 'r' : deal[0] === 'G' ? 'g' : 'b']) / range / 6;
        }
        per = (per + percent) % 1;
        const base = this[min === 'R' ? 'r' : min === 'G' ? 'g' : 'b'];
        const rr = base + range * Rchange(per);
        const gg = base + range * Gchange(per);
        const bb = base + range * Bchange(per);
        return toHex(rr) + toHex(gg) + toHex(bb);
    }
}

// 颜色分量变化函数（提升为模块级）
function Rchange(p) {
    if (p > 0 && p < SIXTH[0]) return 1;
    else if (p < SIXTH[1]) return 1 - (p - SIXTH[0]) / SIXTH[0];
    else if (p < SIXTH[3]) return 0;
    else if (p < SIXTH[4]) return (p - SIXTH[3]) / SIXTH[0];
    else return 1;
}
function Gchange(p) {
    if (p > 0 && p < SIXTH[0]) return p / SIXTH[0];
    else if (p < SIXTH[2]) return 1;
    else if (p < SIXTH[3]) return 1 - (p - SIXTH[2]) / SIXTH[0];
    else return 0;
}
function Bchange(p) {
    if (p > 0 && p < SIXTH[1]) return 0;
    else if (p < SIXTH[2]) return (p - SIXTH[1]) / SIXTH[0];
    else if (p < SIXTH[4]) return 1;
    else return 1 - (p - SIXTH[4]) / SIXTH[0];
}

// 脉冲类
class Pulse {
    constructor(type, startTime, startFloor, pulseLength, animationLength) {
        this.type = type;
        this.startTime = startTime;
        this.startFloor = startFloor;
        this.pulseLength = pulseLength;
        this.animationLength = animationLength;
    }

    fmol(a, b) { return a - b * Math.floor(a / b); }

    pulseNone(nowTime, nowFloor) {
        return this.fmol(nowTime - this.startTime, this.animationLength) / this.animationLength;
    }

    pulseForward(nowTime, nowFloor) {
        const t = this.fmol(nowTime - this.startTime, this.animationLength) / this.animationLength;
        const f = this.fmol(nowFloor - this.startFloor, this.pulseLength) / this.pulseLength;
        return this.fmol(t - f, 1);
    }

    pulseBackward(nowTime, nowFloor) {
        const t = this.fmol(nowTime - this.startTime, this.animationLength) / this.animationLength;
        const f = this.fmol(nowFloor - this.startFloor, this.pulseLength) / this.pulseLength;
        return this.fmol(t + f, 1);
    }

    doPulse(nowTime, nowFloor) {
        switch (this.type) {
            case 'None': return this.pulseNone(nowTime, nowFloor);
            case 'Forward': return this.pulseForward(nowTime, nowFloor);
            case 'Backward': return this.pulseBackward(nowTime, nowFloor);
            default: return this.pulseNone(nowTime, nowFloor);
        }
    }
}

// ========== ShiftType 核心类 ==========
export class ShiftType extends ColorType {
    constructor(colortype, color1, color2, type, startTime, startFloor, pulseLength, animationLength, floortype) {
        super(color1, color2);
        this.onType = colortype;
        this.pulsecal = new Pulse(type, startTime, startFloor, pulseLength, animationLength);
        this.startFloor = startFloor;
        this.floortype = floortype;
    }

    doColor(nowTime, nowFloor) {
        if (this.onType === 'Stripes') return this.doStripes(nowFloor);
        return this.pulsecal.doPulse(nowTime, nowFloor);
    }

    doStripes(nowFloor) {
        return ((nowFloor - this.startFloor) % 2 + 2) % 2 === 1 ? 1 : 0;
    }

    doCalculateColor(nowTime, nowFloor) {
        const percent = this.doColor(nowTime, nowFloor);
        const colorFunc = COLOR_FUNCS[this.onType] || COLOR_FUNCS.undefined;
        const fillColor = colorFunc(this, percent);
        const floorFunc = FLOOR_FUNCS[this.floortype] || FLOOR_FUNCS.undefined;
        return floorFunc(this, fillColor);
    }
}