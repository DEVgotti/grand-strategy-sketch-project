import { chooseAndRemoveCounty } from './helpers/chooseAndRemove.js'
import { generateRandomId } from './helpers/generateId.js'

const strategy = () => {
  const map = document.getElementById('map')
  const counties = [
    'Albacete',
    'Alicante',
    'Almería',
    'Araba',
    'Asturias',
    'Ávila',
    'Badajoz',
    'Illes Balears',
    'Barcelona',
    'Bizkaia',
    'Burgos',
    'Cáceres',
    'Cádiz',
    'Cantabria',
    'Castellón',
    'Ciudad Real',
    'Córdoba',
    'A Coruña',
    'Cuenca',
    'Gipuzkoa',
    'Girona',
    'Granada',
    'Guadalajara',
    'Huelva',
    'Huesca',
    'Jaén',
    'León',
    'Lleida',
    'Lugo',
    'Madrid',
    'Málaga',
    'Murcia',
    'Navarra',
    'Ourense',
    'Palencia',
    'Las Palmas',
    'Pontevedra',
    'La Rioja',
    'Salamanca',
    'Santa Cruz de Tenerife',
    'Segovia',
    'Sevilla',
    'Soria',
    'Tarragona',
    'Teruel',
    'Toledo',
    'Valencia',
    'Valladolid',
    'Zamora',
    'Zaragoza',
    'Ceuta',
    'Melilla',
  ]

  let selectedTroop = null
  let selectedCounty = null
  let countyName = ''
  let army = {
    infantry: {
      quantity: 0,
    },
    tank: {
      quantity: 0,
    },
  }

  // ! Muchas cosas mezcladas en una función dedicada a generar el mapa.
  // TODO: Separar el resto de funcionalidades en algún momento.
  const generateMap = (rows, cols) => {
    // 5 rows 5 cols
    for (let i = 0; i < rows * cols; i++) {
      const container = map.appendChild(document.createElement('div'))
      container.classList.add('county_content')
      const county_terrain = container.appendChild(document.createElement('div'))
      county_terrain.classList.add('county')
      const county = chooseAndRemoveCounty(counties)
      county_terrain.setAttribute('title', county)
      const county_name = container.appendChild(document.createElement('div'))
      county_name.classList.add('county_name')

      county_name.innerHTML = county
    }
  }
  const isCounty = (county) => county.tagName === 'DIV' && county.classList.contains('county')
  const isTroop = (troop) => troop.tagName === 'DIV' && troop.classList.contains('troop')

  // ? Ahora mismo no hay diferencia entre aliados o enemigos
  const hasEnemies = (county) => county.querySelectorAll('.troop').length > 1
  const hasTroops = (county) => county.querySelectorAll('.troop').length > 1

  const handleActions = (event) => {
    const county = event.target
    if (isCounty(county)) {
      selectCounty(county)
      onClickShowName(county)

      document.addEventListener('click', spawnTroops)
      document.addEventListener('click', selectTroop)
    }
  }

  const onClickShowName = (county) => {
    if (isCounty(county)) {
      const countyTitle = county.title
      document.getElementById('properties').style.visibility = 'visible'
      document.getElementById('properties').getElementsByClassName('county_name')[0].innerHTML = countyTitle
    }
  }

  const selectCounty = (county) => {
    if (isCounty(county)) {
      selectedCounty = county
      console.log(`${selectedCounty.getAttribute('title')} selected`)
    }

    return selectedCounty
  }

  const spawnTroops = (event) => {
    if (event.target.tagName !== 'BUTTON') return

    const spawnType = event.target
    countyName = selectedCounty.getAttribute('title')
    console.log(`${countyName} selected`)

    if (!hasTroops(selectedCounty)) {
      const stack = selectedCounty.appendChild(document.createElement('div'))
      stack.classList.add('troop')
      const troopId = generateRandomId()
      stack.setAttribute('data-id', troopId)
    }

    if (spawnType.classList.contains('infantry')) {
      selectedCounty.getElementsByClassName('troop')[0].classList.add('infantry')
      army = {
        ...army,
        infantry: {
          quantity: army.infantry.quantity + 1,
        },
      }
    } else {
      selectedCounty.getElementsByClassName('troop')[0].classList.add('tank')
      army = {
        ...army,
        tank: {
          quantity: army.tank.quantity + 1,
        },
      }
    }
    console.log(army)

    if (hasEnemies(selectedCounty)) {
      console.log('Enemy')
      fight(getEnemies(selectedCounty))
    }
  }

  const selectTroop = async (event) => {
    const element = event.target

    if (isTroop(element)) {
      if (selectedTroop && isCounty(element)) {
        console.log(`Moving to ${element.title}`)
        await moveTroop(selectedTroop, element)
        selectedTroop = null
      } else {
        console.log('Troop selected')
        selectedTroop = element
      }
    } else {
      if (selectedTroop && isCounty(element)) {
        console.log(`Moving to ${element.title}`)
        await moveTroop(selectedTroop, element).then(() => {
          if (hasEnemies(selectedCounty)) {
            console.log('Enemy')
            fight(getEnemies(selectedCounty))
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

  const mergeTroops = () => {}

  const getEnemies = (county) => county.querySelectorAll('.troop')

  const fight = (enemies) => {
    console.log('Starting a fight...')
    console.log(enemies)
  }

  document.addEventListener('click', handleActions)

  return {
    generateMap,
  }
}

const game = strategy()

game.generateMap(5, 5)
