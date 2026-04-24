import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useInView } from "motion/react";

const itemsData = [
    { id: 1, type: "image", src: "https://picsum.photos/seed/ai-course/240/160", width: 180, height: 130, initialTop: "20%", initialLeft: "10%", rotate: -15, z: 2 },
    { id: 2, type: "image", src: "https://picsum.photos/seed/study-plan/220/180", width: 200, height: 150, initialTop: "38%", initialLeft: "18%", rotate: -8, z: 3 },
    { id: 3, type: "image", src: "https://picsum.photos/seed/quiz-maker/200/160", width: 170, height: 130, initialTop: "58%", initialLeft: "12%", rotate: -12, z: 2 },
    { id: 4, type: "image", src: "https://picsum.photos/seed/rag-chat/220/180", width: 190, height: 140, initialTop: "72%", initialLeft: "25%", rotate: -5, z: 4 },
    { id: 5, type: "image", src: "https://picsum.photos/seed/video-learning/240/200", width: 200, height: 150, initialTop: "82%", initialLeft: "40%", rotate: 0, z: 5 },
    { id: 6, type: "image", src: "https://picsum.photos/seed/pdf-notes/220/180", width: 190, height: 140, initialTop: "78%", initialLeft: "56%", rotate: 3, z: 4 },
    { id: 7, type: "image", src: "https://picsum.photos/seed/deep-search/200/160", width: 220, height: 160, initialTop: "85%", initialLeft: "68%", rotate: 8, z: 5 },
    { id: 8, type: "image", src: "https://picsum.photos/seed/streaks/220/160", width: 210, height: 150, initialTop: "62%", initialLeft: "78%", rotate: 10, z: 3 },
    { id: 9, type: "image", src: "https://picsum.photos/seed/gamification/240/180", width: 180, height: 140, initialTop: "42%", initialLeft: "85%", rotate: 15, z: 2 },
    { id: 10, type: "image", src: "https://picsum.photos/seed/leaderboard/200/140", width: 160, height: 110, initialTop: "18%", initialLeft: "78%", rotate: 18, z: 2 },
];

const CreativeLabFallingSection = () => {
    const containerRef = useRef(null);
    const itemsRefs = useRef([]);
    const [hasFallen, setHasFallen] = useState(false);

    const isInView = useInView(containerRef, { once: true, amount: 0.5 });

    useEffect(() => {
        if (isInView && !hasFallen) {
            setHasFallen(true);
        }
    }, [isInView, hasFallen]);

    useEffect(() => {
        if (!hasFallen || !containerRef.current) return;

        const { Engine, World, Bodies, Runner, Mouse, MouseConstraint } = Matter;
        const container = containerRef.current;

        const width = container.offsetWidth;
        const height = container.offsetHeight;

        const engine = Engine.create();
        engine.world.gravity.y = 1.2;

        const wallOpts = { isStatic: true, render: { visible: false } };
        const floor = Bodies.rectangle(width / 2, height + 50, width, 100, wallOpts);
        const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, wallOpts);
        const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOpts);
        World.add(engine.world, [floor, leftWall, rightWall]);

        const itemBodies = [];

        itemsData.forEach((item, index) => {
            const elem = itemsRefs.current[index];
            if (!elem) return;

            const percentX = parseFloat(item.initialLeft) / 100;
            const percentY = parseFloat(item.initialTop) / 100;

            const x = percentX * width;
            const y = percentY * height;

            const body = Bodies.rectangle(x, y, item.width, item.height, {
                restitution: 0.5,
                friction: 0.1,
                frictionAir: 0.01,
                angle: (item.rotate * Math.PI) / 180,
            });

            itemBodies.push({ body, elem, w: item.width, h: item.height });
        });

        World.add(engine.world, itemBodies.map((ib) => ib.body));

        const mouse = Mouse.create(container);
        mouse.pixelRatio = window.devicePixelRatio || 1;
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.2, render: { visible: false } },
        });
        World.add(engine.world, mouseConstraint);

        const runner = Runner.create();
        Runner.run(runner, engine);

        let animationId;
        const tick = () => {
            itemBodies.forEach(({ body, elem, w, h }) => {
                const { x, y } = body.position;
                elem.style.top = "0px";
                elem.style.left = "0px";
                elem.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${body.angle}rad)`;
            });
            animationId = requestAnimationFrame(tick);
        };
        tick();

        return () => {
            cancelAnimationFrame(animationId);
            Runner.stop(runner);
            Engine.clear(engine);
            World.clear(engine.world, false);
        };
    }, [hasFallen]);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[800px] bg-[#e5e9eb] overflow-hidden flex flex-col items-center pt-24 font-sans"
        >
            <div className="text-center z-10 px-4 pointer-events-none select-none">
                <h2 className="text-[40px] md:text-[70px] font-medium text-black tracking-tight leading-[1.1] mb-6">
                    AI-Powered Learning
                </h2>
                <p className="text-[18px] text-gray-700 mb-10 max-w-xl mx-auto leading-relaxed">
                    Every course, quiz, and note is generated by AI — tailored to your topic, speed, and learning style.
                </p>

                <div className="pointer-events-auto group relative cursor-pointer w-fit mx-auto px-6 py-3 bg-black text-white flex gap-2 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
                    <div className="relative z-10 flex gap-2 group-hover:text-black transition-colors duration-500 items-center">
                        <div>Start Building</div>
                        <div className="group-hover:-rotate-45 transition-transform duration-500">🚀</div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 z-0">
                {itemsData.map((item, i) => (
                    <div
                        key={item.id}
                        ref={(el) => { itemsRefs.current[i] = el; }}
                        className={`absolute bg-white rounded-2xl flex items-center justify-center overflow-hidden select-none border-[14px] border-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] ${hasFallen ? 'cursor-grab active:cursor-grabbing' : 'transition-transform duration-300'}`}
                        style={{
                            width: item.width,
                            height: item.height,
                            zIndex: item.z,
                            top: hasFallen ? undefined : item.initialTop,
                            left: hasFallen ? undefined : item.initialLeft,
                            transform: hasFallen ? undefined : `translate(-50%, -50%) rotate(${item.rotate}deg)`,
                        }}
                    >
                        <img
                            src={item.src}
                            alt="Learning snapshot"
                            className="w-full h-full object-cover pointer-events-none select-none"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

const FallingBoxes = () => {
    return (
        <div className="bg-white">
            <CreativeLabFallingSection />
        </div>
    );
};

export default FallingBoxes;