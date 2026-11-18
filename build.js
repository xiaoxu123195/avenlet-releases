// 往下滚到一块，几只「工具光标」把它搭出来：光标是 Agent 自己的工具（read、grep、edit、powershell……），
// 飞到元素上、拉出选框（边拉边写尺寸）、两条参考线一闪，选框拉好内容才出来：字逐个打出来、数字跳上去、线画出来。
// 标记：
//   [data-build]            一块，滚到时开搭；值里带 seq 就按顺序一个接一个（首屏的窗口），带 manual 就等页面脚本叫
//   [data-frame="工具名"]   要拉选框的元素（不写工具名就谁有空谁来）
//   [data-fade]             不拉选框，轮到时淡入（用户自己发的话、用量这一行）；带 data-wait 就等它出完再往下
//   [data-type]             逐字打出来；写个数字是整段大约多少毫秒
//   [data-count="21"]       从 0 跳到 21；[data-draw] SVG 的线画出来；[data-flow] 画完以后线上跑点
// 每个元素滚到眼前才搭；暂时没活的光标过一会儿淡出去，轮到它再出来。每块只搭一次。
// 内容由 <html class="building"> 藏起来（页头的脚本加），没有 JS 时照常显示；系统设了「减少动态」就直接显示。
'use strict'
;(() => {
  const COLORS = {
    read: '#7560ed', grep: '#2f7fd8', glob: '#0f9488', ls: '#0d9f6e',
    edit: '#d9622b', write: '#c43f72', powershell: '#3c6fd9', job: '#8a6cf4',
  }
  const SPARE = ['edit', 'read', 'grep', 'write', 'glob']
  const root = document.documentElement
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (still || !('IntersectionObserver' in window)) {
    root.classList.remove('building')
    return
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const tween = (ms, fn) =>
    new Promise((done) => {
      const t0 = performance.now()
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms)
        fn(ease(p), p)
        if (p < 1) requestAnimationFrame(step)
        else done()
      }
      requestAnimationFrame(step)
    })
  const at = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }
  }
  const PIECE = '[data-frame], [data-fade]'
  const owner = (node) => node.closest(PIECE)
  const shown = (el) => el.getClientRects().length > 0
  const cjk = /[⺀-鿿＀-￯]/

  const layer = document.createElement('div')
  layer.className = 'b-layer'
  layer.setAttribute('aria-hidden', 'true')
  document.body.append(layer)

  // 还没打出来的字：放进一个 CSS Highlight，样式里让它透明，字的位置不动，版面不会跳。
  const hidden = 'Highlight' in window && CSS.highlights ? new Highlight() : null
  if (hidden) CSS.highlights.set('b-hidden', hidden)
  const typing = new Map()

  // 滚到眼前（视口底边往上 8%）才算看见；没显示出来的（手机上收起的侧栏）不等。
  const waiting = new Map()
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      seen.unobserve(e.target)
      waiting.get(e.target)?.()
      waiting.delete(e.target)
    }
  }, { rootMargin: '0px 0px -8% 0px' })
  const inView = (el) =>
    new Promise((done) => {
      if (!shown(el)) return done()
      waiting.set(el, done)
      seen.observe(el)
    })

  function prepare(sec) {
    for (const f of sec.querySelectorAll(PIECE)) f.classList.add('b-wait')
    for (const t of sec.querySelectorAll('[data-type]')) {
      const nodes = []
      const walk = document.createTreeWalker(t, NodeFilter.SHOW_TEXT)
      while (walk.nextNode()) if (walk.currentNode.textContent.length) nodes.push(walk.currentNode)
      const ranges = nodes.map((n) => {
        const r = new Range()
        r.selectNodeContents(n)
        hidden?.add(r)
        return { node: n, range: r }
      })
      typing.set(t, ranges)
      if (!hidden) t.classList.add('b-wait')
    }
    for (const c of sec.querySelectorAll('[data-count]')) {
      c.style.minWidth = c.getBoundingClientRect().width + 'px'
      c.textContent = format(0, c.dataset.count)
    }
    for (const p of sec.querySelectorAll('[data-draw]')) {
      const len = p.getTotalLength()
      p.style.strokeDasharray = `${len}`
      p.style.strokeDashoffset = `${len}`
    }
  }

  const format = (v, target) => {
    const dec = (target.split('.')[1] || '').length
    return Number(v).toFixed(dec)
  }

  async function type(el) {
    const ranges = typing.get(el)
    if (!ranges) return
    typing.delete(el)
    if (!hidden) {
      el.classList.remove('b-wait')
      return
    }
    // 整段大约多少毫秒：data-type 里写了就用它，默认 1500；中文一个字算 1.6 步
    const budget = Number(el.dataset.type) || 1500
    const weight = ranges.reduce((n, r) => n + [...r.node.textContent].reduce((m, ch) => m + (cjk.test(ch) ? 1.6 : 1), 0), 0)
    const per = Math.max(6, Math.min(42, budget / Math.max(1, weight)))
    for (const { node, range } of ranges) {
      const text = node.textContent
      for (let i = 1; i <= text.length; i++) {
        range.setStart(node, i)
        await sleep(cjk.test(text[i - 1]) ? per * 1.6 : per)
      }
      hidden.delete(range)
    }
  }

  const count = (el) => tween(900, (e) => (el.textContent = format(Number(el.dataset.count) * e, el.dataset.count)))
  const draw = (p) => {
    const len = p.getTotalLength()
    return tween(900, (e) => (p.style.strokeDashoffset = `${len * (1 - e)}`)).then(() => {
      if (p.hasAttribute('data-flow')) p.closest('svg')?.querySelectorAll(`[data-on="${p.id}"]`).forEach((m) => m.beginElement?.())
    })
  }

  // 选框拉好以后内容出来：自己和里面不属于别的选框的字、数字、线
  async function reveal(el) {
    el.classList.remove('b-wait')
    el.classList.add('b-in')
    const mine = (sel) => [el, ...el.querySelectorAll(sel)].filter((n) => n.matches(sel) && owner(n) === el)
    const side = [...mine('[data-count]').map(count), ...mine('[data-draw]').map(draw)]
    for (const t of mine('[data-type]')) await type(t)
    await Promise.all(side)
  }

  class Hand {
    constructor(tool, x, y) {
      this.tool = tool
      this.color = COLORS[tool] ?? COLORS.read
      this.el = document.createElement('div')
      this.el.className = 'b-hand'
      this.el.style.setProperty('--c', this.color)
      this.el.innerHTML = `<svg viewBox="0 0 16 16"><path d="M2 2L14 6.7L8.7 8.7L6.7 14Z"/></svg><span>${tool}</span>`
      layer.append(this.el)
      this.x = x
      this.y = y
      this.place()
    }
    place() {
      this.el.style.transform = `translate(${this.x - 2}px, ${this.y - 2}px)`
    }
    async moveTo(x, y) {
      const x0 = this.x
      const y0 = this.y
      const d = Math.hypot(x - x0, y - y0)
      await tween(Math.min(850, 260 + d * 0.4), (e) => {
        this.x = x0 + (x - x0) * e
        this.y = y0 + (y - y0) * e
        this.place()
      })
    }
    // 暂时没活：过一会儿淡出去；轮到它再出来，从原地飞过去
    rest() {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.el.classList.add('gone'), 1400)
    }
    wake() {
      clearTimeout(this.timer)
      this.el.classList.remove('gone')
    }
    leave(x) {
      clearTimeout(this.timer)
      this.moveTo(x, this.y + 40).then(() => {
        this.el.classList.add('gone')
        setTimeout(() => this.el.remove(), 500)
      })
    }
  }

  function guides(r, color, area) {
    const s = at(area)
    const h = document.createElement('div')
    h.className = 'b-guide b-h'
    h.style.cssText = `--c:${color};top:${r.y}px;left:${s.x - 80}px;width:${s.w + 160}px`
    const v = document.createElement('div')
    v.className = 'b-guide b-v'
    v.style.cssText = `--c:${color};left:${r.x}px;top:${s.y}px;height:${s.h}px`
    layer.append(h, v)
    setTimeout(() => (h.remove(), v.remove()), 1000)
  }

  async function frame(hand, el, area) {
    let r = at(el)
    await hand.moveTo(r.x, r.y)
    r = at(el) // 飞的这一会儿版面可能动了
    const box = document.createElement('div')
    box.className = 'b-frame'
    box.style.cssText = `--c:${hand.color};left:${r.x}px;top:${r.y}px`
    box.innerHTML = '<i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i><i class="tm"></i><i class="bm"></i><b></b>'
    layer.append(box)
    const size = box.querySelector('b')
    guides(r, hand.color, area)
    await tween(Math.min(720, 240 + (r.w + r.h) * 0.22), (e) => {
      box.style.width = `${r.w * e}px`
      box.style.height = `${r.h * e}px`
      size.textContent = `${Math.round(r.w * e)} × ${Math.round(r.h * e)}`
      hand.x = r.x + r.w * e
      hand.y = r.y + r.h * e
      hand.place()
    })
    return box
  }
  const unframe = (box) => {
    box.classList.add('fade')
    setTimeout(() => box.remove(), 700)
  }

  // 几只光标同时搭：有名字的元素归那个工具，其余轮着分；外层的内容出来以后里面的才开始。
  async function together(sec, area) {
    const pieces = [...sec.querySelectorAll(PIECE)]
    const frames = pieces.filter((p) => p.hasAttribute('data-frame'))
    const named = [...new Set(frames.map((f) => f.dataset.frame).filter(Boolean))]
    const tools = [...named, ...SPARE.filter((t) => !named.includes(t))].slice(0, Math.min(8, Math.max(3, named.length)))
    const s = at(area)
    const hands = tools.map((t, i) => new Hand(t, i % 2 ? s.x + s.w + 30 : s.x - 50, s.y + 60 + i * 46))
    const queues = hands.map(() => [])
    let next = 0
    for (const f of frames) {
      const i = hands.findIndex((h) => h.tool === f.dataset.frame)
      queues[i >= 0 ? i : next++ % hands.length].push(f)
    }
    const done = new Map(pieces.map((p) => {
      let open
      const promise = new Promise((r) => (open = r))
      return [p, { promise, open }]
    }))
    const parentShown = (el) => {
      const parent = el.parentElement.closest(PIECE)
      return parent && done.has(parent) ? done.get(parent).promise : null
    }
    const fades = pieces.filter((p) => !p.hasAttribute('data-frame')).map(async (el) => {
      await parentShown(el)
      await inView(el)
      await reveal(el)
      done.get(el).open()
    })
    await Promise.all([...fades, ...hands.map(async (hand, i) => {
      for (const f of queues[i]) {
        hand.rest()
        await parentShown(f)
        await inView(f)
        if (!shown(f)) {
          await reveal(f)
          done.get(f).open()
          continue
        }
        hand.wake()
        const box = await frame(hand, f, area)
        await reveal(f)
        done.get(f).open()
        unframe(box)
      }
      hand.leave(i % 2 ? s.x + s.w + 60 : s.x - 80)
    })])
  }

  // 一个接一个（首屏的窗口）：上一个选框拉好，下一个就开始，前面的字接着打；每个工具一只光标。
  async function inOrder(sec, area) {
    const pieces = [...sec.querySelectorAll(PIECE)]
    const tool = (el) => el.dataset.frame || 'read'
    const last = new Map()
    pieces.forEach((p, i) => p.hasAttribute('data-frame') && last.set(tool(p), i))
    const s = at(area)
    const hands = new Map()
    const pending = []
    for (const [i, el] of pieces.entries()) {
      await inView(el)
      if (!el.hasAttribute('data-frame') || !shown(el)) {
        const out = reveal(el)
        pending.push(out)
        if (el.hasAttribute('data-wait')) await out
        continue
      }
      const name = tool(el)
      let hand = hands.get(name)
      if (!hand) {
        const left = hands.size % 2 === 0
        hand = new Hand(name, left ? s.x - 50 : s.x + s.w + 30, at(el).y + 80)
        hands.set(name, hand)
      }
      hand.wake()
      const box = await frame(hand, el, area)
      pending.push(reveal(el).then(() => unframe(box)))
      if (last.get(name) === i) hand.leave(hand.x > s.x + s.w / 2 ? s.x + s.w + 60 : s.x - 80)
      else hand.rest()
    }
    await Promise.all(pending)
  }

  const prepared = new Set()
  async function build(sec) {
    if (sec.classList.contains('b-built') || sec.classList.contains('b-building')) return
    if (!prepared.has(sec)) prepare(sec)
    sec.classList.add('b-building')
    const area = sec.closest('[data-area]') ?? sec
    const mode = (sec.dataset.build || '').split(/\s+/)
    await (mode.includes('seq') ? inOrder(sec, area) : together(sec, area))
    sec.classList.replace('b-building', 'b-built')
  }

  const sections = [...document.querySelectorAll('[data-build]')]
  for (const sec of sections) {
    prepare(sec)
    prepared.add(sec)
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      io.unobserve(e.target)
      build(e.target)
    }
  }, { rootMargin: '0px 0px -12% 0px' })
  for (const sec of sections) if (!/\bmanual\b/.test(sec.dataset.build)) io.observe(sec)
  window.buildSection = build
})()
