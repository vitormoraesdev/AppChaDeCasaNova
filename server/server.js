import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import rateLimit from "express-rate-limit"
import supabase from "./supabase.js"
import fetch from "node-fetch" // Para webhook
import { MercadoPagoConfig, Preference, Payment } from "mercadopago"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const GOAL = 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// Limite de requisições
app.use("/create-payment", rateLimit({ windowMs: 60*1000, max:10 }))

// Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })

/* =========================
   PEGAR TOTAL ARRECADADO
========================= */
app.get("/total", async (req,res)=>{
  try{
    const { data, error } = await supabase
      .from("donations")
      .select("amount")

    if(error){
      console.log("Erro ao buscar doações:", error)
      return res.status(500).json({ error: "Erro ao buscar doações" })
    }

    const donations = Array.isArray(data) ? data : []
    const total = donations.reduce((sum,d) => sum + Number(d.amount),0)

    res.json({ total })
  }catch(err){
    console.log("Erro total:", err)
    res.status(500).json({ error: "Erro interno" })
  }
})

/* =========================
   CRIAR PAGAMENTO
========================= */
app.post("/create-payment", async (req,res)=>{
  try{
    const amount = Number(req.body.amount)

    if(!amount || amount < 5 || amount > 500){
      return res.status(400).json({ error:"Valor inválido (R$5 - R$500)" })
    }

    // checar total atual
    const { data, error } = await supabase
      .from("donations")
      .select("amount")

    if(error){
      console.log("Erro ao buscar doações:", error)
      return res.status(500).json({ error:"Erro interno" })
    }

    const donations = Array.isArray(data) ? data : []
    const total = donations.reduce((sum,d)=> sum + Number(d.amount),0)

    if(total >= GOAL){
      return res.status(400).json({ error:"Meta já atingida" })
    }

    const preference = new Preference(client)
    const response = await preference.create({
      body:{
        items:[{
          title:"Contribuição Chá de Casa Nova",
          quantity:1,
          unit_price: amount,
          currency_id:"BRL"
        }],
        notification_url:"http://localhost:3000/webhook",
        back_urls:{
          success:"https://anabel-unfiring-thuggishly.ngrok-free.dev/success",
          failure:"https://anabel-unfiring-thuggishly.ngrok-free.dev",
          pending:"https://anabel-unfiring-thuggishly.ngrok-free.dev"
        },
        auto_return:"approved"
      }
    })

    res.json({ url: response.init_point })

  }catch(err){
    console.log("Erro pagamento:",err)
    res.status(500).json({ error:"Erro ao criar pagamento" })
  }
})

/* =========================
   PAGAMENTO APROVADO
========================= */
app.get("/success", async (req,res)=>{
  try{
    const paymentId = req.query.payment_id
    if(paymentId){
      const payment = new Payment(client)
      const data = await payment.get({ id: paymentId })

      if(data.status === "approved"){
        await supabase.from("donations").insert({
          amount: data.transaction_amount,
          status: "approved"
        })
        console.log("Doação salva:", data.transaction_amount)
      }
    }

    res.sendFile(path.resolve("public/success.html"))
  }catch(err){
    console.log("Erro confirmação:",err)
    res.redirect("/")
  }
})

/* =========================
   WEBHOOK MERCADO PAGO
========================= */
app.post("/webhook", async (req,res)=>{
  try{
    const payment = req.body

    if(payment.type === "payment" && payment.data && payment.data.id){
      const paymentId = payment.data.id
      const result = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers:{ Authorization:`Bearer ${process.env.MP_ACCESS_TOKEN}` } }
      )
      const data = await result.json()

      if(data.status === "approved"){
        await supabase.from("donations").insert({
          amount: data.transaction_amount,
          status: "approved"
        })
        console.log("Webhook salvou:", data.transaction_amount)
      }
    }

    res.sendStatus(200)
  }catch(err){
    console.log("Erro webhook:",err)
    res.sendStatus(500)
  }
})

/* =========================
   INICIAR SERVIDOR
========================= */
app.listen(PORT,()=>console.log("Servidor rodando na porta", PORT))