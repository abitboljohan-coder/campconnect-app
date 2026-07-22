#!/usr/bin/env node
/**
 * Setup Test Data for Cloisonnement Validation
 *
 * Creates 2 test campings + 2 test gerants for validation
 *
 * Usage:
 *   node scripts/setup-test-data.mjs
 *
 * Requires: .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

// Charger .env
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found.')
  console.error('   Copier .env.example → .env et renseigner vos credentials Supabase')
  process.exit(1)
}

const env = {}
fs.readFileSync(envPath, 'utf-8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .forEach(line => {
    const [key, val] = line.split('=')
    env[key.trim()] = val.trim()
  })

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// === TEST DATA ===

const testCampings = [
  {
    slug: 'test-camping-a',
    nom: 'Test Camping A',
    couleur_principale: '#639922',
    couleur_secondaire: '#1a4d1a',
    description: 'Camping de test A pour validation cloisonnement'
  },
  {
    slug: 'test-camping-b',
    nom: 'Test Camping B',
    couleur_principale: '#2563eb',
    couleur_secondaire: '#1e40af',
    description: 'Camping de test B pour validation cloisonnement'
  }
]

const testGerants = [
  { email: 'gerant-a@test.campconnect.fr', password: 'test123456' },
  { email: 'gerant-b@test.campconnect.fr', password: 'test123456' }
]

async function setup() {
  console.log('🚀 Setup Test Data pour Cloisonnement')
  console.log(`📍 Supabase: ${supabaseUrl}\n`)

  try {
    // 1. Créer campings
    console.log('1️⃣ Créer campings...')
    const { data: existingCampings } = await supabase
      .from('campings')
      .select('id, slug')
      .in('slug', testCampings.map(c => c.slug))

    const existingSlugs = existingCampings?.map(c => c.slug) || []
    const campingsToCreate = testCampings.filter(c => !existingSlugs.includes(c.slug))

    let createdCampings = []
    if (campingsToCreate.length > 0) {
      const { data, error } = await supabase
        .from('campings')
        .insert(campingsToCreate)
        .select()

      if (error) throw error
      createdCampings = data
      console.log(`✅ ${createdCampings.length} camping(s) créé(s)`)
    } else {
      console.log('✅ Campings existent déjà')
    }

    // Récupérer tous les campings (créés + existants)
    const { data: allCampings } = await supabase
      .from('campings')
      .select('id, slug')
      .in('slug', testCampings.map(c => c.slug))

    if (!allCampings || allCampings.length !== 2) {
      throw new Error('Impossible de récupérer les 2 campings')
    }

    console.log(`\n   Camping A (${allCampings[0].slug}): ${allCampings[0].id}`)
    console.log(`   Camping B (${allCampings[1].slug}): ${allCampings[1].id}`)

    // 2. Créer gérants avec auth
    console.log('\n2️⃣ Créer gérants...')
    const gerantUsers = []

    for (let i = 0; i < testGerants.length; i++) {
      const { email, password } = testGerants[i]
      const campingId = allCampings[i].id

      // Essayer de créer l'auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: 'gerant' }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log(`   ℹ️ ${email} existe déjà`)
          // Récupérer l'user existant via RLS (won't work), donc créer juste le gerant record
          const { data: existingGerant } = await supabase
            .from('gerants')
            .select('id')
            .eq('email', email)
            .single()

          if (!existingGerant) {
            // On ne connaît pas le user_id, donc on saute pour ce gerant
            console.log(`   ⚠️ Gerant record pour ${email} non créé (user existe en auth)`)
          }
          continue
        }
        throw signUpError
      }

      const userId = signUpData.user?.id
      if (!userId) throw new Error(`Pas de user_id pour ${email}`)

      gerantUsers.push({ userId, email, campingId })
      console.log(`✅ ${email} créé`)
    }

    // 3. Créer gerants records (lier auth users aux campings)
    console.log('\n3️⃣ Lier gérants aux campings...')
    for (const { userId, email, campingId } of gerantUsers) {
      const { error: gerantError } = await supabase
        .from('gerants')
        .insert({
          user_id: userId,
          email,
          camping_id: campingId
        })

      if (gerantError && !gerantError.message.includes('duplicate')) {
        throw gerantError
      }
      console.log(`✅ ${email} → ${allCampings.find(c => c.id === campingId)?.slug}`)
    }

    // 4. Résumé
    console.log('\n' + '═'.repeat(60))
    console.log('✨ Setup Terminé!\n')
    console.log('Test Campings:')
    allCampings.forEach((c, i) => {
      console.log(`  ${i + 1}. ${testCampings[i].nom} (${c.slug})`)
    })

    console.log('\nGerants de Test:')
    testGerants.forEach((g, i) => {
      const camping = testCampings[i]
      console.log(`  ${i + 1}. ${g.email} → ${camping.slug}`)
      console.log(`     Mot de passe: ${g.password}`)
    })

    console.log('\n🧪 Prêt à valider cloisonnement:')
    console.log(`  Browser 1: https://app.campconnect.fr/join/${allCampings[0].slug}`)
    console.log(`  Browser 2: https://app.campconnect.fr/join/${allCampings[1].slug}`)

    console.log('\n📖 Voir docs/TESTING_CLOISONNEMENT.md pour les étapes')
    console.log('═'.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

setup()
