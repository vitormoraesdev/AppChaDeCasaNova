const GOAL = 5000
let current = 1200

update()

function update(){

 const percent = (current / GOAL) * 100

 document.getElementById("progress").style.width =
 percent + "%"

 document.getElementById("amount").innerText =
 `R$ ${current} de R$ ${GOAL}`

}

document.getElementById("donate")
.addEventListener("click", async ()=>{

 const amount = prompt("Digite o valor da contribuição")

 if(!amount) return

 const response = await fetch("http://localhost:3000/create-payment",{

 method:"POST",

 headers:{
 "Content-Type":"application/json"
 },

 body: JSON.stringify({
 amount:Number(amount)
 })

 })

 const data = await response.json()

 window.location.href = data.url

})