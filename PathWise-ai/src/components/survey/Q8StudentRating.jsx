import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'

// City/state lookup for known schools
const SCHOOL_LOCATION = {
  'MIT': 'Cambridge, Massachusetts',
  'Stanford': 'Palo Alto, California',
  'Harvard': 'Cambridge, Massachusetts',
  'Princeton': 'Princeton, New Jersey',
  'Yale': 'New Haven, Connecticut',
  'Caltech': 'Pasadena, California',
  'Duke University': 'Durham, North Carolina',
  'Johns Hopkins University': 'Baltimore, Maryland',
  'Northwestern University': 'Evanston, Illinois',
  'Dartmouth College': 'Hanover, New Hampshire',
  'Brown University': 'Providence, Rhode Island',
  'Vanderbilt University': 'Nashville, Tennessee',
  'Rice University': 'Houston, Texas',
  'Washington University in St. Louis': 'St. Louis, Missouri',
  'Emory University': 'Atlanta, Georgia',
  'University of Notre Dame': 'Notre Dame, Indiana',
  'Georgetown University': 'Washington, D.C.',
  'Tufts University': 'Medford, Massachusetts',
  'Wake Forest University': 'Winston-Salem, North Carolina',
  'Boston College': 'Chestnut Hill, Massachusetts',
  'UC Berkeley': 'Berkeley, California',
  'UCLA': 'Los Angeles, California',
  'Carnegie Mellon': 'Pittsburgh, Pennsylvania',
  'Georgia Tech': 'Atlanta, Georgia',
  'University of Michigan': 'Ann Arbor, Michigan',
  'Northeastern': 'Boston, Massachusetts',
  'NYU': 'New York, New York',
  'University of Virginia': 'Charlottesville, Virginia',
  'UNC Chapel Hill': 'Chapel Hill, North Carolina',
  'UT Austin': 'Austin, Texas',
  'University of Florida': 'Gainesville, Florida',
  'Boston University': 'Boston, Massachusetts',
}

export default function Q8StudentRating() {
  const { schools, setStudentRatings, goNext } = useSurveyStore()
  const [ratings, setRatings] = useState({})

  const handleRate = (school, value) => {
    setRatings((prev) => ({ ...prev, [school]: value }))
  }

  const handleFinish = () => {
    setStudentRatings(ratings)
    goNext()
  }

  const allRated = schools.every((s) => ratings[s] !== undefined)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' && allRated) handleFinish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allRated, ratings])

  return (
    <QuestionCard
      eyebrow="Step 09 / 10"
      question={
        <>
          How would you personally{' '}
          <span style={{ color: '#c4b5fd', fontStyle: 'italic' }}>rate</span>
          {' '}each school?
        </>
      }
      subtitle="10 = dream school. Based on your campus visits, research, and gut feeling."
      onNext={handleFinish}
      canProgress={allRated}
      nextLabel="Next"
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {schools.map((school, i) => {
          const rating = ratings[school]
          const location = SCHOOL_LOCATION[school] || ''
          const last = i === schools.length - 1
          return (
            <SchoolRatingRow
              key={school}
              school={school}
              location={location}
              rating={rating}
              last={last}
              onRate={(v) => handleRate(school, v)}
            />
          )
        })}
      </div>

      {/* Enter hint */}
      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          opacity: allRated ? 0.55 : 0.2,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        <kbd
          style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            backgroundColor: '#252626',
            border: '1px solid rgba(72,72,72,0.3)',
            borderRadius: '0.25rem',
            color: '#acabaa',
            letterSpacing: '0.05em',
          }}
        >
          ENTER
        </kbd>
        <span style={{ fontSize: '0.75rem', color: '#acabaa' }}>
          to submit this section
        </span>
      </div>
    </QuestionCard>
  )
}

function SchoolRatingRow({ school, location, rating, last, onRate }) {
  return (
    <div
      style={{
        padding: '2rem 0',
        borderBottom: last ? 'none' : '1px solid rgba(72,72,72,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        {/* School info */}
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#e7e5e4',
              marginBottom: '0.25rem',
            }}
          >
            {school}
          </h3>
          {location && (
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#767575',
              }}
            >
              {location}
            </p>
          )}
        </div>

        {/* Rating buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const selected = rating === n
            return (
              <RatingButton
                key={n}
                n={n}
                selected={selected}
                onClick={() => onRate(n)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RatingButton({ n, selected, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40,
        height: 40,
        borderRadius: '0.375rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: selected ? 700 : 500,
        cursor: 'pointer',
        border: selected ? 'none' : '1px solid rgba(72,72,72,0.2)',
        background: selected
          ? 'linear-gradient(135deg, #ccbeff 0%, #4a3d7c 100%)'
          : hovered ? '#252626' : 'transparent',
        color: selected ? '#433675' : hovered ? '#e7e5e4' : '#767575',
        boxShadow: selected ? '0 0 12px rgba(204,190,255,0.3)' : 'none',
        transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {n}
    </motion.button>
  )
}
