import bus from './bus.js'

/**
 * Game loop simple basado en setInterval
 * - Intervalo por defecto: 1000ms (1s)
 * - Emite 'tick' en cada intervalo: { tick, now, dt, elapsedMs, intervalMs }
 * - Emite 'second' como alias por compatibilidad: { second, elapsedMs }
 * - Controles: start, stop, setIntervalMs, isRunning, getTick, getIntervalMs
 */
export const createGameLoop = (opts = {}) => {
    let intervalMs = Number(opts.intervalMs || 1000)
    let timer = null
    let running = false
    let tick = 0
    let lastTime = 0
    let startTime = 0

    const emitTick = () => {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const elapsedMs = now - startTime
        const dt = now - lastTime
        tick += 1

        // Evento principal de loop
        bus.emit('tick', { tick, now, dt, elapsedMs, intervalMs })

        // Alias de compatibilidad
        bus.emit('second', { second: tick, elapsedMs })

        lastTime = now
    }

    const start = () => {
        if (running) return
        running = true
        tick = 0
        startTime = lastTime = (typeof performance !== 'undefined' ? performance.now() : Date.now())
        timer = setInterval(emitTick, intervalMs)
        bus.emit('loop.started', { intervalMs })
    }

    const stop = () => {
        if (!running) return
        clearInterval(timer)
        timer = null
        running = false
        bus.emit('loop.stopped', { tick })
    }

    const setIntervalMs = (ms) => {
        const next = Number(ms)
        if (!Number.isFinite(next) || next <= 0) return
        intervalMs = next
        if (running) {
            clearInterval(timer)
            timer = setInterval(emitTick, intervalMs)
            bus.emit('loop.interval_changed', { intervalMs })
        }
    }

    const isRunning = () => running
    const getTick = () => tick
    const getIntervalMs = () => intervalMs

    return {
        start,
        stop,
        isRunning,
        getTick,
        getIntervalMs,
        setIntervalMs,
    }
}

export default createGameLoop