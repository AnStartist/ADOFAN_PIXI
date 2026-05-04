export function toLegalJson(oldjson) {
    let json = oldjson;

    // 原有结构修复
    json = json
        .replace(/,(\s*[}\]])/g, "$1")   // 去尾逗号
        .replace(/}\s*{/g, "},{")        // 补逗号
        .replace(/\[\],,/g, "[],")
        .replace(/, ,/g, ",")
        .replace(/^\uFEFF/, '');
    json = json.replace(
        /\](\s*)"decorations"/g,
        "],$1\"decorations\""
    );

    // ===== 核心修复：转义字符串内所有未转义的控制字符 =====
    json = json.replace(/"(?:[^"\\]|\\.)*"/g, (str) => {
        return str.replace(/[\x00-\x1F]/g, (ch) => {
            const code = ch.charCodeAt(0);
            if (code === 0x0A) return '\\n';  // 换行
            if (code === 0x0D) return '\\r';  // 回车
            if (code === 0x09) return '\\t';  // 制表符
            // 其他控制字符（包括 \x0B, \x0C, \x00 等）
            return '\\u' + code.toString(16).padStart(4, '0');
        });
    });

    let jsonobject;
    try {
        jsonobject = JSON.parse(json);
    } catch (e) {
        document.getElementById('Notice').innerHTML = "Fail Reading JSON File!";
        console.log(json);
    }
    return jsonobject;
}