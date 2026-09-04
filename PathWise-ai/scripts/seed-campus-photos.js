#!/usr/bin/env node
/**
 * Campus photo seeder (PRD §2, map + photo support).
 *
 * Uploads one campus photo per demo school to the `campus-photos` Supabase
 * Storage bucket and records its attribution in
 * university_financials.photo_credit.
 *
 *   node scripts/seed-campus-photos.js --dry-run   preview, writes nothing
 *   node scripts/seed-campus-photos.js             download, upload, update
 *
 * Sourcing rules from §2: Wikimedia Commons (CC-licensed) or the school's own
 * press kit only. No Instagram, no YouTube, no scraping school sites — that
 * breaches their ToS and the images are copyrighted.
 *
 * The file titles below are chosen by hand; the attribution is NOT. Author,
 * license, and source URL are fetched from the Commons API at run time, so the
 * credit string always matches what Commons actually says rather than what
 * someone remembered. photo_path and photo_credit are written in the same
 * update, so a stored path can never exist without its credit.
 *
 * Requires the §2 columns and reads its credentials the same way as
 * scripts/enrich-schools.js. No model calls — this costs nothing to run.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import { pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'campus-photos'
const UA = 'PathWise-ai-seed/1.0 (college comparison demo; contact pan.parabirdie@gmail.com)'

/**
 * school_name (primary key) → Commons file title plus a human label.
 *
 * The label exists because Commons filenames carry camera and upload cruft
 * ("DSC05930", "(48960882011)") that has no business in a caption a student
 * reads. Only the label is hand-written; author, license, and source URL are
 * always fetched.
 */
const PHOTOS = {
  'Duke University': {
    title: 'File:Duke Chapel, West Campus, Duke University, Durham, NC (48960882011).jpg',
    label: 'Duke Chapel, West Campus',
  },
  'Arizona State University': {
    // The generic "campus view" files for ASU are patio furniture with no
    // landmark in frame. Old Main is the founding building and matches the
    // landmark-building framing of the other four.
    title: 'File:2021 Arizona State University, Tempe Campus, Old Main.jpg',
    label: 'Old Main, Tempe campus',
  },
  UCLA: {
    title: 'File:2019 UCLA Royce Hall 2.jpg',
    label: 'Royce Hall',
  },
  'University of Michigan': {
    title: 'File:Michigan Union at Night, University of Michigan Campus, Ann Arbor, Michigan.JPG',
    label: 'Michigan Union at night',
  },
  'Johns Hopkins University': {
    title: 'File:Gilman Hall on Keyser Quad.jpg',
    label: 'Gilman Hall, Keyser Quad',
  },
}

/** Downscale on Commons' side; a 5000px original is wasted bytes for a map pin. */
const RENDER_WIDTH = 1600

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

const slug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const stripHtml = (html) =>
  (html ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

/** Fetch author, license, and a rendered URL straight from Commons. */
async function fetchCommonsMeta(title, label) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    `&iiprop=url|size|extmetadata&iiurlwidth=${RENDER_WIDTH}&titles=${encodeURIComponent(title)}`

  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Commons API ${res.status}`)
  const page = Object.values((await res.json()).query?.pages ?? {})[0]
  if (!page || page.missing !== undefined) throw new Error(`no such file: ${title}`)

  const info = page.imageinfo?.[0]
  if (!info) throw new Error(`no imageinfo for ${title}`)
  const meta = info.extmetadata ?? {}

  const license = stripHtml(meta.LicenseShortName?.value)
  if (!license || /fair use|non-free/i.test(license)) {
    throw new Error(`license is "${license || 'unknown'}" — not usable under §2`)
  }

  return {
    downloadUrl: info.thumburl ?? info.url,
    artist: stripHtml(meta.Artist?.value) || 'Unknown author',
    license,
    sourcePage: info.descriptionurl,
    // §2 wants an attribution string rendered in the pin's detail view. CC BY
    // and CC BY-SA both require author + license; the source link makes the
    // credit verifiable and satisfies CC0's courtesy attribution too.
    credit:
      `${label} — ${stripHtml(meta.Artist?.value) || 'Unknown author'} ` +
      `(${license}), via Wikimedia Commons: ${info.descriptionurl}`,
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  loadEnvLocal()

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url) fail('SUPABASE_URL (or VITE_SUPABASE_URL) is not set in .env.local.')
  if (!key) fail('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.')

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  if (!dryRun) {
    // Idempotent: the SQL migration also creates this, but doing it here means
    // the script is self-sufficient if only the column DDL was applied.
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error && !/already exists/i.test(error.message)) {
      fail(`could not create bucket "${BUCKET}": ${error.message}`)
    }
    console.log(`bucket "${BUCKET}" ready (public read)`)
  }

  for (const [school, { title, label }] of Object.entries(PHOTOS)) {
    console.log(`\n${school}`)
    try {
      const meta = await fetchCommonsMeta(title, label)
      console.log(`  ${meta.license} · ${meta.artist}`)
      console.log(`  ${meta.sourcePage}`)

      if (dryRun) {
        console.log(`  credit → ${meta.credit}`)
        continue
      }

      const res = await fetch(meta.downloadUrl, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`)
      const bytes = Buffer.from(await res.arrayBuffer())

      const ext = path.extname(new URL(meta.downloadUrl).pathname).toLowerCase() || '.jpg'
      const objectPath = `${slug(school)}${ext === '.jpeg' ? '.jpg' : ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, bytes, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw new Error(`upload failed: ${upErr.message}`)

      // photo_path and photo_credit are written together — never a path
      // without its attribution.
      const { error: dbErr } = await supabase
        .from('university_financials')
        .update({ photo_path: objectPath, photo_credit: meta.credit })
        .eq('school_name', school)
      if (dbErr) throw new Error(`db update failed: ${dbErr.message}`)

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
      console.log(`  ✓ ${(bytes.length / 1024).toFixed(0)} KB → ${objectPath}`)
      console.log(`  ${pub.publicUrl}`)
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
      process.exitCode = 1
    }
  }
}

function fail(message) {
  console.error(`\nError: ${message}\n`)
  process.exit(1)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(`\nFatal: ${err.stack ?? err.message}\n`)
    process.exit(1)
  })
}
