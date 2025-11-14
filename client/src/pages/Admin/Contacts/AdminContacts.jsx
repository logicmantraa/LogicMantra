import { useState, useEffect } from 'react'
import { contactAPI } from '../../../utils/api'
import PageShell from '../../../components/Layout/PageShell'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './AdminContacts.module.css'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' }
]

const intentOptions = [
  { value: '', label: 'All Intents' },
  { value: 'learn', label: 'I want to learn' },
  { value: 'teach', label: 'I want to teach' },
  { value: 'partner', label: 'We want to partner' }
]

export default function AdminContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIntent, setFilterIntent] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [filterStatus, filterIntent])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterIntent) params.intent = filterIntent
      
      const response = await contactAPI.getContacts(params)
      // Handle both response formats: {contacts, total, page, pages} or just array
      setContacts(response.contacts || response || [])
    } catch (err) {
      console.error('Failed to load contacts:', err)
      alert(err.message || 'Failed to load contact submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (contactId, newStatus) => {
    setUpdatingStatus(true)
    try {
      await contactAPI.updateContactStatus(contactId, newStatus)
      await loadContacts()
      if (selectedContact?._id === contactId) {
        const updated = await contactAPI.getContactById(contactId)
        setSelectedContact(updated)
      }
    } catch (err) {
      alert(err.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDelete = async (contactId, contactName) => {
    if (!window.confirm(`Are you sure you want to delete contact submission from "${contactName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await contactAPI.deleteContact(contactId)
      await loadContacts()
      if (selectedContact?._id === contactId) {
        setSelectedContact(null)
      }
    } catch (err) {
      alert(err.message || 'Failed to delete contact')
    }
  }

  const handleSelectContact = async (contact) => {
    try {
      const fullContact = await contactAPI.getContactById(contact._id)
      setSelectedContact(fullContact)
    } catch (err) {
      console.error('Failed to load contact details:', err)
      setSelectedContact(contact)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return styles.statusNew
      case 'read':
        return styles.statusRead
      case 'replied':
        return styles.statusReplied
      case 'archived':
        return styles.statusArchived
      default:
        return styles.statusNew
    }
  }

  const getIntentLabel = (intent) => {
    switch (intent) {
      case 'learn':
        return 'I want to learn'
      case 'teach':
        return 'I want to teach'
      case 'partner':
        return 'We want to partner'
      default:
        return intent
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    read: contacts.filter(c => c.status === 'read').length,
    replied: contacts.filter(c => c.status === 'replied').length
  }

  return (
    <AdminRoute>
      <PageShell contentClassName={styles.container}>
        <div className={styles.header}>
          <h1>Contact Submissions</h1>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total</span>
              <span className={styles.statValue}>{stats.total}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>New</span>
              <span className={styles.statValue}>{stats.new}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Read</span>
              <span className={styles.statValue}>{stats.read}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Replied</span>
              <span className={styles.statValue}>{stats.replied}</span>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value)}
            className={styles.filterSelect}
          >
            {intentOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.content}>
          <div className={styles.contactsList}>
            {loading ? (
              <div className={styles.loading}>Loading contact submissions...</div>
            ) : filteredContacts.length === 0 ? (
              <div className={styles.empty}>No contact submissions found</div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  className={`${styles.contactCard} ${selectedContact?._id === contact._id ? styles.selected : ''}`}
                  onClick={() => handleSelectContact(contact)}
                >
                  <div className={styles.contactInfo}>
                    <div className={styles.contactHeader}>
                      <h3>{contact.name}</h3>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(contact.status)}`}>
                        {contact.status}
                      </span>
                    </div>
                    <p className={styles.contactEmail}>{contact.email}</p>
                    <div className={styles.contactMeta}>
                      <span className={styles.intentBadge}>{getIntentLabel(contact.intent)}</span>
                      <span className={styles.date}>
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={styles.contactPreview}>
                      {contact.message?.substring(0, 100)}
                      {contact.message?.length > 100 ? '...' : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedContact && (
            <div className={styles.contactDetail}>
              <div className={styles.detailHeader}>
                <h2>Contact Details</h2>
                <button onClick={() => setSelectedContact(null)} className={styles.closeBtn}>×</button>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <div className={styles.detailItem}>
                    <label>Name</label>
                    <p>{selectedContact.name}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Email</label>
                    <p>
                      <a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a>
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Intent</label>
                    <p className={styles.intentBadge}>{getIntentLabel(selectedContact.intent)}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Status</label>
                    <p>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedContact.status)}`}>
                        {selectedContact.status}
                      </span>
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Submitted</label>
                    <p>{new Date(selectedContact.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedContact.userId && (
                    <div className={styles.detailItem}>
                      <label>User Account</label>
                      <p>Linked to user account</p>
                    </div>
                  )}
                </div>
                <div className={styles.detailSection}>
                  <label>Message</label>
                  <div className={styles.messageBox}>
                    <p>{selectedContact.message}</p>
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <div className={styles.statusActions}>
                    <label>Update Status:</label>
                    <div className={styles.statusButtons}>
                      {['new', 'read', 'replied', 'archived'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(selectedContact._id, status)}
                          disabled={updatingStatus || selectedContact.status === status}
                          className={`${styles.statusBtn} ${selectedContact.status === status ? styles.active : ''}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedContact._id, selectedContact.name)}
                    className={styles.deleteBtn}
                  >
                    Delete Submission
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </AdminRoute>
  )
}

