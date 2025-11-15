// js/student.js

import { auth, db } from 'firebaseConfig.js';
import { signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    
        // js/student.js (and js/admin.js)

    // Get the loader and main content
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');

    // Start with content hidden (you can also add 'hidden' class in the HTML)
    if (mainContent) mainContent.style.display = 'none'; 

    auth.onAuthStateChanged(user => {
        if (user) {
            // USER IS LOGGED IN
            
            // Show their email
            const userEmail = document.getElementById('student-email') || document.getElementById('admin-email');
            if(userEmail) userEmail.textContent = user.email;
            
            // Hide loader
            if (loader) loader.style.display = 'none';
            
            // Show main content
            if (mainContent) mainContent.style.display = 'block';

        } else {
            // USER IS NOT LOGGED IN
            // Redirect them to the login page
            window.location.href = 'index.html';
        }
    });

    // Universal logout button
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    // --- STUDENT DASHBOARD LOGIC ---
    const jobListContainer = document.getElementById('job-list-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    if (jobListContainer) {
        fetchJobs();
    }
    
    async function fetchJobs() {
        try {
            const jobsCollection = collection(db, 'jobs');
            const now = Timestamp.now();
            
            // Query: Get jobs where expiryDate is in the future, order by soonest to expire
            const q = query(
                jobsCollection, 
                where("expiryDate", ">", now), 
                orderBy("expiryDate", "asc")
            );
            
            const querySnapshot = await getDocs(q);
            
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            jobListContainer.innerHTML = ''; // Clear template/loading
            
            if (querySnapshot.empty) {
                jobListContainer.innerHTML = '<p class="text-gray-600 text-center">No active job postings found.</p>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const job = doc.data();
                const jobCard = createJobCard(job);
                jobListContainer.innerHTML += jobCard;
            });
            
        } catch (error) {
            console.error("Error fetching jobs: ", error);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            jobListContainer.innerHTML = '<p class="text-red-500 text-center">Could not load jobs. Please try again later.</p>';
        }
    }
    
    function createJobCard(job) {
        const { expiryText, expiryClass } = getExpiryInfo(job.expiryDate);

        // Use template literals to build the HTML
        return `
        <div class="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <div class="p-6">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div class="flex-1 min-w-0">
                        <h2 class="text-2xl font-bold text-gray-800 truncate">${job.title}</h2>
                        <p class="text-lg font-semibold text-gray-600 mt-1">${job.companyName}</p>
                        <div class="flex items-center text-gray-500 mt-2 space-x-4">
                            <span>📍 ${job.location}</span>
                            <span>💰 ${job.package}</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0 flex flex-col sm:items-end space-y-3">
                        <span class="inline-flex items-center px-4 py-1.5 rounded-full text-base font-semibold ${expiryClass}">
                            ${expiryText}
                        </span>
                        <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium text-center shadow-sm">
                            Apply Now
                        </a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    function getExpiryInfo(expiryTimestamp) {
        const now = new Date();
        const expiryDate = expiryTimestamp.toDate(); // Convert Firestore Timestamp to JS Date
        const diffTime = expiryDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 0) {
            return { expiryText: 'Expired', expiryClass: 'bg-gray-100 text-gray-800 border border-gray-300' };
        }
        
        if (daysLeft <= 7) {
            return { 
                expiryText: `Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`, 
                expiryClass: 'bg-red-100 text-red-800 border border-red-300' 
            };
        }
        
        return { 
            expiryText: `Expires in ${daysLeft} days`, 
            expiryClass: 'bg-green-100 text-green-800 border border-green-300' 
        };
    }
});