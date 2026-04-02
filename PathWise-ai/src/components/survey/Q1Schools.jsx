import { useState } from 'react'
import { Search, X, ShieldCheck, BadgeCheck } from 'lucide-react'
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
    if (!ALL_UNIVERSITIES.includes(trimmed)) return
    setSchools([...schools, trimmed])
    setInput('')
  }

  const removeSchool = (name) => setSchools(schools.filter((s) => s !== name))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addSchool(input)
  }

  const available = ALL_UNIVERSITIES.filter((s) => !schools.includes(s))
  const suggestions = schools.length < 4
    ? (input.length > 0
        ? available.filter((s) => s.toLowerCase().includes(input.toLowerCase())).slice(0, 6)
        : available.slice(0, 3))
    : []

  return (
    <QuestionCard
      question="Which universities did you get an offer from?"
      subtitle="Add up to 4 schools you're considering. This helps us tailor your financial roadmap."
      onNext={goNext}
      canProgress={schools.length >= 1}
    >
      <div className="space-y-3">
        {/* Search box + tags container */}
        <div
          style={{
            backgroundColor: '#131313',
            border: '1px solid rgba(72,72,72,0.3)',
            borderRadius: '0.75rem',
            padding: '0.5rem',
          }}
        >
          {/* Search input row */}
          <div className="flex items-center" style={{ padding: '0.25rem 0.75rem' }}>
            <Search size={18} style={{ color: '#acabaa', marginRight: '0.75rem', flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a university..."
              maxLength={120}
              className="flex-1 bg-transparent outline-none"
              style={{
                fontSize: '1.0625rem',
                color: '#e7e5e4',
                padding: '0.75rem 0',
              }}
            />
          </div>

          {/* Selected tags */}
          <AnimatePresence>
            {schools.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
                style={{ padding: '0.25rem 0.75rem 0.5rem' }}
              >
                {schools.map((school) => (
                  <motion.span
                    key={school}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{
                      background: 'rgba(74,61,124,0.3)',
                      border: '1px solid rgba(196,181,253,0.2)',
                      color: '#e7deff',
                      padding: '0.375rem 1rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {school}
                    <button
                      onClick={() => removeSchool(school)}
                      className="flex items-center justify-center transition-colors"
                      style={{ color: '#b6a7ee' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#b6a7ee' }}
                    >
                      <X size={13} />
                    </button>
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dropdown suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                backgroundColor: 'rgba(25,26,26,0.9)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(72,72,72,0.15)',
                borderRadius: '0.75rem',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                overflow: 'hidden',
              }}
            >
              <ul style={{ padding: '0.5rem 0' }}>
                {suggestions.map((s) => (
                  <li
                    key={s}
                    onMouseDown={() => addSchool(s)}
                    className="flex items-center justify-between cursor-pointer group"
                    style={{ padding: '1rem 1.5rem' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#252626' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <span className="font-medium" style={{ color: '#e7e5e4' }}>{s}</span>
                    <span
                      className="uppercase font-medium transition-colors"
                      style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: '#767575' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#c4b5fd' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#767575' }}
                    >
                      Select
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: '4rem', opacity: 0.45 }}>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#131313',
            border: '1px solid rgba(72,72,72,0.08)',
            borderRadius: '0.75rem',
          }}
        >
          <BadgeCheck size={20} style={{ color: '#c4b5fd', marginBottom: '1rem' }} />
          <h3
            className="font-bold uppercase"
            style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: '#e7e5e4', marginBottom: '0.5rem' }}
          >
            Verified Institutions
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#acabaa', lineHeight: '1.6' }}>
            We support over 2,500 globally accredited universities across 45 countries.
          </p>
        </div>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#131313',
            border: '1px solid rgba(72,72,72,0.08)',
            borderRadius: '0.75rem',
          }}
        >
          <ShieldCheck size={20} style={{ color: '#c4b5fd', marginBottom: '1rem' }} />
          <h3
            className="font-bold uppercase"
            style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: '#e7e5e4', marginBottom: '0.5rem' }}
          >
            Secure Selection
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#acabaa', lineHeight: '1.6' }}>
            Your choices are private and used only for personalized financial modeling.
          </p>
        </div>
      </div>
    </QuestionCard>
  )
}
