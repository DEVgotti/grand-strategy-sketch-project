export const createCombatModule = () => {
    // ? Ahora mismo no hay diferencia entre aliados o enemigos
    const hasEnemies = (county) => county.querySelectorAll('.troop').length > 1

    const getEnemies = (county) => county.querySelectorAll('.troop')

    const fight = (enemies) => {
        console.log('Starting a fight...')
        console.log(enemies)
    }

    const mergeTroops = () => { }

    return {
        hasEnemies,
        getEnemies,
        fight,
        mergeTroops
    }
}