/**
 * Landing-hero 3D scene — 8 floating collectible cards, fixed camera, gentle bob
 * + occasional momentum spin, hover lift, drag-to-spin, clean click → open category.
 * Card faces are drawn to 2D canvases (code / name / index / change / sparkline, or
 * an INSUFFICIENT DATA face). Reduced-motion → a static arrangement. Adapted from
 * the design handoff prototype; standalone (no framework runtime).
 */
import * as THREE from 'three'

export interface HeroCard {
  code: string
  name: string
  idx: string
  chg: string
  up: boolean
  scored: boolean
  spark: number[]
  src: string
}

interface CardData {
  bx: number
  by: number
  bz: number
  dx: number
  ry: number
  rx: number
  sp: number
  ph: number
  exRy: number
  exRx: number
  spinVy: number
  spinVx: number
  nextSpin: number
  wobT: number
  code: string | null
}

const POS: [number, number, number?][] = [
  [-9.0, 3.6], [8.4, 3.4], [-8.8, 0.1], [8.1, -0.2],
  [-2, -3.8, -0.5], [6, -3.7, -0.3], [-6, -3.7, -0.6], [2, -3.7, -0.2],
]

function rng(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function rr(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, rad: number) {
  x.beginPath()
  x.moveTo(px + rad, py)
  x.arcTo(px + w, py, px + w, py + h, rad)
  x.arcTo(px + w, py + h, px, py + h, rad)
  x.arcTo(px, py + h, px, py, rad)
  x.arcTo(px, py, px + w, py, rad)
  x.closePath()
}
function dia(x: CanvasRenderingContext2D, cx: number, cy: number, s: number, fill: string | null, stroke: string | null) {
  x.save()
  x.translate(cx, cy)
  x.rotate(Math.PI / 4)
  if (fill) { x.fillStyle = fill; x.fillRect(-s / 2, -s / 2, s, s) }
  if (stroke) { x.strokeStyle = stroke; x.lineWidth = 1.5; x.strokeRect(-s / 2, -s / 2, s, s) }
  x.restore()
}

function makeCardTexture(card: HeroCard | null): THREE.CanvasTexture {
  const W = 320, H = 448
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const x = c.getContext('2d')!
  const mono = '"IBM Plex Mono",monospace'
  const sans = '"Archivo Variable",Archivo,sans-serif'
  if (!card) {
    rr(x, 0, 0, W, H, 26); x.fillStyle = '#F0EADD'; x.fill()
    x.strokeStyle = 'rgba(27,23,16,.55)'; x.lineWidth = 2; rr(x, 1, 1, W - 2, H - 2, 25); x.stroke()
    x.strokeStyle = 'rgba(201,169,97,.85)'; x.lineWidth = 1.5; rr(x, 14, 14, W - 28, H - 28, 14); x.stroke()
    for (let gy = 48; gy < H - 30; gy += 46) for (let gx = 42 + ((gy / 46) % 2) * 23; gx < W - 30; gx += 46) dia(x, gx, gy, 7, 'rgba(201,169,97,.22)', null)
    dia(x, W / 2 - 9, H / 2 - 9, 15, '#C9A961', null); dia(x, W / 2 + 9, H / 2 - 9, 15, null, 'rgba(143,111,38,.9)')
    dia(x, W / 2 - 9, H / 2 + 9, 15, null, 'rgba(143,111,38,.9)'); dia(x, W / 2 + 9, H / 2 + 9, 15, '#8F6F26', null)
    x.fillStyle = '#8A6D1F'; x.font = '700 15px ' + sans; x.textAlign = 'center'; x.fillText('T E S S E R A', W / 2, H / 2 + 52); x.textAlign = 'left'
  } else {
    rr(x, 0, 0, W, H, 26); x.fillStyle = '#FBF8F1'; x.fill()
    x.strokeStyle = 'rgba(27,23,16,.65)'; x.lineWidth = 2; rr(x, 1, 1, W - 2, H - 2, 25); x.stroke()
    x.strokeStyle = 'rgba(201,169,97,.9)'; x.lineWidth = 1.5; rr(x, 12, 12, W - 24, H - 24, 16); x.stroke()
    dia(x, 30, 30, 8, '#C9A961', null); dia(x, W - 30, H - 30, 8, '#C9A961', null)
    x.fillStyle = '#8A6D1F'; x.font = '700 26px ' + mono; x.fillText(card.code, 30, 68)
    dia(x, W - 38, 58, 11, null, 'rgba(143,111,38,.9)')
    x.fillStyle = '#4C4638'; x.font = '600 18px ' + sans; x.fillText(card.name, 30, 102, W - 60)
    x.fillStyle = '#1B1710'; x.font = '500 44px ' + mono; x.fillText(card.idx, 30, 188)
    x.font = '600 17px ' + mono
    if (card.scored) { x.fillStyle = card.up ? '#256B57' : '#A8442F'; x.fillText(card.chg + '  24H', 30, 220) }
    else { x.fillStyle = '#6E6759'; x.fillText('BELOW THRESHOLD', 30, 220) }
    if (card.scored && card.spark.length > 1) {
      const px = 30, py = 258, pw = W - 60, ph = 84
      const mn = Math.min(...card.spark), mx = Math.max(...card.spark), sp = mx - mn || 1
      x.beginPath()
      card.spark.forEach((v, i) => { const cx = px + (pw * i) / (card.spark.length - 1), cy = py + ph - ((v - mn) / sp) * ph; i ? x.lineTo(cx, cy) : x.moveTo(cx, cy) })
      x.strokeStyle = card.up ? '#2E8065' : '#A8442F'; x.lineWidth = 3; x.stroke()
    } else {
      x.setLineDash([6, 5]); x.strokeStyle = 'rgba(138,109,31,.7)'; x.lineWidth = 1.5; rr(x, 30, 252, W - 60, 92, 10); x.stroke(); x.setLineDash([])
      x.fillStyle = '#8A6D1F'; x.font = '600 13px ' + mono; x.textAlign = 'center'; x.fillText('INSUFFICIENT DATA', W / 2, 300)
      x.fillStyle = '#6E6759'; x.font = '500 11px ' + mono; x.fillText('INDEX WITHHELD', W / 2, 322); x.textAlign = 'left'
    }
    x.strokeStyle = 'rgba(27,23,16,.12)'; x.lineWidth = 1; x.beginPath(); x.moveTo(30, H - 64); x.lineTo(W - 30, H - 64); x.stroke()
    x.fillStyle = '#6E6759'; x.font = '500 11px ' + mono; x.fillText(card.src, 30, H - 38, W - 60)
    x.fillStyle = '#8B8271'; x.font = '500 10px ' + mono; x.fillText('VERIFIED SALES ONLY', 30, H - 20, W - 60)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.anisotropy = 4
  return tex
}

export function createHeroScene(canvas: HTMLCanvasElement, cards: HeroCard[], opts: { motion: boolean; onOpen: (code: string) => void }) {
  const parent = canvas.parentElement!
  const box = parent.getBoundingClientRect()
  let W = Math.max(60, box.width), H = Math.max(60, box.height)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.setSize(W, H, false)
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 80)
  camera.position.set(0, 0, 15)
  camera.lookAt(0, 0, 0)
  const scene = new THREE.Scene()
  const r = rng(4242)
  const back = makeCardTexture(null)
  const groups: THREE.Group[] = []
  const geo = new THREE.PlaneGeometry(2.2, 3.08)
  const sxFor = () => Math.min(1, Math.max(0.82, (Math.tan((camera.fov * Math.PI) / 360) * 15 * (W / H)) / 9.5))
  let sx = sxFor()

  cards.slice(0, 8).forEach((card, i) => {
    const p = POS[i % POS.length]
    const dx = p[0] + (r() - 0.5) * 0.4
    const by = p[1] + (r() - 0.5) * 0.3
    const bz = p[2] !== undefined ? p[2] : -1.6 + r() * 3.4
    const g = new THREE.Group()
    const fm = new THREE.MeshBasicMaterial({ map: makeCardTexture(card), transparent: true })
    const bm = new THREE.MeshBasicMaterial({ map: back, transparent: true })
    const f = new THREE.Mesh(geo, fm); f.position.z = 0.012
    const b = new THREE.Mesh(geo, bm); b.rotation.y = Math.PI; b.position.z = -0.012
    g.add(f); g.add(b)
    g.position.set(dx * sx, by, bz)
    g.rotation.set((r() - 0.5) * 0.22, (r() - 0.5) * 0.5, (r() - 0.5) * 0.09)
    const data: CardData = { bx: dx * sx, by, bz, dx, ry: g.rotation.y, rx: g.rotation.x, sp: 0.45 + r() * 0.6, ph: r() * 6.28, exRy: 0, exRx: 0, spinVy: 0, spinVx: 0, nextSpin: 2.5 + r() * 9, wobT: 1, code: card.code }
    g.userData = data
    scene.add(g); groups.push(g)
  })

  const raycaster = new THREE.Raycaster()
  let hover: THREE.Group | null = null
  let mx: number | null = null, my = 0
  let drag: { g: THREE.Group; lx: number; ly: number; lt: number; moved: number } | null = null
  const t0 = performance.now()
  let lt = 0
  let raf = 0

  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    mx = e.clientX - rect.left; my = e.clientY - rect.top
    if (drag) {
      const now = performance.now(), ms = Math.max(1, now - drag.lt)
      const ddx = e.clientX - drag.lx, ddy = e.clientY - drag.ly
      drag.moved += Math.abs(ddx) + Math.abs(ddy)
      const u = drag.g.userData as CardData
      u.exRy += ddx * 0.011; u.exRx += ddy * 0.009
      u.spinVy = (ddx / ms) * 11; u.spinVx = (ddy / ms) * 7
      drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now
    }
  }
  const onPointerDown = (e: PointerEvent) => {
    if (!hover) return
    const u = hover.userData as CardData
    u.spinVy = 0; u.spinVx = 0
    drag = { g: hover, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: 0 }
    try { canvas.setPointerCapture(e.pointerId) } catch { /* ignore */ }
  }
  const onPointerUp = () => {
    if (!drag) return
    const d = drag; drag = null
    const u = d.g.userData as CardData
    if (d.moved < 7 && u.code) { u.spinVy = 0; u.spinVx = 0; opts.onOpen(u.code) }
  }
  const onLeave = () => { mx = null }
  canvas.style.touchAction = 'none'
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('pointerleave', onLeave)

  const TAU = Math.PI * 2
  const frame = () => {
    const t = (performance.now() - t0) / 1000
    const dt = Math.min(0.05, Math.max(0.001, t - (lt || t))); lt = t
    if (drag) hover = drag.g
    else if (mx != null) {
      const nx = (mx / Math.max(1, W)) * 2 - 1, ny = -(my / Math.max(1, H)) * 2 + 1
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      let g: THREE.Object3D | null = hits.length ? hits[0].object : null
      while (g && (g.userData as CardData).bx === undefined) g = g.parent
      hover = (g as THREE.Group) || null
    } else hover = null

    for (const g of groups) {
      const u = g.userData as CardData
      const isDrag = drag?.g === g, isHov = hover === g
      if (opts.motion) {
        g.position.x = u.bx + Math.cos(t * u.sp * 0.55 + u.ph) * 0.12
        g.position.y = u.by + Math.sin(t * u.sp + u.ph) * 0.22
        g.position.z = u.bz + Math.sin(t * u.sp * 0.35 + u.ph * 2) * 0.25
        if (!isDrag && !isHov && t >= u.nextSpin) {
          u.nextSpin = t + 7 + ((u.ph * 13 + t * 0.7) % 11)
          const s1 = Math.sin(u.ph * 91 + t) * 0.5 + 0.5
          u.spinVy = (s1 < 0.5 ? -1 : 1) * (9 + s1 * 6)
        }
      }
      if (!isDrag) {
        u.exRy += u.spinVy * dt; u.exRx += u.spinVx * dt
        const k = Math.pow(0.15, dt)
        u.spinVy *= k; u.spinVx *= k
        if (Math.abs(u.spinVy) < 0.05) { u.spinVy = 0; const n = Math.round(u.exRy / TAU); u.exRy += (n * TAU - u.exRy) * Math.min(1, dt * 2.2) }
        if (Math.abs(u.spinVx) < 0.05) { u.spinVx = 0; u.exRx *= 1 - Math.min(1, dt * 2.2) }
      }
      const wobTarget = isHov || isDrag ? 0.22 : 1
      u.wobT += (wobTarget - u.wobT) * Math.min(1, dt * 8)
      const wob = u.wobT * (opts.motion ? 1 : 0)
      g.rotation.y = u.ry * u.wobT + Math.sin(t * 0.45 + u.ph) * 0.16 * wob + u.exRy
      g.rotation.x = u.rx * u.wobT + Math.cos(t * 0.38 + u.ph) * 0.09 * wob + u.exRx
      const target = isHov || isDrag ? 1.14 : 1
      g.scale.setScalar(g.scale.x + (target - g.scale.x) * 0.14)
    }
    canvas.style.cursor = drag ? 'grabbing' : hover ? 'grab' : 'default'
    renderer.render(scene, camera)
    if (opts.motion) raf = requestAnimationFrame(frame)
  }
  if (opts.motion) raf = requestAnimationFrame(frame)
  else frame()

  const ro = new ResizeObserver(() => {
    const rect = parent.getBoundingClientRect()
    if (rect.width < 10 || rect.height < 10) return
    W = rect.width; H = rect.height
    renderer.setSize(W, H, false)
    camera.aspect = W / H; camera.updateProjectionMatrix()
    sx = sxFor()
    for (const g of groups) { const u = g.userData as CardData; u.bx = u.dx * sx }
    if (!opts.motion) frame()
  })
  ro.observe(parent)

  return {
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerleave', onLeave)
      renderer.dispose()
    },
  }
}
