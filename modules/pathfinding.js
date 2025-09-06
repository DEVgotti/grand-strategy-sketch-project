// Pathfinding wrapper (A* via pathfinding.js over CDN ESM)
import PF from 'https://esm.sh/pathfinding@0.4.18'

/**
 * Construye una Grid PF desde el DOM actual del mapa, usando data-x / data-y
 * Retorna { grid, rows, cols }
 */
export const buildGridFromDOM = (mapEl = document.getElementById('map')) => {
    if (!mapEl) throw new Error('Map element not found')
    const counties = Array.from(mapEl.querySelectorAll('.county'))
    if (counties.length === 0) return { grid: new PF.Grid(0, 0), rows: 0, cols: 0 }

    let maxX = 0
    let maxY = 0
    for (const el of counties) {
        const x = Number(el.dataset.x)
        const y = Number(el.dataset.y)
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
    }
    const cols = maxX + 1
    const rows = maxY + 1

    // Por defecto todas las celdas son transitables (walkable)
    const grid = new PF.Grid(cols, rows)

    return { grid, rows, cols }
}

/**
 * Encuentra ruta entre dos counties (elementos DOM con data-x / data-y)
 * Devuelve un array de pares [x, y]
 */
export const findPath = (startEl, endEl, grid) => {
    if (!startEl || !endEl) return []
    const sx = Number(startEl.dataset.x)
    const sy = Number(startEl.dataset.y)
    const ex = Number(endEl.dataset.x)
    const ey = Number(endEl.dataset.y)
    if (Number.isNaN(sx) || Number.isNaN(sy) || Number.isNaN(ex) || Number.isNaN(ey)) return []

    const finder = new PF.AStarFinder({ diagonalMovement: PF.DiagonalMovement.Never })
    // Ojo: PF.Grid es mutable durante la búsqueda, clónalo por cada findPath
    const path = finder.findPath(sx, sy, ex, ey, grid.clone())
    return path
}

/**
 * Utilidad simple para saber si hay ruta (>= 1 paso)
 */
export const isReachable = (startEl, endEl, grid) => {
    const path = findPath(startEl, endEl, grid)
    return Array.isArray(path) && path.length > 0
}