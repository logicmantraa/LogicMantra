import { useState } from 'react'
import PageShell from '../../components/Layout/PageShell'
import { contactAPI } from '../../utils/api'
import styles from './About.module.css'

const values = [
  {
    title: 'Learner First',
    description: 'We build every feature with the learner experience front and centre.'
  },
  {
    title: 'Outcome Driven',
    description: 'Courses designed around real-world projects and measurable growth.'
  },
  {
    title: 'Community Powered',
    description: 'Connect with mentors, peers, and alumni for lifelong learning.'
  }
]

const contactMetrics = [
  { value: '24/7', label: 'Learner Support' },
  { value: '3 Hrs', label: 'Average Response Time' },
  { value: '40+', label: 'Countries Learners Come From' }
]

export default function About() {
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
          <p className={styles.kicker}>About Logic Mantraa</p>
          <h1>Empowering Learners To Shape The Future</h1>
          <p>
            We are a team of educators, engineers, and storytellers dedicated to creating learning experiences
            that are immersive, accessible, and career defining. From our humble beginnings to a thriving global
            community, Logic Mantraa has been built on the belief that knowledge should be borderless.
          </p>
        </div>
        <div className={styles.heroCards}>
          <div className={styles.highlightCard}>
            <span className={styles.highlightNumber}>50K+</span>
            <span className={styles.highlightLabel}>Lessons Streamed</span>
          </div>
          <div className={styles.highlightCard}>
            <span className={styles.highlightNumber}>120</span>
            <span className={styles.highlightLabel}>Partner Institutions</span>
          </div>
          <div className={styles.highlightCard}>
            <span className={styles.highlightNumber}>4.8★</span>
            <span className={styles.highlightLabel}>Learner Rating</span>
          </div>
        </div>
      </section>

      <section className={`${styles.sectionWrapper} ${styles.valuesSection}`}>
        <h2>What We Stand For</h2>
        <div className={styles.valuesGrid}>
          {values.map((value) => (
            <article key={value.title} className={styles.valueCard}>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.sectionWrapper} ${styles.storySection}`}>
        <div className={styles.storyContent}>
          <h2>Our Story</h2>
          <p>
            Logic Mantraa started in 2018 as a study circle helping college students decode complex concepts through
            storytelling and live workshops. Today we have evolved into a full-fledged learning ecosystem with
            immersive courses, collaborative projects, and mentorship-driven bootcamps.
          </p>
          <p>
            Every course on Logic Mantraa is crafted with industry mentors, combining real-world problem solving with
            the consistent support of our learning coaches. We continue to experiment with new mediums – interactive
            sandboxes, AI assistants, and cohort-based challenges – to keep our learners ahead of the curve.
          </p>
        </div>
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <span className={styles.timelineYear}>2018</span>
            <p className={styles.timelineItemText}>Founded with 30 learners and weekend knowledge sessions.</p>
          </div>
          <div className={styles.timelineItem}>
            <span className={styles.timelineYear}>2020</span>
            <p className={styles.timelineItemText}>Launched our digital platform, welcoming remote learners worldwide.</p>
          </div>
          <div className={styles.timelineItem}>
            <span className={styles.timelineYear}>2023</span>
            <p className={styles.timelineItemText}>Introduced AI-assisted practice labs and mentor-led cohorts.</p>
          </div>
        </div>
      </section>

      <section className={`${styles.sectionWrapper} ${styles.contactSection}`}>
        <div className={styles.contactIntro}>
          <h2>Let’s Build Something Extraordinary</h2>
          <p>
            Whether you are a learner, educator, or organisation, we’d love to hear from you. Drop us a note and
            our team will reach out within a few hours.
          </p>
          <div className={styles.metrics}>
            {contactMetrics.map((metric) => (
              <div key={metric.label} className={styles.metric}>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
          {/* Dedicated ad slot reserved for future partnerships & Google Ads - Commented out for v1 */}
          {/* <div className={styles.adSpace}>
            Dedicated ad slot reserved for future partnerships & Google Ads.
          </div> */}
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

      <section className={`${styles.sectionWrapper} ${styles.mapSection}`}>
        <div className={styles.mapCard}>
          <h2>Where You’ll Find Us</h2>
          <p>
            {/* 3rd floor, Gurunanak Plaza, Kota, Rajasthan, India ·  */}
            Mail us at <a href="mailto:logicmantraa@gmail.com">logicmantraa@gmail.com</a>
          </p>
          {/* <div className={styles.mapPlaceholder}>
            Interactive map & campus walkthrough coming soon.
          </div> */}
        </div>
      </section>
    </PageShell>
  )
}


