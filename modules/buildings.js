import bus from './bus.js'

/**
 * Buildings module
 * - Tipos: farm, barracks, factory
 * - Reglas por tick (1s):
 *   - farm: +1 food/ tick (si owner=ally)
 *   - barracks: cada 5 ticks si storedFood >=5 consume 5 y spawnea 1 infantry ally
 *   - factory:  cada 10 ticks si storedFood >=10 consume 10 y spawnea 1 tank ally
 *
 * Estado: por county (clave "x,y") -> { type, storedFood, progress }
 */
export const createBuildingsModule = (mapModule, troopsModule, armyModule) => {
    /** @type {Record<string, { type:'farm'|'barracks'|'factory', storedFood:number, progress:number }>} */
    const state = Object.create(null)

    const keyFor = (countyEl) => {
        const x = countyEl?.dataset?.x
        const y = countyEl?.dataset?.y
        return (x != null && y != null) ? `${x},${y}` : null
    }

    const hasBuilding = (countyEl) => {
        const k = keyFor(countyEl)
        return !!(k && state[k])
    }

    const getBuilding = (countyEl) => {
        const k = keyFor(countyEl)
        return k ? (state[k] || null) : null
    }

    const setBadge = (countyEl, type) => {
        if (!countyEl) return
        let tag = countyEl.querySelector('.building_tag')
        if (!tag) {
            tag = document.createElement('span')
            tag.classList.add('building_tag')
            countyEl.appendChild(tag)
        }
        const short = type === 'farm' ? 'F' : (type === 'barracks' ? 'B' : 'Fa')
        tag.textContent = short
        tag.title = `Building: ${type}`
    }

    const clearBadge = (countyEl) => {
        const tag = countyEl?.querySelector?.('.building_tag')
        if (tag) tag.remove()
    }

    const canPlace = (countyEl, type) => {
        if (!countyEl || !mapModule?.isCounty(countyEl)) return false
        const owner = countyEl.dataset?.owner || 'neutral'
        if (owner !== 'ally') return false
        if (hasBuilding(countyEl)) return false
        return type === 'farm' || type === 'barracks' || type === 'factory'
    }

    const placeBuilding = (countyEl, type) => {
        if (!canPlace(countyEl, type)) return false
        const k = keyFor(countyEl)
        state[k] = { type, storedFood: 0, progress: 0 }
        setBadge(countyEl, type)
        bus.emit('buildings.placed', { countyEl, type })
        return true
    }

    const removeBuilding = (countyEl) => {
        const k = keyFor(countyEl)
        const prev = k ? state[k] : null
        if (!k || !prev) return false
        delete state[k]
        clearBadge(countyEl)
        bus.emit('buildings.removed', { countyEl, type: prev.type })
        return true
    }

    const produceFarm = (countyEl, b) => {
        b.storedFood += 1
        bus.emit('buildings.produced', { countyEl, type: 'farm', produced: { food: 1 }, storedFood: b.storedFood })
    }

    const tryBarracks = (countyEl, b) => {
        b.progress += 1
        if (b.progress % 5 === 0 && b.storedFood >= 5) {
            b.storedFood -= 5
            // Auto-spawn 1 infantry ally
            if (typeof troopsModule.spawnByType === 'function') {
                troopsModule.spawnByType('infantry', countyEl, armyModule, 'ally')
            } else {
                // fallback mínimo: crear DOM directamente
                const el = countyEl.querySelector('.troop.ally.infantry') || (() => {
                    const d = document.createElement('div')
                    d.classList.add('troop', 'ally', 'infantry')
                    d.dataset.type = 'infantry'
                    d.dataset.side = 'ally'
                    d.dataset.count = '0'
                    countyEl.appendChild(d)
                    return d
                })()
                const next = (Number(el.dataset.count || '0') || 0) + 1
                el.dataset.count = String(next)
            }
            bus.emit('buildings.converted', { countyEl, type: 'barracks', result: 'infantry', storedFood: b.storedFood })
        }
    }

    const tryFactory = (countyEl, b) => {
        b.progress += 1
        if (b.progress % 10 === 0 && b.storedFood >= 10) {
            b.storedFood -= 10
            // Auto-spawn 1 tank ally
            if (typeof troopsModule.spawnByType === 'function') {
                troopsModule.spawnByType('tank', countyEl, armyModule, 'ally')
            } else {
                const el = countyEl.querySelector('.troop.ally.tank') || (() => {
                    const d = document.createElement('div')
                    d.classList.add('troop', 'ally', 'tank')
                    d.dataset.type = 'tank'
                    d.dataset.side = 'ally'
                    d.dataset.count = '0'
                    countyEl.appendChild(d)
                    return d
                })()
                const next = (Number(el.dataset.count || '0') || 0) + 1
                el.dataset.count = String(next)
            }
            bus.emit('buildings.converted', { countyEl, type: 'factory', result: 'tank', storedFood: b.storedFood })
        }
    }

    const onTick = () => {
        // Para cada county con building, si owner=ally aplicar reglas
        const entries = Object.entries(state)
        for (const [k, b] of entries) {
            const [x, y] = k.split(',').map(Number)
            const countyEl = document.querySelector(`.county[data-x="${x}"][data-y="${y}"]`)
            if (!countyEl) continue
            const owner = countyEl.dataset?.owner || 'neutral'
            if (owner !== 'ally') continue

            if (b.type === 'farm') produceFarm(countyEl, b)
            else if (b.type === 'barracks') tryBarracks(countyEl, b)
            else if (b.type === 'factory') tryFactory(countyEl, b)
        }
    }

    // HUD helpers
    const getTotals = () => {
        let food = 0
        let farms = 0, barracks = 0, factories = 0
        for (const b of Object.values(state)) {
            food += b.storedFood
            if (b.type === 'farm') farms++
            if (b.type === 'barracks') barracks++
            if (b.type === 'factory') factories++
        }
        return { food, buildings: { farms, barracks, factories } }
    }

    const getState = () => JSON.parse(JSON.stringify(state))

    const init = () => {
        // Suscribirse al loop (emitido por modules/loop.js)
        bus.on('tick', onTick)
    }

    return {
        init,
        onTick,
        placeBuilding,
        removeBuilding,
        hasBuilding,
        getBuilding,
        getTotals,
        getState,
    }
}

export default createBuildingsModule