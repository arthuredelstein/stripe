/* jshint esversion: 6 */

// __showStripeTorDonationCheckout(amount, callback)__.
let showStripeTorDonationCheckout = (function () {

// __encodeURIParams(paramsObject)__.
// Converts a plain JS object to a URI parameter list.
// E.g., { a: "A", b: "B" } -> "a=A&b=B"
// Adapted from http://stackoverflow.com/a/6566471
let encodeURIParams = function (paramsObject) {
  let result = "";
  for (let key in paramsObject) {
    if (result !== "") {
      result += "&";
    }
    result += key + "=" + encodeURIComponent(paramsObject[key]);
  }
  return result;
};

let amountInCents_ = null;
let callback_ = null;
let monthly_ = false;

let stripeHandler = StripeCheckout.configure({
  key: 'pk_test_K2bGg87pthxNndczsmaNvaWq',
  image: 'https://torpat.ch/stripe/tor.png',
  locale: 'auto',
  label: 'Donate with Credit Card',
  billingAddress: true,
  shippingAddress: true,
  token: function (token, args) {
    console.log(token);
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      console.log(xhr.responseText);
      console.log(xhr);
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          response = JSON.parse(xhr.responseText);
        } else {
          response = {success: false, message: "Failed to connect to credit card processor."};
        }
        console.log(response);
        callback_(response);
      }
    };
    xhr.open("POST", "https://torpat.ch/stripe/charge", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    console.log(args);
    let params = {
      stripeToken: token.id,
      amount: amountInCents_,
      monthly: monthly_,
      email: token.email,
    };
    // Include billing and shipping addresses
    console.log(args);
    for (var arg in args) {
      params[arg] = args[arg];
    }
    console.log(params);
    paramString = encodeURIParams(params);
    amountInCents_ = null;
    xhr.send(paramString);
  }
});

window.addEventListener('unload', function() {
  stripeHandler.close();
});

// showStripeTorDonationCheckout(amount, callback)
return function (amount, monthly, callback) {
  // Open Checkout with certain options:
  amountInCents_ = amount * 100;
  monthly_ = monthly;
  callback_ = callback;
  stripeHandler.open({
    name: 'The Tor Project, Inc.',
    description: (monthly ? "Monthly " : "") + 'Charitable Donation of $' + amount,
    zipCode: true,
    amount: amountInCents_, // Stripe wants amount in cents
    panelLabel: "Donate {{amount}}" + (monthly ? " monthly" : ""),
  });
};

})();
