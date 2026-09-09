# 意序填色 (com.yixutianse.app) - Android APK 构建指南

本应用采用现代化移动优先跨端架构开发，现已为您**完整配置并生成了标准的 Android 原生工程目录 (`android/`)**，包名统一为 `com.yixutianse.app`，版本号为 `v1.0`。

---

## 一、目录结构概览

```
yixu-coloring/
├── android/                             # Android 原生工程目录（已全部就绪）
│   ├── build.gradle                     # 工程级构建配置
│   ├── settings.gradle                  # 模块设置
│   ├── gradle.properties                # 构建属性
│   └── app/
│       ├── build.gradle                 # 应用级配置 (包名: com.yixutianse.app, 版本: v1.0)
│       └── src/main/
│           ├── AndroidManifest.xml      # 清单文件（权限、沉浸式窗口、应用名）
│           ├── java/com/yixutianse/app/ # 原生启动 Activity 与硬件加速
│           └── assets/dist/             # 预编译好的离线完整静态资源包
├── capacitor.config.json                # Capacitor 标准跨端配置
├── package.json                         # 包含 build:android 一键打包同步脚本
└── BUILD_APK.md                         # 本构建说明
```

---

## 二、3分钟打包 APK 步骤

### 方式 1：使用 Android Studio 一键打包（推荐，可视化操作）

1. **准备代码**：
   在 AI Studio 右上角点击 **Settings（设置） -> Export to ZIP**，或通过 Git 将项目下载到本地电脑并解压。

2. **更新打包资源（可选）**：
   在项目根目录下打开终端，执行：
   ```bash
   npm install
   npm run build:android
   ```
   > 这一步会自动将最新的 React 页面与治愈填色素材同步至 `android/app/src/main/assets/dist` 中。

3. **打开工程**：
   打开 **Android Studio**，选择 **Open an existing project**，选中解压出来的 **`android` 文件夹**（不要选最外层，直接选 `android` 目录打开）。

4. **生成 APK**：
   - 顶部菜单栏点击：`Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`。
   - 构建完成后，右下角会弹出提示，点击 **`locate`** 即可直接获取生成的安装包：
     `app-debug.apk` （可直接传输到安卓手机安装使用）。
   - 若要发布正式版，点击 `Build` -> `Generate Signed Bundle / APK` 按向导创建签名密钥导出 Release APK。

---

### 方式 2：命令行 Gradle 一键构建（无须打开 Android Studio 界面）

若您的电脑已配置 Android SDK 和 Java 环境：

```bash
# 1. 编译前端资源到 Android 资源包中
npm run build:android

# 2. 进入 android 目录并执行 Gradle 构建
cd android
./gradlew assembleDebug
```

生成的 APK 位于：
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 三、原生配置参数核对

- **应用显示名称**：`意序填色`
- **应用包名 (Package Name)**：`com.yixutianse.app`
- **对外版本号 (Version Name)**：`v1.0`
- **内部版本号 (Version Code)**：`1`
- **最低支持安卓版本**：Android 5.1 (API 22)
- **目标适配安卓版本**：Android 14 (API 34)
- **硬件加速支持**：已在 WebView 启用硬件加速，保证 Canvas 自由涂色与油漆桶注色 60fps 流畅运行。
