# GatorTutor - Tutoring Platform

Welcome to the **GatorTutor** repository, a dedicated peer-to-peer tutoring marketplace. This full-stack web application connects students seeking academic assistance with qualified peer tutors in a secure and user-friendly environment.

## 🚀 About The App
GatorTutor simplifies the process of finding academic help. Whether you're a student struggling or a Tutor looking to share your knowledge, our platform manages the entire workflow — from discovery to booking and communication.

## ✨ Key Features

### 🔍 Advanced Search & AI Discovery
- **Smart Filters**: Easily find tutors by Department, Course (e.g., CSC 648), Hourly Rate, and Availability, reccomendations based on your personal schedule.
- **AI Assistant**: Features a cutting-edge **AI integration (GPT oss via OpenRouter)** that allows users to perform natural language searches (e.g., "Find me a biology tutor available on weekends and fits my schedule for under $25") which are intelligently converted to database queries.

### 📅 Session Management
- **Booking System**: Students can request sessions, and Tutors can Approve/Deny them.
- **Schedule Management**: "My Schedule" view for both students and tutors to track upcoming and past appointments.
- **Availability**: Tutors can set their weekly availability slots.

### 💬 Communication
- **Real-Time Messaging**: Integrated chat feature allows students and tutors to discuss needs before booking a session.

### 🛡️ Admin & Moderation
- **Tutor Verification**: Admins review and approve Tutor applications to ensure quality.
- **Course Validation**: Tutors must request approval to teach specific courses.
- **Reporting System**: Users can report issues, which are managed via the Admin Dashboard.

### 👤  Pseudo-Gmail Signup

- **Requirement**: You **MUST** sign up using a puesdo `@gmail.com` email address.
- **Validation**: The system automatically rejects any non-Gmail email domains during the registration process, acting as a pseudo-verification step (simulating institutional SSO).

## 🛠 Tech Stack
- **Frontend**: React.js, CSS Modules
- **Backend**: FastAPI (Python), Uvicorn
- **Database**: MySQL
- **AI/ML**: OpenRouter API (DeepSeek R1)
- **Deployment**: AWS EC2, Nginx

## 👥 Dev Contributors 

| **Name** | **GitHub** | **Role** |
| :--- | :--- | :--- |
| **Addy Kohli** | Addykohli | Frontend & Ai Developer |
| **Atharva Walawalkar** | Atharva2099 | Backend Developer |
| **Aketzali Zeledon** | AketzaliZ | Backend Developer |
