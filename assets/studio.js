const TEMPLATES = {
  "polaroid": {
    "file": "templates/polaroid.html"
  },
  "card": {
    "file": "templates/card.html"
  },
  "storage": {
    "file": "templates/storage.html"
  }
};
const frames = {},
  names = {
    polaroid: '崩铁拍立得',
    card: 'Potepotte透卡',
    storage: '仿存储卡'
  };

function show(key) {
  if (!TEMPLATES[key]) return;
  document.querySelector('.top').hidden = false;
  document.getElementById('home').hidden = true;
  document.getElementById('editor').hidden = false;
  document.getElementById('toolName').textContent = names[key];
  document.getElementById('switchTool').value = key;
  Object.values(frames).forEach(f => f.hidden = true);
  if (!frames[key]) {
    const f = document.createElement('iframe');
    f.title = names[key];
    f.setAttribute('scrolling', 'no');
    f.src = TEMPLATES[key].file;
    document.getElementById('frames').appendChild(f);
    frames[key] = f
  }
  frames[key].hidden = false;
  window.scrollTo(0, 0)
}

function home() {
  document.querySelector('.top').hidden = false;
  document.getElementById('editor').hidden = true;
  document.getElementById('home').hidden = false;
  window.scrollTo(0, 0)
}
document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => location.hash = b.dataset.open);
document.getElementById('goHome').onclick = () => location.hash = '';
document.getElementById('switchTool').onchange = e => location.hash = e.target.value;

function route() {
  const key = location.hash.slice(1);
  if (TEMPLATES[key]) show(key);
  else home()
}
window.addEventListener('hashchange', route);
route();
window.addEventListener('message', e => {
  if (true) return;
  for (const f of Object.values(frames)) {
    if (f.contentWindow === e.source) f.style.height = Math.max(200, Number(e.data.height) || 800) + 'px'
  }
});
const editor = document.getElementById('editor'),
  fullBtn = document.getElementById('fullscreenBtn');

function fullLabel() {
  fullBtn.textContent = document.fullscreenElement || editor.classList.contains('fullscreenFallback') ?
    '⛶ 退出全屏' : '⛶ 全屏编辑'
}
fullBtn.onclick = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return
  }
  if (editor.classList.contains('fullscreenFallback')) {
    editor.classList.remove('fullscreenFallback');
    fullLabel();
    return
  }
  try {
    if (!editor.requestFullscreen) throw Error();
    await editor.requestFullscreen()
  } catch {
    editor.classList.add('fullscreenFallback')
  }
  fullLabel()
};
document.addEventListener('fullscreenchange', fullLabel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    editor.classList.remove('fullscreenFallback');
    fullLabel()
  }
});

const zoomValues = {
    polaroid: 100,
    card: 100,
    storage: 100
  },
  zoomRange = document.getElementById('titleZoomRange'),
  zoomNumber = document.getElementById('titleZoomNumber');

function activeKey() {
  return document.getElementById('switchTool').value
}

function refreshZoom() {
  const z = zoomValues[activeKey()] || 100;
  zoomRange.value = z;
  zoomNumber.value = Math.round(z)
}

function sendZoom(value) {
  const k = activeKey(),
    z = Math.min(500, Math.max(20, Number(value) || 100));
  zoomValues[k] = z;
  frames[k]?.contentWindow.postMessage({
    type: 'set-preview-zoom',
    zoom: z
  }, '*');
  refreshZoom()
}
zoomRange.oninput = () => sendZoom(zoomRange.value);
zoomNumber.onchange = () => sendZoom(zoomNumber.value);
document.getElementById('titleFit').onclick = () => {
  zoomValues[activeKey()] = 100;
  frames[activeKey()]?.contentWindow.postMessage({
    type: 'fit-preview'
  }, '*');
  refreshZoom()
};
window.addEventListener('message', e => {
  if (e.data?.type !== 'preview-zoom') return;
  for (const [k, f] of Object.entries(frames))
    if (f.contentWindow === e.source) {
      zoomValues[k] = e.data.zoom;
      if (k === activeKey()) refreshZoom()
    }
});
window.addEventListener('hashchange', refreshZoom);
refreshZoom();

const titleSize = document.getElementById('titleSize'),
  titleGuides = document.getElementById('titleGuides'),
  titleGuidesLabel = document.getElementById('titleGuidesLabel');

function refreshTitleSize() {
  const k = activeKey();
  titleGuidesLabel.hidden = k !== 'card';
  titleSize.textContent = k === 'polaroid' ? '尺寸 ⓘ' : k === 'card' ? '80 × 120 mm' : '55 × 75 mm';
  titleSize.disabled = k !== 'polaroid';
  if (k === 'card') frames.card?.contentWindow.postMessage({
    type: 'request-guides'
  }, '*')
}
titleSize.onclick = () => {
  if (activeKey() === 'polaroid') frames.polaroid?.contentWindow.postMessage({
    type: 'show-size-dialog'
  }, '*')
};
titleGuides.onchange = () => frames.card?.contentWindow.postMessage({
  type: 'set-guides',
  checked: titleGuides.checked
}, '*');
window.addEventListener('message', e => {
  if (e.source === frames.card?.contentWindow && e.data?.type === 'guides-state') titleGuides.checked = !!
    e.data.checked
});
window.addEventListener('hashchange', refreshTitleSize);
refreshTitleSize();

const undoButton = document.getElementById('undoProject'),
  redoButton = document.getElementById('redoProject'),
  projectInput = document.getElementById('unifiedProjectFile'),
  readyTemplates = {},
  pendingProjects = {};

function activeFrame() {
  return frames[activeKey()]
}

function historyAction(type) {
  activeFrame()?.contentWindow.postMessage({
    type
  }, '*')
}
undoButton.onclick = () => historyAction('undo-project');
redoButton.onclick = () => historyAction('redo-project');
document.getElementById('saveProject').onclick = () => historyAction('save-project');
document.getElementById('openProject').onclick = () => {
  projectInput.value = '';
  projectInput.click()
};
document.getElementById('importProject').onclick = () => {
  projectInput.value = '';
  projectInput.click()
};

function normalizeProject(p) {
  if (p?.format === 'card-template-studio' && p.version === 1 && ['polaroid', 'card', 'storage'].includes(p
      .template) && p.data) return p;
  if (p?.version === 1 && p.values && p.layers?.main && p.layers?.corner) {
    return {
      format: 'card-template-studio',
      version: 1,
      template: 'card',
      data: {
        values: {
          ...p.values,
          tc1: p.values.tc1 || p.values.tc || '#ffffff',
          tc2: p.values.tc2 || p.values.tc || '#ffffff',
          tc3: p.values.tc3 || p.values.tc || '#ffffff'
        },
        layers: p.layers
      },
      rich: {}
    }
  }
  throw new Error('这不是可识别的模板项目文件。')
}
projectInput.onchange = async () => {
  try {
    const f = projectInput.files[0];
    if (!f) return;
    const p = normalizeProject(JSON.parse(await f.text()));
    pendingProjects[p.template] = p;
    location.hash = p.template;
    show(p.template);
    if (readyTemplates[p.template]) {
      frames[p.template].contentWindow.postMessage({
        type: 'open-project',
        project: p
      }, '*');
      delete pendingProjects[p.template]
    }
  } catch (e) {
    alert(e.message || '项目读取失败')
  }
};
window.addEventListener('message', e => {
  const k = Object.keys(frames).find(k => frames[k].contentWindow === e.source);
  if (!k) return;
  if (e.data?.type === 'template-ready') {
    readyTemplates[k] = true;
    if (pendingProjects[k]) {
      frames[k].contentWindow.postMessage({
        type: 'open-project',
        project: pendingProjects[k]
      }, '*');
      delete pendingProjects[k]
    }
  }
  if (e.data?.type === 'history-state') {
    frames[k].historyState = e.data;
    if (k === activeKey()) {
      undoButton.disabled = !e.data.canUndo;
      redoButton.disabled = !e.data.canRedo
    }
  }
  if (e.data?.type === 'project-error') alert(e.data.message)
});
window.addEventListener('hashchange', () => {
  const h = activeFrame()?.historyState;
  undoButton.disabled = !h?.canUndo;
  redoButton.disabled = !h?.canRedo
});
document.addEventListener('keydown', e => {
  if (!e.ctrlKey && !e.metaKey) return;
  const k = e.key.toLowerCase();
  if (k === 'z' || k === 'y') {
    e.preventDefault();
    historyAction(k === 'y' || e.shiftKey ? 'redo-project' : 'undo-project')
  }
});

document.getElementById('projectMenu').onclick = () => activeFrame()?.contentWindow.postMessage({
  type: 'project-menu'
}, '*');
window.addEventListener('message', e => {
  if (e.data?.type !== 'import-project-data' || !Object.values(frames).some(f => f.contentWindow === e
      .source)) return;
  try {
    const p = normalizeProject(e.data.project);
    pendingProjects[p.template] = p;
    location.hash = p.template;
    show(p.template);
    if (readyTemplates[p.template]) {
      frames[p.template].contentWindow.postMessage({
        type: 'open-project',
        project: p
      }, '*');
      delete pendingProjects[p.template]
    }
  } catch (err) {
    alert(err.message || '项目读取失败')
  }
});
