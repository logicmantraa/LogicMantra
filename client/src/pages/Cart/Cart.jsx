import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cartAPI, paymentAPI } from '../../utils/api'
import { handleRazorpayPayment } from '../../utils/payment'
import PageShell from '../../components/Layout/PageShell'
import styles from './Cart.module.css'

export default function Cart() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      loadCart()
    }
  }, [user])

  const loadCart = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cartAPI.getCart()
      setCart(data)
    } catch (err) {
      console.error('Failed to load cart:', err)
      setError(err.message || 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (cartItemId) => {
    try {
      await cartAPI.removeItem(cartItemId)
      await loadCart()
    } catch (err) {
      alert(err.message || 'Failed to remove item')
    }
  }

  const handleClearCart = async () => {
    if (!window.confirm('Clear all items from cart?')) return
    try {
      await cartAPI.clearCart()
      await loadCart()
    } catch (err) {
      alert(err.message || 'Failed to clear cart')
    }
  }

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Create order from cart
      const orderData = await paymentAPI.createOrder()

      // If free order, redirect to success
      if (orderData.isFree) {
        navigate('/payment/success', { 
          state: { order: orderData.order, isFree: true }
        })
        return
      }

      // Handle Razorpay payment for paid orders
      const result = await handleRazorpayPayment(orderData)
      
      if (result.success) {
        navigate('/payment/success', { 
          state: { order: result.verification.order, verification: result.verification }
        })
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Payment failed')
      if (err.message !== 'Payment cancelled by user') {
        navigate('/payment/failure', { 
          state: { error: err.message || 'Payment failed' }
        })
      }
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.loading}>Loading cart...</div>
      </PageShell>
    )
  }

  if (error && !cart) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.error}>{error}</div>
      </PageShell>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <p>Add items from the store or courses to get started.</p>
          <button onClick={() => navigate('/store')} className={styles.browseBtn}>
            Browse Store
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell contentClassName={styles.container}>
      <div className={styles.header}>
        <h1>Shopping Cart</h1>
        <button onClick={handleClearCart} className={styles.clearBtn} type="button">
          Clear Cart
        </button>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.cartContent}>
        <div className={styles.itemsSection}>
          {cart.items.map((item) => (
            <div key={item._id} className={styles.cartItem}>
              {item.itemDetails?.thumbnail && (
                <img 
                  src={item.itemDetails.thumbnail} 
                  alt={item.itemDetails.name}
                  className={styles.itemImage}
                />
              )}
              <div className={styles.itemDetails}>
                <h3>{item.itemDetails?.name || 'Item'}</h3>
                <p className={styles.itemType}>
                  {item.itemType === 'course' ? 'Course' : 'Store Item'}
                </p>
                <p className={styles.itemPrice}>₹{item.price}</p>
              </div>
              <button
                onClick={() => handleRemoveItem(item._id)}
                className={styles.removeBtn}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className={styles.summarySection}>
          <div className={styles.summaryBox}>
            <h3>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>Items ({cart.itemCount})</span>
              <span>₹{cart.total}</span>
            </div>
            <div className={styles.summaryRow}>
              <strong>Total</strong>
              <strong>₹{cart.total}</strong>
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing}
              className={styles.checkoutBtn}
              type="button"
            >
              {processing ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

