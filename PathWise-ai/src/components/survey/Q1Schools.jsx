import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

// Matches school_name values in supabase/schema.sql university_financials seed
const ALL_UNIVERSITIES = [
  // Elite Private
  'MIT', 'Stanford', 'Harvard', 'Princeton', 'Yale',
  'Caltech', 'Duke University', 'Johns Hopkins University', 'Northwestern University',
  'Dartmouth College', 'Brown University', 'Vanderbilt University', 'Rice University',
  'Washington University in St. Louis', 'Emory University', 'University of Notre Dame',
  'Georgetown University', 'Tufts University', 'Wake Forest University', 'Boston College',
  // Research Public
  'UC Berkeley', 'UCLA', 'Carnegie Mellon', 'Georgia Tech', 'University of Michigan',
  'Northeastern', 'NYU',
  'University of Virginia', 'UNC Chapel Hill', 'University of Wisconsin–Madison',
  'University of Illinois Urbana-Champaign', 'Ohio State University', 'Penn State University',
  'Purdue University', 'University of Washington', 'Arizona State University',
  'Michigan State University', 'UC San Diego', 'UC Davis', 'UC Santa Barbara',
  'UC Irvine', 'UC Santa Cruz', 'UT Austin', 'University of Florida', 'UMass Amherst',
  'Rutgers University', 'Virginia Tech', 'University of Maryland',
  'University of Colorado Boulder', 'Indiana University Bloomington', 'University of Minnesota',
  'Clemson University', 'University of Connecticut',
  // Flagship State
  'Florida State University', 'University of Alabama', 'Auburn University',
  'Iowa State University', 'University of Iowa', 'University of Kansas',
  'Kansas State University', 'University of Missouri', 'University of Tennessee',
  'University of Kentucky', 'University of Arkansas', 'University of Oklahoma',
  'Oklahoma State University', 'Louisiana State University', 'University of South Carolina',
  'University of Vermont', 'University of Oregon', 'University of Arizona',
  'Miami University Ohio', 'Colorado State University', 'University of Utah',
  'Utah State University', 'University of Nevada Las Vegas', 'University of New Mexico',
  'West Virginia University', 'University of Mississippi', 'Mississippi State University',
  'University of Nebraska–Lincoln', 'University of Wyoming',
  'SUNY Buffalo', 'SUNY Stony Brook', 'SUNY Binghamton',
  'Cal Poly San Luis Obispo', 'San Diego State University', 'San Jose State University',
  // Research Private
  'Boston University', 'George Washington University', 'American University',
  'Fordham University', 'Villanova University', 'Case Western Reserve University',
  'Rensselaer Polytechnic Institute', 'Worcester Polytechnic Institute',
  'Stevens Institute of Technology', 'Lehigh University', 'Drexel University',
  'Syracuse University', 'Tulane University', 'University of Miami',
  'University of Denver', 'Gonzaga University', 'Marquette University',
  'Seton Hall University', 'DePaul University', 'Loyola University Chicago',
  // Local / Regional
  'Babson College', 'Bentley University', 'Providence College',
  'College of the Holy Cross', 'Fairfield University', 'Quinnipiac University',
  'Sacred Heart University', 'Marist College', 'Bryant University',
  'Roger Williams University', 'Hofstra University', 'Pace University',
  'CUNY Baruch College',
]

export default function Q1Schools() {
  const { schools, setSchools, goNext } = useSurveyStore()
  const [input, setInput] = useState('')

  const addSchool = (name) => {
    const trimmed = name.trim()
    if (!trimmed || schools.includes(trimmed) || schools.length >= 4) return
    // Only accept names from the known-good allowlist to prevent arbitrary input
    if (!ALL_UNIVERSITIES.includes(trimmed)) return
    setSchools([...schools, trimmed])
    setInput('')
  }

  const removeSchool = (name) => setSchools(schools.filter((s) => s !== name))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addSchool(input)
  }

  const suggestions = input.length > 0
    ? ALL_UNIVERSITIES.filter(
        (s) => !schools.includes(s) && s.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 8)
    : []

  return (
    <QuestionCard
      question="Which universities did you get an offer from?"
      subtitle="Add up to 4 schools you're considering. Press Enter or click + to add."
      onNext={goNext}
      canProgress={schools.length >= 1}
    >
      {/* Tag list */}
      <div className="flex flex-wrap gap-3 min-h-[2.5rem] mb-5">
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
              maxLength={120}
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
                className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#e9e9e7] rounded-lg shadow-md z-10 overflow-hidden"
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
    </QuestionCard>
  )
}
