/**
 * Bootstrap + Logging config
 * - DEBUG global: activar con ?debug=1 o localStorage.DEBUG='1'
 * - console.debug/info condicionadas por DEBUG
 */
(() => {
    const params = new URLSearchParams(window.location.search)
    const urlDebug = params.get('debug')
    const stored = window.localStorage ? localStorage.getItem('DEBUG') : null

    const initial = urlDebug === '1' || stored === '1'
    window.DEBUG = initial

    // Permitir alternar en runtime y persistir
    window.setDebug = (flag) => {
        window.DEBUG = !!flag
        try {
            if (window.DEBUG) localStorage.setItem('DEBUG', '1')
            else localStorage.removeItem('DEBUG')
        } catch { /* ignore */ }
    }

    const debugOn = () => !!window.DEBUG

    // Envolver niveles: debug / info
    const wrapLevel = (name, tag) => {
        const orig = console[name] ? console[name].bind(console) : console.log.bind(console)
        console[name] = (...args) => {
            if (!debugOn()) return
            if (typeof args[0] === 'string') {
                orig(`${tag} ${args[0]}`, ...args.slice(1))
            } else {
                orig(tag, ...args)
            }
        }
    }
    wrapLevel('debug', '[debug]')
    wrapLevel('info', '[info]')
})();

// Cargar juego tras configurar logging
; (async () => {
    const { createStrategyGame } = await import('./modules/strategy.js')
    const game = createStrategyGame()
    game.generateMap(5, 5)
})()
