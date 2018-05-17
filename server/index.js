const dotenv = require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const qs = require('querystring');
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const ShopifyAPIClient = require('shopify-api-node');

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = ['read_products','read_checkouts','write_checkouts'];

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/shopify', (req, res) => {
  const shop = req.query.shop;
  if (shop) {
    const state = nonce();
    const redirectUri = `https://${req.hostname}/shopify/callback`;
    
    const installUrl = 'https://' + shop +
      '/admin/oauth/authorize?client_id=' + apiKey +
      '&scope=' + scopes +
      '&state=' + state +
      '&redirect_uri=' + redirectUri;

    res.cookie('state', state);
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
});

app.get('/shopify/callback', async (req, res) => {
  const { shop, hmac, code, state } = req.query;
  const shopName = shop.split(".")[0];
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified');
  }

  if (shop && hmac && code) {
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, 'utf-8');
    const generatedHash = Buffer.from(
      crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex'),
        'utf-8'
      );
    let hashEquals = false;
    // timingSafeEqual will prevent any timing attacks. Arguments must be buffers
    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    // timingSafeEqual will return an error if the input buffers are not the same length.
    } catch (e) {
      hashEquals = false;
    };

    if (!hashEquals) {
      return res.status(400).send('HMAC validation failed');
    }

    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    };

    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
    .then(async (accessTokenResponse) => {
      const accessToken = accessTokenResponse.access_token;
      const shopRequestUrl = 'https://' + shop + '/admin/shop.json';
      const shopRequestHeaders = {
        'X-Shopify-Access-Token': accessToken,
      };

      // const shopifyApi = new ShopifyAPIClient({
      //   shopName: shopName,
      //   accessToken: accessToken,
      // });
      // console.log(`https:\/\/${req.hostname}\/webhook\/${req.query.state}\/checkout`)
    
      // // Register a hook for when an order is created
      // try {
      //   await shopifyApi.webhook.create({
      //     topic: "checkouts/create",
      //     address: `https:\/\/${req.hostname}\/shopify\/webhook\/${req.query.state}\/checkout`,
      //     format: "json",
      //   })
      // } catch (err) {
      //   console.log("NEW ERR")
      //   console.log(err)
      // }    

      request.get(shopRequestUrl, { headers: shopRequestHeaders })
      .then((shopResponse) => {
        res.end(shopResponse);
      })
      .catch((error) => {
        res.status(error.statusCode).send(error.error.error_description);
      });
    })
    .catch((error) => {
      res.status(error.statusCode).send(error.error.error_description);
    });
  } else {
    res.status(400).send('Required parameters missing');
  }
});

app.get("/twitter", (req, res) => {
  console.log("0", req.query)
  const oauth = {
    consumer_key: "RhJnTksA3hWPcz0B6bAtNj67p",
    consumer_secret: "uub98D4remaZPfBORLMPE4j955eVNtk511C0bgZBrDv4fUtmaR",
    callback: `https://d198355d.ngrok.io/twitter-success?redirect=${req.query.redirect}`
  };

  request.post({url: "https://api.twitter.com/oauth/request_token", oauth:oauth}, (err, response, body) => {
    if (err) console.log("ERR", err)
    console.log("twitter: ", body)
    const req_data = qs.parse(body)
    const uri = 'https://api.twitter.com/oauth/authenticate'
    + '?' + qs.stringify({oauth_token: req_data.oauth_token})

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send({uri});
  })
})

app.get('/twitter-success', (req, res) => {
  console.log("body: ", req.query)
  const oauth =
      { consumer_key: "RhJnTksA3hWPcz0B6bAtNj67p",
        consumer_secret: "uub98D4remaZPfBORLMPE4j955eVNtk511C0bgZBrDv4fUtmaR",
        token: req.query.oauth_token,
        verifier: req.query.oauth_verifier
      }
    , url = 'https://api.twitter.com/oauth/access_token'
  
  console.log("1", req.query, req.body)
  // const oauth = {
  //   consumer_key: "RhJnTksA3hWPcz0B6bAtNj67p",
  //   consumer_secret: "uub98D4remaZPfBORLMPE4j955eVNtk511C0bgZBrDv4fUtmaR",
  //   oauth_nonce: "a9900fe68e2573b27a37f10fbad6a755",
  //   oauth_token: req.query.oauth_token,
  //   callback: `https://d198355d.ngrok.io/twitter-success?redirect=${req.query.redirect}`
  // };

  request.post({url: url, oauth:oauth, formData: { oauth_verifier: req.query.oauth_verifier}}, (err, response, body) => {
    if (err) console.log("ERR", err)
    console.log("BODY: ", body);
    const accessData = qs.parse(body)
    console.log("AD: ", accessData)
    oauth.token = accessData.oauth_token;
    oauth.token_secret = accessData.oauth_token_secret;
    request.post({url: 'https://api.twitter.com/1.1/statuses/update.json?status=Ana%20is%20the%20best%20doula', oauth: oauth}, (err, response, body) => {
      if (err) console.log("ERR", err)
    
      const finalVersion = qs.parse(body)
      res.json(finalVersion);

    });
  })
})

/**
 * Handler for the checkouts/create webhook.
 */
app.post("/webhook/checkout", (req, res) => {
  console.log("Checkout: ", req.body);
  res.send("OK");
});

app.listen(8080, () => {
  console.log('Example app listening on port 8080!');
});