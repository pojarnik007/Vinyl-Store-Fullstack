<h1>Stack:</h1>
Node.js 20+ <br>
Nest.js<br>
TypeScript<br>
Database SQL<br>
ORM<br>
Unit and Integration Testing (Utilizing node:test package)<br>
Deployment (Railway - trial already ended. not working)<br>
Swagger Documentation<br>
Single Sign-On (SSO) with Google<br>
Code Formatting and Quality Assurance (Prettier + ESLint + Git Hooks)<br>
Payment Integration with Stripe<br>
Email Sending (Using Nodemailer)<br>
Configuration Service (Instead of dotenv package)<br>
Initial Data Migration (Approximately 50 vinyl records)<br>

<h1>What was done</h1>

User Authentication: <br>
Users should be able to log in to the system using Google or other SSO providers.
Admins should also have the capability to log in using SSO.

Logout Functionality: <br>
Both Admins and Users should be able to log out from the system.

Accessing Vinyl List: <br>
Users should have access to the vinyl list without requiring authorization.
The vinyl list should display details such as price, name, author name, description, the first review from another user, and the average score based on reviews.
Records should be paginated for better navigation.

User Profile Management: <br>
Authenticated users should be able to view their profiles, including details such as first name, last name, birthdate, avatar, their reviews, and purchased vinyl records.
Users should have the ability to edit their profiles, including updating first name, last name, birthdate, and avatar.
Authenticated users should also have the option to delete their profiles.

Purchase Process: <br>
Authenticated users should be able to purchase vinyl using Stripe.
Users should receive email notifications about their payments.

Admin Functionality: <br>
Admins should be able to add new vinyl records to the store, including details like author name, name, description, image, and price.
Admins should have the capability to edit and delete records in the store.

Search and Sorting: <br>
Authenticated users should be able to search for vinyl records by name and author name.
Users should have the option to sort vinyl records by price, name, and author name.

Review System: <br>
Authenticated users should be able to add reviews (including comments and vinyl scores) to vinyl records.
Admins should be able to delete reviews.
Users should be able to view all reviews of a vinyl record, with pagination for better navigation.

System Logs: <br>
Admins should have access to view logs of the system, including all create, update, and delete actions
for all entities.

Integration with Discogs (https://www.discogs.com/developers) for: <br>
Initial migration of vinyl records.
Displaying Discogs vinyl record scores.
Adding vinyl records from Discogs to the system (restricted to Admins).

Integration with Telegram: <br>
Integration with Telegram for posting vinyl records to channels, including details like name, link to the store, and price.

<h1>Installation</h1>

Copy the repository locally.
You need to create the .env and .env.test files.
These files need to be filled with values ​​similar to those in the .env.example file.

After that, in the console from this folder, type docker-compose up -d. This command will start the database in Docker. 

All the necessary commands for launching are located in packege.json.
For example, npm run start will launch the application.

<h1>Screenshots</h1>
all endpoints shown in swagger <br>
<img width="547" height="1256" alt="image" src="https://github.com/user-attachments/assets/bdffbf3b-4b68-412f-9e3a-da456212a383" />
