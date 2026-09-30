import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Check, ChevronRight, Minus, Plus, ShoppingBag, Sparkles, X } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { products, type Product } from './catalog'
import { supabase } from './supabase'
import './styles.css'

type CartLine = Product & { quantity: number }
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function App() {
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [notice, setNotice] = useState('')
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  const add = (product: Product) => {
    setCart((items) => items.some((item) => item.id === product.id) ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }])
    setNotice(`${product.name} added to bag`)
    window.setTimeout(() => setNotice(''), 2400)
  }
  const changeQuantity = (id: string, amount: number) => setCart((items) => items.flatMap((item) => item.id === id ? (item.quantity + amount > 0 ? [{ ...item, quantity: item.quantity + amount }] : []) : [item]))
  const googleLogin = async () => {
    if (!supabase) return setNotice('Add Supabase environment variables to enable Google sign-in.')
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  return <main>
    <header className="nav"><a className="wordmark" href="#top">EMBER<span>®</span></a><nav><a href="#shop">Shop</a><a href="#story">Our story</a></nav><div className="nav-actions">{session ? <button className="account" onClick={() => supabase?.auth.signOut()}>Hi, {session.user.email?.split('@')[0]}</button> : <button className="account" onClick={googleLogin}>Sign in</button>}<button className="bag-button" onClick={() => setCartOpen(true)} aria-label="Open bag"><ShoppingBag size={18}/><b>{cart.reduce((n, item) => n + item.quantity, 0)}</b></button></div></header>
    <section id="top" className="hero"><div className="hero-copy"><p className="eyebrow">Small rituals, well made</p><h1>Bring the<br/><em>everyday</em> home.</h1><p className="lede">Considered objects for slower mornings, softer evenings, and every in-between moment.</p><a className="text-link" href="#shop">Shop the collection <ArrowRight size={16}/></a></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1600&q=90" alt="A sculptural chair and plant in a calm home"/><p>01 / The living collection</p></div></section>
    <section id="shop" className="collection"><div className="section-head"><div><p className="eyebrow">New arrivals</p><h2>Made for staying in.</h2></div><a className="text-link" href="#shop">View all <ArrowRight size={16}/></a></div><div className="products">{products.map((product, i) => <article className="product" key={product.id}><div className="product-image" style={{ backgroundColor: product.color }}><img src={product.image} alt={product.name}/><button onClick={() => add(product)} aria-label={`Add ${product.name} to bag`}><Plus size={18}/></button><span>0{i + 1}</span></div><div className="product-details"><div><h3>{product.name}</h3><p>{product.subtitle}</p></div><strong>{money.format(product.price)}</strong></div></article>)}</div></section>
    <section id="story" className="manifesto"><div><p className="eyebrow">The ember way</p><h2>Useful things.<br/><em>Beautifully simple.</em></h2></div><div><p>We make everyday objects that earn their place: tactile, honest and designed to become part of your rhythm.</p><a className="text-link" href="#shop">Read our story <ArrowRight size={16}/></a></div></section>
    <footer><span>© 2026 Ember Supply Co.</span><span>Made slowly, for everyday.</span><span>Instagram &nbsp; Pinterest</span></footer>
    {notice && <div className="notice"><Check size={16}/>{notice}</div>}
    {cartOpen && <aside className="cart"><div className="cart-head"><h2>Your bag <sup>{cart.reduce((n, item) => n + item.quantity)}</sup></h2><button onClick={() => setCartOpen(false)} aria-label="Close bag"><X/></button></div>{cart.length ? <><div className="cart-lines">{cart.map(item => <div className="cart-line" key={item.id}><img src={item.image} alt=""/><div><h3>{item.name}</h3><p>{money.format(item.price)}</p><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)}><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}><Plus size={13}/></button></div></div><strong>{money.format(item.price * item.quantity)}</strong></div>)}</div><div className="cart-bottom"><div><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div><p>Shipping and taxes are calculated at checkout.</p><button className="primary" onClick={() => { setCartOpen(false); setCheckout(true) }}>Checkout <ArrowRight size={17}/></button></div></> : <div className="empty"><Sparkles/><p>Your bag is waiting for a few good things.</p><button onClick={() => setCartOpen(false)}>Continue shopping</button></div>}</aside>}
    {checkout && <Checkout cart={cart} subtotal={subtotal} session={session} close={() => setCheckout(false)} success={() => { setCart([]); setCheckout(false); setNotice('Order placed — confirmation email is on its way.') }} />}
  </main>
}

function Checkout({ cart, subtotal, session, close, success }: { cart: CartLine[]; subtotal: number; session: Session | null; close: () => void; success: () => void }) {
  const [email, setEmail] = useState(session?.user.email ?? '')
  const [sending, setSending] = useState(false)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setSending(true); const form = new FormData(event.currentTarget); try { if (!supabase) throw new Error('Configure Supabase to place live orders.'); const { error } = await supabase.functions.invoke('create-order', { body: { email, customerName: String(form.get('customerName')), shippingAddress: { line1: String(form.get('address')), city: String(form.get('city')), postalCode: String(form.get('postalCode')) }, items: cart.map(({ id, quantity }) => ({ id, quantity })) } }); if (error) throw error; success() } catch (error) { alert(error instanceof Error ? error.message : 'We could not place your order. Please try again.') } finally { setSending(false) } }
  return <div className="checkout-overlay"><section className="checkout"><button className="close-checkout" onClick={close}><X size={20}/></button><div className="checkout-brand">EMBER</div><div className="checkout-grid"><form onSubmit={submit}><p className="eyebrow">Checkout</p><h2>A few details,<br/><em>then it’s yours.</em></h2><label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Full name<input required name="customerName" placeholder="Your name"/></label><label>Shipping address<input required name="address" placeholder="Street address"/></label><div className="form-row"><label>City<input required name="city" placeholder="City"/></label><label>Postal code<input required name="postalCode" placeholder="00000"/></label></div><div className="payment-note"><Check size={16}/><span>Secure payment is ready to connect to your payment provider.</span></div><button className="primary" disabled={sending || !cart.length}>{sending ? 'Placing order…' : `Place order · ${money.format(subtotal)}`} <ChevronRight size={17}/></button></form><aside className="order-summary"><p className="eyebrow">Your order</p>{cart.map(item => <div className="summary-line" key={item.id}><img src={item.image} alt=""/><span>{item.name} × {item.quantity}</span><b>{money.format(item.price * item.quantity)}</b></div>)}<div className="total"><span>Total</span><strong>{money.format(subtotal)}</strong></div><p className="fine-print">By placing your order, you agree to our terms. We will send a confirmation to your email.</p></aside></div></section></div>
}

export default App

createRoot(document.getElementById('root')!).render(<App />)
