import { useState } from 'react'
import { supabase } from '../../supabase'
import MapEditor from '../components/MapEditor'
import PlanCalibrator from '../components/PlanCalibrator'
import PerimeterEditor from '../components/PerimeterEditor'
import { detectPois, geocodeCamping, findCampsitePolygon, searchCampsiteByName } from '../lib/osmPois'
import { fusionnerCarteConfig } from '../lib/carteConfig'
import { barycentre } from '../lib/geo'
import { traduireErreur } from '../lib/erreurs'
import { EnTete } from '../components/Bloc'
import { toast } from '../../toast'
import { Texte, Pile, couleur as jetons } from '../../design'

async function compressToBlob(file, maxWidth = 2000, quality = 0.82) {
  const bmp = await createImageBitmap(file)
  let { width, height } = bmp
  if (width > maxWidth) { height = Math.round((height / width) * maxWidth); width = maxWidth }
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  canvas.getContext('2d').drawImage(bmp, 0, 0, width, height)
  return await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
}

export default function Carte({ camping, setCamping }) {
  const [uploading, setUploading] = useState(false)
  // Les messages passent par toast() : en haut de page, ils apparaissaient
  // hors de l'écran du gérant, qui ne savait pas si son action avait marché.
  const setError   = (msg) => msg && toast(msg, 'erreur')
  const setSuccess = (msg) => msg && toast(msg, 'succes')
  const [showCalibrator, setShowCalibrator] = useState(false)
  const [showPerimeter, setShowPerimeter]   = useState(false)
  const [detecting, setDetecting]           = useState(false)
  const [autoAddress, setAutoAddress]       = useState('')
  const [autoRunning, setAutoRunning]       = useState(false)
  const [autoLog, setAutoLog]               = useState([])

  const planUrl    = camping?.plan_url
  const planBounds = camping?.plan_bounds
  const perimeter  = camping?.carte_config?.perimeter || []

  async function handleUpload(file) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Fichier trop lourd (10 Mo maximum).'); return }
    setUploading(true)
    try {
      const blob = await compressToBlob(file, 2000, 0.82)
      const ext  = 'jpg'
      const path = `plans/${camping.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('camping-assets').upload(path, blob, {
          contentType: 'image/jpeg', upsert: true, cacheControl: '3600',
        })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('camping-assets').getPublicUrl(path)
      const publicUrl = pub.publicUrl
      const { error: dbErr } = await supabase.from('campings')
        .update({ plan_url: publicUrl, plan_bounds: null }).eq('id', camping.id)
      if (dbErr) throw dbErr
      setCamping(c => ({ ...c, plan_url: publicUrl, plan_bounds: null }))
      setSuccess('Plan envoyé ! Ajustez-le maintenant sur la vue satellite.')
    } catch (err) { setError(traduireErreur(err, "Le plan n'a pas pu être envoyé. Vérifiez la connexion et réessayez.")) }
    setUploading(false)
  }

  async function autoConfigure() {
    if (autoRunning) return
    setAutoRunning(true); setAutoLog([])
    const log = (msg) => setAutoLog(prev => [...prev, msg])
    let savedSomething = false
    try {
      const addr = autoAddress.trim()
      const cityHint = addr ? (addr.split(',').pop() || '').replace(/\d{5}/, '').trim() : ''

      // ⚡ Lancement PARALLÈLE : Overpass-par-nom + plusieurs variantes Nominatim
      log(`⚡ Recherche parallèle (OSM + géocodage)…`)

      const nomQueries = []
      if (addr) {
        nomQueries.push(addr + ' France')
        const parts = addr.split(',').map(s => s.trim()).filter(Boolean)
        if (parts.length > 1) {
          nomQueries.push(parts.slice(-2).join(', ') + ' France')
          nomQueries.push(parts[parts.length - 1] + ' France')
        }
        if (addr.includes('-')) nomQueries.push(addr.split('-')[0].trim() + ' France')
      }
      nomQueries.push(`${camping.nom} ${cityHint} France`.replace(/\s+/g, ' ').trim())
      nomQueries.push(`${camping.nom} France`)
      nomQueries.push(camping.nom)

      // On lance tout en parallèle
      const osmPromise = searchCampsiteByName(camping.nom, cityHint)
        .then(r => ({ src: 'osm', results: r }))
        .catch(e => ({ src: 'osm', results: [], err: e.message }))
      const nomPromises = nomQueries.map(q =>
        geocodeCamping(q).then(r => ({ src: 'nom', query: q, results: r }))
                         .catch(() => ({ src: 'nom', query: q, results: [] }))
      )

      // On attend TOUS pour départager (OSM > Nominatim si les 2 trouvent)
      const all = await Promise.all([osmPromise, ...nomPromises])
      const osm = all.find(a => a.src === 'osm' && a.results.length)
      const nom = all.find(a => a.src === 'nom' && a.results.length)

      let poly = null, lat, lng
      if (osm) {
        const best = osm.results.sort((a, b) => (b.poly ? 1 : 0) - (a.poly ? 1 : 0))[0]
        lat = best.center.lat; lng = best.center.lng
        if (best.poly) poly = best.poly
        log(`✅ OSM : « ${best.name} »${best.addr ? ' — ' + best.addr : ''} (${osm.results.length} match${osm.results.length > 1 ? 's' : ''})`)
      } else if (nom) {
        const b = nom.results[0]
        lat = +b.lat; lng = +b.lon
        log(`📍 Géocodé (${nom.query}) : ${b.display_name.split(',').slice(0, 3).join(',')}`)
      } else {
        throw new Error('Introuvable partout. Utilisez « Tracer le contour » à la main.')
      }

      if (!poly) {
        log(`🗺️  Recherche du contour dans un rayon de 800 m…`)
        try {
          poly = await findCampsitePolygon(lat, lng, 800)
          if (poly) log(`✅ Contour importé (${poly.length} points)`)
          else     log(`⚠️  Pas de contour dans OSM autour de ce point`)
        } catch (e) {
          log(`⚠️  Recherche contour indisponible (${e.message})`)
        }
      } else {
        log(`✅ Contour déjà obtenu via OSM (${poly.length} points)`)
      }

      // Sauvegarde intermédiaire : si on a un contour, on l'enregistre TOUT DE SUITE
      if (poly) {
        const { config, error: dbErr1 } = await fusionnerCarteConfig(camping.id, { perimeter: poly, center: barycentre(poly) })
        if (!dbErr1) {
          setCamping(c => ({ ...c, carte_config: config }))
          savedSomething = true
        }
      }

      log(`🎯 Détection des POI fiables…`)
      let pois = []
      try {
        pois = await detectPois(poly || null, { lat, lng })
        log(`✅ ${pois.length} POI détectés`)
      } catch (e) {
        log(`⚠️  POI OSM indisponibles (retry a échoué) — le contour est enregistré, ajoutez les POI à la main.`)
      }
      const manuals = (camping?.carte_config?.pins || []).filter(p => !p.osm)
      if (pois.length) log(`   (${manuals.length} POI manuels conservés)`)

      const { config, error: dbErr } = await fusionnerCarteConfig(camping.id, { pins: [...manuals, ...pois] })
      if (dbErr) throw dbErr
      setCamping(c => ({ ...c, carte_config: config }))
      savedSomething = true
      log(`💾 Configuration enregistrée`)
      setSuccess('Auto-configuration terminée !')
    } catch (e) {
      log(`❌ ${e.message}`)
      // Si on a déjà sauvé quelque chose (le contour), on ne montre PAS d'erreur globale
      if (savedSomething) {
        setSuccess('Contour enregistré (lieux à ajouter à la main)')
      } else {
        setError('Erreur : ' + e.message)
      }
    }
    setAutoRunning(false)
  }

  async function autoDetectPois() {
    if (detecting) return
    setDetecting(true)
    try {
      // Le repli n'était calculé que lorsqu'un contour existait, alors qu'il ne
      // sert précisément que dans le cas contraire : sans contour tracé, la
      // détection recevait deux valeurs nulles et échouait avant même
      // d'interroger OpenStreetMap. On repart donc du centre connu du camping.
      const cfg = camping?.carte_config || {}
      const centre = perimeter.length >= 3
        ? barycentre(perimeter)
        : (cfg.center?.lat ? cfg.center
          : (cfg.lat && cfg.lng ? { lat: cfg.lat, lng: cfg.lng } : null))

      if (!centre) {
        setError("Tracez d'abord le contour du camping (étape 1).")
        setDetecting(false); return
      }

      const pois = await detectPois(perimeter.length >= 3 ? perimeter : null, centre)
      if (!pois.length) {
        setError('Aucun équipement trouvé dans le contour. Placez-les à la main sur la carte.')
        setDetecting(false); return
      }
      // Remplace tous les POI OSM par la détection fraîche ; garde uniquement les manuels
      const manuals = (camping?.carte_config?.pins || []).filter(p => !p.osm)
      const { config, error: dbErr } = await fusionnerCarteConfig(camping.id, { pins: [...manuals, ...pois] })
      if (dbErr) throw dbErr
      setCamping(c => ({ ...c, carte_config: config }))
      setSuccess(`${pois.length} lieu${pois.length > 1 ? 'x' : ''} détecté${pois.length > 1 ? 's' : ''} et placé${pois.length > 1 ? 's' : ''} sur la carte`)
    } catch (e) {
      // OpenStreetMap est un service public gratuit : il est régulièrement
      // saturé ou en limitation de débit. Dire « réessayez » évite au gérant de
      // croire que son camping est absent de la base.
      console.error('Détection OSM échouée :', e)
      setError("La détection n'a pas répondu (service public saturé). Réessayez dans une minute, ou placez les lieux à la main.")
    }
    setDetecting(false)
  }

  // Ce bouton était un « × » posé sur l'aperçu, annoncé « Fermer » : on croyait
  // fermer l'image et l'on perdait plan et ajustement, sans confirmation.
  async function supprimerPlan() {
    if (!confirm('Supprimer le plan ? Vos vacanciers ne le verront plus, et son ajustement sur la vue satellite sera perdu.')) return
    const { error: err } = await supabase.from('campings').update({ plan_url: null, plan_bounds: null }).eq('id', camping.id)
    if (err) { setError(traduireErreur(err)); return }
    setCamping(c => ({ ...c, plan_url: null, plan_bounds: null }))
    setSuccess('Plan supprimé.')
  }

  return (
    <Pile espace="xl">
      <EnTete
        titre="Carte du camping"
        sous="Contour, lieux et plan du camping, tels que vos vacanciers les verront."
      />

        {/* ÉTAPE 1 — CONTOUR */}
        <Step n={1} title="Tracer le contour du camping"
              subtitle="Délimitez votre camping sur le satellite. Sert de repère à vos vacanciers et prépare la détection des équipements."
              done={perimeter.length >= 3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {perimeter.length >= 3
              ? <Badge ok>✅ Contour tracé ({perimeter.length} points)</Badge>
              : <Badge>⚠️ Pas encore tracé</Badge>}
            <button onClick={() => setShowPerimeter(true)}
              style={btnPrimary}>
              🗺️ {perimeter.length >= 3 ? 'Modifier le contour' : 'Tracer le contour'}
            </button>
            <span style={{ fontSize: 12, color: jetons.texteDoux }}>
              (détection auto, rectangle ou clic-à-clic — au choix dans l'éditeur)
            </span>
          </div>
        </Step>

        {/* ÉTAPE 2 — LIEUX */}
        {/* Seule la détection automatique a besoin du contour : placer la
            réception à la main doit rester possible dès le premier jour. */}
        <Step n={2} title="Placer les lieux du camping"
              subtitle="Piscine, sanitaires, restaurant, aire de jeux… Détectez-les automatiquement ou placez-les à la main sur la carte."
              done={(camping?.carte_config?.pins || []).length > 0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {(camping?.carte_config?.pins || []).length > 0
              ? <Badge ok>✅ {(camping?.carte_config?.pins || []).length} lieu{(camping?.carte_config?.pins || []).length > 1 ? 'x' : ''} sur la carte</Badge>
              : <Badge>⚠️ Aucun lieu placé</Badge>}
            <button onClick={autoDetectPois}
              disabled={detecting || perimeter.length < 3}
              style={perimeter.length < 3 ? btnDisabled : btnPrimary}>
              {detecting ? '⏳ Détection…' : '🎯 Détecter automatiquement'}
            </button>
          </div>
          {perimeter.length < 3 && (
            <div style={{ marginTop: 8, fontSize: 12, color: jetons.texteDoux }}>
              🔒 La détection automatique demande le contour (étape 1). Vous pouvez déjà placer les lieux à la main.
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <MapEditor
              key={`${camping?.id}-${(camping?.carte_config?.pins || []).length}-${(camping?.carte_config?.perimeter || []).length}`}
              camping={camping}
              setCamping={setCamping}
            />
          </div>
        </Step>

        {/* ÉTAPE 3 — PLAN (OPTIONNEL) */}
        <Step n={3} title="Ajouter votre plan (optionnel)"
              subtitle="Si vous avez un plan illustré du camping, envoyez-le puis ajustez-le sur la vue satellite."
              done={!!planUrl && !!planBounds}
              optional>
          {!planUrl ? (
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{
                border: '2px dashed #d1d5db', borderRadius: 14,
                padding: '40px 20px', textAlign: 'center', background: '#fafaf8',
              }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: jetons.texteMoyen, marginBottom: 6 }}>
                  Aucun plan pour l'instant
                </div>
                <div style={{ fontSize: 13, color: jetons.texteDoux, marginBottom: 20 }}>
                  Envoyez le plan de votre camping (JPG ou PNG, 10 Mo maximum)
                </div>
                <span style={{
                  background: jetons.marque, color: '#fff',
                  padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                }}>
                  Choisir un fichier
                </span>
                <input type="file" accept="image/png,image/jpeg"
                  onChange={e => handleUpload(e.target.files[0])}
                  style={{ display: 'none' }} />
              </div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <img src={planUrl} alt="Plan du camping"
                style={{ width: '100%', maxWidth: 400, maxHeight: 260, objectFit: 'contain',
                         borderRadius: 12, border: '1px solid #e5e7eb', display: 'block',
                         background: jetons.surfaceDouce }} />

              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: planBounds ? '#dcfce7' : jetons.alerteFond,
                color:      planBounds ? jetons.succes : jetons.alerte,
              }}>
                {planBounds
                  ? '✅ Plan ajusté sur la vue satellite — visible pour vos vacanciers'
                  : '⚠️ Plan pas encore ajusté — touchez « Ajuster sur la vue satellite » pour l\'aligner'}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setShowCalibrator(true)} style={btnPrimary}>
                  🎯 Ajuster sur la vue satellite
                </button>
                <label style={{ cursor: 'pointer' }}>
                  <span style={{ background: jetons.surfaceDouce, color: jetons.texteMoyen, padding: '10px 18px',
                                 borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'inline-flex',
                                 alignItems: 'center', minHeight: 44, boxSizing: 'border-box' }}>
                    Remplacer le plan
                  </span>
                  <input type="file" accept="image/png,image/jpeg"
                    onChange={e => handleUpload(e.target.files[0])}
                    style={{ display: 'none' }} />
                </label>
                <button onClick={supprimerPlan}
                  style={{ ...btnPrimary, background: jetons.dangerFond, color: jetons.danger }}>
                  🗑 Supprimer le plan
                </button>
              </div>
            </div>
          )}
          {uploading && <UploadProgress label="Envoi du plan…" />}
        </Step>

      {showCalibrator && (
        <PlanCalibrator
          camping={camping}
          onClose={() => setShowCalibrator(false)}
          onSaved={(bounds) => setCamping(c => ({ ...c, plan_bounds: bounds }))}
        />
      )}
      {showPerimeter && (
        <PerimeterEditor
          camping={camping}
          onClose={() => setShowPerimeter(false)}
          onSaved={(newCfg) => setCamping(c => ({ ...c, carte_config: newCfg }))}
        />
      )}
    </Pile>
  )
}

function UploadProgress({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px',
                  background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
      <div style={{ width: 16, height: 16, border: '2px solid #639922', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: jetons.succes, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

const btnPrimary = {
  background: jetons.marque, color: '#fff', padding: '10px 18px', minHeight: 44,
  borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const btnDisabled = {
  ...btnPrimary, background: jetons.bordure, color: jetons.texteDoux, cursor: 'not-allowed',
}

function Badge({ ok, children }) {
  return (
    <span style={{
      padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: ok ? '#dcfce7' : jetons.alerteFond,
      color:      ok ? jetons.succes : jetons.alerte,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function Step({ n, title, subtitle, done, disabled, disabledReason, optional, children }) {
  const state = disabled ? 'disabled' : done ? 'done' : 'active'
  const numBg = state === 'done'     ? jetons.marque
              : state === 'disabled' ? jetons.bordure
                                     : '#1a4d1a'
  const numFg = state === 'disabled' ? '#9ca3af' : '#fff'
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid ' + (state === 'active' ? jetons.marque : 'rgba(0,0,0,0.07)'),
      boxShadow: state === 'active' ? '0 4px 20px rgba(99,153,34,0.10)' : 'none',
      opacity: state === 'disabled' ? 0.55 : 1,
      overflow: 'hidden', transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', gap: 14, padding: '18px 22px', alignItems: 'flex-start',
                    borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: numBg, color: numFg,
          fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {state === 'done' ? '✓' : n}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Texte variante="sousTitre" as="h2" style={{ fontSize: 16 }}>{title}</Texte>
            {optional && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                        background: jetons.surfaceDouce, color: jetons.texteDoux, fontWeight: 600 }}>
              OPTIONNEL
            </span>}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: jetons.texteDoux, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div style={{ padding: '18px 22px' }}>
        {disabled ? (
          <div style={{ fontSize: 13, color: jetons.texteDoux, fontStyle: 'italic' }}>
            🔒 {disabledReason || 'Terminez l\'étape précédente.'}
          </div>
        ) : children}
      </div>
    </div>
  )
}


