import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ratingAPI } from '../../utils/api'
import styles from './Rating.module.css'

export default function Rating({ courseId, onRatingSubmit }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [myRating, setMyRating] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && courseId) {
      loadMyRating()
    }
  }, [user, courseId])

  const loadMyRating = async () => {
    try {
      const data = await ratingAPI.getMyRating(courseId)
      if (data) {
        setMyRating(data)
        setRating(data.rating)
        setFeedback(data.feedback || '')
      }
    } catch (err) {
      console.error('Failed to load rating:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await ratingAPI.submitRating({
        courseId,
        rating,
        feedback
      })
      setMyRating(data)
      if (onRatingSubmit) {
        onRatingSubmit(data)
      }
    } catch (err) {
      setError(err.message || 'Failed to submit rating')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div>Please login to rate this course</div>
  }

  return (
    <div className={styles.ratingContainer}>
      <h3>{myRating ? 'Update Your Rating' : 'Rate This Course'}</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={styles.star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              <span className={star <= (hover || rating) ? styles.filled : ''}>
                ★
              </span>
            </button>
          ))}
        </div>
        <textarea
          placeholder="Optional feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : myRating ? 'Update Rating' : 'Submit Rating'}
        </button>
      </form>
    </div>
  )
}

