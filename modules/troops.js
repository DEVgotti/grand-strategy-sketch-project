import { generateRandomId } from '../helpers/generateId.js'
import bus from './bus.js'
import { buildGridFromDOM, isReachable } from './pathfinding.js'

export const createTroopsModule = (mapModule, combatModule) => {
    let selectedTroop = null

    const isTroop = (troop) => troop.tagName === 'DIV' && troop.classList.contains('troop')

    const spawnTroops = (event, selectedCounty, armyModule) => {
        const btn = event.target?.closest('button') || null
        if (!btn || !selectedCounty) return

        // Determinar tipo a desplegar
        const type = btn.classList.contains('infantry')
            ? 'infantry'
            : (btn.classList.contains('tank') ? 'tank' : null)
        if (!type) return

        // Enemy mode -> side "enemy", por defecto "ally"
        const enemyMode = !!document.getElementById('enemyMode')?.checked
        const side = enemyMode ? 'enemy' : 'ally'

        const countyName = selectedCounty.getAttribute('title') || '(unknown)'
        console.debug(`[troops] spawn.request county=${countyName} type=${type} side=${side}`)

        // Buscar un stack existente en el county con mismo tipo y bando
        const stacks = Array.from(selectedCounty.querySelectorAll('.troop'))
        const match = stacks.find(el => (el.dataset?.type === type) && (el.dataset?.side === side))

        // Helpers para badge de cantidad
        const ensureBadge = (el) => {
            let badge = el.querySelector('.badge')
            if (!badge) {
                badge = document.createElement('span')
                badge.classList.add('badge')
                el.appendChild(badge)
            }
            return badge
        }
        const setCount = (el, n) => {
            el.dataset.count = String(n)
            const badge = ensureBadge(el)
            badge.textContent = String(n)
            // Tooltip informativo
            const t = el.dataset?.type || '?'
            const s = el.dataset?.side || '?'
            el.title = `${t} (${s}) x${n}`
        }

        let troopEl = match || null

        if (match) {
            // Incrementar el conteo del stack existente
            const next = Number(match.dataset.count || '1') + 1
            setCount(match, next)
        } else {
            // Crear nuevo stack
            troopEl = document.createElement('div')
            troopEl.classList.add('troop', type, side)
            troopEl.setAttribute('data-id', generateRandomId())
            troopEl.dataset.type = type
            troopEl.dataset.side = side
            setCount(troopEl, 1)
            selectedCounty.appendChild(troopEl)
        }

        // Actualizar ejército solo para el bando aliado
        if (side === 'ally') {
            if (type === 'infantry') {
                armyModule.addInfantry()
            } else {
                armyModule.addTank()
            }
        }

        // Emitir evento de spawn con metadatos
        {
            const troopId = (troopEl && troopEl.getAttribute('data-id')) || null
            const count = Number((troopEl && troopEl.dataset?.count) || (match && match.dataset?.count) || '1')
            bus.emit('troops.spawned', { type, side, countyEl: selectedCounty, troopId, count })
        }

        // Evaluar combate solo si hay bandos distintos presentes
        const sidesInCounty = new Set(Array.from(selectedCounty.querySelectorAll('.troop')).map(t => t.dataset.side))
        if (sidesInCounty.size > 1 && combatModule.hasEnemies(selectedCounty)) {
            console.log('[combat] Enemy presence detected')
            combatModule.fight(combatModule.getEnemies(selectedCounty))
        }
    }

    const selectTroop = async (event, _selectedCounty) => {
        const element = event.target

        // Si se hace click sobre una tropa: seleccionarla
        if (isTroop(element)) {
            const id = element.getAttribute('data-id') || '(no-id)'
            const moving = element?.dataset?.moving === 'true'
            console.debug(`[troops] troop.selected id=${id} moving=${moving}`)
            selectedTroop = element
            bus.emit('troops.selected', { troopEl: element })
            return
        }

        // Determinar el county de destino de forma robusta
        const destinationCounty = mapModule.isCounty(element)
            ? element
            : (element.closest && element.closest('.county'))

        if (selectedTroop && destinationCounty && mapModule.isCounty(destinationCounty)) {
            const moving = selectedTroop?.dataset?.moving === 'true'
            const id = selectedTroop.getAttribute('data-id') || '(no-id)'
            console.debug(`[troops] move.request id=${id} moving=${moving} to=${destinationCounty.title}`)
            // Bloquear nuevos movimientos si la tropa ya está en movimiento
            if (moving) {
                console.warn(`[troops] move.blocked id=${id} reason=already-moving`)
                return
            }
            const { grid } = buildGridFromDOM()
            const fromCountyEl = selectedTroop.closest ? (selectedTroop.closest('.county') || selectedTroop.parentElement) : selectedTroop.parentElement
            if (isReachable(fromCountyEl, destinationCounty, grid)) {
                bus.emit('troops.move_started', { troopEl: selectedTroop, fromCountyEl, toCountyEl: destinationCounty })
                await moveTroop(selectedTroop, destinationCounty)
                bus.emit('troops.moved', { toCountyEl: destinationCounty })
                // Tras mover, evaluar combate en el destino
                if (combatModule.hasEnemies(destinationCounty)) {
                    console.log('Enemy')
                    combatModule.fight(combatModule.getEnemies(destinationCounty))
                }
            } else {
                console.warn('No hay ruta disponible hacia el destino')
            }
            selectedTroop = null
        }
    }

    const moveTroop = (troop, county) => {
        return new Promise((resolve) => {
            const troopClone = county.appendChild(troop.cloneNode(true))
            troopClone.style.visibility = 'hidden'

            const troopId = troop.getAttribute('data-id') || '(no-id)'
            troop.dataset.moving = 'true'
            console.debug(`[troops] moveTroop.start id=${troopId} to=${county.title}`)

            const targetRect = county.getBoundingClientRect()
            const troopRect = troop.getBoundingClientRect()

            const offsetX = targetRect.left + targetRect.width / 2 - (troopRect.left + troopRect.width / 2)
            const offsetY = targetRect.top + targetRect.height / 2 - (troopRect.top + troopRect.height / 2)

            troop.style.transition = 'transform 5s ease-in-out'
            troop.style.transform = `translate(${offsetX}px, ${offsetY}px)`

            // Esperar a que termine la transición antes de resolver la promesa
            troop.addEventListener('transitionend', function handler() {
                const troopId = troop.getAttribute('data-id') || '(no-id)'
                troopClone.style.visibility = 'visible'
                troop.dataset.moving = 'false'
                console.debug(`[troops] moveTroop.end id=${troopId}`)
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