import { useNavigate, useLocation, Link } from 'react-router-dom'
import PageShell from '../../components/Layout/PageShell'
import styles from './PaymentFailure.module.css'

export default function PaymentFailure() {
  const navigate = useNavigate()
  const location = useLocation()
  const { error } = location.state || {}

  return (
    <PageShell contentClassName={styles.container}>
      <div className={styles.failureBox}>
        <div className={styles.icon}>✗</div>
        <h1>Payment Failed</h1>
        <p className={styles.subtitle}>
          {error || 'Your payment could not be processed. Please try again.'}
        </p>

        <div className={styles.infoBox}>
          <p>If money was deducted from your account, it will be refunded within 5-7 business days.</p>
        </div>

        <div className={styles.actions}>
          <button onClick={() => navigate('/cart')} className={styles.primaryBtn}>
            Try Again
          </button>
          <Link to="/store" className={styles.secondaryBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </PageShell>
  )
}

