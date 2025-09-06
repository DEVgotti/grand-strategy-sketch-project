export const createEventsModule = (mapModule, troopsModule, armyModule, combatModule) => {
    const handleClick = (event) => {
        const target = event.target

        // Click on a county
        if (mapModule.isCounty(target)) {
            mapModule.selectCounty(target)
            mapModule.onClickShowName(target)

            // If a troop is selected and we click a county, attempt move
            const selectedCounty = mapModule.getSelectedCounty()
            if (troopsModule.getSelectedTroop()) {
                // Reuse existing logic in troops module
                troopsModule.selectTroop(event, selectedCounty)
            }
            return
        }

        // Click on spawn buttons
        const btn = target.closest ? target.closest('button') : null
        if (btn) {
            const selectedCounty = mapModule.getSelectedCounty()
            if (selectedCounty) {
                troopsModule.spawnTroops(event, selectedCounty, armyModule)
            }
            return
        }

        // Click on a troop
        if (troopsModule.isTroop(target)) {
            const selectedCounty = mapModule.getSelectedCounty()
            if (selectedCounty) {
                troopsModule.selectTroop(event, selectedCounty)
            }
            return
        }
    }

    const init = () => {
        const app = document.querySelector('.app')
        if (!app) return
        app.addEventListener('click', handleClick)
    }

    return {
        handleClick,
        init,
    }
}