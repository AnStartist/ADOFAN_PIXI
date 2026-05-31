# ADOFAN PIXI

一个轻量级的 ADOFAI（A Dance of Fire and Ice）谱面播放器，支持多平台运行。

## 技术栈

- **构建工具**: Vite
- **前端框架**: None
- **2D 渲染**: PIXI.js
- **语言**: JavaScript
- **UI 组件**: Drawn by myself
- **核心库**: [adofai](https://github.com/AnStartist/ADOFAN_PIXI/)

## 功能特性

- 谱面播放：支持加载和播放 ADOFAI 谱面文件（.adofai、.json）
- 渲染后端：支持 WebGL 渲染
- 媒体导入：
  - 支持加载音频文件
  - 支持导入视频背景
- 性能优化：
  - 轨道分区
- 视觉效果：
  - 星球拖尾效果
  - 打击音效
  - 谱面信息指示器（TBPM/Tiles 进度/beat）
- 其他功能：
  - FPS 显示
  - 性能监控面板

## 安装和运行
- 下载项目打包文件（.zip）
- 解压到任意文件夹
- 打开cmd或终端
- 定位到解包文件夹
- 输入 'npx serve' 回车
- 按住 control 键并左键单击终端显示的链接

## 项目结构

```
audios/    #打拍音文件
images/    #UI及纹理文件
default_map/    #默认地图
load/    #核心代码
main.js   #主程序
```

## 支持平台

- Web（浏览器）
- 桌面（可通过 Electron 等打包）


本项目遵循相应的开源许可证。
