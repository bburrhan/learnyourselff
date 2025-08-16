export interface StripeProduct {
  id: string
  priceId: string
  name: string
  description: string
  price: number
  currency: string
  mode: 'payment' | 'subscription'
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SsQG6I4atylAwl',
    priceId: 'price_1RwfQDHjeffmjAUCWlSi1OQv',
    name: 'Deneme',
    description: 'fsfsrf',
    price: 1.00,
    currency: 'USD',
    mode: 'payment'
  },
  {
    id: 'prod_ScVRni3Mu0gPnU',
    priceId: 'price_1RhGR3HjeffmjAUCuYZuvarz',
    name: '48 hours challenge',
    description: '48 hours challenge',
    price: 4.90,
    currency: 'USD',
    mode: 'payment'
  }
]

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id)
}

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId)
}