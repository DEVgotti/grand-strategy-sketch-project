import { chooseAndRemoveCounty } from '../helpers/chooseAndRemove.js'

export const createMapModule = () => {
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

    let selectedCounty = null

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

    const selectCounty = (county) => {
        if (isCounty(county)) {
            selectedCounty = county
            console.log(`${selectedCounty.getAttribute('title')} selected`)
        }

        return selectedCounty
    }

    const onClickShowName = (county) => {
        if (isCounty(county)) {
            const countyTitle = county.title
            document.getElementById('properties').style.visibility = 'visible'
            document.getElementById('properties').getElementsByClassName('county_name')[0].innerHTML = countyTitle
        }
    }

    return {
        generateMap,
        isCounty,
        selectCounty,
        onClickShowName,
        getSelectedCounty: () => selectedCounty
    }
}