// Persistencia con localForage vía CDN ESM
import localforage from 'https://esm.sh/localforage@1.10.0'

const store = localforage.createInstance({
    name: 'grand-strategy',
    storeName: 'game'
})

export const saveArmy = async (army) => {
    try {
        await store.setItem('army', army)
    } catch (err) {
        console.error('saveArmy error', err)
    }
}

export const loadArmy = async () => {
    try {
        const data = await store.getItem('army')
        return data || null
    } catch (err) {
        console.error('loadArmy error', err)
        return null
    }
}

export const clearArmy = async () => {
    try {
        await store.removeItem('army')
    } catch (err) {
        console.error('clearArmy error', err)
    }
}

export default {
    saveArmy,
    loadArmy,
    clearArmy
}