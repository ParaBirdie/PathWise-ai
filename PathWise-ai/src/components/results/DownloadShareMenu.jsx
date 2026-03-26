import { useState, useRef, useEffect } from 'react'
import { Download, FileText, File, Mail, Link2, Check, Share2 } from 'lucide-react'
import { formatCurrency } from '../../lib/npvEngine'
import { PRIMARY_GOALS } from '../../lib/economicData'

const GOAL_LABEL = Object.fromEntries(PRIMARY_GOALS.map(({ value, label }) => [value, label]))

/* ── Inline SVG icons for platforms Lucide doesn't cover ── */
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

/* ── Word (.doc) generation ── */
function buildWordDocument(comparisonResult, major, goals) {
  const { results, best, lifecycleDividend } = comparisonResult
  const goalStr = goals.map((g) => GOAL_LABEL[g] ?? g).join(', ')
  const dividendSign = lifecycleDividend >= 0 ? '+' : ''

  const schoolRows = results
    .map(
      (r, i) => `
      <tr>
        <td><b>${i + 1}. ${r.school}</b>${i === 0 ? ' ★ Top Recommendation' : ''}</td>
        <td>${formatCurrency(r.npv, true)}</td>
        <td>${formatCurrency(r.entryWage, true)}</td>
        <td>${formatCurrency(r.year10Wage, true)}</td>
        <td>${formatCurrency(r.annualTuition, true)}/yr</td>
      </tr>`,
    )
    .join('')

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>PathWise Analysis</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, sans-serif; color: #1d1d1f; margin: 72pt; }
    h1   { font-size: 28pt; color: #1d1d1f; margin-bottom: 4pt; }
    h2   { font-size: 14pt; color: #3b82f6; margin-top: 18pt; }
    .sub { font-size: 11pt; color: #6e6e73; margin-top: 0; }
    .dividend { font-size: 36pt; font-weight: bold; color: #1d1d1f; margin: 8pt 0; }
    table { border-collapse: collapse; width: 100%; margin-top: 8pt; }
    th { background: #f5f5f7; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
    td { padding: 6pt 8pt; border-bottom: 1px solid #e5e5ea; font-size: 10pt; }
    .note { font-size: 9pt; color: #6e6e73; margin-top: 24pt; }
  </style>
</head>
<body>
  <h1>Your PathWise Analysis</h1>
  <p class="sub">${major} &nbsp;·&nbsp; ${goalStr} &nbsp;·&nbsp; 40-year projection</p>

  <h2>Life-Cycle Dividend</h2>
  <p class="dividend">${dividendSign}${formatCurrency(lifecycleDividend, true)}</p>
  <p class="sub">Net wealth advantage of <b>${best.school}</b> over your next-best option (NPV-discounted, 40 years)</p>

  <h2>School Comparison</h2>
  <table>
    <thead>
      <tr>
        <th>School</th>
        <th>40-yr NPV</th>
        <th>Entry Wage</th>
        <th>Year-10 Wage</th>
        <th>Tuition</th>
      </tr>
    </thead>
    <tbody>${schoolRows}</tbody>
  </table>

  <p class="note">
    <b>Methodology:</b> Earnings modeled via the Quartic Mincerian equation (Murphy &amp; Welch, 1990).
    NPV uses a 5% annual discount rate, 40-year career horizon, and includes $35k/yr opportunity cost during college.
    Results are educational simulations — consult a financial advisor for personalized guidance.
  </p>
</body>
</html>`
}

/* ── Main component ── */
export default function DownloadShareMenu({ comparisonResult, major, goals }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)
  const closeTimer = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* Debounced close so moving between trigger → menu doesn't flicker */
  const handleMouseEnter = () => {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  const { best, lifecycleDividend } = comparisonResult
  const dividendSign = lifecycleDividend >= 0 ? '+' : ''
  const shareText = `I used PathWise to compare colleges — ${best.school} came out on top with a ${dividendSign}${formatCurrency(lifecycleDividend, true)} life-cycle financial advantage over 40 years. See my full analysis:`
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  /* ── Save handlers ── */
  const handlePDF = () => {
    setOpen(false)
    setTimeout(() => window.print(), 100)
  }

  const handleWord = () => {
    const html = buildWordDocument(comparisonResult, major, goals)
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PathWise-Analysis.doc'
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  /* ── Share handlers ── */
  const openShare = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const handleEmail = () =>
    openShare(
      `mailto:?subject=${encodeURIComponent('My PathWise College Analysis')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    )

  const handleX = () =>
    openShare(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    )

  const handleWhatsApp = () =>
    openShare(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`)

  const handleSMS = () =>
    openShare(`sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`)

  const handleLinkedIn = () =>
    openShare(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    )

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'My PathWise Analysis', text: shareText, url: shareUrl })
      setOpen(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback: do nothing */
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  /* ── Shared button style ── */
  const optBtn =
    'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-[#1d1d1f] hover:bg-black/[0.04] transition-colors text-left'

  const iconWrap = (color) =>
    `flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white ${color}`

  return (
    <div
      ref={menuRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <Download className="w-4 h-4" />
        Download Result
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-black/[0.06] p-3 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Arrow */}
          <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 border-r border-b border-black/[0.06] rotate-45" />

          {/* ── Save section ── */}
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest px-1 mb-1">
            Save
          </p>
          <button onClick={handlePDF} className={optBtn}>
            <span className={iconWrap('bg-red-500')}>
              <FileText className="w-3.5 h-3.5" />
            </span>
            Save as PDF
          </button>
          <button onClick={handleWord} className={optBtn}>
            <span className={iconWrap('bg-blue-600')}>
              <File className="w-3.5 h-3.5" />
            </span>
            Save as Word (.doc)
          </button>

          <div className="my-2 border-t border-black/[0.06]" />

          {/* ── Share section ── */}
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest px-1 mb-1">
            Share
          </p>
          <button onClick={handleEmail} className={optBtn}>
            <span className={iconWrap('bg-gray-500')}>
              <Mail className="w-3.5 h-3.5" />
            </span>
            Email
          </button>
          <button onClick={handleX} className={optBtn}>
            <span className={iconWrap('bg-black')}>
              <XIcon />
            </span>
            X (Twitter)
          </button>
          <button onClick={handleWhatsApp} className={optBtn}>
            <span className={iconWrap('bg-green-500')}>
              <WhatsAppIcon />
            </span>
            WhatsApp
          </button>
          <button onClick={handleSMS} className={optBtn}>
            <span className={iconWrap('bg-green-400')}>
              <Share2 className="w-3.5 h-3.5" />
            </span>
            Text Message (SMS)
          </button>
          <button onClick={handleLinkedIn} className={optBtn}>
            <span className={iconWrap('bg-[#0a66c2]')}>
              <LinkedInIcon />
            </span>
            LinkedIn
          </button>
          {hasNativeShare && (
            <button onClick={handleNativeShare} className={optBtn}>
              <span className={iconWrap('bg-violet-500')}>
                <Share2 className="w-3.5 h-3.5" />
              </span>
              More options…
            </button>
          )}
          <button onClick={handleCopyLink} className={optBtn}>
            <span className={iconWrap(copied ? 'bg-green-500' : 'bg-gray-400')}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            </span>
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
