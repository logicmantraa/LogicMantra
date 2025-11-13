import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userAPI } from '../../../utils/api'
import Navbar from '../../../components/Navbar/Navbar'
import AdminRoute from '../../../components/AdminRoute/AdminRoute'
import styles from './AdminUsers.module.css'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await userAPI.getUsers()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users:', err)
      alert(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await userAPI.deleteUser(userId)
      loadUsers()
      if (selectedUser?._id === userId) {
        setSelectedUser(null)
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user')
    }
  }

  const handleToggleAdmin = async (user) => {
    try {
      await userAPI.updateUser(user._id, { isAdmin: !user.isAdmin })
      loadUsers()
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...selectedUser, isAdmin: !user.isAdmin })
      }
    } catch (err) {
      alert(err.message || 'Failed to update user')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && user.isAdmin) ||
                       (filterRole === 'student' && !user.isAdmin)
    return matchesSearch && matchesRole
  })

  return (
    <AdminRoute>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>User Management</h1>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Users</span>
              <span className={styles.statValue}>{users.length}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Admins</span>
              <span className={styles.statValue}>{users.filter(u => u.isAdmin).length}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Students</span>
              <span className={styles.statValue}>{users.filter(u => !u.isAdmin).length}</span>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins Only</option>
            <option value="student">Students Only</option>
          </select>
        </div>

        <div className={styles.content}>
          <div className={styles.usersList}>
            {loading ? (
              <div className={styles.loading}>Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.empty}>No users found</div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`${styles.userCard} ${selectedUser?._id === user._id ? styles.selected : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.details}>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <div className={styles.badges}>
                        {user.isAdmin && (
                          <span className={styles.adminBadge}>Admin</span>
                        )}
                        <span className={styles.userBadge}>
                          {user.isAdmin ? 'Administrator' : 'Student'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleAdmin(user)
                      }}
                      className={`${styles.toggleBtn} ${user.isAdmin ? styles.removeAdmin : styles.makeAdmin}`}
                    >
                      {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(user._id, user.name)
                      }}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedUser && (
            <div className={styles.userDetail}>
              <div className={styles.detailHeader}>
                <h2>User Details</h2>
                <button onClick={() => setSelectedUser(null)} className={styles.closeBtn}>×</button>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <div className={styles.detailItem}>
                    <label>Name</label>
                    <p>{selectedUser.name}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Email</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Role</label>
                    <p>
                      {selectedUser.isAdmin ? (
                        <span className={styles.adminBadge}>Administrator</span>
                      ) : (
                        <span className={styles.userBadge}>Student</span>
                      )}
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>User ID</label>
                    <p className={styles.userId}>{selectedUser._id}</p>
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <button
                    onClick={() => handleToggleAdmin(selectedUser)}
                    className={`${styles.toggleBtn} ${selectedUser.isAdmin ? styles.removeAdmin : styles.makeAdmin}`}
                  >
                    {selectedUser.isAdmin ? 'Remove Admin Access' : 'Grant Admin Access'}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedUser._id, selectedUser.name)}
                    className={styles.deleteBtn}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  )
}

