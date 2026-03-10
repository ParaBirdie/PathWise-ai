import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

const ALL_UNIVERSITIES = [
  'MIT', 'Harvard', 'Yale', 'Princeton', 'Stanford', 'Columbia',
  'Caltech', 'Duke University', 'Johns Hopkins University', 'Northwestern University',
  'Dartmouth College', 'Brown University', 'Vanderbilt University', 'Rice University',
  'Washington University in St. Louis', 'Emory University', 'University of Notre Dame',
  'Georgetown University', 'Tufts University', 'Wake Forest University', 'Boston College',
  'Carnegie Mellon', 'Georgia Tech', 'University of Michigan', 'UC Berkeley', 'UCLA',
  'NYU', 'Northeastern', 'Cornell',
  'University of Virginia', 'University of Wisconsin–Madison',
  'University of Illinois Urbana-Champaign', 'Ohio State University', 'Penn State University',
  'Purdue University', 'University of Washington', 'Arizona State University',
  'Michigan State University', 'University of Florida', 'Rutgers University',
  'Virginia Tech', 'University of Maryland', 'University of Colorado Boulder',
  'Indiana University Bloomington', 'University of Minnesota', 'Clemson University',
  'University of Connecticut', 'Florida State University', 'University of Alabama',
  'Auburn University', 'Iowa State University', 'University of Iowa',
  'University of Kansas', 'Kansas State University', 'University of Missouri',
  'University of Tennessee', 'University of Kentucky', 'University of Arkansas',
  'University of Oklahoma', 'Louisiana State University', 'University of Mississippi',
  'Mississippi State University', 'Oklahoma State University', 'University of South Carolina',
  'University of Oregon', 'University of Arizona', 'University of Nebraska–Lincoln',
  'University of Nevada Las Vegas', 'University of New Mexico', 'University of Wyoming',
  'University of Utah', 'Utah State University', 'West Virginia University',
  'Miami University Ohio', 'Colorado State University', 'San Diego State University',
  'San Jose State University', 'Cal Poly San Luis Obispo',
  'SUNY Binghamton', 'SUNY Buffalo', 'SUNY Stony Brook',
  'UMass Amherst', 'UNC Chapel Hill', 'UT Austin',
  'UC Davis', 'UC Irvine', 'UC San Diego', 'UC Santa Barbara', 'UC Santa Cruz',
  'Boston University', 'American University', 'DePaul University', 'Drexel University',
  'Fordham University', 'George Washington University', 'Gonzaga University',
  'Lehigh University', 'Loyola University Chicago', 'Marquette University',
  'Rensselaer Polytechnic Institute', 'Seton Hall University',
  'Stevens Institute of Technology', 'Syracuse University', 'Tulane University',
  'Villanova University', 'University of Denver', 'University of Miami',
  'Case Western Reserve University', 'Worcester Polytechnic Institute',
  'Marist College', 'Babson College', 'Bentley University', 'Bryant University',
  'College of the Holy Cross', 'CUNY Baruch College', 'Fairfield University',
  'Hofstra University', 'Pace University', 'Providence College',
  'Quinnipiac University', 'Roger Williams University', 'Sacred Heart University',
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

  const suggestions = input.length > 0
    ? ALL_UNIVERSITIES.filter(
        (s) => !schools.includes(s) && s.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 6)
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
