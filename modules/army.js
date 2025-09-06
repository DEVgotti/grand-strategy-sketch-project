import { saveArmy } from './persistence.js'
export const createArmyModule = () => {
    let army = {
        infantry: {
            quantity: 0,
        },
        tank: {
            quantity: 0,
        },
    }

    const addInfantry = () => {
        army = {
            ...army,
            infantry: {
                quantity: army.infantry.quantity + 1,
            },
        }
        console.log(army)
        // Persistir en segundo plano
        saveArmy(army).catch(console.error)
    }

    const addTank = () => {
        army = {
            ...army,
            tank: {
                quantity: army.tank.quantity + 1,
            },
        }
        console.log(army)
        // Persistir en segundo plano
        saveArmy(army).catch(console.error)
    }

    const getArmy = () => army

    const setArmy = (next) => {
        if (!next) return
        army = next
        console.log('Army loaded', army)
    }

    return {
        addInfantry,
        addTank,
        getArmy,
        setArmy
    }
}