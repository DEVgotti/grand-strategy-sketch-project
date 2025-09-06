import { createMapModule } from './map.js'
import { createTroopsModule } from './troops.js'
import { createCombatModule } from './combat.js'
import { createArmyModule } from './army.js'
import { createEventsModule } from './events.js'

export const createStrategyGame = () => {
    // Create all modules
    const mapModule = createMapModule()
    const combatModule = createCombatModule()
    const armyModule = createArmyModule()
    const troopsModule = createTroopsModule(mapModule, combatModule)
    const eventsModule = createEventsModule(mapModule, troopsModule, armyModule, combatModule)

    // Add global event listener
    document.addEventListener('click', eventsModule.handleActions)

    return {
        generateMap: mapModule.generateMap
    }
}