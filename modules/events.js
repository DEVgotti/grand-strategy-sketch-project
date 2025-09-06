import bus from './bus.js'
export const createEventsModule = (mapModule, troopsModule, armyModule, combatModule, buildingsModule) => {
    const enableSpawnButtons = (enabled) => {
        const infBtn = document.querySelector('#properties .troop_movilization .infantry')
        const tankBtn = document.querySelector('#properties .troop_movilization .tank')
        if (infBtn) infBtn.disabled = !enabled
        if (tankBtn) tankBtn.disabled = !enabled
    }

    const updateBuildingButtonsForCounty = (county) => {
        const owner = county?.dataset?.owner || 'neutral'
        const farmBtn = document.querySelector('#properties .buildings .farm')
        const barracksBtn = document.querySelector('#properties .buildings .barracks')
        const factoryBtn = document.querySelector('#properties .buildings .factory')
        const canBuild = owner === 'ally' && buildingsModule && !buildingsModule.hasBuilding(county)
        const set = (btn) => { if (btn) btn.disabled = !canBuild }
        set(farmBtn); set(barracksBtn); set(factoryBtn)
    }

    const handleClick = (event) => {
        const target = event.target

        // Click on a county
        if (mapModule.isCounty(target)) {
            mapModule.selectCounty(target)
            mapModule.onClickShowName(target)

            // Habilitar botones de despliegue cuando hay county seleccionado
            const infBtn = document.querySelector('#properties .troop_movilization .infantry')
            const tankBtn = document.querySelector('#properties .troop_movilization .tank')
            if (infBtn) infBtn.disabled = false
            if (tankBtn) tankBtn.disabled = false

            // Actualizar disponibilidad de construcción según owner/slot
            updateBuildingButtonsForCounty(target)

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

        // Click on buttons (spawn or buildings)
        const btn = target.closest ? target.closest('button') : null
        if (btn) {
            const selectedCounty = mapModule.getSelectedCounty()
            if (!selectedCounty) return

            // Troop spawn
            if (btn.classList.contains('infantry') || btn.classList.contains('tank')) {
                const type = btn.classList.contains('infantry') ? 'infantry' : 'tank'
                bus.emit('troops.spawn_requested', { type, countyEl: selectedCounty })
                troopsModule.spawnTroops(event, selectedCounty, armyModule)
                // Por si cambia owner tras spawn, actualizar botones de edificios
                updateBuildingButtonsForCounty(selectedCounty)
                return
            }

            // Buildings
            if (btn.classList.contains('farm') || btn.classList.contains('barracks') || btn.classList.contains('factory')) {
                const type = btn.classList.contains('farm') ? 'farm' :
                    (btn.classList.contains('barracks') ? 'barracks' : 'factory')
                const ok = buildingsModule && buildingsModule.placeBuilding(selectedCounty, type)
                if (ok) {
                    updateBuildingButtonsForCounty(selectedCounty)
                }
                return
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

        // Deshabilitar inicialmente los botones de despliegue hasta que se seleccione un county
        const infBtn = document.querySelector('#properties .troop_movilization .infantry')
        const tankBtn = document.querySelector('#properties .troop_movilization .tank')
        if (infBtn) infBtn.disabled = true
        if (tankBtn) tankBtn.disabled = true

        // Deshabilitar inicialmente botones de edificios
        const farmBtn = document.querySelector('#properties .buildings .farm')
        const barracksBtn = document.querySelector('#properties .buildings .barracks')
        const factoryBtn = document.querySelector('#properties .buildings .factory')
        if (farmBtn) farmBtn.disabled = true
        if (barracksBtn) barracksBtn.disabled = true
        if (factoryBtn) factoryBtn.disabled = true

        // Reaccionar a cambios de owner/edificios para actualizar disponibilidad
        bus.on('map.owner_changed', ({ countyEl }) => {
            const selected = mapModule.getSelectedCounty()
            if (selected && selected === countyEl) {
                updateBuildingButtonsForCounty(selected)
            }
        })
        bus.on('buildings.placed', ({ countyEl }) => {
            const selected = mapModule.getSelectedCounty()
            if (selected && selected === countyEl) {
                updateBuildingButtonsForCounty(selected)
            }
        })
        bus.on('buildings.removed', ({ countyEl }) => {
            const selected = mapModule.getSelectedCounty()
            if (selected && selected === countyEl) {
                updateBuildingButtonsForCounty(selected)
            }
        })
    }

    return {
        handleClick,
        init,
    }
}