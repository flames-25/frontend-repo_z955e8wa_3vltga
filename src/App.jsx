import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ProductCard({ product, onAdd }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
      <img src={product.image_url || `https://picsum.photos/seed/${encodeURIComponent(product.title)}/600/400`} alt={product.title} className="w-full h-44 object-cover" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-800 line-clamp-2">{product.title}</h3>
          <span className="text-green-600 font-bold">${product.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">{product.category}</span>
          <button onClick={() => onAdd(product)} className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-90">Add</button>
        </div>
      </div>
    </div>
  )
}

function Cart({ items, onUpdateQty, onCheckout }) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const delivery = items.length ? 4.99 : 0
  const total = subtotal + delivery

  return (
    <div className="sticky top-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-800">Your Cart</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 mt-2">No items yet</p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((it) => (
            <div key={it.title} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{it.title}</p>
                <span className="text-xs text-gray-500">${it.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdateQty(it.title, Math.max(1, it.quantity - 1))} className="px-2 py-1 rounded border">-</button>
                <span className="w-6 text-center">{it.quantity}</span>
                <button onClick={() => onUpdateQty(it.title, it.quantity + 1)} className="px-2 py-1 rounded border">+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t pt-3 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>${delivery.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold mt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
        <button disabled={!items.length} onClick={onCheckout} className="w-full mt-3 bg-emerald-600 text-white py-2 rounded-lg disabled:opacity-40">Checkout</button>
      </div>
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const url = `${API_BASE}/api/products${category ? `?category=${encodeURIComponent(category)}` : ''}`
        const res = await fetch(url)
        const data = await res.json()
        setProducts(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [category])

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category))
    return Array.from(set)
  }, [products])

  const addToCart = (p) => {
    setCart(prev => {
      const existing = prev.find(it => it.title === p.title)
      if (existing) {
        return prev.map(it => it.title === p.title ? { ...it, quantity: it.quantity + 1 } : it)
      }
      return [...prev, { title: p.title, price: p.price, product_id: p._id || '', quantity: 1 }]
    })
  }

  const updateQty = (title, qty) => {
    setCart(prev => prev.map(it => it.title === title ? { ...it, quantity: qty } : it))
  }

  const checkout = async () => {
    try {
      setMessage('Placing order...')
      const payload = {
        customer_name: 'Guest',
        customer_email: 'guest@example.com',
        customer_address: '123 Sample Street',
        items: cart.map(it => ({ product_id: it.product_id, title: it.title, price: it.price, quantity: it.quantity })),
        subtotal: cart.reduce((s, it) => s + it.price * it.quantity, 0),
        delivery_fee: 4.99,
        total: 0,
        status: 'pending'
      }
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Order failed')
      const data = await res.json()
      setMessage(`Order placed! #${data.id}`)
      setCart([])
    } catch (e) {
      console.error(e)
      setMessage('Could not place order')
    } finally {
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <span className="font-semibold text-gray-800">FlavorHub</span>
          </div>
          <div className="flex gap-2">
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {loading ? (
            <div className="text-center text-gray-500">Loading products...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <ProductCard key={p.title} product={p} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>
        <div>
          <Cart items={cart} onUpdateQty={updateQty} onCheckout={checkout} />
          {message && <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 p-2 rounded">{message}</p>}
        </div>
      </main>
    </div>
  )
}

export default App
