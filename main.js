import { chooseAndRemoveCounty } from './helpers/chooseAndRemove.js'

const strategy = () => {
  const map = document.getElementById("map")
  const counties = ["Albacete",
  "Alicante",
  "Almería",
  "Araba",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Illes Balears",
  "Barcelona",
  "Bizkaia",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "A Coruña",
  "Cuenca",
  "Gipuzkoa",
  "Girona",
  "Granada",
  "Guadalajara",
  "Huelva",
  "Huesca",
  "Jaén",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Las Palmas",
  "Pontevedra",
  "La Rioja",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Zamora",
  "Zaragoza",
  "Ceuta",
  "Melilla"]

  let selectedTroop = null
  let selectedCounty = null
  let countyName

  // ! Muchas cosas mezcladas en una función dedicada a generar el mapa.
  // TODO: Separar el resto de funcionalidades en algún momento.
  const generateMap = (rows, cols) => {
    // 5 rows 5 cols
    for (let i = 0; i < rows*cols; i++) {
      const container = map.appendChild(document.createElement('div'))
      container.classList.add('county')
      const county = chooseAndRemoveCounty(counties)
      container.setAttribute('title', county)
    }
  }
  const isCounty = (county) => county.tagName === 'DIV' && county.classList.contains('county')
  const isTroop = (troop) => troop.tagName === 'DIV' && troop.classList.contains('troop')

  const handleActions = (event) => {
    const county = event.target
    if(isCounty(county)) {
      selectCounty(county)
      onClickShowName(county)

      document.addEventListener('click', spawnTroops)
      document.addEventListener('click', selectTroop)
    }
  }

  const onClickShowName = (county) => {
    if(isCounty(county)) {
      const countyTitle = county.title
      document.getElementById('properties').style.visibility = 'visible'
      document.getElementsByClassName('county_name')[0].innerHTML = countyTitle
    }
  }

  const selectCounty = (county) => {
    if(isCounty(county)) {
      selectedCounty = county
      console.log(`${selectedCounty.getAttribute('title')} selected`)
    }

    return selectedCounty
  }

  const spawnTroops = (event) => {
    if(event.target.tagName !== 'BUTTON') return

    countyName = selectedCounty.getAttribute('title')
    console.log(`${countyName} selected`)

    const stack = selectedCounty.appendChild(document.createElement('div'))
    stack.classList.add('troop')

    if(event.target.classList.contains('infantry')) {
      stack.classList.add('infantry')
    } else {
      stack.classList.add('tank')
    }
  }

  const selectTroop = (event) => {
    const element = event.target

    if(isTroop(element)) {
      if(selectedTroop && isCounty(element)) {
        moveTroop(selectedTroop, element)
        selectedTroop = null
      } else {
        console.log('Troop selected')
        selectedTroop = element
      }
    } else {
      if(selectedTroop && isCounty(element)) {
        moveTroop(selectedTroop, element)
        selectedTroop = null
      }

      if(isCounty(event.target)) console.log('There\'s no troops here.')
    }
  }

  const moveTroop = (troop, county) => {
    // Clonamos la tropa en la provincia seleccionada
    const troopClone = county.appendChild(troop.cloneNode(true))
    // Ocultamos la tropa clonada momentaneamente
    troopClone.style.visibility = 'hidden'

    const targetRect = county.getBoundingClientRect()
    const troopRect = troop.getBoundingClientRect()

    const offsetX = targetRect.left + targetRect.width / 2 - (troopRect.left + troopRect.width / 2)
    const offsetY = targetRect.top + targetRect.height / 2 - (troopRect.top + troopRect.height / 2)

    troop.style.transition = 'transform 5s ease-in-out'
    troop.style.transform = `translate(${offsetX}px, ${offsetY}px)`

    //* Hacemos visible la tropa clonada en el nuevo condado
    //* una vez termine la transición que simula el movimiento.
    setTimeout(() => {
      // Hacemos la tropa clonada visible
      troopClone.style.visibility = 'visible'
      // Eliminamos la tropa original
      troop.remove()
    }, 5000);
  }

  document.addEventListener('click', handleActions)

  return {
    generateMap,
  }
}

const game = strategy()

game.generateMap(5,5)
