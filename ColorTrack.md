!!设置轨道颜色&重置轨道颜色!!
1.活跃事件列表:
    I.记录活跃的设置轨道颜色/重置轨道颜色事件.
    II.每个事件作为一个Object,记录事件影响范围与事件起始轨道.
    III.当当前加载的轨道不含事件加载范围内的轨道,即在列表中删除此事件.
    IV.当有新的"重置轨道颜色"事件被触发时,立即重新计算活跃时间列表内所有事件的影响范围.
2.设置轨道颜色:
    I.设置轨道颜色需在加载谱面时预先计算好影响范围(不含"重置轨道颜色").
    II.当轨道显示范围触及新的"设置轨道颜色"事件时,将其加入活跃列表.
    III.初始时间为0.
3.重置轨道颜色:
    I.重置轨道颜色需要在加载谱面时预先计算事件触发时间并且按照时间排序.
    II.当播放时间达下一个重置轨道颜色事件时,将其加入活跃列表,并重新计算影响范围.
4.轨道颜色事件:
    I.以map形式记录每个颜色形式(单独/条纹/发光/闪烁/切换/彩虹/音量)对应的函数.
    II.颜色形式"单独"和"条纹"为一次性事件,但仍需加入活跃事件列表(影响范围相关).
    III.颜色事件只更改在其影响范围内且在轨道显示范围内的轨道颜色,其余轨道不更新颜色(节约性能).
    IV.在adofai文件"settings"键内的轨道颜色仍需做成轨道颜色事件形式,影响范围所有轨道.
    V.在初始化加载所有轨道时,轨道颜色即为"settings"设置内的主色调.
    VI.在开始播放时,重置轨道颜色为初始颜色(可见范围内).
    VII.初始时间为触发时间.
5.影响范围列表:
    I.维护一个按 floor 排序的事件数组,并缓存每个轨道的最终颜色结果.当活跃列表变化(插入/删除/重算)时,才重新计算受影响的轨道区间.
    II.JustThisTile == true -> 只影响当前轨道.

#事件示例:
设置轨道颜色 : { "floor": 6, "eventType": "ColorTrack", "trackColorType": "Blink", "trackColor": "debb7b", "secondaryTrackColor": "ffffff", "trackColorAnimDuration": 2, "trackColorPulse": "Forward", "trackPulseLength": 10, "trackStyle": "Basic", "trackTexture": "", "trackTextureScale": 1, "trackGlowIntensity": 100, "justThisTile": false}

重设轨道颜色 : { "floor": 1, "eventType": "RecolorTrack", "startTile": [1, "ThisTile"], "endTile": [3, "Start"], "gapLength": 0, "duration": 0, "trackColorType": "Single", "trackColor": "debb7b", "secondaryTrackColor": "ffffff", "trackColorAnimDuration": 2, "trackColorPulse": "None", "trackPulseLength": 10, "trackStyle": "NeonLight", "trackGlowIntensity": 100, "angleOffset": 0, "ease": "Linear", "eventTag": ""}

#各个颜色类型的函数(括号内为参数):
1.单独 (主色调) : 主色调.
2.条纹 (主色调/副色调/初始轨道/当前轨道) : 当前轨道-初始轨道 % 2 == 1 ? 副色调 : 主色调.
3.发光 (主色调/副色调/脉冲类型/脉冲长度/初始轨道/当前轨道/初始时间/当前时间/动画时长 -> 时长*60/当前bpm) :
    脉冲类型 == "无" : (副色调 - 主色调)*(1 - abs(1 - 2 * ((当前时间 - 初始时间) % 动画时长) / 动画时长)) + 主色调.
    脉冲类型 == "前进" : 
        (副色调 - 主色调)*(1 - abs(1 - 2 * ((当前时间 - 初始时间 - ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长)) + 主色调.
    脉冲类型 == "后退" :
        (副色调 - 主色调)*(1 - abs(1 - 2 * ((当前时间 - 初始时间 + ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长)) + 主色调.
4.闪烁 (主色调/副色调/脉冲类型/脉冲长度/初始轨道/当前轨道/初始时间/当前时间/动画时长 -> 时长*60/当前bpm) :
    脉冲类型 == "无" : (副色调 - 主色调)*((当前时间 - 初始时间) % 动画时长) / 动画时长 + 主色调.
    脉冲类型 == "前进": 
        (副色调 - 主色调)*((当前时间 - 初始时间 - ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长 + 主色调.
    脉冲类型 == "后退":
        (副色调 - 主色调)*((当前时间 - 初始时间 + ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长 + 主色调.
5.切换 (主色调/副色调/脉冲类型/脉冲长度/初始轨道/当前轨道/初始时间/当前时间/动画时长 -> 时长*60/当前bpm) :
    脉冲类型 == "无" : ((当前时间 - 初始时间) % 动画时长) / 动画时长 < 0.5 ? 主色调 : 副色调.
    脉冲类型 == "前进" : 
        ((当前时间 - 初始时间 - ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长 < 0.5 ? 主色调 : 副色调.
    脉冲类型 == "后退" :
        ((当前时间 - 初始时间 + ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长 < 0.5 ? 主色调 : 副色调.
6.彩虹 (主色调/副色调/脉冲类型/脉冲长度/初始轨道/当前轨道/初始时间/当前时间/动画时长 -> 时长*60/当前bpm) :
    RainbowColor函数(col/percent) : 
        const convert = {"0": 0 ,"1":1 , "2":2 , "3":3 , "4":4 , "5":5 , "6":6 , "7":7 , "8":8 , "9":9 ,"A":10,"B":11,"C":12,"D":13,"E":14,"F":15 , "a":10 , "b":11,"c":12,"d":13,"e":14,"f":15};
        const color = new Object;
        color['R'] = convert[col[0]] * 16 + convert[col[1]];
        color['G'] = convert[col[2]] * 16 + convert[col[3]];
        color['B'] = convert[col[4]] * 16 + convert[col[5]];
        let max = "R";
        if (color['G'] > color['R']) max = "G";
        if (color['B'] > color[max]) max = "B";
        let min = "R";
        if (color['G'] < color['R']) min = "G";
        if (color['B'] > color[min]) min = "B";
        const process = {"RB":["G" , 1 , 0] , "GB":["R" , -1 , 0.16666666] , "GR":["B" , 1 , 0.3333333333] , "BR":["G" , -1 , 0.5] , "BG":["R" , 1 , 0.66666666666] , "RG":["B" , -1 , 0.83333333333]};
        const deal = process[max + min];
        let per = 0;
        if (deal[1] == 1) per = deal[2] + (color[deal[0]] - color[min]) / (color[max] - color[min]) / 6;
        else per = deal[2] + (color[max] - color[deal[0]]) / (color[max] - color[min]) / 6;
        per += percent;
        per = per % 1;
        Color['R2'] = convert10to16(Math.round(color[min] + (color[max] - color[min]) * Rchange(per)));
        Color['G2'] = convert10to16(Math.round(color[min] + (color[max] - color[min]) * Gchange(per)));
        Color['B2'] = convert10to16(Math.round(color[min] + (color[max] - color[min]) * Bchange(per)));
        return Color['R2'] + Color['G2'] + Color['B2'];

    convert10to16函数(10number) : 
        const convert = {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":"A","11":"B","12":"C","13":"D","14":"E","15":"F"};
        return convert[Math.floor(10number/16)] + convert[10number % 16];
    Rchange函数(percent) :
        if (percent > 0 && percent < 1/6) return 1;
        else if (percent < 1/3) return 1 - (percent - 1/6 ) / (1/6);
        else if (percent < 2/3) return 0;
        else if (percent < 5/6) return (percent - 2/3) / (1/6);
        else return 1;
    Gchange函数(percent) :
        if (percent > 0 && percent < 1/6) return percent / (1/6);
        else if (percent < 1/2) return 1;
        else if (percent < 2/3) return 1 - (percent - 3/6) / (1/6);
        else return 0;
    Bchange函数(percent) :
        if (percent > 0 && percent < 1/3) return 0 ;
        else if (percent < 1/2) return (percent - 1/3) / (1/6);
        else if (percent < 5/6) return 1;
        else return 1 - (percent - 5/6) / (1/6);  
    脉冲类型 == "无" : RainbowColor(主色调 , ((当前时间 - 初始时间) % 动画时长) / 动画时长).
    脉冲类型 == "前进" : 
        RainbowColor(主色调 , ((当前时间 - 初始时间 - ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长).
    脉冲类型 == "后退" :
        RainbowColor(主色调 , ((当前时间 - 初始时间 + ((当前轨道 - 初始轨道) / 脉冲长度) * 动画时长) % 动画时长) / 动画时长).
7.音量 (主色调/副色调/音量):
    //若脉冲不为无需要缓存列表缓存音量并逐刻前滚/后滚列表设置轨道颜色,出于性能考量,脉冲为前进/后退将被当作无处置.
    (副色调 - 主色调) * (音量 / 100%) + 主色调.

#性能考量:
    加载轨道时将rgb主色调&副色调预先计算为{r , g , b}颜色值.
    脉冲时间计算单独做成函数.

#不足:
    未知重置轨道颜色duration如何计算(由原来轨道颜色渐变为新颜色?但是未免废性能,且不实用,因为在一般谱面中重置轨道颜色一般为瞬间事件(duration = 0)).

#FAQ:
    两个 RecolorTrack 重叠时,哪个生效? 后进入列表的事件生效.
    RecolorTrack 是否覆盖之前的 ColorTrack 设置?还是仅作为'重置'将颜色还原为 settings 中的默认色? RecolorTrack实际上是重新设置轨道颜色(定时出发的ColorTrack)而不是恢复初始颜色,此为adofai事件命名遗留问题.