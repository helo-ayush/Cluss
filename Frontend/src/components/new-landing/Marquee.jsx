import React from 'react'

const Marquee = () => {
    const texts = [
        "/ AI COURSE GENERATION",
        "/ YOUTUBE TO CURRICULUM",
        "/ INSTANT QUIZ BUILDER",
        "/ RAG STUDY CHAT",
        "/ AI-GENERATED NOTES",
        "/ TRACK YOUR PROGRESS"
    ];

    return (
        <div className="overflow-hidden whitespace-nowrap bg-white py-6 flex select-none">
            <div className="flex animate-marquee shrink-0 min-w-full">
                {texts.map((text, index) => (
                    <div key={index} className="flex items-center mx-10">
                        <span className="text-3xl font-mono tracking-tighter uppercase text-black">
                            {text}
                        </span>
                        {/* <span className="ml-20 text-4xl font-light text-gray-300">/</span> */}
                    </div>
                ))}
            </div>
            <div className="flex animate-marquee shrink-0 min-w-full">
                {texts.map((text, index) => (
                    <div key={`dup-${index}`} className="flex items-center mx-10">
                        <span className="text-3xl font-mono tracking-tighter uppercase text-black">
                            {text}
                        </span>
                        {/* <span className="ml-20 text-4xl font-light text-gray-300">/</span> */}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Marquee
