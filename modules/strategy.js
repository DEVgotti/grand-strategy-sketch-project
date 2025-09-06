import { createMapModule } from './map.js'
import { createTroopsModule } from './troops.js'
import { createCombatModule } from './combat.js'
import { createArmyModule } from './army.js'
import { createEventsModule } from './events.js'
import { loadArmy } from './persistence.js'
import { createHudModule } from './hud.js'
import { createGameLoop } from './loop.js'
import { createBuildingsModule } from './buildings.js'

export const createStrategyGame = () => {
    // Create all modules
    const mapModule = createMapModule()
    const combatModule = createCombatModule()
    const armyModule = createArmyModule()
    const troopsModule = createTroopsModule(mapModule, combatModule)
    const buildingsModule = createBuildingsModule(mapModule, troopsModule, armyModule)
    const eventsModule = createEventsModule(mapModule, troopsModule, armyModule, combatModule, buildingsModule)
    const hudModule = createHudModule(armyModule, buildingsModule)
    const loop = createGameLoop({ intervalMs: 1000 })

    // Load persisted state (army) before wiring events
    loadArmy().then((saved) => {
        if (saved) {
            armyModule.setArmy(saved)
            // Refrescar HUD tras cargar estado persistido
            hudModule.refresh()
        }
    }).catch(console.error)

    // Init event delegation within app container
    eventsModule.init()
    hudModule.init()
    buildingsModule.init()
    loop.start()

    return {
        generateMap: mapModule.generateMap,
        startLoop: loop.start,
        stopLoop: loop.stop,
        getTick: loop.getTick,
        setLoopInterval: loop.setIntervalMs,
    }
}