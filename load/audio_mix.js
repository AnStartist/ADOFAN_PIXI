/**
 * 混合多个音频文件（带全局缓存，避免重复加载）
 * 优化版：支持大量打击音时的分块处理、峰值保护、软削波
 * @param {number[]} timePoints - 每个音频的开始时间（秒）
 * @param {string[]} audioUrls - 音频文件URL数组
 * @param {number} targetSampleRate - 目标采样率（Hz），设置为0则自动使用最高采样率
 * @param {number[]} volumes - 每个音频的音量（0-1或0-100，会自动检测）
 * @returns {Promise<string>} 返回混合后音频的dataURL（WAV格式）
 */

const audioCache = new Map();

async function loadAudio(url, audioContext) {
    if (audioCache.has(url)) {
        return audioCache.get(url);
    }

    const loadPromise = (async () => {
        try {
            let arrayBuffer;
            if (url.startsWith('data:')) {
                arrayBuffer = dataURLToArrayBuffer(url);
            } else {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                arrayBuffer = await response.arrayBuffer();
            }
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (err) {
            audioCache.delete(url);
            throw new Error(`加载音频失败 (${url}): ${err.message}`);
        }
    })();

    audioCache.set(url, loadPromise);
    return loadPromise;
}

// 软削波函数 - 防止混音后削峰失真
const softClip = (x) => {
    const absX = Math.abs(x);
    if (absX < 0.5) return x;
    if (absX < 1.5) return x * (1 - x * x / 3);
    return x < 0 ? -1 : 1;
};

export async function mixAudio(timePoints, audioUrls, targetSampleRate, volumes) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    try {
        if (!Array.isArray(timePoints) || !Array.isArray(audioUrls) || !Array.isArray(volumes)) {
            throw new Error('参数必须是数组类型');
        }
        
        const minLen = Math.min(timePoints.length, audioUrls.length, volumes.length);
        if (minLen === 0) throw new Error('没有有效的音频数据');
        
        // 标准化音量
        const isPercentage = volumes.some(v => v > 1);
        const normalizedVolumes = volumes.slice(0, minLen).map(v => {
            let vol = isPercentage ? Math.min(100, Math.max(0, v)) / 100 : Math.min(1, Math.max(0, v));
            return vol;
        });
        
        // 并行加载所有音频
        const loadTasks = [];
        for (let i = 0; i < minLen; i++) {
            const url = audioUrls[i];
            if (!url) continue;
            loadTasks.push(
                loadAudio(url, audioContext).then(buffer => ({
                    success: true,
                    buffer: buffer,
                    time: timePoints[i] || 0,
                    volume: normalizedVolumes[i]
                })).catch(err => {
                    console.warn(err.message);
                    return { success: false };
                })
            );
        }
        
        const results = await Promise.all(loadTasks);
        const audioItems = results.filter(r => r.success);
        
        if (audioItems.length === 0) {
            throw new Error('没有成功加载任何音频文件');
        }
        
        // 确定目标采样率
        let finalSampleRate = targetSampleRate > 0 ? targetSampleRate : 44100;
        if (targetSampleRate <= 0) {
            finalSampleRate = Math.max(...audioItems.map(item => item.buffer.sampleRate));
        }
        
        // 重采样
        const processedItems = audioItems.map(item => {
            if (item.buffer.sampleRate !== finalSampleRate) {
                return {
                    ...item,
                    buffer: resampleAudioBuffer(audioContext, item.buffer, finalSampleRate)
                };
            }
            return item;
        });
        
        // 计算总时长
        let totalDuration = 0;
        processedItems.forEach(item => {
            const endTime = item.time + item.buffer.duration;
            if (endTime > totalDuration) totalDuration = endTime;
        });
        
        const totalFrames = Math.ceil(totalDuration * finalSampleRate);
        let maxChannels = Math.max(...processedItems.map(item => item.buffer.numberOfChannels));
        maxChannels = Math.min(maxChannels, 2);
        
        const outputBuffer = audioContext.createBuffer(maxChannels, totalFrames, finalSampleRate);
        
        // 获取输出通道数据
        const outputData = [];
        for (let ch = 0; ch < maxChannels; ch++) {
            outputData.push(outputBuffer.getChannelData(ch));
            outputData[ch].fill(0);
        }
        
        // 分块混音（防止大量打击音时阻塞主线程）
        const CHUNK_SIZE = 5000; // 每帧处理5000个音频项
        let peakAmplitude = 0;
        
        for (let idx = 0; idx < processedItems.length; idx += CHUNK_SIZE) {
            const chunk = processedItems.slice(idx, idx + CHUNK_SIZE);
            
            for (const item of chunk) {
                const startFrame = Math.round(item.time * finalSampleRate);
                const sourceChannels = item.buffer.numberOfChannels;
                
                for (let ch = 0; ch < maxChannels; ch++) {
                    const sourceCh = ch < sourceChannels ? ch : 0;
                    const sourceData = item.buffer.getChannelData(sourceCh);
                    const out = outputData[ch];
                    const len = Math.min(sourceData.length, totalFrames - startFrame);
                    
                    for (let i = 0; i < len; i++) {
                        const newVal = out[startFrame + i] + sourceData[i] * item.volume;
                        out[startFrame + i] = newVal;
                        const absVal = Math.abs(newVal);
                        if (absVal > peakAmplitude) peakAmplitude = absVal;
                    }
                }
            }
            
            // 让出主线程，防止UI冻结
            if (idx + CHUNK_SIZE < processedItems.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        // 应用峰值保护和软削波
        const TARGET_HEADROOM = 0.9;
        const gainReduction = peakAmplitude > TARGET_HEADROOM 
            ? TARGET_HEADROOM / peakAmplitude 
            : 1.0;
        
        for (let ch = 0; ch < maxChannels; ch++) {
            const data = outputData[ch];
            for (let i = 0; i < data.length; i++) {
                data[i] = softClip(data[i] * gainReduction);
            }
        }
        
        const wavBlob = bufferToWav(outputBuffer);
        const dataURL = await blobToDataURL(wavBlob);
        return dataURL;
        
    } finally {
        await audioContext.close();
    }
}

// 辅助函数保持不变
function dataURLToArrayBuffer(dataURL) {
    const parts = dataURL.split(',');
    const base64 = parts[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function resampleAudioBuffer(audioContext, buffer, targetSampleRate) {
    const sourceSampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const targetLength = Math.max(1, Math.round(buffer.length * targetSampleRate / sourceSampleRate));
    const resampledBuffer = audioContext.createBuffer(numChannels, targetLength, targetSampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
        const sourceData = buffer.getChannelData(ch);
        const targetData = resampledBuffer.getChannelData(ch);
        for (let i = 0; i < targetLength; i++) {
            const sourceIndex = i * sourceSampleRate / targetSampleRate;
            const indexFloor = Math.floor(sourceIndex);
            const indexCeil = Math.ceil(sourceIndex);
            if (indexCeil >= sourceData.length) {
                targetData[i] = 0;
            } else if (indexFloor === indexCeil) {
                targetData[i] = sourceData[indexFloor];
            } else {
                const ratio = sourceIndex - indexFloor;
                targetData[i] = sourceData[indexFloor] * (1 - ratio) + sourceData[indexCeil] * ratio;
            }
        }
    }
    return resampledBuffer;
}

function bufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitDepth = 16;
    let interleaved;
    if (numChannels === 1) {
        interleaved = audioBuffer.getChannelData(0);
    } else {
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        interleaved = new Float32Array(left.length + right.length);
        for (let i = 0; i < left.length; i++) {
            interleaved[i * 2] = left[i];
            interleaved[i * 2 + 1] = right[i];
        }
    }
    const dataLength = interleaved.length * (bitDepth / 8);
    const bufferLength = 44 + dataLength;
    const view = new DataView(new ArrayBuffer(bufferLength));
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    const offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
        const sample = Math.max(-1, Math.min(1, interleaved[i]));
        view.setInt16(offset + i * 2, sample * 32767, true);
    }
    return new Blob([view], { type: 'audio/wav' });
}

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}