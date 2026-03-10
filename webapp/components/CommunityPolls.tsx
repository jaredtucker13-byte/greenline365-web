'use client';

import { useState, useEffect, useCallback } from 'react';

interface PollOption {
  id: string;
  poll_id: string;
  business_id: string;
  business_name: string;
  business_image: string | null;
  vote_count: number;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  category: string;
  destination_slug: string | null;
  options: PollOption[];
  total_votes: number;
}

interface CommunityPollsProps {
  className?: string;
  maxPolls?: number;
}

export default function CommunityPolls({ className = '', maxPolls = 10 }: CommunityPollsProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [votingOption, setVotingOption] = useState<string | null>(null);

  useEffect(() => {
    // Load previously voted polls from localStorage
    try {
      const stored = localStorage.getItem('gl365_poll_votes');
      if (stored) setVotedPolls(new Set(JSON.parse(stored)));
    } catch {}

    fetch(`/api/directory/community-polls?limit=${maxPolls}`)
      .then(r => r.json())
      .then(data => {
        setPolls(data.polls || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [maxPolls]);

  const handleVote = useCallback(async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId) || votingOption) return;

    setVotingOption(optionId);

    try {
      const res = await fetch('/api/directory/community-polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId }),
      });

      if (res.ok || res.status === 409) {
        // Update local state
        const newVoted = new Set(votedPolls);
        newVoted.add(pollId);
        setVotedPolls(newVoted);
        localStorage.setItem('gl365_poll_votes', JSON.stringify([...newVoted]));

        // Optimistically increment vote count
        if (res.ok) {
          setPolls(prev => prev.map(poll => {
            if (poll.id !== pollId) return poll;
            return {
              ...poll,
              total_votes: poll.total_votes + 1,
              options: poll.options.map(opt =>
                opt.id === optionId
                  ? { ...opt, vote_count: opt.vote_count + 1 }
                  : opt
              ),
            };
          }));
        }
      }
    } catch {}

    setVotingOption(null);
  }, [votedPolls, votingOption]);

  const goTo = (direction: 'prev' | 'next') => {
    setCurrentIndex(prev => {
      if (direction === 'prev') return prev > 0 ? prev - 1 : polls.length - 1;
      return prev < polls.length - 1 ? prev + 1 : 0;
    });
  };

  if (loading) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <div className="rounded-2xl border border-white/10 bg-midnight-900/60 p-6 animate-pulse">
          <div className="h-5 bg-white/5 rounded w-3/4 mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-white/5 rounded" />
            <div className="h-10 bg-white/5 rounded" />
            <div className="h-10 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (polls.length === 0) return null;

  const poll = polls[currentIndex];
  const hasVoted = votedPolls.has(poll.id);
  const maxVotes = Math.max(...poll.options.map(o => o.vote_count), 1);

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="rounded-2xl border border-white/10 bg-midnight-900/60 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-gold/70">Community Poll</span>
          </div>
          <h3 className="text-lg font-heading font-bold text-white leading-snug">{poll.title}</h3>
          {poll.description && (
            <p className="text-xs text-white/40 font-body mt-1">{poll.description}</p>
          )}
          <p className="text-[11px] text-white/30 font-body mt-2">
            {poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}
            {poll.destination_slug && (
              <span> &middot; {poll.destination_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            )}
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-4 space-y-2">
          {poll.options.map((option) => {
            const pct = poll.total_votes > 0 ? Math.round((option.vote_count / poll.total_votes) * 100) : 0;
            const isVoting = votingOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(poll.id, option.id)}
                disabled={hasVoted || !!votingOption}
                className={`
                  w-full relative rounded-lg border text-left transition-all duration-300 overflow-hidden
                  ${hasVoted
                    ? 'border-white/5 cursor-default'
                    : 'border-white/10 hover:border-gold/30 cursor-pointer active:scale-[0.99]'
                  }
                `}
              >
                {/* Progress bar background — always visible when voted */}
                <div
                  className="absolute inset-0 rounded-lg transition-all duration-700 ease-out"
                  style={{
                    width: hasVoted ? `${pct}%` : '0%',
                    background: option.vote_count === maxVotes && hasVoted
                      ? 'linear-gradient(90deg, rgba(201,169,78,0.25), rgba(201,169,78,0.1))'
                      : 'linear-gradient(90deg, rgba(201,169,78,0.12), rgba(201,169,78,0.04))',
                  }}
                />

                <div className="relative flex items-center gap-3 px-4 py-2.5">
                  {/* Business avatar */}
                  {option.business_image ? (
                    <img
                      src={option.business_image}
                      alt={option.business_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <span className="text-xs font-heading font-bold text-gold/60">{option.business_name[0]}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-body text-white/90 block truncate">{option.business_name}</span>
                    {/* Vote progress bar under name */}
                    {hasVoted && (
                      <div className="mt-1 w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: option.vote_count === maxVotes
                              ? 'linear-gradient(90deg, #C9A84C, #E8C97A)'
                              : 'rgba(201,168,76,0.5)',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Vote count / button */}
                  {hasVoted ? (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-xs font-heading font-semibold text-gold/70">{pct}%</span>
                      <span className="text-[9px] text-white/25 font-body">{option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-heading font-semibold uppercase tracking-wider flex-shrink-0 ${isVoting ? 'text-gold' : 'text-white/30 group-hover:text-gold/60'}`}>
                      {isVoting ? '...' : 'Vote'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation footer */}
        {polls.length > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
            <button
              onClick={() => goTo('prev')}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/30 hover:bg-gold/5 transition-all duration-300"
              aria-label="Previous poll"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {polls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-gold w-4' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to poll ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo('next')}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-gold/30 hover:bg-gold/5 transition-all duration-300"
              aria-label="Next poll"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* See all polls link */}
        <div className="px-6 py-3 border-t border-white/5 text-center">
          <a
            href="/community/polls"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-medium uppercase tracking-wider transition-colors duration-300"
            style={{ color: 'rgba(201,168,76,0.6)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A84C'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(201,168,76,0.6)'; }}
          >
            See all polls
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
