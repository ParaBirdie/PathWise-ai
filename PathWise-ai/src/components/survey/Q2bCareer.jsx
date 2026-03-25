import { useState } from 'react'
import { motion } from 'framer-motion'
import QuestionCard from './QuestionCard'
import { useSurveyStore } from '../../store/surveyStore'

const CAREER_DATA = [
  {
    industry: 'Technology & Software',
    description: 'Creation, maintenance, and security of digital infrastructure and consumer products.',
    categories: [
      {
        name: 'Engineering',
        roles: [
          'Software Engineer (Frontend)',
          'Software Engineer (Backend)',
          'Software Engineer (Fullstack)',
          'Mobile App Developer',
          'DevOps Engineer',
          'Site Reliability Engineer (SRE)',
        ],
      },
      {
        name: 'Data & AI',
        roles: [
          'Data Scientist',
          'Machine Learning Engineer',
          'Data Analyst',
          'Business Intelligence (BI) Developer',
        ],
      },
      {
        name: 'Product & Design',
        roles: [
          'Product Manager (PM)',
          'UI/UX Designer',
          'User Researcher',
          'Solution Architect',
        ],
      },
      {
        name: 'Security & Systems',
        roles: [
          'Cybersecurity Analyst',
          'Information Security Engineer',
          'Network Administrator',
          'Cloud Architect',
        ],
      },
    ],
  },
  {
    industry: 'Consulting',
    description: 'Professional services firms providing external strategic advice to corporations and governments.',
    categories: [
      {
        name: 'Management Consulting',
        roles: [
          'Strategy Consultant',
          'Business Analyst',
          'Associate Consultant',
        ],
      },
      {
        name: 'Implementation / Operations',
        roles: [
          'Operations Consultant',
          'Supply Chain Consultant',
          'Change Management Specialist',
        ],
      },
      {
        name: 'Technology / Digital Consulting',
        roles: [
          'Digital Transformation Lead',
          'IT Strategy Consultant',
          'ERP Implementation Specialist',
        ],
      },
      {
        name: 'Boutique / Specialized',
        roles: [
          'Healthcare Consultant',
          'Economic Consultant',
          'Sustainability / ESG Consultant',
        ],
      },
    ],
  },
  {
    industry: 'Healthcare & Life Sciences',
    description: 'Clinical roles (patient care) and non-clinical/corporate roles (administration and research).',
    categories: [
      {
        name: 'Clinical / Frontline',
        roles: [
          'Registered Nurse (RN)',
          'Physician Assistant (PA)',
          'Physical / Occupational Therapist',
          'Medical Technician',
        ],
      },
      {
        name: 'Healthcare Administration',
        roles: [
          'Hospital Administrator',
          'Health Informatics Specialist',
          'Medical Records Manager',
          'Patient Experience Coordinator',
        ],
      },
      {
        name: 'Pharmaceuticals & Biotech',
        roles: [
          'Clinical Research Associate (CRA)',
          'R&D Scientist',
          'Quality Assurance (QA) Specialist',
          'Regulatory Affairs Associate',
        ],
      },
      {
        name: 'Public Health',
        roles: [
          'Epidemiologist',
          'Health Policy Analyst',
          'Community Health Worker',
        ],
      },
    ],
  },
  {
    industry: 'Engineering & Manufacturing',
    description: 'Physical creation of infrastructure, machines, and consumer goods.',
    categories: [
      {
        name: 'Mechanical / Aeronautical',
        roles: [
          'Design Engineer',
          'Manufacturing Engineer',
          'Aerospace Engineer',
          'Robotics Engineer',
        ],
      },
      {
        name: 'Civil & Environmental',
        roles: [
          'Structural Engineer',
          'Urban Planner',
          'Sustainability Engineer',
          'Water Resources Engineer',
        ],
      },
      {
        name: 'Electrical & Hardware',
        roles: [
          'Hardware Engineer',
          'Circuit Designer',
          'Power Systems Engineer',
          'Control Systems Engineer',
        ],
      },
      {
        name: 'Process / Chemical',
        roles: [
          'Petroleum Engineer',
          'Chemical Process Engineer',
          'Materials Scientist',
        ],
      },
    ],
  },
  {
    industry: 'Marketing, Media & Creative',
    description: 'Brand awareness, communication, and the attention economy.',
    categories: [
      {
        name: 'Digital Marketing',
        roles: [
          'SEO/SEM Specialist',
          'Performance Marketer',
          'Content Strategist',
          'Social Media Manager',
        ],
      },
      {
        name: 'Advertising & PR',
        roles: [
          'Account Coordinator',
          'Copywriter',
          'Media Buyer',
          'Public Relations Specialist',
        ],
      },
      {
        name: 'Creative Arts',
        roles: [
          'Graphic Designer',
          'Art Director',
          'Video Editor',
          'Motion Designer',
        ],
      },
      {
        name: 'Market Research',
        roles: [
          'Consumer Insights Analyst',
          'Quantitative Researcher',
          'Brand Manager',
        ],
      },
    ],
  },
  {
    industry: 'Energy & Sustainability',
    description: 'Traditional energy as well as the rapidly growing green energy sector.',
    categories: [
      {
        name: 'Renewable Energy',
        roles: [
          'Solar / Wind Project Developer',
          'Grid Integration Engineer',
          'Energy Auditor',
        ],
      },
      {
        name: 'Sustainability / CSR',
        roles: [
          'ESG Analyst',
          'Sustainability Coordinator',
          'Carbon Accountant',
        ],
      },
      {
        name: 'Traditional Energy',
        roles: [
          'Reservoir Engineer',
          'Drilling Engineer',
          'Landman',
          'Energy Trader',
        ],
      },
    ],
  },
  {
    industry: 'Public Policy, Government & Law',
    description: 'Governance, legal compliance, and social impact.',
    categories: [
      {
        name: 'Government / Civil Service',
        roles: [
          'Foreign Service Officer',
          'Policy Researcher',
          'Legislative Assistant',
          'FBI / CIA Analyst',
        ],
      },
      {
        name: 'Legal',
        roles: [
          'Paralegal',
          'Compliance Officer',
          'Contract Administrator',
          'Conflict Analyst',
        ],
      },
      {
        name: 'Non-Profit / NGO',
        roles: [
          'Program Coordinator',
          'Grant Writer',
          'Fundraising / Development Officer',
          'Advocacy Lead',
        ],
      },
    ],
  },
  {
    industry: 'Supply Chain & Logistics',
    description: 'Managing the movement of goods from raw materials to the end consumer.',
    categories: [
      {
        name: 'Operations',
        roles: [
          'Supply Chain Analyst',
          'Logistics Coordinator',
          'Procurement Specialist (Buyer)',
        ],
      },
      {
        name: 'Inventory',
        roles: [
          'Demand Planner',
          'Inventory Manager',
          'Warehouse Operations Lead',
        ],
      },
    ],
  },
  {
    industry: 'Finance & Investment',
    description: 'Sell-Side (selling services/stocks) and Buy-Side (investing money to make a profit).',
    categories: [
      {
        name: 'Investment Banking',
        roles: [
          'M&A Analyst',
          'Capital Markets Associate',
          'Public Finance',
        ],
      },
      {
        name: 'Sales & Trading',
        roles: [
          'Equity Trader',
          'Fixed Income Sales',
          'Derivatives Specialist',
          'Quantitative Researcher',
        ],
      },
      {
        name: 'Private Equity & Venture Capital',
        roles: [
          'Investment Associate',
          'Portfolio Operations',
          'Deal Sourcing',
        ],
      },
      {
        name: 'Wealth & Asset Management',
        roles: [
          'Portfolio Manager',
          'Financial Advisor',
          'Relationship Manager',
        ],
      },
      {
        name: 'Corporate Finance',
        roles: [
          'FP&A Analyst',
          'Treasury Manager',
          'Internal Auditor',
        ],
      },
      {
        name: 'Middle Office',
        roles: [
          'Risk Management Analyst',
          'Compliance Officer',
          'Trade Support',
        ],
      },
    ],
  },
  {
    industry: 'Medicine (MD / DO Path)',
    description: 'Physician and clinical specialization tracks across private, academic, and hospital settings.',
    categories: [
      {
        name: 'Physicians',
        roles: [
          'Primary Care (Internal Medicine / Pediatrics)',
          'Surgeon (Orthopedic / Neuro / Cardio)',
          'Dermatologist',
          'Cardiologist',
          'Oncologist',
          'Psychiatrist',
        ],
      },
      {
        name: 'Emergency & Critical Care',
        roles: [
          'ER Physician',
          'Anesthesiologist',
          'Intensivist',
        ],
      },
      {
        name: 'Diagnostics',
        roles: [
          'Radiologist',
          'Pathologist',
          'Medical Lab Director',
        ],
      },
      {
        name: 'Dentistry & Optometry',
        roles: [
          'General Dentist',
          'Orthodontist',
          'Oral Surgeon',
          'Optometrist',
        ],
      },
      {
        name: 'Advanced Practice',
        roles: [
          'Pharmacist (Retail or Clinical)',
          'Nurse Practitioner (NP)',
          'Physician Assistant (PA)',
        ],
      },
    ],
  },
  {
    industry: 'Law & Legal Services',
    description: 'Practice areas across BigLaw, boutique, in-house, and government employers.',
    categories: [
      {
        name: 'Corporate Law',
        roles: [
          'M&A Attorney',
          'Securities Lawyer',
          'Intellectual Property (IP) Counsel',
          'Tax Attorney',
        ],
      },
      {
        name: 'Litigation',
        roles: [
          'Trial Lawyer',
          'Defense Attorney',
          'Prosecutor (District Attorney)',
          'Judicial Clerk',
        ],
      },
      {
        name: 'Public Interest & Government',
        roles: [
          'Public Defender',
          'Environmental Lawyer',
          'Civil Rights Attorney',
          'Judge Advocate General (JAG)',
        ],
      },
      {
        name: 'In-House Counsel',
        roles: [
          'General Counsel',
          'Legal Operations',
        ],
      },
      {
        name: 'Specialized Practices',
        roles: [
          'Family Law Attorney',
          'Immigration Lawyer',
          'Real Estate Attorney',
          'Estate Planning Attorney',
        ],
      },
    ],
  },
  {
    industry: 'Real Estate & Construction',
    description: 'Acquisition, development, and management of physical property.',
    categories: [
      {
        name: 'Development & Investment',
        roles: [
          'REIT Analyst',
          'Project Manager',
          'Real Estate Developer',
        ],
      },
      {
        name: 'Brokerage & Sales',
        roles: [
          'Commercial Real Estate Agent',
          'Residential Broker',
          'Leasing Manager',
        ],
      },
      {
        name: 'Valuation & Finance',
        roles: [
          'Real Estate Appraiser',
          'Mortgage Underwriter',
          'Escrow Officer',
        ],
      },
    ],
  },
  {
    industry: 'Education & Academia',
    description: 'K-12, higher education, and educational technology.',
    categories: [
      {
        name: 'K-12 Education',
        roles: [
          'Classroom Teacher',
          'Special Education Coordinator',
          'School Administrator (Principal)',
        ],
      },
      {
        name: 'Higher Education',
        roles: [
          'Professor (Tenure-track)',
          'Researcher',
          'Admissions Officer',
          'Student Affairs Dean',
        ],
      },
      {
        name: 'EdTech',
        roles: [
          'Instructional Designer',
          'Educational Consultant',
          'Curriculum Developer',
        ],
      },
    ],
  },
]

export default function Q2bCareer() {
  const { careerIndustry, careerRole, setCareer, goNext } = useSurveyStore()
  const [hoveredIndustry, setHoveredIndustry] = useState(careerIndustry || null)

  const activeData = CAREER_DATA.find((d) => d.industry === hoveredIndustry) || null

  return (
    <QuestionCard
      question="What career are you aiming for?"
      subtitle="Hover an industry to explore roles, then select your target position."
      onNext={goNext}
      canProgress={!!careerRole}
    >
      <div className="flex gap-4 h-[400px]">
        {/* Left: Industry list */}
        <div className="w-5/12 shrink-0 h-full overflow-y-auto flex flex-col gap-1.5 pr-1">
          {CAREER_DATA.map((item) => {
            const isActive = hoveredIndustry === item.industry
            const isSelected = careerIndustry === item.industry
            return (
              <motion.button
                key={item.industry}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setHoveredIndustry(item.industry)}
                onClick={() => setHoveredIndustry(item.industry)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-medium border transition-colors duration-100
                  ${isActive
                    ? 'bg-[#37352f] text-white border-[#37352f]'
                    : isSelected
                      ? 'bg-[#e9e9e7] text-[#37352f] border-[#e9e9e7]'
                      : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f1f1ef]'
                  }`}
              >
                {item.industry}
              </motion.button>
            )
          })}
        </div>

        {/* Right: Roles panel */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden">
          {!activeData ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-[#c4c4c0] text-center px-4">
                Hover an industry on the left to see available roles
              </p>
            </div>
          ) : (
            <motion.div
              key={activeData.industry}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
              className="pr-1"
            >
              <p className="text-xs text-[#787774] mb-4 leading-relaxed">
                {activeData.description}
              </p>
              <div className="flex flex-col gap-4">
                {activeData.categories.map((cat) => (
                  <div key={cat.name}>
                    <p className="text-[10px] font-semibold text-[#787774] uppercase tracking-widest mb-1.5">
                      {cat.name}
                    </p>
                    <div className="flex flex-col gap-1">
                      {cat.roles.map((role) => (
                        <motion.button
                          key={role}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCareer(activeData.industry, role)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-medium border transition-colors duration-100
                            ${careerRole === role && careerIndustry === activeData.industry
                              ? 'bg-[#37352f] text-white border-[#37352f]'
                              : 'bg-white text-[#37352f] border-[#e9e9e7] hover:bg-[#f1f1ef]'
                            }`}
                        >
                          {role}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {careerRole && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 py-3 rounded-xl bg-[#f1f1ef] border border-[#e9e9e7] text-xs text-[#37352f]"
        >
          <span className="text-[#787774]">Selected: </span>
          <span className="font-medium">{careerRole}</span>
          <span className="text-[#787774]"> — {careerIndustry}</span>
        </motion.div>
      )}
    </QuestionCard>
  )
}
