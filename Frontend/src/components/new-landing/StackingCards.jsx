import React, { useRef } from 'react';
import { useTransform, motion, useScroll } from 'motion/react';

const Img1 = '/ref/Img1.png';
const Img2 = '/ref/Img2.png';
const Logo = '/ref/Logo.svg';

const projects = [
    {
        title: 'Creative Content',
        description: 'In a world where attention is fleeting, we craft content that stops the scroll, sparks curiosity, and drives action.',
        services: [
            'Motion Design',
            'Social Media Assets',
            'Showreel Creation',
            'Copywriting',
            'Short 3D product reels',
            'CGI & VFX - coming soon'
        ],
        link: Img1,
        color: '#ffffff',
    },
    {
        title: 'Development',
        description: 'From MVP to Series A platform, we build the technical foundation that grows with your startup.',
        services: [
            'Webflow Development',
            'Creative Development',
            'Native Web Dev',
            'Framer',
            'Wordpress'
        ],
        link: Img2,
        color: '#ffffff',
    },
    {
        title: 'Strategic Marketing',
        description: 'In a world where attention is fleeting, we craft content that stops the scroll, sparks curiosity, and drives action.',
        services: [
            'Brand Strategy',
            'Market Analysis',
            'Campaign Planning',
            'SEO Optimization',
            'Performance Marketing',
            'Analytics - coming soon'
        ],
        link: Img1,
        color: '#ffffff',
    },
];

const Card = ({ i, title, description, services, link, color, progress, range, targetScale }) => {
    const container = useRef(null);

    // Animation Logic
    const scale = useTransform(progress, range, [1, targetScale]);
    const blur = useTransform(progress, range, [0, 25]);

    return (
        <div ref={container} className="h-screen flex items-center justify-center sticky top-0">
            <motion.div
                style={{
                    scale,
                    filter: `blur(${blur}px)`,
                    backgroundColor: color,
                }}
                className="relative w-[95vw] max-w-[1200px] h-[750px] rounded-[48px] p-10 md:p-14 bg-white shadow-sm border border-gray-100 flex flex-col md:flex-row gap-10 overflow-hidden transform-gpu"
            >
                {/* Left Content Section */}
                <div className="w-full md:w-[45%] flex flex-col justify-between h-full relative z-20">
                    {/* Top Content Group */}
                    <div>
                        {/* Title: Adjusted size for better wrapping */}
                        <h2 className="text-4xl md:text-[56px] font-semibold text-gray-900 mb-6 tracking-tight leading-[1.05]">
                            {title}
                        </h2>

                        {/* Description */}
                        <p className="text-[17px] text-gray-600 leading-relaxed mb-8 max-w-[420px]">
                            {description}
                        </p>

                        {/* Services List */}
                        <div>
                            <span className="text-[15px] font-bold text-gray-900 block mb-4">
                                Services:
                            </span>
                            <ul className="flex flex-col gap-2">
                                {services.map((service, idx) => {
                                    const isComingSoon = service.includes('coming soon');
                                    const parts = service.split('-');
                                    const mainText = parts[0].trim();

                                    return (
                                        <li key={idx} className="text-[18px] text-gray-800 font-medium tracking-tight flex items-center">
                                            {mainText}
                                            {isComingSoon && (
                                                <span className="ml-2 text-gray-300 font-light italic text-[16px]">
                                                    - coming soon
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Button Group - Pinned to bottom via flex justify-between */}
                    <div className="group relative cursor-pointer w-fit px-8 py-3 bg-[#f0f2f5] rounded-full overflow-hidden flex items-center gap-2 mt-auto md:mt-0">
                        <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
                        <div className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-500">
                            <span className="font-medium text-[15px]">More Info</span>
                            <div className="w-4 h-4 relative group-hover:-rotate-12 transition-transform duration-500">
                                <img
                                    src={Logo}
                                    alt="arrow"
                                    className="object-contain opacity-60 group-hover:opacity-100 group-hover:invert transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Image Section */}
                <div className="hidden md:block w-full md:w-[55%] h-full relative rounded-[32px] overflow-hidden">
                    <img
                        src={link}
                        alt={title}
                        className="object-cover w-full h-full"
                    />
                </div>
            </motion.div>
        </div>
    );
};

const StackingCards = () => {
    const container = useRef(null);
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end end'],
    });

    return (
        <section ref={container} className="mt-[10vh] mb-[10vh] bg-[#e5e9eb] py-10 rounded-t-[48px]">
            {projects.map((project, i) => {
                const rangeStart = i * (1 / projects.length);
                const rangeEnd = rangeStart + (1 / projects.length);

                const targetScale = 1 - ((projects.length - i) * 0.05);

                return (
                    <Card
                        key={`p_${i}`}
                        i={i}
                        {...project}
                        progress={scrollYProgress}
                        range={[rangeStart, rangeEnd]}
                        targetScale={targetScale}
                    />
                );
            })}
        </section>
    );
};

export default StackingCards;