# Logic Mantraa Backend Architecture Guidelines

## 🎯 Goal

Build a scalable, secure, and production-ready backend that supports multiple product types and future growth without rework.

---

## 🧱 Core Architecture

```
Controller → Service → Repository → Model
```

### Rules:

* Controllers = HTTP only
* Services = Business logic
* Repositories = DB queries
* Models = Schema only

---

## 🧠 Design Principles

### 1. Separation of Concerns

No mixing of:

* HTTP logic
* Business logic
* Data access

---

### 2. Reusability

* No duplicate logic
* Shared utilities/services

---

### 3. Scalability

* System must support:

  * Courses
  * Test Series
  * PDFs
  * Future products

---

### 4. Extensibility

Adding a new product type should NOT require:

* major refactor
* duplication

---

## 🛍️ Product-First Approach

Everything is a **Product**

Examples:

* Course
* Test Series
* PDF
* Bundle (future)

---

## 👤 Access System

Replace:

```
Enrollment (course-specific)
```

With:

```
UserProductAccess (generic)
```

---

## 🔐 Security Rules

* Always validate ownership
* Never trust client input
* Rate limit sensitive endpoints
* Sanitize all inputs

---

## ⚡ Performance Rules

* Use caching for:

  * Product listing
  * Dashboard
* Avoid N+1 queries
* Prefer aggregation pipelines

---

## ❌ Anti-Patterns (Strictly Avoid)

* Fat controllers
* Business logic in routes
* Duplicate logic
* Hardcoded values
* Direct DB calls from controllers

---

## 🔄 Migration Safety

* No breaking existing users
* Backward compatibility required
* Data integrity must be preserved

---

## 🚀 Future Readiness

System must be ready for:

* Payments
* Subscriptions
* Bundles
* Discounts
* Analytics

---

## 🧠 Final Principle

> Build once, scale forever.

Avoid short-term hacks that create long-term problems.
