import bus from './bus.js'
import { clearArmy } from './persistence.js'

/**
 * HUD de ejército: muestra totales aliados (desde ArmyModule) y enemigos (desde DOM).
 * - Actualiza en respuesta a eventos del bus.
 * - Botón Reset para limpiar persistencia y reiniciar el conteo aliado.
 */
export const createHudModule = (armyModule) => {
    // Elementos del DOM
    let elAllyInfantry = null
    let elAllyTank = null
    let elEnemyInfantry = null
    let elEnemyTank = null
    let btnReset = null

    const queryElements = () => {
        elAllyInfantry = document.getElementById('hud_ally_infantry')
        elAllyTank = document.getElementById('hud_ally_tank')
        elEnemyInfantry = document.getElementById('hud_enemy_infantry')
        elEnemyTank = document.getElementById('hud_enemy_tank')
        btnReset = document.getElementById('btnResetArmy')
    }

    const readAllyFromArmy = () => {
        const army = (armyModule && typeof armyModule.getArmy === 'function')
            ? armyModule.getArmy()
            : { infantry: { quantity: 0 }, tank: { quantity: 0 } }

        const infantry = Number(army?.infantry?.quantity || 0)
        const tank = Number(army?.tank?.quantity || 0)
        return { infantry, tank }
    }

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

    const refresh = () => {
        renderAlly()
        renderEnemy()
    }

    const attachEvents = () => {
        // Actualiza HUD tras spawns
        bus.on('troops.spawned', (payload) => {
            // Aliado: refrescar desde Army; Enemigo: desde DOM
            if (payload?.side === 'ally') renderAlly()
            else renderEnemy()
        })

        // Tras resolver combate, los enemigos (y quizá aliados si se extiende la lógica)
        // cambian en el mapa; refrescar ambos por seguridad
        bus.on('combat.resolved', () => {
            refresh()
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