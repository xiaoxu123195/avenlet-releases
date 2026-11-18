// 页面上的小事：顶栏、深浅色、两处方格水波、复制核对命令、手机上复制这个页面的地址。
'use strict'
;(() => {
  const root = document.documentElement
  const query = new URLSearchParams(location.search)
  document.getElementById('theme').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
  })
  const bar = document.getElementById('bar')
  addEventListener('scroll', () => bar.classList.toggle('scrolled', scrollY > 8), { passive: true })

  // 首屏：logo 落进中间的 2×2 格，落下那一刻从那里起第一圈波。
  const hero = mountGrid(document.getElementById('hero'), { icons: true })
  document.getElementById('mark').classList.add('drop')
  if (!query.has('noauto')) setTimeout(() => hero.ripple(2.5, hero.cols / 2 - 0.5), 430)

  // 应用窗口升上来以后，工具光标按顺序把这次运行搭出来（升的时候位置在变，先等它停稳）。
  const app = document.getElementById('app')
  if (root.classList.contains('building')) {
    app.addEventListener('animationend', () => window.buildSection?.(app), { once: true })
  }

  // 下载区：第一次滚到时，从下载按钮那一格起一圈波。
  const dl = document.getElementById('download')
  const grid = mountGrid(dl)
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return
    io.disconnect()
    setTimeout(() => grid.rippleAt(document.getElementById('dl-btn')), 250)
  }, { threshold: 0.45 }).observe(dl)

  // 剪贴板不让用（不是 https、浏览器拦了）时说一声，让人自己选。
  const copy = (button, text) => {
    const done = (ok) => { button.textContent = ok ? '复制好了' : '复制不了，请手动选' }
    if (!navigator.clipboard) return done(false)
    navigator.clipboard.writeText(text).then(() => done(true), () => done(false))
  }
  const cmd = document.getElementById('copy')
  cmd.addEventListener('click', () => copy(cmd, cmd.dataset.copy))
  const link = document.getElementById('copy-link')
  link.addEventListener('click', () => copy(link, location.origin + location.pathname))
})()
