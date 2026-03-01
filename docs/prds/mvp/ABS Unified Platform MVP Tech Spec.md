# **ABS Unified Platform**

## **MVP Developer Technical Specification (Execution Ready)**

---

# **1\. Overview**

This document defines the technical architecture, stack decisions, database structure, APIs, security model, and deployment approach for the ABS MVP launch.

MVP Scope Includes:

* Hardware RFQ system  
* Arcplus SaaS landing \+ Free Trial  
* Subscription management  
* Training registration  
* Mobile money payment integration  
* Admin management dashboard

---

# **2\. Technology Stack (MVP)**

## **Frontend**

* Next.js (App Router)  
* TypeScript  
* Tailwind CSS  
* REST API integration

## **Backend**

* Django  
* Django REST Framework  
* PostgreSQL  
* Celery (async tasks – optional MVP-lite)

## **Infrastructure**

* VPS (DigitalOcean / Hetzner)  
* Nginx  
* Gunicorn  
* SSL (Let’s Encrypt)

## **Containerize**

* Docker

---

# **3\. System Architecture**

Client (Browser)  
→ Next.js Frontend  
→ Django REST API  
→ Django Core Services  
→ PostgreSQL Database

External Services:

* Mobile Money API  
* Email Service (SendGrid / SMTP)

---

# **4\. Database Models (Core)**

## **User**

* id  
* name  
* email  
* password\_hash  
* role (admin, client, trial)  
* country

## **Organization**

* id  
* name  
* country  
* subscription\_plan  
* trial\_expiry

## **Product (Hardware)**

* id  
* name  
* category  
* description  
* specifications\_json

## **QuoteRequest**

* id  
* organization\_id  
* product\_id  
* selected\_specs  
* quantity  
* status

## **Subscription**

* id  
* organization\_id  
* plan  
* billing\_cycle  
* payment\_status  
* expiry\_date

## **TrainingRegistration**

* id  
* user\_id  
* training\_type  
* payment\_status

---

# **5\. API Endpoints (MVP)**

## **Auth**

POST /api/auth/register  
POST /api/auth/login

## **Hardware RFQ**

GET /api/products  
POST /api/quote-request

## **Arcplus**

POST /api/trial/start  
POST /api/subscription/create  
POST /api/subscription/webhook

## **Training**

POST /api/training/register

## **Admin**

GET /api/admin/quotes  
GET /api/admin/subscriptions

---

# **6\. Free Trial Logic**

* Trial duration: 14 or 30 days  
* Auto-create Organization on signup  
* Auto-expire after trial\_expiry  
* Email reminders at:  
  * Day 7  
  * 3 days before expiry  
  * Expiry day

---

# **7\. Payment Integration**

* Mobile Money API  
* Webhook endpoint for confirmation  
* Status transitions:  
  pending → confirmed → active

---

# **8\. Security Requirements**

* HTTPS enforced  
* JWT authentication  
* Role-based access control  
* Input validation (DRF serializers)  
* Admin-only endpoints protected

---

# **9\. Deployment Plan**

1. Provision VPS  
2. Install PostgreSQL  
3. Deploy Django backend  
4. Deploy Next.js frontend  
5. Configure Nginx reverse proxy  
6. Enable SSL

---

