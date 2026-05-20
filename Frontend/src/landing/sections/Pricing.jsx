import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const FREE_FEATURES = [
    '200 credits per week (resets weekly)',
    'Standard AI · Gemini 2.5 Flash',
    '5 credits · Generate Course Map',
    '10 credits · Generate Lesson Notes',
    '1 credit · Tutor Chat message',
    'Short & Standard explanations only',
];

const PRO_FEATURES = [
    '150 credits per day (accumulates)',
    'Advanced AI · Gemini 3.1 Pro',
    '15 credits · Generate Course Map',
    '30 credits · Generate Lesson Notes',
    '3 credits · Tutor Chat message',
    'Deep explanation depth unlocked',
    'Code & Mini Project questions',
];

const ULTRA_FEATURES = [
    '300 credits per day (accumulates)',
    'Everything in Pro, doubled credits',
    'Max quiz settings (10 MCQ · 5 Written · 3 Code)',
    'Web Grounding & richest AI settings',
    'Highest priority AI processing',
    'Mini Projects included',
];

const Toast = ({ toast }) => (
    <AnimatePresence>
        {toast && (
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}
                className="bg-zinc-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 p-4 flex items-center gap-3 min-w-[280px]"
            >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <span className={`text-lg font-bold ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {toast.type === 'success' ? '✓' : '✕'}
                    </span>
                </div>
                <div>
                    <p className="font-semibold text-white text-sm">{toast.type === 'success' ? 'Success!' : 'Error'}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{toast.message}</p>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

const Pricing = () => {
    const { user } = useUser();
    const { openSignIn } = useClerk();
    const navigate = useNavigate();
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [userPlan, setUserPlan] = useState('free');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
            if (type === 'success') window.location.reload();
        }, 2500);
    };

    useEffect(() => {
        if (user) {
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/${user.id}/usage`)
                .then(res => res.json())
                .then(data => { if (data.success && data.plan) setUserPlan(data.plan); })
                .catch(console.error);
        }
    }, [user]);

    const handleCheckout = async (plan) => {
        if (!user) { openSignIn(); return; }
        if (userPlan === plan || (userPlan === 'ultra' && plan === 'pro')) {
            navigate('/dashboard'); return;
        }
        setLoadingPlan(plan);
        try {
            const res = await loadRazorpayScript();
            if (!res) { showToast("Razorpay SDK failed to load. Are you online?", "error"); setLoadingPlan(null); return; }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clerkId: user.id, plan }),
            });
            const data = await response.json();
            if (!data.success) { showToast("Could not create order: " + (data.message || "Unknown error"), "error"); setLoadingPlan(null); return; }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_ShJJUB86k3Q2Oq',
                amount: data.amount,
                currency: data.currency,
                name: "Cluss AI",
                description: `Upgrade to ${plan.toUpperCase()}`,
                order_id: data.order.id,
                handler: async function (response) {
                    const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payment/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clerkId: user.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan
                        }),
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        showToast(`Welcome to ${plan.toUpperCase()}! Your plan is now active.`, "success");
                    } else {
                        showToast("Payment verification failed. Contact support.", "error");
                    }
                },
                prefill: { name: user.fullName || '', email: user.primaryEmailAddress?.emailAddress || '' },
                theme: { color: "#6366f1" },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (err) {
            console.error(err);
            showToast("Something went wrong. Please try again.", "error");
        } finally {
            setLoadingPlan(null);
        }
    };

    const getButtonLabel = (plan) => {
        if (loadingPlan === plan) return 'Processing...';
        if (!user) return plan === 'free' ? 'Get started for free' : `Get started with ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
        if (userPlan === plan) return 'Your current plan';
        if (userPlan === 'ultra' && plan === 'pro') return 'Go to Dashboard';
        return plan === 'free' ? 'Get started for free' : `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
    };

    const isCurrentPlan = (plan) => user && userPlan === plan;

    return (
        <div id="pricing" className='w-full flex justify-center pb-20'>
            <Toast toast={toast} />
            <div className='w-[90vw] bg-gradient-to-b from-[#252830] to-[#1e2028] rounded-4xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden'>
                <div className='py-16 flex flex-col items-center gap-12'>

                    {/* Header */}
                    <div className='flex flex-col items-center text-center gap-4 px-4'>
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                            Pricing
                        </div>
                        <h2 className='text-[40px] md:text-[50px] font-medium leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight'>
                            Plans and Pricing
                        </h2>
                        <p className='text-[18px] text-zinc-400 max-w-lg'>
                            Start for free and create your first study plan today. Upgrade anytime for more depth and control.
                        </p>
                    </div>

                    {/* Cards Container */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-[1100px] px-8'>

                        {/* Free Plan */}
                        <div className={`flex flex-col p-8 rounded-[32px] border h-full justify-between gap-10 transition-all duration-300 hover:border-white/15 ${isCurrentPlan('free') ? 'border-indigo-500 border-2 shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-gradient-to-b from-[#272a33] to-[#1e2028]' : 'border-white/[0.08] bg-gradient-to-b from-[#22252d] to-[#1b1d25]'}`}>
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className='text-2xl font-medium text-white'>Free</h3>
                                    {isCurrentPlan('free') && (
                                        <span className='bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-[0_0_8px_rgba(99,102,241,0.5)]'>Current</span>
                                    )}
                                </div>
                                <div className='mb-6 flex flex-col'>
                                    <span className='text-[45px] font-medium leading-tight text-white'>₹0</span>
                                    <p className='text-sm text-zinc-400'>Perfect for casual learners</p>
                                </div>

                                <div className='space-y-4 mb-4'>
                                    <p className='font-medium text-zinc-200'>Daily Learning Essentials</p>
                                    <ul className='space-y-3'>
                                        {FREE_FEATURES.map((feature, i) => (
                                            <li key={i} className='flex items-center gap-3 text-sm text-zinc-400'>
                                                <div className='bg-white/10 min-w-5 h-5 flex items-center justify-center rounded text-indigo-400'>
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                disabled={loadingPlan === 'free' || isCurrentPlan('free')}
                                onClick={() => !user ? openSignIn() : navigate('/dashboard')}
                                className='group relative cursor-pointer w-full py-4 bg-white/5 border border-white/10 flex justify-center items-center gap-2 rounded-2xl overflow-hidden disabled:opacity-60 disabled:cursor-default transition-all duration-300'
                            >
                                <div className='absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                                <div className='relative z-10 font-medium text-zinc-300 group-hover:text-black transition-colors duration-500'>
                                    {isCurrentPlan('free') ? 'Your current plan' : 'Get started for free'}
                                </div>
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className={`flex flex-col p-8 rounded-[32px] border h-full justify-between gap-10 relative transition-all duration-300 ${isCurrentPlan('pro') ? 'border-indigo-500 border-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-gradient-to-b from-indigo-950/30 via-zinc-900/60 to-zinc-900/80' : 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 via-zinc-900/40 to-zinc-900/60 shadow-[0_0_40px_rgba(99,102,241,0.25)] hover:border-indigo-400/60'}`}>
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <h3 className='text-2xl font-medium text-white'>Pro</h3>
                                    <span className='bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(99,102,241,0.5)]'>
                                        <span className='text-xs'>🔥</span> Popular
                                    </span>
                                </div>
                                <div className='mb-6 flex flex-col'>
                                    <span className='text-[45px] font-medium leading-tight text-white'>₹49</span>
                                    <p className='text-sm text-zinc-300'>Per month · For serious learners</p>
                                </div>

                                <div className='space-y-4 mb-4'>
                                    <p className='font-medium text-zinc-200'>Everything in Free, plus:</p>
                                    <ul className='space-y-3'>
                                        {PRO_FEATURES.map((feature, i) => (
                                            <li key={i} className='flex items-center gap-3 text-sm text-zinc-300'>
                                                <div className='bg-indigo-500/20 min-w-5 h-5 flex items-center justify-center rounded text-indigo-300 border border-indigo-500/20'>
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                disabled={loadingPlan === 'pro' || isCurrentPlan('pro')}
                                onClick={() => handleCheckout('pro')}
                                className='group relative cursor-pointer w-full py-4 bg-indigo-600 border border-indigo-500/40 flex justify-center items-center gap-2 rounded-2xl overflow-hidden disabled:opacity-60 disabled:cursor-default transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                            >
                                <div className='absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                                <div className='relative z-10 font-medium text-white group-hover:text-black transition-colors duration-500'>
                                    {getButtonLabel('pro')}
                                </div>
                            </button>
                        </div>

                        {/* Ultra Plan */}
                        <div className={`flex flex-col p-8 rounded-[32px] h-full justify-between gap-10 bg-gradient-to-b from-[#22252d] to-[#171920] border transition-all duration-300 hover:border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${isCurrentPlan('ultra') ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.2)]' : 'border-white/[0.08]'}`}>
                            <div>
                                <div className='flex items-center justify-between mb-4'>
                                    <h3 className='text-2xl font-medium text-white'>Ultra</h3>
                                    {isCurrentPlan('ultra') && (
                                        <span className='bg-white text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase'>Current</span>
                                    )}
                                </div>
                                <div className='mb-6 flex flex-col'>
                                    <span className='text-[45px] font-medium leading-tight text-white'>₹99</span>
                                    <p className='text-sm text-zinc-400'>Per month · For power learners</p>
                                </div>

                                <div className='space-y-4 mb-4'>
                                    <p className='font-medium text-white'>Everything in Pro, plus:</p>
                                    <ul className='space-y-3'>
                                        {ULTRA_FEATURES.map((feature, i) => (
                                            <li key={i} className='flex items-center gap-3 text-sm text-zinc-300'>
                                                <div className='bg-white text-black min-w-5 h-5 flex items-center justify-center rounded'>
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                disabled={loadingPlan === 'ultra' || isCurrentPlan('ultra')}
                                onClick={() => handleCheckout('ultra')}
                                className='group relative cursor-pointer w-full py-4 bg-white text-black flex justify-center items-center gap-2 rounded-2xl overflow-hidden disabled:opacity-60 disabled:cursor-default transition-all duration-300'
                            >
                                <div className='absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                                <div className='relative z-10 font-medium transition-colors duration-500'>
                                    {getButtonLabel('ultra')}
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Pricing;
