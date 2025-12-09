import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PageShell from '../../components/Layout/PageShell'
import styles from './Home.module.css'

export default function Home() {
  const { user } = useAuth()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const features = [
    {
      icon: '📚',
      title: 'Comprehensive Courses',
      description: 'Access a wide range of courses designed by industry experts'
    },
    {
      icon: '🎥',
      title: 'Video Lectures',
      description: 'Learn at your own pace with high-quality video content'
    },
    {
      icon: '📝',
      title: 'Practice Resources',
      description: 'Reinforce your learning with notes and practice sheets'
    },
    {
      icon: '⭐',
      title: 'Expert Ratings',
      description: 'Learn from top-rated courses reviewed by thousands of students'
    },
    {
      icon: '🔍',
      title: 'Smart Search',
      description: 'Find exactly what you need with our advanced search and filters'
    },
    {
      icon: '💼',
      title: 'Career Ready',
      description: 'Build skills that employers are looking for'
    }
  ]

  const stats = [
    { number: '10K+', label: 'Active Students' },
    { number: '500+', label: 'Courses' },
    { number: '50+', label: 'Expert Instructors' },
    { number: '98%', label: 'Satisfaction Rate' }
  ]

  return (
    <PageShell contentClassName={styles.shell}>
      <div className={styles.animatedBg}>
        <div
          className={styles.gradientOrb}
          style={{
            left: `${mousePosition.x / 20}px`,
            top: `${mousePosition.y / 20}px`
          }}
        ></div>
        <div
          className={styles.gradientOrb2}
          style={{
            left: `${mousePosition.x / 15}px`,
            top: `${mousePosition.y / 15}px`
          }}
        ></div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>🚀 Transform Your Future</span>
          </div>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleLine1}>Master Skills That</span>
            <span className={styles.titleLine2}>
              <span className={styles.highlight}>Matter</span>
              <span className={styles.cursor}>|</span>
            </span>
          </h1>
          <p className={styles.heroSubtitle}>
            Join thousands of learners on Logic Mantraa. Access world-class courses, learn from industry experts, 
            and accelerate your career.
          </p>
          <div className={styles.cta}>
            <Link to="/courses" className={styles.primaryBtn}>
              <span>Explore Courses</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            {!user && (
              <Link to="/login" className={styles.secondaryBtn}>
                Get Started Free
              </Link>
            )}
          </div>
          <div className={styles.stats}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <div className={styles.statNumber}>{stat.number}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard} style={{ animationDelay: '0s' }}>
            <div className={styles.cardIcon}>📚</div>
            <div className={styles.cardText}>Courses</div>
          </div>
          <div className={styles.floatingCard} style={{ animationDelay: '0.5s' }}>
            <div className={styles.cardIcon}>🎓</div>
            <div className={styles.cardText}>Learn</div>
          </div>
          <div className={styles.floatingCard} style={{ animationDelay: '1s' }}>
            <div className={styles.cardIcon}>⭐</div>
            <div className={styles.cardText}>Excel</div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose Logic Mantraa?</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to succeed in your learning journey
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={feature.title} className={styles.featureCard} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Start Learning?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of students already learning on Logic Mantraa
          </p>
          {!user ? (
            <div className={styles.ctaButtons}>
              <Link to="/signup" className={styles.ctaPrimaryBtn}>
                Create Free Account
              </Link>
              <Link to="/courses" className={styles.ctaSecondaryBtn}>
                Browse Courses
              </Link>
            </div>
          ) : (
            <Link to="/courses" className={styles.ctaPrimaryBtn}>
              Continue Learning
            </Link>
          )}
        </div>
      </section>

      {/* Ads disabled for v1 */}
    </PageShell>
  )
}
