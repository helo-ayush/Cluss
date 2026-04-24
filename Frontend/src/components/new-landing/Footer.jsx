import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowRight, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const featuresLinks = [
        'AI Course Builder', 'YouTube Q&A Chat', 'Deep Topic Search',
        'AI Quiz Generator', 'Study Summaries', 'RAG Study Chat', 'Progress Tracking'
    ];

    const learnLinks = [
        'K-12 Education', 'Higher Education', 'Coding Bootcamps',
        'Language Learning', 'Test Prep', 'Self-taught Devs', 'Skill Building'
    ];

    const companyLinks = [
        'About', 'Pricing', 'Features', 'Blog', 'Careers', 'Contact'
    ];

    const socialLinks = [
        { icon: <Instagram size={18} />, href: '#' },
        { icon: <Linkedin size={18} />, href: '#' },
        { icon: <span className="font-bold text-sm">X</span>, href: '#' },
    ];

    return (
        <footer className="w-full bg-[#e5e9eb] px-6 md:px-12 py-16 font-sans text-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Company Column */}
                    <div>
                        <h4 className="font-semibold mb-6">Company:</h4>
                        <ul className="space-y-3">
                            {companyLinks.map((link) => (
                                <li key={link}>
                                    <Link to="#" className="hover:text-gray-500 transition-colors duration-200 block text-[15px]">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Features Column */}
                    <div>
                        <h4 className="font-semibold mb-6">Features:</h4>
                        <ul className="space-y-3">
                            {featuresLinks.map((link) => (
                                <li key={link}>
                                    <Link to="#" className="hover:text-gray-500 transition-colors duration-200 block text-[15px]">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Learning Paths Column */}
                    <div>
                        <h4 className="font-semibold mb-6">Learning Paths:</h4>
                        <ul className="space-y-3">
                            {learnLinks.map((link) => (
                                <li key={link}>
                                    <Link to="#" className="hover:text-gray-500 transition-colors duration-200 block text-[15px]">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Subscription & Social Column */}
                    <div className="flex flex-col">
                        <h4 className="font-semibold mb-6">Stay in the loop</h4>
                        <div className="relative mb-8 group">
                            <input
                                type="email"
                                placeholder="Your email here"
                                className="w-full bg-transparent border-b border-gray-400 py-2 pr-10 focus:outline-none focus:border-gray-900 transition-colors text-[15px]"
                            />
                            <button className="absolute right-0 bottom-2 text-gray-500 hover:text-gray-900 transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mb-10">
                            By signing up, you agree to our <Link to="#" className="underline">Privacy Policy</Link>. We respect your data. Unsubscribe anytime.
                        </p>

                        <h4 className="font-semibold mb-6">Follow us on:</h4>
                        <div className="flex gap-3">
                            {socialLinks.map((social, index) => (
                                <Link
                                    key={index}
                                    to={social.href}
                                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-white hover:border-white transition-all duration-300 text-gray-700"
                                >
                                    {social.icon}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-300 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                    <div className="flex items-center gap-2 cursor-pointer order-2 md:order-1">
                        <span className="text-2xl font-bold tracking-tighter text-[#666666]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            study<span style={{ color: '#1a1a1a' }}>helper</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 order-3 md:order-2">
                        <span>© 2026 StudyHelper. All rights reserved</span>
                        <div className="w-1 h-1 rounded-full bg-black mx-1" />
                        <Link to="#" className="text-gray-900 font-medium">Privacy Policy</Link>
                    </div>

                    {/* Scroll to Top Button */}
                    <button
                        onClick={scrollToTop}
                        className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 md:absolute md:right-0 md:-top-6 order-1 md:order-3"
                    >
                        <ArrowUp size={24} />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;