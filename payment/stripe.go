package payment

import (
	"github.com/stripe/stripe-go/v81/client"
	"github.com/tobyleye/playlist-converter/config"
)

// Setup
var StripeClient = &client.API{}

func init() {
	StripeClient.Init(config.STRIPE_SECRET_KEY, nil)
}
