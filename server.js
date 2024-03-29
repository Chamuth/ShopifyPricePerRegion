require("isomorphic-fetch")
const dotenv = require("dotenv")
dotenv.config()
const Koa = require("koa")
const next = require("next")
const { default: createShopifyAuth } = require("@shopify/koa-shopify-auth")
const { verifyRequest } = require("@shopify/koa-shopify-auth")
const session = require("koa-session")
const { default: graphQLProxy } = require("@shopify/koa-shopify-graphql-proxy")
const { ApiVersion } = require("@shopify/koa-shopify-graphql-proxy")
const Router = require("koa-router")
const bodyParser = require("koa-bodyparser")
const {
  receiveWebhook,
  registerWebhook,
} = require("@shopify/koa-shopify-webhooks")
const fetch = require("node-fetch")

const { Pool } = require("pg")

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY, HOST } = process.env

app.prepare().then(() => {
  const server = new Koa()
  const router = new Router()

  router.use(bodyParser())

  server.use(session({ sameSite: "none", secure: true }, server))
  server.keys = [SHOPIFY_API_SECRET_KEY]

  server.pool = new Pool({
    user: "prrsbxxhpdgjwi",
    host: "ec2-52-23-45-36.compute-1.amazonaws.com",
    database: "d3nb7unse3sq4u",
    password:
      "b470a762490ee281efa562d75def798a019c3b4dac411bb2737f2eeb4cc77965",
    port: 5432,
    ssl: { rejectUnauthorized: false },
  })

  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: [
        "read_products",
        "write_products",
        "read_orders",
        "write_orders",
      ],
      accessMode: "offline",
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session
        if (shop && accessToken) {
          await ctx.app.pool.query(`
            UPDATE tokens SET value='${accessToken}' WHERE key='access'
          `)
          ctx.cookies.set("shopOrigin", shop, {
            httpOnly: false,
            secure: true,
            sameSite: "none",
          })
        } else {
          ctx.redirect("/")
        }
      },
    })
  )

  // const webhook = receiveWebhook({ secret: SHOPIFY_API_SECRET_KEY })

  // router.post("/webhooks/order/create", webhook, (ctx) => {
  //   console.log("WEBHOOK RECEIDE!!!!!!")
  //   console.log("received webhook: ", ctx.state.webhook)
  //   ctx.res.statusCode = 200
  // })

  router.get("/api/rates", async ctx => {
    const { rows } = await ctx.app.pool.query("SELECT * FROM exchange_rates")
    ctx.body = JSON.stringify(rows)
  })

  router.post("/api/rates", ctx => {
    var eurusd = ctx.request.query["EURUSD"]
    var eurgbp = ctx.request.query["EURGBP"]

    // ctx.body = "UPDATE exchange_rates SET value=" + usdeur + " WHERE key='USDEUR'";

    ctx.app.pool.query(
      `UPDATE exchange_rates SET value=` + eurusd + ` WHERE key='EURUSD'`
    )
    ctx.app.pool.query(
      `UPDATE exchange_rates SET value=` + eurgbp + ` WHERE key='EURGBP'`
    )
  })

  router.post("/webhooks/order/create", async ctx => {
    var orderid = ctx.request.body.admin_graphql_api_id
    var tag = ctx.request.body.presentment_currency
    var country = ctx.request.body.billing_address.country

    // read access token from database
    const { rows } = await ctx.app.pool.query("SELECT * FROM tokens")
    const accessToken = rows[0].value

    switch (tag) {
      case "USD":
        if (country.toLowerCase() === "united states") {
          tag = "US"
        } else {
          tag = "Global"
        }
        break
      case "EUR":
        tag = "Europe and Ireland"
        break
      case "GBP":
        tag = "UK"
        break
    }

    const query = `mutation {
      orderUpdate(input: {
        id: "${orderid}",
        tags: "${tag}"
      }) {
        order {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`

    console.log(query)
    console.log(accessToken)

    fetch("https://tanorganic21.myshopify.com/admin/api/2021-04/graphql.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query }),
    })
      .then(result => {
        console.log("Set Order Id: " + orderid + " => tags to " + tag)
        console.log(JSON.stringify(result))
      })
      .catch(err => {
        console.log("error", err)
      })

    ctx.body = ctx.request.body
  })

  server.use(graphQLProxy({ version: ApiVersion.July20 }))

  router.get("(.*)", verifyRequest(), async ctx => {
    await handle(ctx.req, ctx.res)
    ctx.respond = false
    ctx.res.statusCode = 200
  })

  server.use(router.allowedMethods())
  server.use(router.routes())

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
