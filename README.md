# 卡片模板工坊 · v12 多 HTML 版

保留 v12 的界面与编辑功能，将目录和三个模板拆为独立文件。模板通过目录页加载，公共工具栏、缩放、全屏、撤回/重做、项目导入及模板切换仍由公共外壳管理。

## 文件结构

- `index.html`：目录页及公共编辑工具栏。
- `templates/polaroid.html`：仿拍立得模板及其素材、编辑逻辑。
- `templates/card.html`：透明卡片模板及其素材、编辑逻辑。
- `templates/storage.html`：仿存储卡挂件模板及其素材、编辑逻辑。
- `assets/studio.css`：目录与公共工具栏样式。
- `assets/studio.js`：模板路径登记、导航、项目导入、公共工具栏通信。
- `THIRD_PARTY/`：字体许可。

## 使用与部署

使用入口为 `index.html`。建议通过网页服务器访问，以避免不同浏览器对本地文件的限制。在本目录运行 `python3 -m http.server 8000`，然后打开 `http://localhost:8000`。

上传 GitHub 时，将本目录内的所有文件和子目录一并上传至仓库根目录，保持相对路径。启用 GitHub Pages 的分支部署，选择 `main` 分支、根目录即可，无需构建或安装依赖。

原有 `index.html#polaroid`、`index.html#card`、`index.html#storage` 地址继续可用。目录导入项目会识别模板并打开；所有编辑内容和上传图片仍在浏览器本地处理。请使用“项目 → 保存项目”保留编辑结果。

## 单独更新模板

只修改或替换相应 `templates/*.html` 文件即可；无需重新复制其他模板。各模板暂时保留自身内嵌素材，便于独立维护。本次不改变原模板的数据格式和渲染逻辑。

## 新增模板

1. 在 `templates/` 放入新模板 HTML。
2. 在 `assets/studio.js` 顶部的 `TEMPLATES` 中登记键名与相对文件路径，并在 `names` 中登记显示名。
3. 在 `index.html` 增加对应的目录卡片（`data-open` 使用同一个键名）和 `switchTool` 选项。
4. 如需接入公共工具栏、项目导入及保存，按已有模板实现 `postMessage` 通信，并扩展 `normalizeProject` 中允许的模板键及尺寸设置；已有模板可作为接口参考。

## 素材说明

字体许可见 `THIRD_PARTY/Nimbus-Roman-LICENSE.txt`。模板图案及图标等素材的权利归各自权利人，本文件包不授予额外素材许可。
