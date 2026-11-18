// 方格水波：一块 canvas 画格线、工具图标、悬停的格子和水波；只在有波、鼠标在动的时候画，
// 波散完就停，平时不占 CPU；系统设了「减少动态」就不起波。首屏和下载区各挂一个。
'use strict'

// 应用里各工具用的 Lucide 图标（lucide-react 0.577.0，ISC），rect、circle、ellipse 换成了等价的 path。
const GRID_ICONS = {
  smartphone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 18h.01'],
  folderSearch: ['M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1', 'm21 21-1.9-1.9', 'M14 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  database: ['M3 5a9 3 0 1 0 18 0a9 3 0 1 0-18 0', 'M3 5V19A9 3 0 0 0 21 19V5', 'M3 12A9 3 0 0 0 21 12'],
  keyRound: ['M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z', 'M16 7.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0-1 0'],
  listTree: ['M8 5h13', 'M13 12h8', 'M13 19h8', 'M3 10a2 2 0 0 0 2 2h3', 'M3 5v12a2 2 0 0 0 2 2h3'],
  binary: ['M16 14a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2z', 'M8 4a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0V6a2 2 0 0 1 2-2z', 'M6 20h4', 'M14 10h4', 'M6 14h2v6', 'M14 4h2v6'],
  scanSearch: ['M3 7V5a2 2 0 0 1 2-2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M21 17v2a2 2 0 0 1-2 2h-2', 'M7 21H5a2 2 0 0 1-2-2v-2', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'm16 16-1.9-1.9'],
  libraryBig: ['M4 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M7 3v18', 'M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z'],
  listTodo: ['M13 5h8', 'M13 12h8', 'M13 19h8', 'm3 17 2 2 4-4', 'M4 4h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z'],
  languages: ['m5 8 6 6', 'm4 14 6-6 2-3', 'M2 5h12', 'M7 2h1', 'm22 22-5-10-5 10', 'M14 18h6'],
  globe: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
  braces: ['M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1', 'M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1'],
  cast: ['M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6', 'M2 12a9 9 0 0 1 8 8', 'M2 16a5 5 0 0 1 4 4', 'M2 20h.01'],
  command: ['M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3'],
}
// [行, 离中线的列, 图标, 名字]：围着首屏的标题摆一圈，标题和按钮底下不放。0.5.0 起 SQLite、MMKV、Plist、Protobuf、JSON
// 没有自己的界面了（Agent 直接读，SQLite、MMKV、Plist 也能拖进对话区直接看），所以只写格式名，不写工具名。
const GRID_PLACES = [
  [1, -3, 'database', 'SQLite'], [2, -6, 'smartphone', '数据提取'], [1, 3, 'libraryBig', '知识库'],
  [2, 6, 'languages', '翻译'], [4, -9, 'folderSearch', '真机浏览'], [3, 9, 'listTodo', '待办'],
  [6, -11, 'cast', '投屏'], [6, 10, 'command', '快捷面板'], [8, -8, 'keyRound', 'MMKV'],
  [8, 8, 'braces', 'JSON'], [3, -12, 'listTree', 'Plist'], [4, 12, 'binary', 'Protobuf'],
  [9, -11, 'scanSearch', '包名搜索'], [9, 11, 'globe', 'HTTP 调试'],
]
// 点在这些上面不起波、不亮格子：链接、按钮、首屏的应用窗口
const SKIP = 'a, button, [data-no-ripple]'
const GRID_STEP = 55         // 波每往外走一格晚多少毫秒
const GRID_ICON_TIME = 1700  // 图标亮起再退下去要多久
const gridStill = matchMedia('(prefers-reduced-motion: reduce)').matches
const gridPaths = Object.fromEntries(Object.entries(GRID_ICONS).map(([k, v]) => [k, v.map((d) => new Path2D(d))]))

function mountGrid(sec, { icons: withIcons = false } = {}) {
  const canvas = sec.querySelector('canvas.grid')
  const tip = sec.querySelector('.tip')
  const ctx = canvas.getContext('2d')
  let W = 0, H = 0, size = 56, cols = 0, rows = 0, left = 0
  let icons = new Map()
  let theme = {}
  let hover = null
  let frame = 0
  const ripples = []

  function readTheme() {
    const s = getComputedStyle(document.documentElement)
    const v = (name) => s.getPropertyValue(name).trim()
    theme = { wave: v('--wave'), line: v('--line'), brand: v('--brand'), rest: Number(v('--icon-rest')) }
  }

  function layout() {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    W = canvas.clientWidth
    H = canvas.clientHeight
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    size = W < 720 ? 40 : 56
    sec.style.setProperty('--cell', size + 'px')
    cols = Math.ceil(W / size) + 2
    if (cols % 2) cols++
    rows = Math.ceil(H / size) + 1
    left = (W - cols * size) / 2
    icons = new Map()
    if (withIcons && size === 56) {
      for (const [r, c, name, label] of GRID_PLACES) icons.set(`${r},${cols / 2 + c}`, { r, c: cols / 2 + c, name, label })
    }
    draw(performance.now())
  }

  // 一格在 now 时被波照亮多少（0–1）：离起点越远越晚到、亮得越久、越淡，几圈波叠加。
  function lit(r, c, now, icon) {
    let sum = 0
    for (const w of ripples) {
      const d = Math.hypot(r - w.r, c - w.c)
      const dur = icon ? GRID_ICON_TIME : 460 + d * 30
      const local = now - w.t - d * GRID_STEP - (icon ? 40 : 0)
      if (local < 0 || local > dur) continue
      const p = local / dur
      const peak = icon ? 0.22 : 0.3
      const e = p < peak ? p / peak : 1 - (p - peak) / (1 - peak)
      sum += e * e * (3 - 2 * e) * (icon ? 1 : Math.max(0.25, 1 - d / 30))
    }
    return Math.min(1, sum)
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = theme.line
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let c = 0; c <= cols; c++) {
      const x = Math.round(left + c * size) + 0.5
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
    }
    for (let r = 0; r <= rows; r++) {
      const y = r * size + 0.5
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = ripples.length ? lit(r, c, now, false) : 0
        const over = hover && hover.r === r && hover.c === c
        if (a < 0.01 && !over) continue
        const x = Math.round(left + c * size)
        const y = r * size
        ctx.fillStyle = `rgba(${theme.wave},${Math.max(a * 0.2, over ? 0.07 : 0)})`
        ctx.fillRect(x + 1, y + 1, size - 1, size - 1)
        if (a > 0.02) {
          ctx.strokeStyle = `rgba(${theme.wave},${a * 0.5})`
          ctx.strokeRect(x + 1.5, y + 1.5, size - 2, size - 2)
        }
      }
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const icon of icons.values()) {
      const over = hover && hover.r === icon.r && hover.c === icon.c
      const wave = ripples.length ? lit(icon.r, icon.c, now, true) : 0
      ctx.save()
      ctx.translate(Math.round(left + icon.c * size) + (size - 22) / 2, icon.r * size + (size - 22) / 2)
      ctx.scale(22 / 24, 22 / 24)
      ctx.globalAlpha = over ? 1 : theme.rest + (1 - theme.rest) * wave
      ctx.strokeStyle = theme.brand
      ctx.lineWidth = (1.6 * 24) / 22
      for (const p of gridPaths[icon.name]) ctx.stroke(p)
      ctx.restore()
    }
  }

  function tick(now) {
    frame = 0
    while (ripples.length && now - ripples[0].t > GRID_STEP * Math.hypot(rows, cols) + GRID_ICON_TIME + 200) ripples.shift()
    draw(now)
    if (ripples.length) frame = requestAnimationFrame(tick)
  }

  function ripple(r, c) {
    if (gridStill) return
    ripples.push({ r, c, t: performance.now() })
    if (!frame) frame = requestAnimationFrame(tick)
  }

  // 页面上一点（视口坐标）落在哪一格
  function cellAt(x, y) {
    const box = canvas.getBoundingClientRect()
    return { r: Math.floor((y - box.top) / size), c: Math.floor((x - box.left - left) / size) }
  }

  sec.addEventListener('pointermove', (e) => {
    const at = e.target.closest(SKIP) ? null : cellAt(e.clientX, e.clientY)
    if (at?.r === hover?.r && at?.c === hover?.c) return
    hover = at
    const icon = at && icons.get(`${at.r},${at.c}`)
    if (icon && tip) {
      tip.textContent = icon.label
      tip.style.left = Math.round(left + (icon.c + 0.5) * size) + 'px'
      tip.style.top = (icon.r + 1) * size + 6 + 'px'
      tip.classList.add('on')
    } else if (tip) {
      tip.classList.remove('on')
    }
    if (!frame) draw(performance.now())
  })
  sec.addEventListener('pointerleave', () => {
    hover = null
    tip?.classList.remove('on')
    if (!frame) draw(performance.now())
  })
  sec.addEventListener('click', (e) => {
    if (e.target.closest(SKIP)) return
    const { r, c } = cellAt(e.clientX, e.clientY)
    ripple(r, c)
  })

  readTheme()
  layout()
  addEventListener('resize', () => {
    clearTimeout(layout.timer)
    layout.timer = setTimeout(layout, 120)
  })
  new MutationObserver(() => {
    readTheme()
    if (!frame) draw(performance.now())
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  return {
    ripple,
    // 以一个元素的中心起一圈波
    rippleAt(el) {
      const b = el.getBoundingClientRect()
      const at = cellAt(b.left + b.width / 2, b.top + b.height / 2)
      ripple(at.r, at.c)
    },
    get cols() {
      return cols
    },
  }
}
window.mountGrid = mountGrid
