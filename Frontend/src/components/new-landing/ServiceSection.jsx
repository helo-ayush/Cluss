import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Plus, Minus } from 'lucide-react';

const services = [
    {
        id: '01',
        name: 'AI Course Builder',
        description: 'Automatically convert any YouTube video or topic into a structured course module with lessons, timestamps, and key concepts. Stop wasting hours searching for tutorials—enter any topic and let Gemini 3.1 construct your syllabus instantly.'
    },
    {
        id: '02',
        name: 'YouTube RAG Study Chat',
        description: 'Interact with your courses like never before. Chat directly with your materials; our RAG engine answers your questions by searching through exact video transcripts to find the perfect answer.'
    },
    {
        id: '03',
        name: 'Instant AI Notes & Summaries',
        description: 'Skip the manual transcription. Get detailed, beautifully formatted study notes and summaries instantly for every video lesson, saving you time so you can focus on learning.'
    },
    {
        id: '04',
        name: 'AI Quiz Generator',
        description: 'Test your knowledge on the fly. We automatically generate adaptive multiple-choice quizzes based on your course content to challenge yourself and adapt to your knowledge gaps.'
    },
    {
        id: '05',
        name: 'Progress & Streak Tracking',
        description: 'Consistency is the key to mastery. Track your daily learning streaks, unlock modules by passing quizzes, and monitor your course completion across all your curriculums in a central dashboard.'
    },
];

const ServicesSection = () => {
    const [expanded, setExpanded] = useState(null);

    const toggle = (i) => {
        if (expanded === i) {
            setExpanded(null);
        } else {
            setExpanded(i);
        }
    };

    return (
        <section id="about" className="w-full py-20 flex flex-col items-center">
            <div className="w-[90vw] bg-white rounded-[40px] shadow-sm border border-gray-100">
                <div className="p-8 md:p-16">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start mb-20 gap-8">
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-900">
                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                            Our Features
                        </div>
                        <h2 className="text-3xl md:text-5xl font-medium max-w-2xl leading-tight text-gray-900">
                            We don't just find videos, we build personalized curriculums.
                        </h2>
                    </div>

                    {/* Services List */}
                    <div className="w-full flex flex-col">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                viewport={{ once: true }}
                                onClick={() => toggle(index)}
                                className="group flex flex-col border-t border-gray-100 py-6 md:py-8 cursor-pointer hover:bg-gray-50 transition-colors duration-300 px-4 -mx-4 rounded-xl"
                            >
                                <div className="flex items-center w-full">
                                    <span className="text-sm md:text-base font-medium text-gray-900 w-16 md:w-32 group-hover:translate-x-4 transition-transform duration-300 ease-out">
                                        {service.id}
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-medium flex-1 text-gray-900 group-hover:translate-x-4 transition-transform duration-300 ease-out">
                                        {service.name}
                                    </h3>
                                    <div className="flex justify-end group-hover:-translate-x-4 transition-transform duration-300 ease-out">
                                        {expanded === index ? (
                                            <Minus
                                                className="w-5 h-5 md:w-6 md:h-6 text-gray-900"
                                                strokeWidth={1.2}
                                            />
                                        ) : (
                                            <Plus
                                                className="w-5 h-5 md:w-6 md:h-6 text-gray-900 group-hover:text-gray-500 transition-colors duration-300"
                                                strokeWidth={1.2}
                                            />
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expanded === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 md:pl-32 pl-16 pr-8 text-gray-600 leading-relaxed text-[15px] md:text-[17px] max-w-4xl">
                                                {service.description}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                        <div className="border-t border-gray-100" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;