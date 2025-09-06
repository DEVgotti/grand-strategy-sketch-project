import bus from './bus.js'
export const createEventsModule = (mapModule, troopsModule, armyModule, combatModule) => {
    const handleClick = (event) => {
        const target = event.target

        // Click on a county
        if (mapModule.isCounty(target)) {
            mapModule.selectCounty(target)
            mapModule.onClickShowName(target)

            // Emit selection event
            const x = Number(target.dataset.x)
            const y = Number(target.dataset.y)
            const name = target.title
            bus.emit('map.county_selected', { el: target, x, y, name })

            // If a troop is selected and we click a county, attempt move
            const selectedCounty = mapModule.getSelectedCounty()
            if (troopsModule.getSelectedTroop()) {
                // Notify move request
                bus.emit('troops.move_requested', { fromTroopEl: troopsModule.getSelectedTroop(), toCountyEl: selectedCounty })
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
                const type = btn.classList.contains('infantry') ? 'infantry'
                    : (btn.classList.contains('tank') ? 'tank' : 'unknown')
                bus.emit('troops.spawn_requested', { type, countyEl: selectedCounty })
                troopsModule.spawnTroops(event, selectedCounty, armyModule)
            }
            return
        }

        // Click on a troop
        if (troopsModule.isTroop(target)) {
            bus.emit('troops.select_requested', { troopEl: target })
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