// js/admin.js

import { auth, db } from '/firebaseConfig.js';
import { signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, doc, writeBatch, Timestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

    // --- ADMIN DASHBOARD LOGIC ---
    const uploadForm = document.getElementById('upload-form');
    const uploadButton = document.getElementById('upload-button');
    const uploadStatus = document.getElementById('upload-status');
    const csvFileInput = document.getElementById('csv-file');

    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const file = csvFileInput.files[0];
            if (!file) {
                showStatus('Please select a file.', 'red');
                return;
            }

            uploadButton.disabled = true;
            uploadButton.textContent = 'Uploading...';
            showStatus('Parsing CSV file...', 'blue');

            // Use PapaParse (loaded from CDN in HTML) to read the CSV file
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        uploadJobsToFirestore(results.data);
                    } else {
                        showStatus('No data found in CSV file.', 'red');
                        uploadButton.disabled = false;
                        uploadButton.textContent = 'Upload Jobs';
                    }
                },
                error: (err) => {
                    showStatus(`Error parsing file: ${err.message}`, 'red');
                    uploadButton.disabled = false;
                    uploadButton.textContent = 'Upload Jobs';
                }
            });
        });
    }

    async function uploadJobsToFirestore(jobs) {
        showStatus(`Uploading ${jobs.length} jobs to database...`, 'blue');
        
        // Use a batch write for efficiency
        const batch = writeBatch(db);
        const jobsCollection = collection(db, 'jobs');
        
        let validJobs = 0;
        
        for (const job of jobs) {
            try {
                // 1. Validate required fields
                if (!job.title || !job.companyName || !job.expiryDate || !job.applyUrl) {
                    console.warn('Skipping incomplete job:', job);
                    continue; // Skip this job and move to the next
                }
                
                // 2. Convert expiryDate string (e.g., "2025-12-01") to a Firebase Timestamp
                const expiryDate = new Date(job.expiryDate);
                if (isNaN(expiryDate.getTime())) {
                    throw new Error(`Invalid date format for ${job.title}. Use YYYY-MM-DD.`);
                }
                const expiryTimestamp = Timestamp.fromDate(expiryDate);
                
                // 3. Create new job document reference
                const newJobRef = doc(jobsCollection); // Create a ref with a new auto-ID
                
                const newJob = {
                    title: job.title.trim(),
                    companyName: job.companyName.trim(),
                    location: job.location?.trim() || 'Not specified',
                    package: job.package?.trim() || 'Not specified',
                    applyUrl: job.applyUrl.trim(),
                    expiryDate: expiryTimestamp,
                    createdAt: Timestamp.now(),
                };
                
                // 4. Add to batch
                batch.set(newJobRef, newJob);
                validJobs++;
                
            } catch (error) {
                console.error('Error processing job:', job, error);
                // Stop the whole batch if one job fails validation
                showStatus(`Error: ${error.message}`, 'red');
                uploadButton.disabled = false;
                uploadButton.textContent = 'Upload Jobs';
                return; // Exit the function
            }
        }
        
        // 5. Commit the batch
        try {
            await batch.commit();
            showStatus(`Successfully uploaded ${validJobs} jobs!`, 'green');
            uploadForm.reset();
        } catch (error) {
            console.error('Error committing batch:', error);
            showStatus(`Database error: ${error.message}`, 'red');
        } finally {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload Jobs';
        }
    }

    function showStatus(message, color) {
        uploadStatus.textContent = message;
        uploadStatus.classList.remove('hidden', 'text-red-600', 'text-green-600', 'text-blue-600');
        
        if (color === 'red') {
            uploadStatus.classList.add('text-red-600');
        } else if (color === 'green') {
            uploadStatus.classList.add('text-green-600');
        } else {
            uploadStatus.classList.add('text-blue-600');
        }
    }
});