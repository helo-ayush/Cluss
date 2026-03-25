import React from 'react';
import { AvatarCircles } from './magicui/AvatarCircles';
import { NeonGradientCard } from './magicui/NeonGradientCard';

const teamMembers = [
  {
    name: "Amritesh Kumar Rai",
    role: "CodeVoyager3 (UI/UX)",
    description: "Designing intuitive interfaces that make learning accessible to everyone.",
    imageUrl: "https://avatars.githubusercontent.com/u/175085530?v=4",
  },
  {
    name: "Ayush Kumar",
    role: "helo-ayush (Backend)",
    description: "Architecting the scalable backend that powers the Just-In-Time processing model and Lazy Loading.",
    imageUrl: "https://avatars.githubusercontent.com/u/119419988?v=4",
  },
  {
    name: "K$TB",
    role: "Kaus-code (Frontend)",
    description: "Ensuring TV-like seamless continuity between the user and their trusted creators pool.",
    imageUrl: "https://avatars.githubusercontent.com/u/180457826?v=4",
  },
  {
    name: "Himanshu K Mahto",
    role: "himanshu6093 (Database)",
    description: "Optimizing the LLM prompts that dynamically score transcripts and generate contextual quizzes.",
    imageUrl: "https://avatars.githubusercontent.com/u/173599381?v=4",
  }
];

const smallAvatars = [
  { imageUrl: "https://avatars.githubusercontent.com/u/175085530?v=4", profileUrl: "https://github.com/CodeVoyager3" },
  { imageUrl: "https://avatars.githubusercontent.com/u/119419988?v=4", profileUrl: "https://github.com/helo-ayush" },
  { imageUrl: "https://avatars.githubusercontent.com/u/180457826?v=4", profileUrl: "https://github.com/Kaus-code" },
  { imageUrl: "https://avatars.githubusercontent.com/u/173599381?v=4", profileUrl: "https://github.com/himanshu6093" },
];

export default function Team() {
  return (
    <section id="team" className="relative w-full pt-40 pb-20 px-4 md:px-8 bg-background flex flex-col items-center overflow-hidden">
      {/* Background ambient glow matching neon green */}
      <div className="absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl w-full flex flex-col items-center text-center z-10 space-y-8">
        <span className="glass-pill text-primary font-label uppercase tracking-[0.3em] text-xs font-bold px-4 py-1.5 rounded-full inline-block">
          The Minds Behind Focus Forge
        </span>

        <h2 className="text-4xl md:text-6xl font-headline italic forge-gradient-text tracking-tighter">
          Meet Our Team
        </h2>

        <p className="font-body text-white/50 text-lg md:text-xl max-w-2xl leading-relaxed">
          We are a group of developers committed to revolutionizing how you learn.
        </p>

        <div className="flex justify-center items-center py-6">
          <AvatarCircles avatarUrls={smallAvatars} numPeople={0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 w-full">
          {teamMembers.map((member, index) => (
            <NeonGradientCard key={index} className="max-w-xs mx-auto w-full" borderRadius={20} borderSize={2}>
              <div className="flex flex-col items-center text-center space-y-4 p-4 liquid-glass rounded-2xl h-full">
                <img src={member.imageUrl} alt={member.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-primary/50 object-cover shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
                <div>
                  <h3 className="text-lg md:text-xl font-headline text-white tracking-tight leading-tight">{member.name}</h3>
                  <p className="text-primary font-label text-[10px] md:text-xs uppercase tracking-wider mt-2">{member.role}</p>
                </div>
                <p className="font-body text-white/50 text-xs md:text-sm leading-relaxed mb-4">
                  {member.description}
                </p>
                <div className="mt-auto w-full">
                  <a href={smallAvatars[index].profileUrl} target="_blank" rel="noopener noreferrer" className="forge-btn-primary w-full block text-center py-2 text-sm">
                    Connect
                  </a>
                </div>
              </div>
            </NeonGradientCard>
          ))}
        </div>
      </div>
    </section>
  );
}
