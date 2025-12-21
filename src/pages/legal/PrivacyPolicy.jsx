import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] text-white p-8 font-nunito">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/welcome')}
                    className="flex items-center gap-2 mb-8 hover:text-yellow-300 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Home
                </button>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-white/20 rounded-2xl">
                            <Lock className="w-8 h-8 text-yellow-300" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black">Privacy Policy</h1>
                    </div>

                    <div className="space-y-6 text-blue-100 leading-relaxed">
                        <p>At Mathemix, accessible from our application, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Mathemix and how we use it.</p>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">Information We Collect</h2>
                            <p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Account information (Username, Email)</li>
                                <li>Game progress and statistics</li>
                                <li>Usage data and logs</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">How We Use Your Information</h2>
                            <p>We use the information we collect in various ways, including to:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Provide, operate, and maintain our game</li>
                                <li>Improve, personalize, and expand our game</li>
                                <li>Understand and analyze how you use our game</li>
                                <li>Develop new features, functionality, and services</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">Log Files</h2>
                            <p>Mathemix follows a standard procedure of using log files. These files log visitors when they use the app. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">Children's Information</h2>
                            <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>
                        </section>

                        <div className="pt-8 mt-8 border-t border-white/10 text-sm text-blue-200">
                            Last updated: December 2025
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
