import bus from './bus.js'
import { clearArmy } from './persistence.js'

/**
 * HUD de ejército y economía:
 * - Muestra totales aliados (desde ArmyModule) y enemigos (desde DOM).
 * - Muestra recursos y edificios (desde BuildingsModule).
 * - Actualiza en respuesta a eventos del bus y ticks del loop.
 * - Botón Reset para limpiar persistencia y reiniciar el conteo aliado.
 */
export const createHudModule = (armyModule, buildingsModule) => {
    // Elementos del DOM
    let elAllyInfantry = null
    let elAllyTank = null
    let elEnemyInfantry = null
    let elEnemyTank = null

    // Economía / edificios
    let elFood = null
    let elBuildFarms = null
    let elBuildBarracks = null
    let elBuildFactories = null

    let btnReset = null

    const queryElements = () => {
        elAllyInfantry = document.getElementById('hud_ally_infantry')
        elAllyTank = document.getElementById('hud_ally_tank')
        elEnemyInfantry = document.getElementById('hud_enemy_infantry')
        elEnemyTank = document.getElementById('hud_enemy_tank')

        elFood = document.getElementById('hud_food')
        elBuildFarms = document.getElementById('hud_build_farms')
        elBuildBarracks = document.getElementById('hud_build_barracks')
        elBuildFactories = document.getElementById('hud_build_factories')

        btnReset = document.getElementById('btnResetArmy')
    }

    // Ejército aliado desde ArmyModule
    const readAllyFromArmy = () => {
        const army = (armyModule && typeof armyModule.getArmy === 'function')
            ? armyModule.getArmy()
            : { infantry: { quantity: 0 }, tank: { quantity: 0 } }

        const infantry = Number(army?.infantry?.quantity || 0)
        const tank = Number(army?.tank?.quantity || 0)
        return { infantry, tank }
    }

    // Enemigos desde DOM (suma de stacks .troop.enemy)
    const readEnemyFromDOM = () => {
        const enemies = Array.from(document.querySelectorAll('.troop.enemy'))
        let infantry = 0
        let tank = 0
        for (const el of enemies) {
            const type = el.dataset?.type === 'tank' ? 'tank' : 'infantry'
            const count = Number(el.dataset?.count || '1') || 0
            if (type === 'tank') tank += count
            else infantry += count
        }
        return { infantry, tank }
    }

    // Economía/edificios desde BuildingsModule
    const readBuildingsTotals = () => {
        if (!buildingsModule || typeof buildingsModule.getTotals !== 'function') {
            return { food: 0, buildings: { farms: 0, barracks: 0, factories: 0 } }
        }
        const t = buildingsModule.getTotals()
        const food = Number(t?.food || 0)
        const farms = Number(t?.buildings?.farms || 0)
        const barracks = Number(t?.buildings?.barracks || 0)
        const factories = Number(t?.buildings?.factories || 0)
        return { food, buildings: { farms, barracks, factories } }
    }

    const renderAlly = () => {
        if (!elAllyInfantry || !elAllyTank) return
        const { infantry, tank } = readAllyFromArmy()
        elAllyInfantry.textContent = String(infantry)
        elAllyTank.textContent = String(tank)
    }

    const renderEnemy = () => {
        if (!elEnemyInfantry || !elEnemyTank) return
        const { infantry, tank } = readEnemyFromDOM()
        elEnemyInfantry.textContent = String(infantry)
        elEnemyTank.textContent = String(tank)
    }

    const renderEconomy = () => {
        const totals = readBuildingsTotals()
        if (elFood) elFood.textContent = String(totals.food)
        if (elBuildFarms) elBuildFarms.textContent = String(totals.buildings.farms)
        if (elBuildBarracks) elBuildBarracks.textContent = String(totals.buildings.barracks)
        if (elBuildFactories) elBuildFactories.textContent = String(totals.buildings.factories)
    }

    const refresh = () => {
        renderAlly()
        renderEnemy()
        renderEconomy()
    }

    const attachEvents = () => {
        // Spawns -> actualiza ejército aliado (o enemigo si aplica)
        bus.on('troops.spawned', (payload) => {
            if (payload?.side === 'ally') renderAlly()
            else renderEnemy()
        })

        // Combate -> recalc ambos
        bus.on('combat.resolved', () => {
            refresh()
        })

        // Producción y conversiones -> economía cambia
        bus.on('buildings.produced', () => {
            renderEconomy()
        })
        bus.on('buildings.converted', () => {
            // Al convertir en unidades, army aliado podría cambiar si autoproducción suma
            renderEconomy()
            renderAlly()
        })
        bus.on('buildings.placed', () => {
            renderEconomy()
        })
        bus.on('buildings.removed', () => {
            renderEconomy()
        })

        // Tick del loop -> refresco ligero de economía
        bus.on('tick', () => {
            renderEconomy()
        })

        // Botón de reset del ejército aliado
        if (btnReset) {
            btnReset.addEventListener('click', async () => {
                try {
                    await clearArmy()
                } catch (e) {
                    console.error('HUD clearArmy error', e)
                }
                // Reiniciar estado en memoria del ArmyModule
                if (armyModule && typeof armyModule.setArmy === 'function') {
                    armyModule.setArmy({
                        infantry: { quantity: 0 },
                        tank: { quantity: 0 },
                    })
                }
                renderAlly()
            })
        }
    }

    const init = () => {
        queryElements()
        attachEvents()
        refresh()
    }

    return {
        init,
        refresh,
    }
}

export default createHudModule