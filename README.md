# HRMS – Human Resource Management System

A full-stack **Human Resource Management System (HRMS)** designed to manage employees, departments, attendance, leave, payroll, performance, helpdesk requests, and role-based access.

## 🚀 Project Overview

The HRMS application provides separate dashboards and functionality for four organizational roles:

- **ADMIN**
- **HR**
- **MANAGER**
- **EMPLOYEE**

The system implements role-based access control (RBAC) and organizational hierarchy to ensure users can access only the features and data permitted for their role.

---

## 👥 User Roles

### 🔐 ADMIN
- Manage HR accounts
- Manage departments and designations
- View attendance and leave information
- Manage payroll
- View performance reviews
- Access audit history
- Manage HR helpdesk requests

### 👨‍💼 HR
- Create and manage Manager accounts
- Create and manage Employee accounts
- Manage employees
- Manage departments and designations
- Manage attendance
- Manage leave requests
- Generate and manage payroll
- Manage performance reviews
- Handle employee and manager helpdesk requests

### 👨‍💻 MANAGER
- View and manage assigned team members
- View attendance
- Manage leave-related activities
- View payroll information
- Participate in performance reviews
- Contact HR through the helpdesk

### 👤 EMPLOYEE
- View and update profile
- View attendance
- Apply for leave
- View payroll information
- View performance information
- Contact HR through the helpdesk

---

## ✨ Key Features

- JWT-based authentication
- Role-Based Access Control (RBAC)
- Four separate role dashboards
- Employee management
- Manager management
- Department management
- Designation management
- Attendance management
- Leave management
- Payroll management
- Performance reviews
- HR helpdesk system
- Notifications
- Account security features
- Protected routes
- Responsive user interface

---

## 🛠️ Frontend Technologies

- **React**
- **Vite**
- **JavaScript**
- **Axios**
- **React Router**
- **CSS**

---

## ☁️ Backend & Cloud Technologies

The complete HRMS project was developed using:

- **Java**
- **Spring Boot**
- **Spring Security**
- **JWT Authentication**
- **MySQL**
- **Docker**
- **AWS**
- **Amazon EC2**
- **Amazon RDS**
- **Amazon ECR**
- **Amazon S3**
- **Amazon CloudFront**
- **AWS IAM**
- **AWS CloudWatch**

---

## 📁 Project Structure

```text
src/
│
├── components/      # Reusable components
├── layouts/         # Role-based layouts
├── pages/           # Application pages
├── routes/          # Application routing and protected routes
├── services/        # API and authentication services
├── styles/          # CSS files
└── assets/          # Images and static assets
```

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/soumyaranjanmohanty-creator/HRMS-Frontend.git
```

### 2. Navigate to the project

```bash
cd HRMS-Frontend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create a `.env` file

Create a `.env` file in the project root and add:

```env
VITE_API_BASE_URL=http://localhost:8080
```

> Make sure the Spring Boot backend is running locally on port `8080`.

### 5. Start the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🔒 Environment Configuration

This repository does not contain sensitive credentials.

Use the `.env.example` file as a reference:

```env
VITE_API_BASE_URL=https://your-api-url.example.com
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## ☁️ AWS Deployment

The HRMS project was successfully deployed and tested using AWS cloud services.

Deployment architecture included:

```text
React Frontend
      ↓
Amazon S3
      ↓
Amazon CloudFront
      ↓
Spring Boot Backend
      ↓
Docker
      ↓
Amazon EC2
      ↓
Amazon RDS (MySQL)
```

Additional AWS services used in the project architecture include IAM, CloudWatch, and Amazon ECR.

> **Note:** Cloud infrastructure may be stopped or removed after testing to avoid unnecessary AWS charges. The complete source code and local development configuration are available in this repository.

---

## 🔐 Security

The application includes:

- JWT-based authentication
- Protected routes
- Role-Based Access Control
- Account security mechanisms
- Secure environment configuration
- Sensitive credentials excluded from the repository

---

## 👨‍💻 Author

**Soumyaranjan Mohanty**

MCA Student | Aspiring AWS Cloud Engineer

---

## 📌 Project Status

✅ Frontend development completed  
✅ Backend integration completed  
✅ Local testing completed  
✅ AWS deployment tested  
✅ Source code available for local setup
