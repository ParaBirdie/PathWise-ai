import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, Palette, Database, CreditCard, Zap,
  Stethoscope, Briefcase, Factory, BookOpen, Leaf,
  Scale, Package, TrendingUp, Building2, Home,
  ChevronRight, Circle, CheckCircle2,
} from 'lucide-react'
import QuestionCard from './QuestionCard'
import { useSurveyStore } from '../../store/surveyStore'

const CAREER_DATA = [
  {
    industry: 'Technology & Software',
    icon: Terminal,
    categories: [
      { name: 'Engineering', roles: ['Software Engineer (Frontend)', 'Software Engineer (Backend)', 'Software Engineer (Fullstack)', 'Mobile App Developer', 'DevOps Engineer', 'Site Reliability Engineer (SRE)'] },
      { name: 'Data & AI', roles: ['Data Scientist', 'Machine Learning Engineer', 'Data Analyst', 'Business Intelligence (BI) Developer'] },
      { name: 'Product & Design', roles: ['Product Manager (PM)', 'UI/UX Designer', 'User Researcher', 'Solution Architect'] },
      { name: 'Security & Systems', roles: ['Cybersecurity Analyst', 'Information Security Engineer', 'Network Administrator', 'Cloud Architect'] },
    ],
  },
  {
    industry: 'Consulting',
    icon: Briefcase,
    categories: [
      { name: 'Management Consulting', roles: ['Strategy Consultant', 'Business Analyst', 'Associate Consultant'] },
      { name: 'Implementation / Operations', roles: ['Operations Consultant', 'Supply Chain Consultant', 'Change Management Specialist'] },
      { name: 'Technology / Digital Consulting', roles: ['Digital Transformation Lead', 'IT Strategy Consultant', 'ERP Implementation Specialist'] },
      { name: 'Boutique / Specialized', roles: ['Healthcare Consultant', 'Economic Consultant', 'Sustainability / ESG Consultant'] },
    ],
  },
  {
    industry: 'Healthcare & Life Sciences',
    icon: Stethoscope,
    categories: [
      { name: 'Clinical / Frontline', roles: ['Registered Nurse (RN)', 'Physician Assistant (PA)', 'Physical / Occupational Therapist', 'Medical Technician'] },
      { name: 'Healthcare Administration', roles: ['Hospital Administrator', 'Health Informatics Specialist', 'Medical Records Manager', 'Patient Experience Coordinator'] },
      { name: 'Pharmaceuticals & Biotech', roles: ['Clinical Research Associate (CRA)', 'R&D Scientist', 'Quality Assurance (QA) Specialist', 'Regulatory Affairs Associate'] },
      { name: 'Public Health', roles: ['Epidemiologist', 'Health Policy Analyst', 'Community Health Worker'] },
    ],
  },
  {
    industry: 'Engineering & Manufacturing',
    icon: Factory,
    categories: [
      { name: 'Mechanical / Aeronautical', roles: ['Design Engineer', 'Manufacturing Engineer', 'Aerospace Engineer', 'Robotics Engineer'] },
      { name: 'Civil & Environmental', roles: ['Structural Engineer', 'Urban Planner', 'Sustainability Engineer', 'Water Resources Engineer'] },
      { name: 'Electrical & Hardware', roles: ['Hardware Engineer', 'Circuit Designer', 'Power Systems Engineer', 'Control Systems Engineer'] },
      { name: 'Process / Chemical', roles: ['Petroleum Engineer', 'Chemical Process Engineer', 'Materials Scientist'] },
    ],
  },
  {
    industry: 'Marketing, Media & Creative',
    icon: Palette,
    categories: [
      { name: 'Digital Marketing', roles: ['SEO/SEM Specialist', 'Performance Marketer', 'Content Strategist', 'Social Media Manager'] },
      { name: 'Advertising & PR', roles: ['Account Coordinator', 'Copywriter', 'Media Buyer', 'Public Relations Specialist'] },
      { name: 'Creative Arts', roles: ['Graphic Designer', 'Art Director', 'Video Editor', 'Motion Designer'] },
      { name: 'Market Research', roles: ['Consumer Insights Analyst', 'Quantitative Researcher', 'Brand Manager'] },
    ],
  },
  {
    industry: 'Energy & Sustainability',
    icon: Leaf,
    categories: [
      { name: 'Renewable Energy', roles: ['Solar / Wind Project Developer', 'Grid Integration Engineer', 'Energy Auditor'] },
      { name: 'Sustainability / CSR', roles: ['ESG Analyst', 'Sustainability Coordinator', 'Carbon Accountant'] },
      { name: 'Traditional Energy', roles: ['Reservoir Engineer', 'Drilling Engineer', 'Landman', 'Energy Trader'] },
    ],
  },
  {
    industry: 'Public Policy, Government & Law',
    icon: Scale,
    categories: [
      { name: 'Government / Civil Service', roles: ['Foreign Service Officer', 'Policy Researcher', 'Legislative Assistant', 'FBI / CIA Analyst'] },
      { name: 'Legal', roles: ['Paralegal', 'Compliance Officer', 'Contract Administrator', 'Conflict Analyst'] },
      { name: 'Non-Profit / NGO', roles: ['Program Coordinator', 'Grant Writer', 'Fundraising / Development Officer', 'Advocacy Lead'] },
    ],
  },
  {
    industry: 'Supply Chain & Logistics',
    icon: Package,
    categories: [
      { name: 'Operations', roles: ['Supply Chain Analyst', 'Logistics Coordinator', 'Procurement Specialist (Buyer)'] },
      { name: 'Inventory', roles: ['Demand Planner', 'Inventory Manager', 'Warehouse Operations Lead'] },
    ],
  },
  {
    industry: 'Finance & Investment',
    icon: TrendingUp,
    categories: [
      { name: 'Investment Banking', roles: ['M&A Analyst', 'Capital Markets Associate', 'Public Finance'] },
      { name: 'Sales & Trading', roles: ['Equity Trader', 'Fixed Income Sales', 'Derivatives Specialist', 'Quantitative Researcher'] },
      { name: 'Private Equity & Venture Capital', roles: ['Investment Associate', 'Portfolio Operations', 'Deal Sourcing'] },
      { name: 'Wealth & Asset Management', roles: ['Portfolio Manager', 'Financial Advisor', 'Relationship Manager'] },
      { name: 'Corporate Finance', roles: ['FP&A Analyst', 'Treasury Manager', 'Internal Auditor'] },
      { name: 'Middle Office', roles: ['Risk Management Analyst', 'Compliance Officer', 'Trade Support'] },
    ],
  },
  {
    industry: 'Medicine (MD / DO Path)',
    icon: Building2,
    categories: [
      { name: 'Physicians', roles: ['Primary Care (Internal Medicine / Pediatrics)', 'Surgeon (Orthopedic / Neuro / Cardio)', 'Dermatologist', 'Cardiologist', 'Oncologist', 'Psychiatrist'] },
      { name: 'Emergency & Critical Care', roles: ['ER Physician', 'Anesthesiologist', 'Intensivist'] },
      { name: 'Diagnostics', roles: ['Radiologist', 'Pathologist', 'Medical Lab Director'] },
      { name: 'Dentistry & Optometry', roles: ['General Dentist', 'Orthodontist', 'Oral Surgeon', 'Optometrist'] },
      { name: 'Advanced Practice', roles: ['Pharmacist (Retail or Clinical)', 'Nurse Practitioner (NP)', 'Physician Assistant (PA)'] },
    ],
  },
  {
    industry: 'Law & Legal Services',
    icon: Scale,
    categories: [
      { name: 'Corporate Law', roles: ['M&A Attorney', 'Securities Lawyer', 'Intellectual Property (IP) Counsel', 'Tax Attorney'] },
      { name: 'Litigation', roles: ['Trial Lawyer', 'Defense Attorney', 'Prosecutor (District Attorney)', 'Judicial Clerk'] },
      { name: 'Public Interest & Government', roles: ['Public Defender', 'Environmental Lawyer', 'Civil Rights Attorney', 'Judge Advocate General (JAG)'] },
      { name: 'In-House Counsel', roles: ['General Counsel', 'Legal Operations'] },
      { name: 'Specialized Practices', roles: ['Family Law Attorney', 'Immigration Lawyer', 'Real Estate Attorney', 'Estate Planning Attorney'] },
    ],
  },
  {
    industry: 'Real Estate & Construction',
    icon: Home,
    categories: [
      { name: 'Development & Investment', roles: ['REIT Analyst', 'Project Manager', 'Real Estate Developer'] },
      { name: 'Brokerage & Sales', roles: ['Commercial Real Estate Agent', 'Residential Broker', 'Leasing Manager'] },
      { name: 'Valuation & Finance', roles: ['Real Estate Appraiser', 'Mortgage Underwriter', 'Escrow Officer'] },
    ],
  },
  {
    industry: 'Education & Academia',
    icon: BookOpen,
    categories: [
      { name: 'K-12 Education', roles: ['Classroom Teacher', 'Special Education Coordinator', 'School Administrator (Principal)'] },
      { name: 'Higher Education', roles: ['Professor (Tenure-track)', 'Researcher', 'Admissions Officer', 'Student Affairs Dean'] },
      { name: 'EdTech', roles: ['Instructional Designer', 'Educational Consultant', 'Curriculum Developer'] },
    ],
  },
]

export default function Q2bCareer() {
  const { careerIndustry, careerRole, setCareer, goNext } = useSurveyStore()
  const [activeIndustry, setActiveIndustry] = useState(
    careerIndustry || CAREER_DATA[0].industry
  )

  const activeData = CAREER_DATA.find((d) => d.industry === activeIndustry) ?? CAREER_DATA[0]

  return (
    <QuestionCard
      question={
        <>
          What career are you{' '}
          <span style={{ color: '#c4b5fd' }}>aiming for?</span>
        </>
      }
      subtitle="Hover an industry to explore roles, then select your target position. Your path is defined by your precision."
      onNext={goNext}
      canProgress={!!careerRole}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '1.5rem', height: '480px' }}>
        {/* Left: Industry list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {CAREER_DATA.map((item) => {
            const Icon = item.icon
            const isActive = activeIndustry === item.industry
            const hasRole = careerIndustry === item.industry

            return (
              <button
                key={item.industry}
                onMouseEnter={() => setActiveIndustry(item.industry)}
                onClick={() => setActiveIndustry(item.industry)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  backgroundColor: isActive ? '#252626' : '#131313',
                  borderLeft: isActive ? '3px solid #c4b5fd' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #c4b5fd' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <Icon
                    size={15}
                    style={{ color: isActive ? '#c4b5fd' : '#484848', flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: isActive ? '#e7e5e4' : '#acabaa',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.industry}
                  </span>
                </div>
                {isActive && <ChevronRight size={13} style={{ color: '#c4b5fd', flexShrink: 0 }} />}
                {hasRole && !isActive && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#c4b5fd', flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Right: Role cards */}
        <div style={{ overflowY: 'auto', padding: '0.125rem' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeData.industry}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              {activeData.categories.flatMap((cat) =>
                cat.roles.map((role) => {
                  const isSelected = careerRole === role && careerIndustry === activeData.industry
                  return (
                    <RoleCard
                      key={role}
                      role={role}
                      category={cat.name}
                      isSelected={isSelected}
                      onClick={() => setCareer(activeData.industry, role)}
                    />
                  )
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Selection summary */}
      <AnimatePresence>
        {careerRole && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginTop: '1.25rem',
              padding: '0.75rem 1.25rem',
              backgroundColor: 'rgba(74,61,124,0.15)',
              border: '1px solid rgba(196,181,253,0.2)',
              borderRadius: '0.5rem',
            }}
          >
            <CheckCircle2 size={14} style={{ color: '#c4b5fd', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', color: '#acabaa' }}>
              <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{careerRole}</span>
              {' — '}
              <span>{careerIndustry}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionCard>
  )
}

function RoleCard({ role, category, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '1.25rem 1.5rem',
        backgroundColor: '#000000',
        border: isSelected
          ? '1px solid rgba(196,181,253,0.5)'
          : hovered
            ? '1px solid rgba(196,181,253,0.3)'
            : '1px solid rgba(72,72,72,0.15)',
        borderRadius: '0.5rem',
        boxShadow: isSelected ? '0 0 16px rgba(196,181,253,0.08)' : 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isSelected ? '#c4b5fd' : '#767575',
          }}
        >
          {category}
        </span>
        {isSelected
          ? <CheckCircle2 size={17} style={{ color: '#c4b5fd' }} fill="rgba(196,181,253,0.2)" />
          : <Circle size={17} style={{ color: hovered ? '#c4b5fd' : '#484848', transition: 'color 0.15s' }} />
        }
      </div>
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: isSelected ? '#c4b5fd' : '#e7e5e4',
        }}
      >
        {role}
      </h3>
    </button>
  )
}
