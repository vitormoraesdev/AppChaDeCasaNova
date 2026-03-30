export function updateProgress(current, goal){
  const percent = Math.min((current/goal)*100, 100)
  document.getElementById("progress-bar").style.width = percent + "%"
  
  const format = new Intl.NumberFormat("pt-BR",{
    style:"currency",
    currency:"BRL"
  })

  document.getElementById("amount").innerText =
    `${format.format(current)} de ${format.format(goal)}`
}