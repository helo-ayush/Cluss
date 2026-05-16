import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const services = [
  {
    id: '01',
    name: 'Guided Study Plans',
    description: 'Turn any topic into a structured learning path with modules, subtopics, inline checks, and milestone projects. Instead of a giant wall of content, you get a sequence you can actually complete.'
  },
  {
    id: '02',
    name: 'Playlist Study Plans',
    description: 'Import a YouTube playlist you already trust and Cluss will reshape it into day-by-day study blocks with checkpoints, so you can move through the material with real pacing.'
  },
  {
    id: '03',
    name: 'Context-Aware Study Chat',
    description: 'Ask questions inside the current lesson or playlist day. The assistant stays anchored to that context instead of drifting into unrelated explanations.'
  },
  {
    id: '04',
    name: 'Inline Assessments',
    description: 'Test your knowledge with multiple-choice checks, written prompts, and optional code tasks generated from the exact lesson you are learning.'
  },
  {
    id: '05',
    name: 'Progress & Streak Tracking',
    description: 'Track your daily learning streaks, unlock steps by passing checkpoints, and monitor progress across all your study plans in one dashboard.'
  },
];

export default function ServicesSection() {
  const [expanded, setExpanded] = useState(null);

  return (
    <section id="about" className="flex w-full flex-col items-center py-20">
      <div className="w-[90vw] rounded-[40px] border border-gray-100 bg-white shadow-sm">
        <div className="p-8 md:p-16">
          <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-900">
              <div className="h-1.5 w-1.5 rounded-full bg-black" />
              Our Features
            </div>
            <h2 className="max-w-2xl text-3xl font-medium leading-tight text-gray-900 md:text-5xl">
              We do more than collect material, we turn it into a study system.
            </h2>
          </div>

          <div className="flex w-full flex-col">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="group -mx-4 flex cursor-pointer flex-col rounded-xl border-t border-gray-100 px-4 py-6 transition-colors duration-300 hover:bg-gray-50 md:py-8"
              >
                <div className="flex w-full items-center">
                  <span className="w-16 text-sm font-medium text-gray-900 transition-transform duration-300 ease-out group-hover:translate-x-4 md:w-32 md:text-base">
                    {service.id}
                  </span>
                  <h3 className="flex-1 text-xl font-medium text-gray-900 transition-transform duration-300 ease-out group-hover:translate-x-4 md:text-2xl">
                    {service.name}
                  </h3>
                  <div className="flex justify-end transition-transform duration-300 ease-out group-hover:-translate-x-4">
                    {expanded === index ? (
                      <Minus className="h-5 w-5 text-gray-900 md:h-6 md:w-6" strokeWidth={1.2} />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-900 transition-colors duration-300 group-hover:text-gray-500 md:h-6 md:w-6" strokeWidth={1.2} />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="max-w-4xl px-0 pb-2 pt-4 pl-16 text-[15px] leading-relaxed text-gray-600 md:pl-32 md:pr-8 md:text-[17px]">
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
}
