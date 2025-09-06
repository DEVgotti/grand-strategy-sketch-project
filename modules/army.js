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
    }

    const addTank = () => {
        army = {
            ...army,
            tank: {
                quantity: army.tank.quantity + 1,
            },
        }
        console.log(army)
    }

    const getArmy = () => army

    return {
        addInfantry,
        addTank,
        getArmy
    }
}