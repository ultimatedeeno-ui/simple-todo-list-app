import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

type Line = { id: string; quantity: number }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const token = request.headers.get('Authorization') ?? ''
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: token } } })
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { email, customerName, shippingAddress, items } = await request.json() as { email: string; customerName: string; shippingAddress: Record<string, string>; items: Line[] }
    if (!email || !customerName || !shippingAddress?.line1 || !Array.isArray(items) || items.length === 0) throw new Error('Please complete your contact, shipping, and bag details.')
    const ids = items.map((item) => item.id)
    const { data: products, error: productError } = await admin.from('products').select('id, name, price_cents').in('id', ids).eq('active', true)
    if (productError || !products || products.length !== new Set(ids).size) throw new Error('One or more bag items are unavailable.')
    const orderLines = items.map((line) => {
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) throw new Error('Invalid quantity.')
      const product = products.find((candidate) => candidate.id === line.id)!
      return { product_id: product.id, product_name: product.name, unit_price_cents: product.price_cents, quantity: line.quantity }
    })
    const subtotal = orderLines.reduce((total, line) => total + line.unit_price_cents * line.quantity, 0)
    const { data: { user } } = await client.auth.getUser()
    const { data: order, error: orderError } = await admin.from('orders').insert({ email, customer_name: customerName, shipping_address: shippingAddress, subtotal_cents: subtotal, user_id: user?.id ?? null }).select('id').single()
    if (orderError || !order) throw new Error('Could not save your order.')
    const { error: itemError } = await admin.from('order_items').insert(orderLines.map((line) => ({ ...line, order_id: order.id })))
    if (itemError) throw new Error('Could not save order items.')
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')
    const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
    if (mailgunDomain && mailgunKey) {
      const form = new URLSearchParams({ from: `Ember <orders@${mailgunDomain}>`, to: email, subject: `Order confirmation · ${order.id.slice(0, 8)}`, text: `Thank you, ${customerName}. We received your Ember order for $${(subtotal / 100).toFixed(2)}. Order number: ${order.id}.` })
      const mailResponse = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, { method: 'POST', headers: { Authorization: `Basic ${btoa(`api:${mailgunKey}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
      if (!mailResponse.ok) console.error('Mailgun confirmation failed:', await mailResponse.text())
    }
    return Response.json({ orderId: order.id }, { headers: cors })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, { status: 400, headers: cors })
  }
})
