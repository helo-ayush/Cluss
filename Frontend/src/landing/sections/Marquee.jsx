import React from 'react'

const Marquee = () => {
    const texts = [
        "/ GUIDED STUDY PLANS",
        "/ PLAYLIST TO DAY PLAN",
        "/ INSTANT QUIZ BUILDER",
        "/ RAG STUDY CHAT",
        "/ AI-GENERATED NOTES",
        "/ TRACK YOUR PROGRESS"
    ];

    return (
        <div className="overflow-hidden whitespace-nowrap bg-[#252830] border-y border-white/5 py-6 flex select-none">
            <div className="flex animate-marquee shrink-0 min-w-full">
                {texts.map((text, index) => (
                    <div key={index} className="flex items-center mx-10">
                        <span className="text-3xl font-mono tracking-tighter uppercase text-white/70">
                            {text}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex animate-marquee shrink-0 min-w-full">
                {texts.map((text, index) => (
                    <div key={`dup-${index}`} className="flex items-center mx-10">
                        <span className="text-3xl font-mono tracking-tighter uppercase text-white/70">
                            {text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Marquee
