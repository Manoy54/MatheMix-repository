import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
                            <FileText className="w-8 h-8 text-yellow-300" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black">Terms of Service</h1>
                    </div>

                    <div className="space-y-6 text-blue-100 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">1. Acceptance of Terms</h2>
                            <p>By accessing and using Mathemix ("the Game"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">2. User Accounts</h2>
                            <p>To access certain features, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">3. User Conduct</h2>
                            <p>You agree not to engage in any of the following prohibited activities:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Using cheats, automation software, or exploits to gain unfair advantage.</li>
                                <li>Harassing, abusing, or harming other players.</li>
                                <li>Attempting to interfere with the proper working of the Game.</li>
                                <li>Impersonating Bicol University staff or developers.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">4. Intellectual Property</h2>
                            <p>All content included in Mathemix, such as text, graphics, logos, and software, is the property of the development team at Bicol University College of Science or its licensors and is protected by copyright laws.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">5. Termination</h2>
                            <p>We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-2">6. Changes to Terms</h2>
                            <p>We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.</p>
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

export default TermsOfService;
