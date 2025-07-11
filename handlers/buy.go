package handlers

import (
	"github.com/labstack/echo/v4"
	"github.com/stripe/stripe-go/v81"
	"github.com/tobyleye/playlift/payment"
)

func (h Handlers) GetProducts(c echo.Context) error {
	params := &stripe.ProductListParams{}
	params.Limit = stripe.Int64(10)
	result := payment.StripeClient.Products.List(params)
	products := []*stripe.Product{}
	for result.Next() {
		product := result.Product()
		products = append(products, product)
	}

	return c.JSON(200, products)
}
