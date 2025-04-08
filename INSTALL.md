# Synaptic Forest 安装指南

首先，确保您已经安装了Node.js（推荐版本18或更高）和npm或yarn。

## 安装依赖

运行以下命令安装所有必要的依赖项：

```bash
npm install
# 或者
yarn install
```

## 安装 Lucide React (如果需要)

如果遇到图标库问题，请单独安装lucide-react：

```bash
npm install lucide-react@0.263.1
# 或者
yarn add lucide-react@0.263.1
```

## 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
```

现在，您可以在浏览器中访问 http://localhost:3000 来查看应用了。

## 构建生产版本

```bash
npm run build
npm start
# 或者
yarn build
yarn start
```

## 可能遇到的问题

### 1. Hydration 错误

如果您遇到与hydration相关的错误，这通常是因为服务器端和客户端渲染的内容不一致。这些问题通常在刷新页面后消失，或者通过设置组件为客户端组件（添加'use client'）来解决。

### 2. 依赖项冲突

如果遇到依赖项冲突，请尝试清除缓存并重新安装：

```bash
npm cache clean --force
rm -rf node_modules
rm -rf .next
npm install
```

### 3. 图形渲染问题

如果3D可视化效果出现问题，请确保您的浏览器支持WebGL，并且没有被禁用。
