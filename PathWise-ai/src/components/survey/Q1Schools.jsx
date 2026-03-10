import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

const POPULAR_SCHOOLS = [
  'MIT', 'Stanford', 'Harvard', 'Yale', 'Princeton', 'Columbia',
  'Cornell', 'UC Berkeley', 'UCLA', 'NYU', 'Georgia Tech', 'Carnegie Mellon',
  'University of Michigan', 'Northeastern', 'Vanderbilt', 'Tufts',
]

export default function Q1Schools() {
  const { schools, setSchools, goNext } = useSurveyStore()
  const [input, setInput] = useState('')

  const addSchool = (name) => {
    const trimmed = name.trim()
    if (!trimmed || schools.includes(trimmed) || schools.length >= 4) return
    setSchools([...schools, trimmed])
    setInput('')
  }

  const removeSchool = (name) => setSchools(schools.filter((s) => s !== name))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addSchool(input)
  }

  const suggestions = POPULAR_SCHOOLS.filter(
    (s) => !schools.includes(s) && s.toLowerCase().includes(input.toLowerCase()) && input.length > 0
  ).slice(0, 4)

  return (
    <QuestionCard
      question="Which universities did you get an offer from?"
      subtitle="Add up to 4 schools you're considering. Press Enter or click + to add."
      onNext={goNext}
      canProgress={schools.length >= 1}
    >
      {/* Tag list */}
      <div className="flex flex-wrap gap-3 min-h-[3rem] mb-5">
        <AnimatePresence>
          {schools.map((school) => (
            <motion.span
              key={school}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#37352f] text-white text-sm font-medium"
            >
              {school}
              <button
                onClick={() => removeSchool(school)}
                className="flex items-center justify-center w-4 h-4 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {schools.length === 0 && (
          <span className="text-sm text-[#c4c4c0] self-center">No schools added yet</span>
        )}
      </div>

      {/* Input */}
      {schools.length < 4 && (
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a school name..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[#e9e9e7] text-sm text-[#37352f] placeholder:text-[#c4c4c0] outline-none focus:ring-2 focus:ring-[#37352f]/10 focus:border-[#37352f]/40 transition-all"
            />
            <button
              onClick={() => addSchool(input)}
              disabled={!input.trim()}
              className="px-4 py-2.5 rounded-lg bg-white border border-[#e9e9e7] hover:bg-[#f1f1ef] disabled:opacity-30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 left-0 right-0 bg-white border border-[#e9e9e7] rounded-lg shadow-md z-10 overflow-hidden"
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => addSchool(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#37352f] hover:bg-[#f1f1ef] transition-colors border-b border-[#e9e9e7] last:border-0"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Popular shortcuts */}
      {schools.length === 0 && input.length === 0 && (
        <div className="mt-6">
          <p className="text-xs text-[#787774] mb-3">Popular picks</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SCHOOLS.slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => addSchool(s)}
                className="px-3 py-1.5 rounded-md border border-[#e9e9e7] text-sm text-[#37352f] bg-white hover:bg-[#f1f1ef] transition-colors duration-150"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </QuestionCard>
  )
}
