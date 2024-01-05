export function chooseAndRemoveCounty(array) {
  const randomIndex = Math.floor(Math.random() * array.length)
  const chosenCounty = array.splice(randomIndex, 1)[0]
  return chosenCounty
}