import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Youtube, Compass, Play, Trash2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecentPlansPanel({ plans, onOpen, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'guided' | 'playlist'

  const tabFilteredPlans = plans.filter((plan) => {
    if (activeTab === 'guided') return plan.sourceType !== 'playlist';
    if (activeTab === 'playlist') return plan.sourceType === 'playlist';
    return true;
  });

  const filteredPlans = searchQuery === ''
    ? tabFilteredPlans.slice(0, 3)
    : tabFilteredPlans.filter((plan) =>
        plan.course_title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -2 }}
      className="h-[25.5rem] flex flex-col rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-300 font-nunito antialiased text-white" 
      id="library"
    >
      {/* Header Area */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/[0.04] mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-white tracking-tight">Recent Learning</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-300">
            {plans.length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between min-h-0">
        {/* Stateful Navigation Tabs & Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 shrink-0">
          {/* Interactive Tabs */}
          <div className="flex items-center gap-1.5 bg-black/40 rounded-full p-1 border border-white/[0.04]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition uppercase tracking-wider ${
                activeTab === 'all'
                  ? 'bg-white text-black font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All Tracks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guided')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition uppercase tracking-wider ${
                activeTab === 'guided'
                  ? 'bg-white text-black font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Guided
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('playlist')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition uppercase tracking-wider ${
                activeTab === 'playlist'
                  ? 'bg-white text-black font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Playlists
            </button>
          </div>

          {/* Local Search Input Box */}
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-4.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type last ID numbers or keywords..."
              className="w-full h-8.5 pl-10 pr-4 rounded-full border border-white/[0.05] bg-[#141414] text-xs text-white placeholder-zinc-500 outline-none transition focus:border-white/10 focus:bg-[#161616]"
            />
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.01] px-6 py-12 text-center">
            <p className="text-sm font-semibold text-zinc-400">No study plans yet</p>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-zinc-600">
              Use the Create button to start a guided plan or convert a playlist.
            </p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center text-xs text-zinc-400 py-12">
            No matches found for "{searchQuery}" under this track filter.
          </div>
        ) : (
          /* Workstation Cards List container (Separated distinct cards rows) */
          <div className="flex-1 overflow-y-auto custom-scroll -mx-5 px-5 md:-mx-6 md:px-6 min-h-0 pr-1">
            {/* Table Header simulation row */}
            <div className="flex items-center text-[11px] uppercase tracking-wider text-zinc-400 font-bold border-b border-white/[0.04] pb-2.5 px-3 mb-3">
              <div className="w-16 pl-1 shrink-0">ID</div>
              <div className="flex-1 min-w-[12rem] md:min-w-[14rem]">Study Track Plan</div>
              <div className="w-28 hidden sm:block shrink-0">Category</div>
              <div className="w-20 sm:w-24 shrink-0">Progress</div>
              <div className="w-24 sm:w-28 text-right shrink-0 pr-2">Action</div>
            </div>

            {/* List of distinct card rows */}
            <div className="space-y-3 pb-2">
              {filteredPlans.map((plan, index) => {
                const isPlaylist = plan.sourceType === 'playlist';
                const Icon = isPlaylist ? Youtube : Compass;
                const progress = plan.progress || 0;
                
                // First plan in filtered array is highlighted as active ( Krakow stopped equivalent )
                const isActiveRow = index === 0 && searchQuery === '';
                const shortId = plan._id ? `#${plan._id.substring(plan._id.length - 4)}` : '#XXXX';

                return (
                  <div 
                    key={plan._id} 
                    onClick={() => onOpen(plan)}
                    className={`group flex items-center rounded-2xl border p-3.5 cursor-pointer transition-all duration-300 ${
                      isActiveRow 
                        ? 'bg-white/[0.03] border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.2)]' 
                        : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.02] hover:border-white/[0.05]'
                    }`}
                  >
                    {/* ID */}
                    <div className={`w-16 pl-1 text-xs shrink-0 ${isActiveRow ? 'text-white font-bold' : 'text-zinc-300 font-medium'}`}>
                      {shortId}
                    </div>
                    
                    {/* Plan Name with Icon */}
                    <div className="flex-1 min-w-[12rem] md:min-w-[14rem] pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isActiveRow ? 'bg-white/10 text-white' : 'bg-white/[0.04] text-zinc-400'
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-white truncate max-w-[10rem] sm:max-w-xs md:max-w-[20rem]" title={plan.course_title}>
                          {plan.course_title}
                        </span>
                      </div>
                    </div>
                    
                    {/* Category */}
                    <div className="w-28 text-zinc-300 font-semibold text-xs hidden sm:block shrink-0">
                      {isPlaylist ? 'Video Learning' : 'Guided Plan'}
                    </div>
                    
                    {/* Progress percentage */}
                    <div className="w-20 sm:w-24 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{progress}%</span>
                        <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden hidden md:block">
                          <div 
                            className="h-full rounded-full bg-white" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="w-24 sm:w-28 text-right shrink-0 pr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onOpen(plan)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold transition border border-white/10 hover:scale-[1.03] ${
                          isActiveRow 
                            ? 'bg-white text-black border-transparent hover:bg-zinc-200' 
                            : 'bg-black text-zinc-300 hover:bg-white hover:text-black hover:border-transparent'
                        }`}
                      >
                        <Play className="h-2 w-2 fill-current" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Library Link Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-zinc-400">Showing {filteredPlans.length} active tracks</span>
          <Link 
            to="/dashboard/guided" 
            className="text-xs font-extrabold text-white hover:underline flex items-center gap-1"
          >
            Open Full System Library <span>-&gt;</span>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
