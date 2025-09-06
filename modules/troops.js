import { generateRandomId } from '../helpers/generateId.js'

export const createTroopsModule = (mapModule, combatModule) => {
    let selectedTroop = null

    const isTroop = (troop) => troop.tagName === 'DIV' && troop.classList.contains('troop')

    const spawnTroops = (event, selectedCounty, armyModule) => {
        if (event.target.tagName !== 'BUTTON') return

        const spawnType = event.target
        const countyName = selectedCounty.getAttribute('title')
        console.log(`${countyName} selected`)

        // Check if county already has troops
        const hasTroops = selectedCounty.querySelectorAll('.troop').length > 0

        if (!hasTroops) {
            const stack = selectedCounty.appendChild(document.createElement('div'))
            stack.classList.add('troop')
            const troopId = generateRandomId()
            stack.setAttribute('data-id', troopId)
        }

        // Update army count
        if (spawnType.classList.contains('infantry')) {
            // Only add class if we just created a new troop
            if (!hasTroops) {
                selectedCounty.getElementsByClassName('troop')[0].classList.add('infantry')
            }
            armyModule.addInfantry()
        } else {
            // Only add class if we just created a new troop
            if (!hasTroops) {
                selectedCounty.getElementsByClassName('troop')[0].classList.add('tank')
            }
            armyModule.addTank()
        }

        // Check for enemies after spawning
        if (combatModule.hasEnemies(selectedCounty)) {
            console.log('Enemy')
            combatModule.fight(combatModule.getEnemies(selectedCounty))
        }
    }

    const selectTroop = async (event, selectedCounty) => {
        const element = event.target

        if (isTroop(element)) {
            if (selectedTroop && mapModule.isCounty(element)) {
                console.log(`Moving to ${element.title}`)
                await moveTroop(selectedTroop, element)
                selectedTroop = null
            } else {
                console.log('Troop selected')
                selectedTroop = element
            }
        } else {
            if (selectedTroop && mapModule.isCounty(element)) {
                console.log(`Moving to ${element.title}`)
                await moveTroop(selectedTroop, element).then(() => {
                    if (combatModule.hasEnemies(selectedCounty)) {
                        console.log('Enemy')
                        combatModule.fight(combatModule.getEnemies(selectedCounty))
                    }
                })
                selectedTroop = null
            }
        }
    }

    const moveTroop = (troop, county) => {
        return new Promise((resolve) => {
            const troopClone = county.appendChild(troop.cloneNode(true))
            troopClone.style.visibility = 'hidden'

            const targetRect = county.getBoundingClientRect()
            const troopRect = troop.getBoundingClientRect()

            const offsetX = targetRect.left + targetRect.width / 2 - (troopRect.left + troopRect.width / 2)
            const offsetY = targetRect.top + targetRect.height / 2 - (troopRect.top + troopRect.height / 2)

            troop.style.transition = 'transform 5s ease-in-out'
            troop.style.transform = `translate(${offsetX}px, ${offsetY}px)`

            // Esperar a que termine la transición antes de resolver la promesa
            troop.addEventListener('transitionend', function handler() {
                troopClone.style.visibility = 'visible'
                troop.remove()
                troop.removeEventListener('transitionend', handler)

                resolve() // Resolvemos la promesa después de que la transición haya terminado
            })
        })
    }

    const getSelectedTroop = () => selectedTroop

    const setSelectedTroop = (troop) => {
        selectedTroop = troop
    }

    return {
        isTroop,
        spawnTroops,
        selectTroop,
        moveTroop,
        getSelectedTroop,
        setSelectedTroop
    }
}