# PROJECT REPORT: BMSK Field Visit Tracking & Reporting System

## 1. Project Title
**BMSK Field Visit Tracking & Reporting System**

---

## 2. Introduction
In standard operational procedures for field maintenance and monitoring, ensuring the physical presence of personnel at designated sites and accurately recording their activities is a significant challenge. The **BMSK Field Visit Tracking & Reporting System** is a web-based application designed to streamline the process of planning, executing, and reporting field visits for stations (e.g., AWS, ARG).

The system serves three primary roles: **Admins/Incharges**, who plan and oversee the visits, and **Field Assistants (FAs)**, who execute the visits on the ground. By leveraging modern web technologies and geolocation services, the system aims to eliminate manual logs, reduce fraud, and provide real-time or near real-time insights into field operations.

---

## 3. Objective of Project
The primary objectives of this project are:
1.  **Digitize and Automate Operations**: To replace manual paper-based reporting with a digital workflow.
2.  **Enhance Accountability**: To ensure Field Assistants physically visit the assigned locations by using GPS geolocation for verifying visit coordinates.
3.  **Streamline Planning**: To allow Incharges to create and assign tour plans to specific Field Assistants efficiently.
4.  **Centralize Data**: To maintain a centralized database of all stations, plans, and visit reports for easy access and historical analysis.
5.  **Facilitate Reporting**: To generate automated PDF and Word reports, including photos and visit details, reducing the administrative burden.

---

## 4. Scope of Project
The scope of the project includes:
*   **User Management**: Role-based access control for Incharges and Field Assistants.
*   **Station Management**: A repository of all field stations (AWS/ARG types), including their geolocation (latitude/longitude) and metadata.
*   **Tour Planning**: Functionality for Incharges to create multi-day visit plans for Field Assistants.
*   **Trip Management**: "Start Trip" and "End Trip" features for FAs to log their daily movement, capturing start/end timestamps and locations.
*   **Visit Recording**: A mobile-friendly interface for FAs to record data at each station, including checklists, remarks, and geo-tagged photographs.
*   **Data Export**: Capabilities to export visit data and summaries into printable formats (PDF/Word).
*   **Distance Calculation**: Automatic calculation of distance traveled between stations.

**Out of Scope**: Real-time fleet tracking map (live streaming of location) is currently outside the primary scope but a potential future addition.

---

## 5. Data Used and Methodology

### 5.1 System Architecture
The system follows a modern **Model-View-Controller (MVC)** architectural pattern adapted for the **Next.js** framework.
-   **Frontend (View)**: Built with **React.js** and **Tailwind CSS**, ensuring a responsive user interface that works seamless on both desktop (for Incharges) and mobile devices (for Field Assistants).
-   **Backend (Controller)**: **Next.js API Routes** (Serverless functions) handle the business logic, processing requests for creating plans, submitting visits, and authentication.
-   **Database (Model)**: **Prisma ORM** manages the interaction with the database (SQLite for development/PostgreSQL for production), ensuring type-safe database queries.

### 5.2 Technology Used
*   **Framework**: [Next.js 16](https://nextjs.org/) (React Framework for the Web)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (For type safety)
*   **Database**: SQLite (via **Prisma ORM**)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
*   **UI Components**: [Radix UI](https://www.radix-ui.com/) / [Lucide React](https://lucide.dev/) (Icons)
*   **Libraries**:
    *   `geolib`: For geospatial calculations (distance between coordinates).
    *   `react-hook-form` & `zod`: For robust form handling and validation.
    *   `framer-motion`: For smooth UI animations.
    *   `dexie`: For client-side offline storage capabilities.

### 5.3 Methodology
The project was developed using an **Agile Methodology**. Code was developed in iterative sprints, starting with the core database schema design, followed by the authentication system, and then the core features (Stations, Plans, Visits). Continuous feedback loops were used to refine the User Experience (UX), particularly for the mobile view used by Field Assistants.

### 5.4 Flow Chart (High-Level Logic)
1.  **Login**: User logs in -> System detects Role (Incharge or FA).
2.  **Planning (Incharge)**: Selects FA -> Selects Stations -> Creates Tour Plan.
3.  **Execution (FA)**:
    *   Logs in -> Sees Assign Plan.
    *   **Start Trip**: Captures current GPS Location & Time.
    *   **Visit Station**: Selects Station -> Fills Form -> Uploads Photo -> Submits (Captures Visit GPS).
    *   **End Trip**: Captures End GPS Location & Time.
4.  **Reporting**: Data syncs to server -> Incharge views "Completed" reports -> Downloads PDF/Word.

---

## 6. Implementation Detail

### Database Design (Prisma Schema)
The data model consists of several key entities:
*   **User**: Stores credentials and roles.
*   **Station**: Stores static data about locations (Lat/Long, District).
*   **TourPlan & TourPlanItem**: Links Users to Stations for planned visits.
*   **Trip**: Records detailed start/end logic and total distance for a specific session.
*   **Visit**: The core record containing dynamic form data, photos, and validation of the visit.

### Key Features Implemented
*   **Geofencing/Distance Logic**: The system calculates the distance between the user's current location and the station's registered location to verify proximity.
*   **Photo Upload**: Integration allows users to capture and upload evidence of their visit directly from the browser.
*   **Offline Resilience**: Usage of `dexie` (IndexedDB wrapper) allows for potential caching of data when network connectivity is poor in remote field areas.
*   **Dynamic Forms**: Visit forms utilize `react-hook-form` for efficient inputs, including automated population of metadata like "Last Visited Date" and "Vendor Engineer Name".

---

## 7. Result and Discussion

### 7.1 Result
The system successfully enables:
*   **Incharges** to manage hundreds of stations and multiple field assistants from a single dashboard.
*   **Field Assistants** to easily log their work without complex paperwork.
*   **Automated Validation**: Visits are tagged with determining data points (Location, Time) that reduce the possibility of fake reporting.

### 7.2 Performance Optimization
*   **Server-Side Rendering (SSR)**: Next.js is used to render pages fast on the server, improving load times for dashboards.
*   **Optimized Assets**: Images are handled efficiently to prevent large uploads from slowing down the mobile tracking experience.
*   **Lightweight UI**: Using Tailwind CSS ensures the CSS bundle size remains small.

### 7.3 Advantages of System
*   **Accuracy**: GPS-based tracking ensures data integrity.
*   **Efficiency**: Reduces time spent on manual data entry and report compilation.
*   **Accessibility**: As a web app, it runs on any smartphone with a browser; no heavy app installation required.
*   **Scalability**: Built on a robust tech stack that can handle increased data loads.

### 7.4 Limitations
*   **Network Dependency**: While some offline capabilities exist, syncing data requires an active internet connection.
*   **GPS Accuracy**: Reliance on device GPS means accuracy can vary based on the hardware of the phone used by the Field Assistant.

### 7.5 Future Enhancement
*   **Native Mobile App**: Wrapping the web app into a React Native container for deeper hardware integration.
*   **Real-Time Live Map**: Admin dashboard showing dots moving on a map for active FAs.
*   **Advanced Analytics**: Charts showing "Most Visited Stations", "Average Time per Visit", etc.
*   **Push Notifications**: Reminders for FAs to start trips or alerts for upcoming assign plans.

---

## 8. Conclusion
The **BMSK Field Visit Tracking & Reporting System** represents a significant step forward in digitizing field operations. by integrating location intelligence with standard reporting workflows, it solves the core problem of "verification" in remote maintenance tasks. The modular design ensures that the system is not only effective for current requirements but is also future-proof for upcoming expansions like live tracking and AI-based analytics.
