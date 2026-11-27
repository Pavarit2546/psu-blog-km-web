'use client'

import { useEffect, useRef } from 'react'

const vertexSource = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const fragmentSource = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform bool dark;

  vec3 palette(vec3 daylight, vec3 night) {
    return dark ? night : daylight;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec3 curtain(vec3 sky, vec2 p, float phase, float level, vec3 tint) {
    float x = p.x + phase;
    float fold = sin(3.4 * x + 0.19 * time + 0.8 * sin(5.6 * x - 0.11 * time));
    float rim = level + 0.13 * fold + 0.035 * sin(8.2 * x - 0.16 * time);
    float above = p.y - rim;
    float height = 0.14 + 0.12 * (0.5 + 0.5 * sin(7.0 * x + fold));
    float veil = exp(-max(above, 0.0) / height) * smoothstep(-0.018, 0.02, above);
    vec3 color = mix(sky, tint, 0.545 * veil);
    float glow = exp(-abs(above) * 23.0);
    return mix(color, palette(vec3(0.84, 1.0, 0.98), vec3(0.24, 0.62, 0.76)), 0.65 * glow);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = vec2((uv.x - 0.5) * resolution.x / resolution.y, uv.y);
    vec3 horizon = palette(vec3(0.55, 0.70, 0.85), vec3(0.035, 0.075, 0.14));
    vec3 zenith = palette(vec3(0.80, 0.87, 0.97), vec3(0.025, 0.035, 0.10));
    vec3 sky = mix(horizon, zenith, uv.y);
    sky = mix(sky, palette(vec3(0.36, 0.53, 0.76), vec3(0.08, 0.13, 0.23)), 0.52 * sin(3.14159 * uv.y));
    sky = curtain(sky, p, 1.9, 0.60, palette(vec3(0.38, 0.40, 0.82), vec3(0.28, 0.23, 0.55)));
    sky = curtain(sky, p, 0.0, 0.32, palette(vec3(0.08, 0.78, 0.77), vec3(0.04, 0.43, 0.46)));

    vec2 cell = p * 57.0;
    float seed = hash(floor(cell));
    float star = 1.0 - smoothstep(0.0, 0.075, length(fract(cell) - vec2(0.5)));
    float glint = star * step(0.954, seed) * (0.6 + 0.4 * sin(time + 80.0 * seed));
    float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(sky + glint * 0.3 + dither, 1.0);
  }
`

export function AuroraBackground({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const updatePalette = useRef<((dark: boolean) => void) | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' })
    if (!gl) return

    const program = gl.createProgram()
    if (!program) return
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type)
      if (!shader) continue
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      gl.attachShader(program, shader)
      gl.deleteShader(shader)
    }
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }
    gl.useProgram(program)
    const triangle = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const resolution = gl.getUniformLocation(program, 'resolution')
    const time = gl.getUniformLocation(program, 'time')
    const darkUniform = gl.getUniformLocation(program, 'dark')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let elapsed = 0
    let previous = 0
    let visible = true

    const draw = () => {
      gl.uniform1f(time, elapsed)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const tick = (now: number) => {
      if (now - previous >= 1000 / 24) {
        elapsed += Math.min(now - previous, 100) / 1000
        previous = now
        draw()
      }
      frame = requestAnimationFrame(tick)
    }
    updatePalette.current = (darkMode) => {
      gl.uniform1i(darkUniform, Number(darkMode))
      draw()
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      if (!visible || document.hidden || gl.isContextLost()) return
      previous = performance.now()
      draw()
      if (!motion.matches) frame = requestAnimationFrame(tick)
    }
    const resize = new ResizeObserver(() => {
      // The glow is low frequency. Bound the drawing buffer even on high-DPI displays.
      const scale = Math.min(1, 1440 / Math.max(1, canvas.clientWidth, canvas.clientHeight))
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(resolution, canvas.width, canvas.height)
      sync()
    })
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    resize.observe(canvas)
    observer.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    motion.addEventListener('change', sync)
    canvas.addEventListener('webglcontextlost', sync)
    return () => {
      updatePalette.current = null
      cancelAnimationFrame(frame)
      resize.disconnect()
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      motion.removeEventListener('change', sync)
      canvas.removeEventListener('webglcontextlost', sync)
      gl.deleteBuffer(triangle)
      gl.deleteProgram(program)
      if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  useEffect(() => { updatePalette.current?.(dark) }, [dark])

  return <canvas ref={canvasRef} className="block size-full" />
}
