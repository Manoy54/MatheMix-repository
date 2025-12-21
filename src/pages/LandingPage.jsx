import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    Gamepad2,
    Trophy,
    Users,
    Zap,
    Brain,
    Monitor,
    MousePointerClick,
    Mail,
    Twitter,
    Instagram,
    Star,
    ChevronDown,
    Code,
    Cpu,
    Calculator,
    Sparkles
} from 'lucide-react';
import { useLoading } from '../context/LoadingContext';
import { useMobile } from '../hooks/useMobile';

const LandingPage = () => {
    const isMobile = useMobile();
    const navigate = useNavigate();
    const { resetLoading, markAsFinished, setModeDataReady, setBg3DReady } = useLoading();

    // On mount, if we are on the landing page, we want to clear any existing loading screen
    // so the visitor sees the landing page immediately.
    React.useEffect(() => {
        setModeDataReady(true);
        setBg3DReady(true);
        markAsFinished();

        // Check for hash and scroll to section
        if (window.location.hash === '#how-to-play') {
            setTimeout(() => {
                const element = document.getElementById('how-to-play');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [setModeDataReady, setBg3DReady, markAsFinished]);

    const handlePlayNow = () => {
        // Start the loading sequence
        resetLoading();
        // Move to the root which will then redirect to mode-select or login
        navigate('/');
    };

    // Math Symbols for Background Animation (from LoginPage)
    const mathSymbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞'];

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen text-white font-nunito overflow-x-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">

            {/* FLOATING SYMBOLS (Background Animation) */}
            {!isMobile && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
            )}

            {/* 1. Welcome / Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-8"
                    >
                        {/* Game-Style Large Logo */}
                        <div className="flex flex-col items-center justify-center gap-6 mb-8">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl blur-2xl opacity-60" />
                                <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-6 rounded-3xl border-2 border-white/30 backdrop-blur-md shadow-2xl">
                                    <Calculator className="w-24 h-24 text-white drop-shadow-lg" />
                                </div>
                            </motion.div>

                            <h1 className="text-6xl md:text-9xl font-black tracking-tight drop-shadow-xl text-white flex items-center gap-4">
                                MATHEMIX
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
                                >
                                    <Sparkles className="w-16 h-16 md:w-24 md:h-24 text-yellow-300 drop-shadow-lg" />
                                </motion.div>
                            </h1>
                        </div>
                        <p className="text-xl md:text-3xl text-blue-100 font-light max-w-3xl mx-auto drop-shadow-md">
                            A fast-paced math challenge where your speed and accuracy build the ultimate streak
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="flex flex-col md:flex-row gap-4 justify-center items-center"
                    >
                        <button
                            onClick={handlePlayNow}
                            className="group relative px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-full font-extrabold text-xl transition-all hover:scale-105 shadow-xl flex items-center gap-2"
                        >
                            <Play className="fill-blue-600" />
                            Play Now
                        </button>

                        <button
                            onClick={() => document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 rounded-full font-extrabold text-xl transition-all hover:scale-105 backdrop-blur-md shadow-xl flex items-center gap-2"
                        >
                            <Gamepad2 className="w-6 h-6" />
                            How to Play
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* 2. About the Game */}
            <section className="py-20 bg-white/5 backdrop-blur-sm relative z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="whileInView"
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-6">About The Game</h2>
                        <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                            Mathemix is an interactive educational platform developed by BSIT students from the <span className="text-yellow-300 font-bold">Bicol University College of Science</span>. Designed to bridge the gap between learning and entertainment, it defies traditional problem-solving by blending a sleek, modern interface with gamified mechanics. Challenge your mental math, sharpen your accuracy, and master various disciplines in an experience that is as exciting as it is educational.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Brain, title: "Comprehensive Topics", desc: "Master a wide range of mathematical disciplines, from Algebra and Geometry to Data and Probability." },
                            { icon: Zap, title: "Endless Challenge", desc: "Test your limits with a continuous flow of questions designed to sharpen your mental speed and accuracy." },
                            { icon: Trophy, title: "Streak Mastery", desc: 'Build and maintain your "Current Streak" to track your progress and challenge yourself to reach new high scores.' }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                initial="initial"
                                whileInView="whileInView"
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="p-8 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all group backdrop-blur-md shadow-lg"
                            >
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-blue-100">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. How to Play */}
            <section id="how-to-play" className="py-20 relative z-10">
                <div className="container mx-auto px-4">
                    <motion.h2
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="whileInView"
                        className="text-4xl md:text-5xl font-black text-center mb-16"
                    >
                        How to Play
                    </motion.h2>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-8 relative"
                    >
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />

                        {[
                            { icon: MousePointerClick, step: "1", title: "Choose Mode", desc: "Select Solo or Multiplayer." },
                            { icon: Brain, step: "2", title: "Plan Strategy", desc: "Analyze the board and think ahead." },
                            { icon: Zap, step: "3", title: "Execute Moves", desc: "Drag and drop to unleash power." },
                            { icon: Trophy, step: "4", title: "Claim Victory", desc: "Dominate the leaderboard." }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="relative z-10 flex flex-col items-center text-center"
                            >
                                <div className="w-24 h-24 bg-[#0077b6] border-4 border-white rounded-full flex items-center justify-center mb-6 shadow-xl relative">
                                    <item.icon className="w-10 h-10 text-white" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-black shadow-md">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-blue-100 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. Gameplay Preview */}
            <section className="py-20 bg-black/20 backdrop-blur-sm z-10 relative">
                <div className="container mx-auto px-4">
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="whileInView"
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Gameplay Preview</h2>
                        <p className="text-blue-100">See the action unfold.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative aspect-video max-w-5xl mx-auto bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                    >
                        <video
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        >
                            <source src="/gameplay-preview.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Overlay Content */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8 pointer-events-none">
                            <div>
                                <h3 className="text-2xl font-bold">Epic Battles</h3>
                                <p className="text-gray-300">Experience dynamic visual effects and smooth animations.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 5. Features / Modes */}
            <section className="py-20 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Features & Modes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-md" />
                                <div>
                                    <h3 className="text-2xl font-bold">High-Score Mastery</h3>
                                    <p className="text-yellow-300 font-semibold">Streak-Based Progression</p>
                                </div>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                Push your mental limits by answering questions continuously to build your highest streak. There is no question limit—keep going until you stop or can no longer answer to beat your personal best.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <Calculator className="w-10 h-10 text-purple-300 drop-shadow-md" />
                                <div>
                                    <h3 className="text-2xl font-bold">Diverse Categories</h3>
                                    <p className="text-purple-300 font-semibold">Tailored Learning</p>
                                </div>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                Choose from specialized mathematical disciplines including Number and Algebra, Measurement and Geometry, or Data and Probability. Each category is designed to sharpen specific analytical and problem-solving skills.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>



            {/* Meet the Developers (NEW) */}
            <section className="py-20 relative z-10">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-black text-center mb-6">Meet The Developers</h2>
                    <p className="text-center text-blue-100 max-w-3xl mx-auto mb-16 text-lg leading-relaxed drop-shadow-md">
                        "We are BSIT students from the Bicol University College of Science, pushing the boundaries of technology by building a high-performance website that bridges the gap between innovation and user experience."
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-8 flex-wrap">
                        {[
                            { name: "Sean Dylan Armenta", role: "Full Stack Developer", icon: Code },
                            { name: "John Benedict Candelaria", role: "UI/UX Designer", icon: Brain },
                            { name: "Jeffrey Cruel", role: "Backend Specialist", icon: Cpu },
                            { name: "Nash Mapula", role: "Frontend Developer", icon: Monitor }
                        ].map((dev, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -10 }}
                                className="flex flex-col items-center p-6"
                            >
                                <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md overflow-hidden">
                                    <dev.icon className="w-16 h-16 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-center">{dev.name}</h3>
                                <p className="text-blue-200 font-medium text-sm">{dev.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* 8. FAQ */}
            <section className="py-20 bg-black/20 backdrop-blur-sm relative z-10">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-4xl font-black text-center mb-12">FAQ</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Is it free to play?", a: "Yes! Mathemix is 100% free to start. Optional cosmetics available." },
                            { q: "Can I play with friends?", a: "Absolutely. Use the 'Custom Lobby' feature to invite friends instantly." },
                            { q: "What devices are supported?", a: "Currently available on Web (Desktop & Mobile). Native apps coming soon." },
                            { q: "Do I need an account?", a: "Yes, account is required to save progress and rank." }
                        ].map((faq, index) => (
                            <details key={index} className="group bg-white/10 rounded-xl overflow-hidden cursor-pointer transition-all hover:bg-white/20 border border-white/10 backdrop-blur-md">
                                <summary className="p-6 flex justify-between items-center font-bold text-lg list-none">
                                    {faq.q}
                                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-6 pb-6 text-blue-100 leading-relaxed">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* 9. Contact Us */}
            <section className="py-20 relative z-10">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl">
                        <Mail className="w-12 h-12 text-white mx-auto mb-6" />
                        <h2 className="text-3xl font-black mb-4">Get in Touch</h2>
                        <p className="text-blue-100 mb-8">
                            Have questions or feedback? We'd love to hear from you.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <a href="mailto:support@mathemix.com" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-bold">
                                <Mail className="w-4 h-4" /> support@mathemix.com
                            </a>
                            <a href="#" className="flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-lg hover:brightness-110 transition-colors font-bold shadow-lg">
                                Discord Community
                            </a>
                        </div>

                        <div className="flex justify-center gap-6 mt-8">
                            <a href="#" className="text-blue-200 hover:text-white transition-colors transform hover:scale-110"><Twitter className="w-6 h-6" /></a>
                            <a href="#" className="text-blue-200 hover:text-white transition-colors transform hover:scale-110"><Instagram className="w-6 h-6" /></a>
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. Footer */}
            <footer className="py-12 bg-black/40 text-blue-200 text-sm border-t border-white/10 relative z-10 backdrop-blur-md">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur-lg opacity-40" />
                                <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-2 rounded-xl border border-white/30 backdrop-blur-md shadow-lg">
                                    <Calculator className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                            </motion.div>

                            <span className="font-black text-white text-xl tracking-wide flex items-center gap-2">
                                MATHEMIX
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
                                >
                                    <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow-md" />
                                </motion.div>
                            </span>
                        </div>

                        <div className="flex gap-8">
                            <button onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button>
                            <button onClick={() => navigate('/terms-of-service')} className="hover:text-white transition-colors">Terms of Service</button>
                            <button onClick={() => navigate('/cookie-policy')} className="hover:text-white transition-colors">Cookie Policy</button>
                        </div>

                        <div>
                            &copy; {new Date().getFullYear()} SNEC Studios. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
