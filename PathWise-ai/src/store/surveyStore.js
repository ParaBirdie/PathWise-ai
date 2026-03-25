import { create } from 'zustand'

export const useSurveyStore = create((set, get) => ({
  // Survey answers
  schools: [],               // Q1: string[]
  major: '',                 // Q2: string
  residency: '',             // Q3: string (state/country)
  isInState: false,          // derived from Q3
  incomeBracket: null,       // Q4: { label, value }
  goals: [],                 // Q5: string[] — one or more of the PRIMARY_GOALS values
  alumniData: {},            // Q6: { [school]: string (range) }
  financialAidOffers: {},    // Q7: { [school]: number | null } — null means user skipped
  studentRatings: {},        // Q8: { [school]: number (1–10) }

  // Navigation
  currentStep: 0,        // 0 = landing, 1–7 = questions, 8 = results
  direction: 1,          // 1 = forward, -1 = back

  // Results cache
  comparisonResult: null,

  // Actions
  setSchools: (schools) => set({ schools }),
  setMajor: (major) => set({ major }),
  setResidency: (residency, isInState) => set({ residency, isInState }),
  setIncomeBracket: (incomeBracket) => set({ incomeBracket }),
  toggleGoal: (value) => set((state) => ({
    goals: state.goals.includes(value)
      ? state.goals.filter((g) => g !== value)
      : [...state.goals, value],
  })),
  setAlumniData: (alumniData) => set({ alumniData }),
  setFinancialAidOffers: (financialAidOffers) => set({ financialAidOffers }),
  setStudentRatings: (studentRatings) => set({ studentRatings }),
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
    incomeBracket: null, goals: [], alumniData: {}, financialAidOffers: {}, studentRatings: {},
    currentStep: 0, direction: 1, comparisonResult: null,
  }),
}))
