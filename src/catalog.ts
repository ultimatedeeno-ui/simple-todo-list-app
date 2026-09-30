export type Product = { id: string; name: string; subtitle: string; price: number; color: string; image: string }

export const products: Product[] = [
  { id: 'arc-mug', name: 'Arc mug', subtitle: 'Stoneware / 12 oz', price: 32, color: '#b3aa96', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85' },
  { id: 'loop-candle', name: 'Loop candle', subtitle: 'Fig leaf / 40 hr', price: 26, color: '#e6d2ad', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85' },
  { id: 'grid-throw', name: 'Grid throw', subtitle: 'Wool blend / 50 × 70', price: 98, color: '#a08775', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85' },
  { id: 'form-vase', name: 'Form vase', subtitle: 'Hand-finished ceramic', price: 74, color: '#c8b69e', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85' },
]
