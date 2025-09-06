import { createMapModule } from './map.js'
import { createTroopsModule } from './troops.js'
import { createCombatModule } from './combat.js'
import { createArmyModule } from './army.js'
import { createEventsModule } from './events.js'
import { loadArmy } from './persistence.js'

export const createStrategyGame = () => {
    // Create all modules
    const mapModule = createMapModule()
    const combatModule = createCombatModule()
    const armyModule = createArmyModule()
    const troopsModule = createTroopsModule(mapModule, combatModule)
    const eventsModule = createEventsModule(mapModule, troopsModule, armyModule, combatModule)

    // Load persisted state (army) before wiring events
    loadArmy().then((saved) => {
        if (saved) {
            armyModule.setArmy(saved)
        }
    }).catch(console.error)

    // Init event delegation within app container
    eventsModule.init()

    return {
        generateMap: mapModule.generateMap
    }
}