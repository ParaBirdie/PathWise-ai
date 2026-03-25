import { useSurveyStore } from './store/surveyStore'
import SurveyShell from './components/survey/SurveyShell'
import Landing from './components/survey/Landing'
import Q1Schools from './components/survey/Q1Schools'
import Q2Major from './components/survey/Q2Major'
import Q2bCareer from './components/survey/Q2bCareer'
import Q3Residency from './components/survey/Q3Residency'
import Q4Income from './components/survey/Q4Income'
import Q5Goal from './components/survey/Q5Goal'
import Q6Alumni from './components/survey/Q6Alumni'
import Q7FinancialAid from './components/survey/Q7FinancialAid'
import ResultsPage from './components/results/ResultsPage'

const STEPS = [
  { key: 'landing',  Component: Landing },
  { key: 'q1',       Component: Q1Schools },
  { key: 'q2',       Component: Q2Major },
  { key: 'q2b',      Component: Q2bCareer },
  { key: 'q3',       Component: Q3Residency },
  { key: 'q4',       Component: Q4Income },
  { key: 'q5',       Component: Q5Goal },
  { key: 'q6',       Component: Q6Alumni },
  { key: 'q7',       Component: Q7FinancialAid },
  { key: 'results',  Component: ResultsPage },
]

export default function App() {
  const currentStep = useSurveyStore((s) => s.currentStep)

  if (currentStep === STEPS.length - 1) {
    return <ResultsPage />
  }

  const { key, Component } = STEPS[Math.min(currentStep, STEPS.length - 1)]

  return (
    <SurveyShell stepKey={key}>
      <Component />
    </SurveyShell>
  )
}
