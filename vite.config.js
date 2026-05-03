// vite.config.js
import { defineConfig } from 'vite';
import path from "path"
import legacy from '@vitejs/plugin-legacy'
import htmlPostBuildPlugin from './no-attr'

const base = './'

export default defineConfig({
  base: base, // 核心配置：将所有资源路径设置为相对路径
  // 其他配置...
  plugins: [
	legacy({
    targets: ['defaults', 'not IE 11'],
    additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    renderModernChunks: false, // 只生成 legacy 回退包，不生成带 import 的 ESM chunk
  }),
	htmlPostBuildPlugin({ base })
  ]
});
