import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy = () => {
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
                            <Cookie className="w-8 h-8 text-yellow-300" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black">Cookie Policy</h1>
                    </div>

                    <div className="space-y-6 text-blue-100 leading-relaxed">
                        <p>This Cookie Policy explains what cookies are and how we use them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.</p>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">What Are Cookies?</h2>
                            <p>Cookies are small text files that are sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">How Mathemix Uses Cookies</h2>
                            <p>When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>To enable certain functions of the Service (e.g. keeping you logged in)</li>
                                <li>To provide analytics</li>
                                <li>To store your preferences</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">Essential Cookies</h2>
                            <p>We use essential cookies to authenticate users and prevent fraudulent use of user accounts. Without these cookies, the services that you have asked for cannot be provided.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">What Are Your Choices?</h2>
                            <p>If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.</p>
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

export default CookiePolicy;
