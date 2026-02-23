import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
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
import StandardHeader from '../components/StandardHeader';

const LandingPage = ({ user }) => {
    const isMobile = useMobile();
    const location = useLocation();
    const navigate = useNavigate();
    const { markAsFinished, setModeDataReady, setBg3DReady } = useLoading();

    // On mount or hash change, handle scrolling to sections
    React.useEffect(() => {
        setModeDataReady(true);
        setBg3DReady(true);
        markAsFinished();

        if (location.hash === '#how-to-play') {
            const scrollTarget = () => {
                const element = document.getElementById('how-to-play');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            };

            // Small delay to ensure render is complete
            const timeoutId = setTimeout(scrollTarget, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [location.hash, setModeDataReady, setBg3DReady, markAsFinished]);

    const handlePlayNow = () => {
        if (user) {
            navigate('/mode-select');
        } else {
            navigate('/login');
        }
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
        <div className={`min-h-screen text-white font-nunito overflow-x-hidden ${isMobile ? 'bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]' : ''}`}>



            {/* 1. Welcome / Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10">
                <div className="w-[85%] md:container mx-auto text-center">
                    <motion.div
                        initial={isMobile ? {} : { opacity: 0, scale: 0.8 }}
                        animate={isMobile ? {} : { opacity: 1, scale: 1 }}
                        transition={isMobile ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
                        className="mb-8"
                    >
                        {/* Game-Style Large Logo */}
                        <div className="flex flex-col items-center justify-center gap-3 md:gap-6 mb-4 md:mb-8">
                            <StandardHeader size="large" />
                        </div>
                        <p className="text-sm md:text-3xl text-blue-100 font-light max-w-3xl mx-auto drop-shadow-md">
                            A fast-paced math challenge where your speed and accuracy build the ultimate streak
                        </p>
                    </motion.div>

                    <motion.div
                        initial={isMobile ? {} : { opacity: 0, y: 20 }}
                        animate={isMobile ? {} : { opacity: 1, y: 0 }}
                        transition={isMobile ? { duration: 0 } : { delay: 0.5, duration: 0.6 }}
                        className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center"
                    >
                        <button
                            onClick={handlePlayNow}
                            className="group relative px-5 py-2.5 md:px-8 md:py-4 bg-white text-blue-600 active:bg-blue-50 md:hover:bg-blue-50 rounded-full font-extrabold text-base md:text-xl transition-all active:scale-95 md:hover:scale-105 md:shadow-xl flex items-center gap-2 transform-gpu"
                        >
                            <Play className="fill-blue-600 w-4 h-4 md:w-6 md:h-6" />
                            Play Now
                        </button>

                        <button
                            onClick={() => document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-5 py-2.5 md:px-8 md:py-4 bg-white/10 active:bg-white/20 md:hover:bg-white/20 text-white border-2 border-white/30 rounded-full font-extrabold text-base md:text-xl transition-all active:scale-95 md:hover:scale-105 md:backdrop-blur-md md:shadow-xl flex items-center gap-2 transform-gpu"
                        >
                            <Gamepad2 className="w-4 h-4 md:w-6 md:h-6" />
                            How to Play
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* 2. About the Game */}
            <section className="py-10 md:py-20 md:bg-white/5 md:backdrop-blur-sm relative z-10">
                <div className="w-[85%] md:container mx-auto">
                    <motion.div
                        variants={isMobile ? {} : fadeInUp}
                        initial="initial"
                        whileInView="whileInView"
                        className="text-center mb-8 md:mb-16"
                    >
                        <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-6">About The Game</h2>
                        <p className="text-xs md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
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
                                variants={isMobile ? {} : fadeInUp}
                                initial="initial"
                                whileInView="whileInView"
                                viewport={{ once: true }}
                                transition={isMobile ? { duration: 0 } : { delay: index * 0.2 }}
                                className="p-4 md:p-8 rounded-2xl bg-white/10 border border-white/20 active:bg-white/20 md:hover:bg-white/20 transition-all group md:backdrop-blur-md md:shadow-lg transform-gpu"
                            >
                                <div className="w-10 h-10 md:w-16 md:h-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 md:group-hover:scale-110 transition-transform transform-gpu">
                                    <feature.icon className="w-5 h-5 md:w-8 md:h-8 text-white" />
                                </div>
                                <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                                <p className="text-blue-100 text-xs md:text-base">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. How to Play */}
            <section id="how-to-play" className="py-10 md:py-20 relative z-10">
                <div className="w-[85%] md:container mx-auto">
                    <motion.h2
                        variants={isMobile ? {} : fadeInUp}
                        initial="initial"
                        whileInView="whileInView"
                        className="text-2xl md:text-5xl font-black text-center mb-8 md:mb-16"
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
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-[#0077b6] border-4 border-white rounded-full flex items-center justify-center mb-4 md:mb-6 md:shadow-xl relative transform-gpu">
                                    <item.icon className="w-6 h-6 md:w-10 md:h-10 text-white" />
                                    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-black shadow-md text-xs md:text-base">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2">{item.title}</h3>
                                <p className="text-blue-100 text-xs md:text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. Gameplay Preview */}
            <section className="py-10 md:py-20 md:bg-black/20 md:backdrop-blur-sm z-10 relative">
                <div className="w-[85%] md:container mx-auto">
                    <motion.div
                        variants={isMobile ? {} : fadeInUp}
                        initial="initial"
                        whileInView="whileInView"
                        className="text-center mb-6 md:mb-12"
                    >
                        <h2 className="text-2xl md:text-5xl font-black mb-2 md:mb-4">Gameplay Preview</h2>
                        <p className="text-blue-100 text-sm md:text-base">See the action unfold.</p>
                    </motion.div>

                    <motion.div
                        initial={isMobile ? {} : { opacity: 0, scale: 0.95 }}
                        whileInView={isMobile ? {} : { opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative aspect-video max-w-5xl mx-auto bg-black rounded-3xl overflow-hidden border border-white/10 md:shadow-2xl transform-gpu"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4 md:p-8 pointer-events-none">
                            <div>
                                <h3 className="text-sm md:text-2xl font-bold mb-1 leading-tight">Epic Battles</h3>
                                <p className="text-gray-300 text-[10px] md:text-base leading-tight">Experience dynamic visual effects and smooth animations.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 5. Features / Modes */}
            <section className="py-10 md:py-20 relative z-10">
                <div className="w-[85%] md:container mx-auto">
                    <div className="text-center mb-8 md:mb-16">
                        <h2 className="text-2xl md:text-5xl font-black mb-2 md:mb-4">Features & Modes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <motion.div
                            whileHover={isMobile ? {} : { scale: 1.02 }}
                            className="p-4 md:p-8 rounded-3xl bg-white/10 border border-white/20 md:backdrop-blur-md"
                        >
                            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6">
                                <Trophy className="w-6 h-6 md:w-10 md:h-10 text-yellow-300 drop-shadow-md" />
                                <div>
                                    <h3 className="text-lg md:text-2xl font-bold">High-Score Mastery</h3>
                                    <p className="text-yellow-300 font-semibold text-sm md:text-base">Streak-Based Progression</p>
                                </div>
                            </div>
                            <p className="text-blue-100 leading-relaxed text-xs md:text-base">
                                Push your mental limits by answering questions continuously to build your highest streak. There is no question limit—keep going until you stop or can no longer answer to beat your personal best.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={isMobile ? {} : { scale: 1.02 }}
                            className="p-4 md:p-8 rounded-3xl bg-white/10 border border-white/20 md:backdrop-blur-md"
                        >
                            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6">
                                <Calculator className="w-6 h-6 md:w-10 md:h-10 text-purple-300 drop-shadow-md" />
                                <div>
                                    <h3 className="text-lg md:text-2xl font-bold">Diverse Categories</h3>
                                    <p className="text-purple-300 font-semibold text-sm md:text-base">Tailored Learning</p>
                                </div>
                            </div>
                            <p className="text-blue-100 leading-relaxed text-xs md:text-base">
                                Choose from specialized mathematical disciplines including Number and Algebra, Measurement and Geometry, or Data and Probability. Each category is designed to sharpen specific analytical and problem-solving skills.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>



            {/* Meet the Team */}
            <section className="py-10 md:py-20 relative z-10">
                <div className="w-[85%] md:container mx-auto">
                    <h2 className="text-2xl md:text-4xl font-black text-center mb-4 md:mb-6">Game Designers & Conceptualizers</h2>
                    <p className="text-center text-blue-100 max-w-3xl mx-auto mb-8 md:mb-16 text-xs md:text-lg leading-relaxed drop-shadow-md">
                        "We are BSED Mathematics students from Bicol University Tabaco. As game designers and conceptualizers, we developed a web-based educational game that integrates mathematical vocabulary with interactive learning experiences. This innovation aims to support Grade 8 learners in understanding key mathematical terms while promoting engagement and positive attitudes toward mathematics."
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-8 flex-wrap mb-16">
                        {[
                            { name: "BARCENAS, REYMUND B.", role: "Game Designer & Conceptualizer", icon: Gamepad2 },
                            { name: "BROQUEZA, MARIANNE JOY B.", role: "Game Designer & Conceptualizer", icon: Brain },
                            { name: "PLANDEZ, PRINCESS JAIRA B.", role: "Game Designer & Conceptualizer", icon: Star },
                            { name: "TADURAN, BIANCA MAE R.", role: "Game Designer & Conceptualizer", icon: Sparkles }
                        ].map((dev, index) => (
                            <motion.div
                                key={index}
                                whileHover={isMobile ? {} : { y: -10 }}
                                className="flex flex-col items-center p-3 md:p-6"
                            >
                                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center mb-4 md:mb-6 md:shadow-xl md:backdrop-blur-md overflow-hidden">
                                    <dev.icon className="w-10 h-10 md:w-16 md:h-16 text-white" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-center">{dev.name}</h3>
                                <p className="text-blue-200 font-medium text-xs md:text-sm">{dev.role}</p>
                            </motion.div>
                        ))}
                    </div>

                    <h2 className="text-2xl md:text-4xl font-black text-center mb-4 md:mb-6 mt-12">Developer</h2>
                    <p className="text-center text-blue-100 max-w-3xl mx-auto mb-8 md:mb-16 text-xs md:text-lg leading-relaxed drop-shadow-md">
                        "We are BSIT students from the Bicol University College of Science, pushing the boundaries of technology by building a high-performance website that bridges the gap between innovation and user experience."
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-8 flex-wrap">
                        {[
                            { name: "SEAN DYLAN ARMENTA", role: "Developer", icon: Code },
                            { name: "JOHN BENEDICT CANDELARIA", role: "Developer", icon: Cpu },
                            { name: "JEFFREY CRUEL", role: "Developer", icon: Monitor },
                            { name: "NASH MAPULA", role: "Developer", icon: MousePointerClick }
                        ].map((dev, index) => (
                            <motion.div
                                key={`dev-${index}`}
                                whileHover={isMobile ? {} : { y: -10 }}
                                className="flex flex-col items-center p-3 md:p-6"
                            >
                                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center mb-4 md:mb-6 md:shadow-xl md:backdrop-blur-md overflow-hidden">
                                    <dev.icon className="w-10 h-10 md:w-16 md:h-16 text-white" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-center">{dev.name}</h3>
                                <p className="text-blue-200 font-medium text-xs md:text-sm">{dev.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* 8. FAQ */}
            <section className="py-10 md:py-20 md:bg-black/20 md:backdrop-blur-sm relative z-10">
                <div className="w-[85%] md:container mx-auto max-w-3xl">
                    <h2 className="text-2xl md:text-4xl font-black text-center mb-8 md:mb-12">FAQ</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Is it free to play?", a: "Yes! Mathemix is 100% free to start. Optional cosmetics available." },
                            { q: "Can I play with friends?", a: "Absolutely. Use the 'Custom Lobby' feature to invite friends instantly." },
                            { q: "What devices are supported?", a: "Currently available on Web (Desktop & Mobile). Native apps coming soon." },
                            { q: "Do I need an account?", a: "Yes, account is required to save progress and rank." }
                        ].map((faq, index) => (
                            <details key={index} className="group bg-white/10 rounded-xl overflow-hidden cursor-pointer transition-all active:bg-white/20 md:hover:bg-white/20 border border-white/10 md:backdrop-blur-md transform-gpu">
                                <summary className="p-4 md:p-6 flex justify-between items-center font-bold text-sm md:text-lg list-none">
                                    {faq.q}
                                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-4 pb-4 md:px-6 md:pb-6 text-blue-100 text-xs md:text-base leading-relaxed">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* 9. Contact Us */}
            <section className="py-10 md:py-20 relative z-10">
                <div className="w-[85%] md:container mx-auto text-center">
                    <div className="max-w-2xl mx-auto bg-white/10 md:backdrop-blur-xl p-6 md:p-12 rounded-3xl border border-white/20 md:shadow-2xl">
                        <Mail className="w-8 h-8 md:w-12 md:h-12 text-white mx-auto mb-4 md:mb-6" />
                        <h2 className="text-2xl md:text-3xl font-black mb-2 md:mb-4">Get in Touch</h2>
                        <p className="text-blue-100 mb-6 md:mb-8 text-sm md:text-base">
                            Have questions or feedback? We'd love to hear from you.
                        </p>
                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                            <a href="mailto:support@mathemix.com" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-lg active:bg-blue-50 md:hover:bg-blue-50 transition-colors font-bold text-sm md:text-base transform-gpu">
                                <Mail className="w-4 h-4" /> support@mathemix.com
                            </a>
                            <a href="#" className="flex items-center justify-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-lg active:brightness-110 md:hover:brightness-110 transition-colors font-bold md:shadow-lg text-sm md:text-base transform-gpu">
                                Discord Community
                            </a>
                        </div>

                        <div className="flex justify-center gap-6 mt-8">
                            <a href="#" className="text-blue-200 active:text-white md:hover:text-white transition-colors transform active:scale-95 md:hover:scale-110"><Twitter className="w-6 h-6" /></a>
                            <a href="#" className="text-blue-200 active:text-white md:hover:text-white transition-colors transform active:scale-95 md:hover:scale-110"><Instagram className="w-6 h-6" /></a>
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. Footer */}
            <footer className="py-12 md:bg-black/40 text-blue-200 text-sm border-t border-white/10 relative z-10 md:backdrop-blur-md">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl md:blur-lg md:opacity-40 hidden md:block" />
                                <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-2 rounded-xl border border-white/30 md:backdrop-blur-md md:shadow-lg">
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
                            <button onClick={() => navigate('/privacy-policy')} className="active:text-white md:hover:text-white transition-colors">Privacy Policy</button>
                            <button onClick={() => navigate('/terms-of-service')} className="active:text-white md:hover:text-white transition-colors">Terms of Service</button>
                            <button onClick={() => navigate('/cookie-policy')} className="active:text-white md:hover:text-white transition-colors">Cookie Policy</button>
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
