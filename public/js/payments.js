export async function createPayment(amount){
  const response = await fetch("http://localhost:3000/create-payment",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ amount:Number(amount) })
  })

  const data = await response.json()
  if(data.url){
    return data
  }else{
    throw new Error(data.error || "Erro desconhecido")
  }
}