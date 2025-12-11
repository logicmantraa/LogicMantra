import { useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import PageShell from '../../components/Layout/PageShell'
import styles from './PaymentSuccess.module.css'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const { order, verification, isFree } = location.state || {}

  useEffect(() => {
    // Redirect to home if no order data
    if (!order) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [order, navigate])

  if (!order) {
    return (
      <PageShell contentClassName={styles.container}>
        <div className={styles.message}>
          <h2>Redirecting...</h2>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell contentClassName={styles.container}>
      <div className={styles.successBox}>
        <div className={styles.icon}>✓</div>
        <h1>Payment Successful!</h1>
        <p className={styles.subtitle}>
          {isFree 
            ? 'Your free order has been completed successfully.'
            : 'Thank you for your purchase. Your order has been confirmed.'}
        </p>

        <div className={styles.orderDetails}>
          <h3>Order Details</h3>
          <div className={styles.detailRow}>
            <span>Order ID:</span>
            <span className={styles.orderId}>{order.orderId}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Total Amount:</span>
            <strong>₹{order.totalAmount}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Status:</span>
            <span className={styles.status}>{order.paymentStatus}</span>
          </div>
        </div>

        <div className={styles.itemsList}>
          <h3>Purchased Items</h3>
          {order.items?.map((item, index) => (
            <div key={index} className={styles.item}>
              <span>{item.name}</span>
              <span>₹{item.price}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Link to="/my-courses" className={styles.primaryBtn}>
            Go to My Courses
          </Link>
          <Link to="/store" className={styles.secondaryBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </PageShell>
  )
}

