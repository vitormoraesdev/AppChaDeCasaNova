import { GOAL } from "../config/config.js"
import { updateProgress } from "./progress.js"
import { createPayment } from "./payments.js"

let lastTotal = 0

async function loadTotal() {
  try {
    const res = await fetch("http://localhost:3000/total")
    const data = await res.json()

    if(data.total > lastTotal){
      const difference = data.total - lastTotal
      showDonationAlert(difference)
    }

    lastTotal = data.total
    updateProgress(data.total, GOAL)
  } catch (err) {
    console.log("Erro ao carregar total:", err)
  }
}

function showDonationAlert(value){
  const alert = document.createElement("div")
  alert.innerText = "Nova contribuição de R$ " + value
  alert.className = "donation-alert"
  document.body.appendChild(alert)

  setTimeout(()=> alert.remove(), 4000)
}

setInterval(loadTotal, 5000)
loadTotal()

document.getElementById("donate").addEventListener("click", async () => {
  const amountStr = prompt("Digite o valor da contribuição (R$5 - R$500)")
  if(!amountStr) return

  const amount = Number(amountStr)
  if(amount < 5 || amount > 500){
    alert("Digite um valor entre R$5 e R$500")
    return
  }

  try {
    const payment = await createPayment(amount)
    window.location.href = payment.url
  } catch(err){
    console.log("Erro ao criar pagamento:", err)
    alert(err.message || "Erro ao processar pagamento")
  }
})