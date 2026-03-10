import { create } from 'zustand'

export const useSurveyStore = create((set, get) => ({
  // Survey answers
  schools: [],           // Q1: string[]
  major: '',             // Q2: string
  residency: '',         // Q3: string (state/country)
  isInState: false,      // derived from Q3
  incomeBracket: null,   // Q4: { label, value }
  goal: '',              // Q5: 'roi' | 'prestige'
  alumniData: {},        // Q6: { [school]: number }

  // Navigation
  currentStep: 0,        // 0 = landing, 1–6 = questions, 7 = results
  direction: 1,          // 1 = forward, -1 = back

  // Results cache
  comparisonResult: null,

  // Actions
  setSchools: (schools) => set({ schools }),
  setMajor: (major) => set({ major }),
  setResidency: (residency, isInState) => set({ residency, isInState }),
  setIncomeBracket: (incomeBracket) => set({ incomeBracket }),
  setGoal: (goal) => set({ goal }),
  setAlumniData: (alumniData) => set({ alumniData }),
  setComparisonResult: (comparisonResult) => set({ comparisonResult }),

  goNext: () => {
    const { currentStep } = get()
    set({ currentStep: currentStep + 1, direction: 1 })
  },
  goBack: () => {
    const { currentStep } = get()
    if (currentStep > 0) set({ currentStep: currentStep - 1, direction: -1 })
  },
  goTo: (step) => {
    const { currentStep } = get()
    set({ currentStep: step, direction: step > currentStep ? 1 : -1 })
  },
  reset: () => set({
    schools: [], major: '', residency: '', isInState: false,
    incomeBracket: null, goal: '', alumniData: {},
    currentStep: 0, direction: 1, comparisonResult: null,
  }),
}))
