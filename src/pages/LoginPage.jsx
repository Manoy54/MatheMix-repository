import React, { useState, useEffect } from "react";
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react"; // Imported ChevronDown


 import createAccImg from "../assets/createaccimg.jpg";



// --- 2. FIREBASE CONFIGURATION ---
let auth;
let db;


const firebaseConfig = {
  apiKey: "AIzaSyB-2pa1BV9M6hnkVaurpun25dPB54xDq4A",
  authDomain: "mathemix-9c8ba.firebaseapp.com",
  projectId: "mathemix-9c8ba",
  storageBucket: "mathemix-9c8ba.firebasestorage.app",
  messagingSenderId: "935229093991",
  appId: "1:935229093991:web:39c640add883cbf3a43cc2",
  measurementId: "G-0RMLEHK80H"
};

const app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);


// FOR PREVIEW USE ONLY (Keeps the preview running here)
try {
  if (typeof __firebase_config !== 'undefined' && !auth) {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}


function App() {
    const [isRegister, setIsRegister] = useState(true);

    // Form States
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [bMonth, setBMonth] = useState("");
    const [bDay, setBDay] = useState("");
    const [bYear, setBYear] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Helpers
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    // Math Symbols for Background
    const mathSymbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞'];

    // Initialize Auth (Preview Environment Pattern)
    useEffect(() => {
        const initAuth = async () => {
            if (!auth) return;
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                try {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } catch (e) {
                    console.error("Auto-login failed:", e);
                }
            }
        };
        initAuth();
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!auth) {
            setError("System error: Firebase not initialized.");
            return;
        }

        if (isRegister) {
            if (!username || !bMonth || !bDay || !bYear) {
                setError("Please fill in all fields.");
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: username });
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    birthday: `${bMonth}/${bDay}/${bYear}`,
                    longestStreak: 0,
                });
                setMessage("Account created! Logging you in...");
            } catch (firebaseError) {
                setError(firebaseError.message);
            }
        } else {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                setMessage("Logged in successfully!");
            } catch (firebaseError) {
                console.error(firebaseError);
                setError("Invalid email or password.");
            }
        }
    };

    // --- NEW GAMIFIED STYLES (Applied to Original Structure) ---

    // Input: Glassmorphism style (Semi-transparent white, white text, white border)
    const inputClass = "w-full p-3 bg-white/10 border-2 border-white/20 rounded-md focus:bg-white/20 focus:border-white/50 outline-none transition-all text-white font-bold placeholder-white/50 text-[15px] backdrop-blur-sm";

    // Dropdowns: Glassmorphism style + appearance-none to hide default arrow + pr-8 for icon space
    const selectClass = "appearance-none p-3 bg-white/10 border-2 border-white/20 rounded-md focus:border-white/50 outline-none text-white font-bold text-[15px] cursor-pointer transition-all backdrop-blur-sm [&>option]:text-gray-900 pr-8";

    // Labels: White/Blue text to pop against gradient
    const labelClass = "block text-xs font-black text-blue-100 uppercase mb-2 tracking-wide";

    // Tabs: White text with white underline for active
    const tabBaseClass = "text-2xl font-bold pb-1 mr-8 transition-colors cursor-pointer relative";
    const activeTabClass = "text-white border-b-[4px] border-white drop-shadow-md"; 
    const inactiveTabClass = "text-blue-200/60 hover:text-white border-b-[4px] border-transparent";

    return (
        <div className="flex h-screen w-full font-nunito bg-white overflow-hidden">

            {/* --- LEFT SIDE: IMAGE (Fixed) --- */}
            <div className="hidden md:block w-1/2 h-full relative bg-[#ffe8b5]">
                <img
                    src={createAccImg}
                    alt="Visual"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ boxShadow: 'inset -25px 0 25px -10px rgba(0,0,0,0.1)' }}
                />
            </div>

            {/* --- RIGHT SIDE: FORM --- */}
            {/* WRAPPER: Changed bg-white to the blue gradient & added relative for floating symbols */}
            <div className="w-full md:w-1/2 h-full bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] flex flex-col pt-12 md:pt-24 px-4 md:px-16 overflow-y-auto shadow-xl relative">

                {/* --- FLOATING SYMBOLS (Background Animation) --- */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {mathSymbols.map((symbol, i) => (
                        <motion.div
                            key={`symbol-${i}`}
                            className="absolute text-white/5 select-none font-black"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                fontSize: `${Math.random() * 60 + 40}px`,
                            }}
                            animate={{
                                y: [0, -40, 0],
                                x: [0, Math.random() * 20 - 10, 0],
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: Math.random() * 15 + 15,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            {symbol}
                        </motion.div>
                    ))}
                </div>

                {/* Form Wrapper (Z-index ensures it sits above symbols) */}
                <div className="w-full max-w-[480px] mx-auto z-10">

                    {/* Tabs */}
                    <div className="flex mb-8">
                        <button
                            onClick={() => setIsRegister(true)}
                            className={`${tabBaseClass} ${isRegister ? activeTabClass : inactiveTabClass}`}
                        >
                            Sign up
                        </button>
                        <button
                            onClick={() => setIsRegister(false)}
                            className={`${tabBaseClass} ${!isRegister ? activeTabClass : inactiveTabClass}`}
                        >
                            Log In
                        </button>
                    </div>

                    {/* Messages */}
                    {error && <div className="mb-4 p-3 bg-red-500/20 border-l-4 border-red-400 text-white text-sm font-bold rounded-md backdrop-blur-sm">{error}</div>}
                    {message && <div className="mb-4 p-3 bg-green-500/20 border-l-4 border-green-400 text-white text-sm font-bold rounded-md backdrop-blur-sm">{message}</div>}

                    <form onSubmit={handleAuth} className="w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isRegister ? "signup" : "login"}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-5"
                            >

                                {/* --- SIGN UP FIELDS --- */}
                                {isRegister && (
                                    <>
                                        <div>
                                            <label className={labelClass}>Birthday</label>
                                            <div className="flex gap-3">
                                                {/* Month Select */}
                                                <div className="relative w-full">
                                                    <select className={`${selectClass} w-full`} value={bMonth} onChange={(e) => setBMonth(e.target.value)} required>
                                                        <option value="" disabled>Month</option>
                                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none" size={16} />
                                                </div>
                                                
                                                {/* Day Select */}
                                                <div className="relative w-1/3">
                                                    <select className={`${selectClass} w-full`} value={bDay} onChange={(e) => setBDay(e.target.value)} required>
                                                        <option value="" disabled>Day</option>
                                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none" size={16} />
                                                </div>

                                                {/* Year Select */}
                                                <div className="relative w-1/3">
                                                    <select className={`${selectClass} w-full`} value={bYear} onChange={(e) => setBYear(e.target.value)} required>
                                                        <option value="" disabled>Year</option>
                                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none" size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- SHARED FIELDS --- */}

                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type="email"
                                        placeholder="user@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                {isRegister && (
                                    <div>
                                        <label className={labelClass}>Username</label>
                                        <input
                                            type="text"
                                            placeholder="andrew123"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className={`${labelClass} mb-0`}>Password</label>
                                        {!isRegister && <button type="button" className="text-xs font-bold text-blue-200 hover:text-white hover:underline transition-colors">Forgot password</button>}
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                {/* Policy Text (Signup Only) */}
                                {isRegister && (
                                    <div className="text-xs text-blue-100/70 font-medium leading-tight mt-1">
                                        By clicking Sign up, you accept Mathemix's <span className="text-white cursor-pointer hover:underline">Terms</span> and <span className="text-white cursor-pointer hover:underline">Privacy Policy</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-white hover:bg-blue-50 text-[#023e8a] font-extrabold rounded-md text-lg transition-transform transform active:scale-95 shadow-lg mt-4"
                                >
                                    {isRegister ? "Sign up" : "Log in"}
                                </button>

                            </motion.div>
                        </AnimatePresence>
                    </form>

                    {/* Bottom Toggle Link */}
                    <div className="mt-8 pt-6 border-t border-white/20 text-center">
                        <button
                            onClick={() => setIsRegister(!isRegister)}
                            className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-md text-lg border-2 border-white/30 transition-colors backdrop-blur-sm"
                        >
                            {isRegister ? "Already have an account? Log in" : "New to Mathemix? Create an account"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default App;