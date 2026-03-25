import { useSurveyStore } from '../../store/surveyStore'
import QuestionCard from './QuestionCard'
import { motion } from 'framer-motion'
import { Sun, Snowflake, Cloud, Wind } from 'lucide-react'

const WORK_HOURS = [
  { label: 'Less than 20 hours', value: '<20h' },
  { label: 'Less than 40 hours', value: '<40h' },
  { label: '40 – 50 hours',      value: '40-50h' },
  { label: '50 – 60 hours',      value: '50-60h' },
  { label: 'More than 60 hours', value: '>60h' },
]

const GREEK_LIFE_OPTIONS = [
  { label: 'Yes, very important',   value: 'yes' },
  { label: 'Somewhat important',    value: 'somewhat' },
  { label: 'Not important to me',   value: 'no' },
]

const WEATHER_OPTIONS = [
  { label: 'Warm & sunny',      value: 'warm',      Icon: Sun },
  { label: 'Cold & snowy',      value: 'cold',      Icon: Snowflake },
  { label: 'Mild & temperate',  value: 'mild',      Icon: Cloud },
  { label: 'No preference',     value: 'any',       Icon: Wind },
]

function SectionLabel({ number, children }) {
  return (
    <p className="text-sm font-semibold text-[#37352f] mb-2 mt-12 first:mt-0">
      <span className="text-[#787774] mr-1.5">{number}.</span>{children}
    </p>
  )
}

export default function Q8Priorities() {
  const {
    workHours, setWorkHours,
    interests, setInterests,
    greekLife, setGreekLife,
    weatherPref, setWeatherPref,
    goNext,
  } = useSurveyStore()

  return (
    <QuestionCard
      question="What are your priorities?"
      subtitle="Help us understand what matters most to you outside the classroom."
      onNext={goNext}
      canProgress={!!workHours}
    >
      {/* 1) Work hours */}
      <SectionLabel number={1}>How many hours are you willing to work per week?</SectionLabel>
      <div className="flex flex-col gap-2">
        {WORK_HOURS.map(({ label, value }) => {
          const selected = workHours === value
          return (
            <motion.button
              key={value}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWorkHours(value)}
              className={`flex items-center justify-between px-5 py-3.5 rounded-lg text-sm font-medium border transition-colors duration-150
                ${selected
                  ? 'bg-[#37352f] text-white border-[#37352f]'
                  : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f1f1ef]'
                }`}
            >
              <span>{label}</span>
              {selected && <span className="text-white/50 text-xs tracking-wide">Selected</span>}
            </motion.button>
          )
        })}
      </div>

      {/* 2) Interests */}
      <SectionLabel number={2}>What are your interests?</SectionLabel>
      <textarea
        value={interests}
        onChange={(e) => setInterests(e.target.value)}
        placeholder="e.g. entrepreneurship, music, outdoor activities, research…"
        rows={3}
        className="w-full px-4 py-3 rounded-lg border border-[#e9e9e7] bg-white text-sm text-[#37352f] placeholder-[#c4c4c0] resize-none focus:outline-none focus:border-[#37352f] transition-colors duration-150"
      />

      {/* 3) Greek life */}
      <SectionLabel number={3}>Is Greek life important to you?</SectionLabel>
      <div className="flex flex-col gap-2">
        {GREEK_LIFE_OPTIONS.map(({ label, value }) => {
          const selected = greekLife === value
          return (
            <motion.button
              key={value}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGreekLife(value)}
              className={`flex items-center justify-between px-5 py-3.5 rounded-lg text-sm font-medium border transition-colors duration-150
                ${selected
                  ? 'bg-[#37352f] text-white border-[#37352f]'
                  : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f1f1ef]'
                }`}
            >
              <span>{label}</span>
              {selected && <span className="text-white/50 text-xs tracking-wide">Selected</span>}
            </motion.button>
          )
        })}
      </div>

      {/* 4) Weather */}
      <SectionLabel number={4}>What weather do you enjoy?</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {WEATHER_OPTIONS.map(({ label, value, Icon }) => {
          const selected = weatherPref === value
          return (
            <motion.button
              key={value}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWeatherPref(value)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium border transition-colors duration-150
                ${selected
                  ? 'bg-[#37352f] text-white border-[#37352f]'
                  : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f1f1ef]'
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </motion.button>
          )
        })}
      </div>
    </QuestionCard>
  )
}
