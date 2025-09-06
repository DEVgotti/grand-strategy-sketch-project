export const createEventsModule = (mapModule, troopsModule, armyModule, combatModule) => {
    let spawnTroopsHandler = null
    let selectTroopHandler = null

    const handleActions = (event) => {
        const county = event.target
        if (mapModule.isCounty(county)) {
            mapModule.selectCounty(county)
            mapModule.onClickShowName(county)

            // Remove any existing event listeners to prevent duplicates
            if (spawnTroopsHandler) {
                document.removeEventListener('click', spawnTroopsHandler)
            }
            if (selectTroopHandler) {
                document.removeEventListener('click', selectTroopHandler)
            }

            // Define new event handlers with current context
            spawnTroopsHandler = (e) => {
                const selectedCounty = mapModule.getSelectedCounty()
                if (selectedCounty) {
                    troopsModule.spawnTroops(e, selectedCounty, armyModule)
                }
            }

            selectTroopHandler = (e) => {
                const selectedCounty = mapModule.getSelectedCounty()
                if (selectedCounty) {
                    troopsModule.selectTroop(e, selectedCounty)
                }
            }

            // Add new event listeners
            document.addEventListener('click', spawnTroopsHandler)
            document.addEventListener('click', selectTroopHandler)
        }
    }

    return {
        handleActions
    }
}