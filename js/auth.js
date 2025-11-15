// js/auth.js

// 1. Import Firebase services (ONLY ONCE, AT THE TOP)
import { auth, db } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- BLOCK 1: REDIRECTS IF ALREADY LOGGED IN ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is ALREADY logged in.
        // We need to check their role and redirect them.
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin') {
                window.location.href = 'dashboard-admin.html';
            } else {
                window.location.href = 'dashboard-student.html';
            }
        } else {
            // Role not found, just sign them out
            await auth.signOut();
        }
    } else {
        // User is not logged in.
        // DO NOTHING - let them see the login page.
    }
});

// --- BLOCK 2: LOGIN FORM HANDLER (RUNS AFTER HTML LOADS) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-button');

    // Remove demo buttons if they exist
    document.getElementById('admin-login-btn')?.remove();
    document.getElementById('student-login-btn')?.remove();

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            // THIS IS THE LINE THAT ISN'T RUNNING
            e.preventDefault(); 
            
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            
            loginButton.disabled = true;
            loginButton.textContent = 'Signing in...';
            errorMessage.classList.add('hidden');

            try {
                // 1. Sign in the user with Firebase Auth
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Get the user's role from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    // 3. Redirect based on role
                    if (userData.role === 'admin') {
                        window.location.href = 'dashboard-admin.html';
                    } else if (userData.role === 'student') {
                        window.location.href = 'dashboard-student.html';
                    } else {
                        errorMessage.textContent = 'No role assigned. Contact admin.';
                        errorMessage.classList.remove('hidden');
                        await auth.signOut();
                    }
                } else {
                    errorMessage.textContent = 'User data not found. Contact admin.';
                    errorMessage.classList.remove('hidden');
                    await auth.signOut();
                }

            } catch (error) {
                errorMessage.textContent = 'Invalid email or password.';
                errorMessage.classList.remove('hidden');
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = 'Sign In';
            }
        });
    }
});