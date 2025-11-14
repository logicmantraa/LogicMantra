import { useState } from 'react'
import PageShell from '../../components/Layout/PageShell'
import { contactAPI } from '../../utils/api'
import styles from './Contact.module.css'

const contactMetrics = [
  { value: '24/7', label: 'Learner Support' },
  { value: '3 Hrs', label: 'Average Response Time' },
  { value: '40+', label: 'Countries Learners Come From' }
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    intent: 'learn',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus(null)

    try {
      await contactAPI.submitContact(formData)
      setSubmitStatus({ type: 'success', message: 'Thank you for contacting us! We will get back to you soon.' })
      setFormData({
        name: '',
        email: '',
        intent: 'learn',
        message: ''
      })
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err.message || 'Failed to send message. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell contentClassName={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>Get In Touch</h1>
          <p>
            Whether you are a learner, educator, or organisation, we'd love to hear from you. 
            Drop us a note and our team will reach out within a few hours.
          </p>
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className={styles.contactIntro}>
          <h2>Let's Build Something Extraordinary</h2>
          <p>
            Have questions about our courses? Want to teach with us? Looking for partnerships?
            We're here to help you on your learning journey.
          </p>
          <div className={styles.metrics}>
            {contactMetrics.map((metric) => (
              <div key={metric.label} className={styles.metric}>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <form className={styles.contactForm} onSubmit={handleSubmit}>
          {submitStatus && (
            <div className={submitStatus.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {submitStatus.message}
            </div>
          )}
          <div className={styles.formGrid}>
            <label>
              Full Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                required
                disabled={submitting}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
                disabled={submitting}
              />
            </label>
          </div>
          <label>
            Select Intent
            <select
              name="intent"
              value={formData.intent}
              onChange={handleInputChange}
              disabled={submitting}
            >
              <option value="learn">I want to learn</option>
              <option value="teach">I want to teach</option>
              <option value="partner">We want to partner</option>
            </select>
          </label>
          <label>
            Your Message
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={5}
              placeholder="Tell us how we can help…"
              required
              disabled={submitting}
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>

      <section className={styles.infoSection}>
        <div className={styles.infoCard}>
          <h2>Where You'll Find Us</h2>
          <div className={styles.infoContent}>
            <div className={styles.infoItem}>
              <h3>Address</h3>
              <p>91/4 Knowledge Park, Bengaluru, India</p>
            </div>
            <div className={styles.infoItem}>
              <h3>Email</h3>
              <p><a href="mailto:hello@logicmantraa.com">hello@logicmantraa.com</a></p>
            </div>
            <div className={styles.infoItem}>
              <h3>Support</h3>
              <p>Available 24/7 for all learners</p>
            </div>
          </div>
          <div className={styles.mapPlaceholder}>
            Interactive map & campus walkthrough coming soon.
          </div>
        </div>
      </section>
    </PageShell>
  )
}

