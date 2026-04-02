import { useState } from 'react'
import { Sun, Snowflake, Cloud, Wind, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '../../store/surveyStore'
import { logQuestionData } from '../../lib/questionDataService'
import QuestionCard from './QuestionCard'

const WORK_HOURS = [
  { label: 'Less than 20 hours', value: '<20h' },
  { label: 'Less than 40 hours', value: '<40h' },
  { label: '40 – 50 hours',      value: '40-50h' },
  { label: '50 – 60 hours',      value: '50-60h' },
  { label: 'More than 60 hours', value: '>60h' },
]

const GREEK_LIFE_OPTIONS = [
  { label: 'Very Important',     value: 'yes' },
  { label: 'Somewhat Important', value: 'somewhat' },
  { label: 'Not Important',      value: 'no' },
]

const WEATHER_OPTIONS = [
  { label: 'Always Sunny',  value: 'warm', Icon: Sun },
  { label: 'Crisp & Snow',  value: 'cold', Icon: Snowflake },
  { label: 'Mild Seasons',  value: 'mild', Icon: Cloud },
  { label: 'Rainy Days',    value: 'any',  Icon: Wind },
]

export default function Q9Priorities() {
  const {
    workHours, setWorkHours,
    interests, setInterests,
    greekLife, setGreekLife,
    weatherPref, setWeatherPref,
    goNext,
  } = useSurveyStore()

  const handleNext = () => {
    const {
      schools, major, residency, isInState, incomeBracket,
      goals, alumniData, financialAidOffers, studentRatings,
      workHours: wh, interests: int, greekLife: gl, weatherPref: wp,
      comparisonResult,
    } = useSurveyStore.getState()
    logQuestionData(
      { schools, major, residency, isInState, incomeBracket, goals, alumniData, financialAidOffers, studentRatings, workHours: wh, interests: int, greekLife: gl, weatherPref: wp },
      comparisonResult
    ).then(({ error }) => {
      if (error) console.error('[PathWise] question_data save failed:', error.message)
    })
    goNext()
  }

  return (
    <QuestionCard
      question={
        <>
          WHAT ARE YOUR{' '}
          <span style={{ color: '#c4b5fd' }}>PRIORITIES?</span>
        </>
      }
      headingStyle={{
        fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
        letterSpacing: '-0.04em',
        fontWeight: 900,
        textTransform: 'uppercase',
        lineHeight: 0.92,
        marginBottom: '1.5rem',
      }}
      subtitle="Help us understand what matters most to you outside the classroom."
      onNext={handleNext}
      canProgress={!!workHours}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>

        {/* Section 1: Work Hours — full width */}
        <SectionCard label="Availability" icon={<Clock size={18} style={{ color: '#c4b5fd' }} />}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1.25rem', color: '#e7e5e4' }}>
            How many hours are you willing to work per week?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxWidth: '28rem' }}>
            {WORK_HOURS.map(({ label, value }) => (
              <RadioRow
                key={value}
                label={label}
                selected={workHours === value}
                onClick={() => setWorkHours(value)}
              />
            ))}
          </div>
        </SectionCard>

        {/* Sections 2 + 3: two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Section 2: Interests */}
          <SectionCard label="Interests">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1.25rem', color: '#e7e5e4' }}>
              What are your interests?
            </h2>
            <textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Start typing your passions..."
              rows={5}
              maxLength={2000}
              style={{
                width: '100%',
                backgroundColor: '#000000',
                border: '1px solid rgba(72,72,72,0.15)',
                borderRadius: '0.375rem',
                padding: '1rem 1.25rem',
                color: '#e7e5e4',
                fontSize: '0.9375rem',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 1px rgba(196,181,253,0.3)' }}
              onBlur={(e) => { e.target.style.boxShadow = 'none' }}
            />
            {interests.length > 1800 && (
              <p style={{ fontSize: '0.75rem', color: '#ec7c8a', marginTop: '0.375rem' }}>
                {2000 - interests.length} characters remaining
              </p>
            )}
          </SectionCard>

          {/* Section 3: Greek Life */}
          <SectionCard label="Social">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1.25rem', color: '#e7e5e4' }}>
              Is Greek life important to you?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {GREEK_LIFE_OPTIONS.map(({ label, value }) => (
                <RadioRow
                  key={value}
                  label={label}
                  selected={greekLife === value}
                  onClick={() => setGreekLife(value)}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Section 4: Weather — full width */}
        <SectionCard label="Atmosphere">
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1.5rem', color: '#e7e5e4' }}>
            What weather do you enjoy?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {WEATHER_OPTIONS.map(({ label, value, Icon }) => (
              <WeatherCard
                key={value}
                label={label}
                Icon={Icon}
                selected={weatherPref === value}
                onClick={() => setWeatherPref(value)}
              />
            ))}
          </div>
        </SectionCard>

      </div>
    </QuestionCard>
  )
}

function SectionCard({ label, icon, children }) {
  return (
    <div
      style={{
        backgroundColor: '#131313',
        borderRadius: '0.75rem',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {icon}
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#c4b5fd',
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

function RadioRow({ label, selected, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderRadius: '0.375rem',
        background: selected
          ? 'linear-gradient(135deg, #ccbeff 0%, #4a3d7c 100%)'
          : hovered ? '#252626' : '#1f2020',
        border: selected ? 'none' : '1px solid rgba(72,72,72,0.15)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      <span
        style={{
          fontSize: '0.9375rem',
          fontWeight: selected ? 700 : 500,
          color: selected ? '#433675' : '#e7e5e4',
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: selected ? '2px solid #433675' : '2px solid rgba(72,72,72,0.4)',
          backgroundColor: selected ? '#433675' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {selected && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c4b5fd' }} />
        )}
      </div>
    </motion.button>
  )
}

function WeatherCard({ label, Icon, selected, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '1.75rem 1rem',
        borderRadius: '0.5rem',
        background: selected
          ? 'linear-gradient(135deg, #ccbeff 0%, #4a3d7c 100%)'
          : hovered ? '#252626' : '#1f2020',
        border: selected ? 'none' : '1px solid rgba(72,72,72,0.15)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      <Icon
        size={28}
        style={{ color: selected ? '#433675' : hovered ? '#c4b5fd' : '#acabaa', transition: 'color 0.15s ease' }}
      />
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: selected ? '#433675' : '#acabaa',
        }}
      >
        {label}
      </span>
    </motion.button>
  )
}
