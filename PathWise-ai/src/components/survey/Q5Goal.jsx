import { useSurveyStore } from '../../store/surveyStore'
import { PRIMARY_GOALS } from '../../lib/economicData'
import QuestionCard from './QuestionCard'
import { TrendingUp, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const ICONS = {
  roi: TrendingUp,
  prestige: Star,
}

export default function Q5Goal() {
  const { goal, setGoal, goNext } = useSurveyStore()

  return (
    <QuestionCard
      question="What's your primary goal?"
      subtitle="This shapes how we rank and interpret your results."
      onNext={goNext}
      canProgress={!!goal}
    >
      <div className="flex flex-col gap-4">
        {PRIMARY_GOALS.map(({ value, label, desc }) => {
          const Icon = ICONS[value]
          const selected = goal === value
          return (
            <motion.button
              key={value}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGoal(value)}
              className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-colors duration-150
                ${selected
                  ? 'bg-[#37352f] text-white border-[#37352f]'
                  : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f7f7f5]'
                }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                selected ? 'bg-white/15' : 'bg-[#f1f1ef]'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-base">{label}</p>
                <p className={`text-sm mt-1 ${selected ? 'text-white/60' : 'text-[#787774]'}`}>{desc}</p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </QuestionCard>
  )
}
