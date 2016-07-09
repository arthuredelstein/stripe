const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const co = require('co');

const shipping_params = function (body) {
  let result = {};
  for (let param in body) {
    if (param.startsWith("shipping_")) {
      result[param] = body[param];
    }
  }
  return result;
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.get('/stripe/', function (req, res) {
  res.sendFile('index.html', { root : __dirname});
});
app.get('/stripe/tor.png', function (req, res) {
  res.sendFile('tor.png', { root : __dirname});
});
app.get('/stripe/stripe-tor.js', function (req, res) {
  res.sendFile('stripe-tor.js', { root : __dirname});
});
app.post('/stripe/charge', function (req, res) {
  co(function* () {
    try {
      const body = req.body;
      console.log(body);
      if (body.monthly === 'true') {
        // User wants to make a monthly donation
        // First, create a Stripe customer.
        const customer = yield stripe.customers.create({
          source: body.stripeToken,
          email: body.email,
        });
        // Now, create a Stripe "plan" for the customer.
        const planID = crypto.randomBytes(48).toString('hex');
        const plan = yield stripe.plans.create({
          amount: body.amount,
          interval: "month",
          name: "Recurring Monthly Donation",
          currency: "usd",
          id: planID,
          statement_descriptor: "Tor Monthly Donation",
        });
        // Finaly, create a subscription that follows the plan.
        console.log(shipping_params(body));
        yield stripe.subscriptions.create({
          customer: customer.id,
          plan: plan.id,
          metadata: shipping_params(body),
        });
      } else {
        // We are processing a one-time donation
        const charge = yield stripe.charges.create({
          amount: body.amount,
          receipt_email: body.email,
          currency: "usd",
          source: body.stripeToken,
          description: "One-time Donation",
          statement_descriptor: "Donation to Tor",
          metadata: shipping_params(body),
          shipping: {
            name: body.shipping_name,
            address: {
              line1: body.shipping_address_line1,
              line2: body.shipping_address_line2,
              city: body.shipping_address_city,
              state: body.shipping_address_state,
              postal_code: body.shipping_address_zip,
              country: body.shipping_address_country,
            },
          },
        });
        const charge2 = yield stripe.charges.retrieve(charge.id);
        console.log("charge stored: " + JSON.stringify(charge2));
      }
      // If we got so far, then we have succeeded! Tell the browser.
      res.send(JSON.stringify({success: true}));
    } catch (err) {
      // Something went wrong. Report back to the browser.
      res.send(JSON.stringify({success: false, message: err.message}));
    }
  });
});

const PORT = 8888;

const server = app.listen(PORT, function () {
  console.log("started");
});
