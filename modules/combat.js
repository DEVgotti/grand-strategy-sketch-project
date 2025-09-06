import bus from './bus.js'

export const createCombatModule = () => {
    // Hay enemigos si coexisten bandos distintos en el mismo county
    const hasEnemies = (county) => {
        if (!county) return false
        const sides = new Set(
            Array.from(county.querySelectorAll('.troop')).map(el => el.dataset?.side)
        )
        return sides.has('ally') && sides.has('enemy')
    }

    const getEnemies = (county) => county.querySelectorAll('.troop')

    const fight = (enemies) => {
        const stacks = Array.from(enemies || [])
        if (stacks.length === 0) return

        const county = stacks[0].closest ? stacks[0].closest('.county') : null
        if (!county) return

        const before = readTotals(county)
        const after = resolveCombat(JSON.parse(JSON.stringify(before)))

        writeBackTotals(county, after)

        bus.emit('combat.resolved', { countyEl: county, before, after })
        console.debug('[combat] resolved', { before, after })
    }

    // Lee totales agregados por bando y tipo desde el DOM
    const readTotals = (county) => {
        const totals = {
            ally: { infantry: 0, tank: 0 },
            enemy: { infantry: 0, tank: 0 },
        }
        const stacks = Array.from(county.querySelectorAll('.troop'))
        for (const el of stacks) {
            const side = el.dataset?.side === 'enemy' ? 'enemy' : 'ally'
            const type = el.dataset?.type === 'tank' ? 'tank' : 'infantry'
            const count = Math.max(0, Number(el.dataset?.count || '1') || 0)
            totals[side][type] += count
        }
        return totals
    }

    // Reglas simples de combate:
    // - Superioridad: tank elimina infantry 1:1 (aplicación simultánea por bandos)
    // - Mismo tipo: se resuelve por rondas de "dado" hasta que uno llega a 0
    const resolveCombat = (totals) => {
        const t = totals

        // Superioridad cruzada
        {
            const aTankKills = Math.min(t.ally.tank, t.enemy.infantry)
            const eTankKills = Math.min(t.enemy.tank, t.ally.infantry)
            t.enemy.infantry = Math.max(0, t.enemy.infantry - aTankKills)
            t.ally.infantry = Math.max(0, t.ally.infantry - eTankKills)
        }

        // Mismo tipo por dados
        const roll = () => 1 + Math.floor(Math.random() * 6)

        while (t.ally.infantry > 0 && t.enemy.infantry > 0) {
            const a = roll(); const e = roll()
            if (a >= e) t.enemy.infantry--
            else t.ally.infantry--
        }

        while (t.ally.tank > 0 && t.enemy.tank > 0) {
            const a = roll(); const e = roll()
            if (a >= e) t.enemy.tank--
            else t.ally.tank--
        }

        // Clamp
        t.ally.infantry = Math.max(0, t.ally.infantry)
        t.ally.tank = Math.max(0, t.ally.tank)
        t.enemy.infantry = Math.max(0, t.enemy.infantry)
        t.enemy.tank = Math.max(0, t.enemy.tank)

        return t
    }

    // Vuelca los totales post-combate al DOM, unificando stacks por bando+tipo
    const writeBackTotals = (county, totals) => {
        const ensureBadge = (el) => {
            let badge = el.querySelector('.badge')
            if (!badge) {
                badge = document.createElement('span')
                badge.classList.add('badge')
                el.appendChild(badge)
            }
            return badge
        }
        const setCount = (el, n) => {
            el.dataset.count = String(n)
            const badge = ensureBadge(el)
            badge.textContent = String(n)
            const t = el.dataset?.type || '?'
            const s = el.dataset?.side || '?'
            el.title = `${t} (${s}) x${n}`
        }

        const applyFor = (side, type, count) => {
            const nodes = Array.from(county.querySelectorAll(`.troop.${type}.${side}`))
            if (count <= 0) {
                nodes.forEach(n => n.remove())
                return
            }
            // Debe existir al menos uno; si hay varios, unificar
            const keep = nodes[0]
            if (keep) {
                setCount(keep, count)
                for (let i = 1; i < nodes.length; i++) nodes[i].remove()
            }
        }

        applyFor('ally', 'infantry', totals.ally.infantry)
        applyFor('ally', 'tank', totals.ally.tank)
        applyFor('enemy', 'infantry', totals.enemy.infantry)
        applyFor('enemy', 'tank', totals.enemy.tank)

        // Determinar owner del county tras aplicar bajas (sticky cuando no hay tropas)
        const allyTotal = Math.max(0, (totals.ally.infantry || 0)) + Math.max(0, (totals.ally.tank || 0))
        const enemyTotal = Math.max(0, (totals.enemy.infantry || 0)) + Math.max(0, (totals.enemy.tank || 0))

        const prevOwner = county.dataset.owner || 'neutral'
        const prevLastOwner = county.dataset.lastOwner || prevOwner

        let newOwner = prevOwner
        let newLastOwner = prevLastOwner

        if (allyTotal > 0 && enemyTotal > 0) {
            newOwner = 'contested'
            // No cambiamos lastOwner en disputa
        } else if (allyTotal > 0) {
            newOwner = 'ally'
            newLastOwner = 'ally'
        } else if (enemyTotal > 0) {
            newOwner = 'enemy'
            newLastOwner = 'enemy'
        } else {
            // Ambos bandos a 0: mantener último dueño conocido
            newOwner = prevLastOwner
        }

        // Persistir lastOwner
        county.dataset.lastOwner = newLastOwner

        // Actualizar DOM y emitir evento solo si hay cambio real de owner visible
        if (newOwner !== prevOwner) {
            county.dataset.owner = newOwner
            county.classList.remove('owner-ally', 'owner-enemy', 'owner-contested', 'owner-neutral')
            county.classList.add(`owner-${newOwner}`)
            bus.emit('map.owner_changed', { countyEl: county, owner: newOwner })
        }
    }

    const mergeTroops = () => { /* reservado para lógica futura si es necesaria */ }

    return {
        hasEnemies,
        getEnemies,
        fight,
        mergeTroops
    }
}