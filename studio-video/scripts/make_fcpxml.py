import json, urllib.parse
from xml.sax.saxutils import quoteattr

BASE = 'C:/Users/abitb/Videos/CampConnect_Pub_v2'
FPS = 30
DUR = 44 * FPS

def url(rel):
    return 'file:///' + urllib.parse.quote(f'{BASE}/{rel}', safe='/:')

def tc(frames):
    return f'{int(frames)}/{FPS}s'

texts = json.load(open('v2/textes.json'))
LABEL = {
 '01_accroche_1': 'Accroche 1', '02_accroche_2': 'Accroche 2', '03_promesse': 'Promesse',
 '04_surtitre_vacanciers': 'Surtitre vacanciers', '05_texte_qr_code': 'Texte QR code', '06_carte_qr_code': 'Carte QR code',
 '07_texte_groupes': 'Texte groupes', '08_texte_messagerie': 'Texte messagerie', '09_texte_agenda': 'Texte agenda',
 '10_texte_carte': 'Texte carte', '11_surtitre_gerant': 'Surtitre gerant', '12_titre_gerant': 'Titre gerant',
 '13_texte_animations': 'Texte animations', '14_vignette_animations': 'Vignette animations',
 '15_texte_signalements': 'Texte signalements', '16_vignette_signalements': 'Vignette signalements',
 '17_texte_personnalisation': 'Texte personnalisation', '18_vignette_personnalisation': 'Vignette personnalisation',
 '19_etiquettes_gerant': 'Etiquettes gerant', '20_fin_decouvrez': 'Fin - Decouvrez', '21_fin_bouton_demo': 'Fin - Bouton demo',
 '22_fin_email': 'Fin - Email'}

res = ['<format id="r1" name="FFVideoFormat1080x1920p30" frameDuration="1/30s" width="1080" height="1920" colorSpace="1-1-1 (Rec. 709)"/>']
res.append(f'<asset id="plate" name="00_fond_telephone_logo" start="0s" duration="{tc(DUR)}" hasVideo="1" format="r1" videoSources="1" src={quoteattr(url("00_fond_telephone_logo.mp4"))}/>')
for aid, f in [('mus', 'audio/musique_seule.wav'), ('sfx', 'audio/sound_design.wav')]:
    res.append(f'<asset id="{aid}" name="{f.split("/")[-1][:-4]}" start="0s" duration="{tc(DUR)}" hasAudio="1" audioSources="1" audioChannels="2" audioRate="48000" src={quoteattr(url(f))}/>')

# lane assignment (no overlap within a lane)
lanes_end = []
clips = []
for i, t in enumerate(texts):
    s, e = round(t['start'] * FPS), round(t['end'] * FPS)
    for li, le in enumerate(lanes_end):
        if le <= s:
            lanes_end[li] = e; lane = li + 1; break
    else:
        lanes_end.append(e); lane = len(lanes_end)
    aid = f't{i:02d}'
    res.append(f'<asset id="{aid}" name="{t["name"]}" start="0s" duration="{tc(e - s)}" hasVideo="1" format="r1" videoSources="1" src={quoteattr(url("textes/" + t["name"] + ".mov"))}/>')
    clips.append(f'<asset-clip ref="{aid}" lane="{lane}" offset="{tc(s)}" name={quoteattr(LABEL.get(t["name"], t["name"]))} start="0s" duration="{tc(e - s)}" format="r1"/>')

markers = [(0, 'Accroche'), (4, 'Logo'), (8, 'QR code'), (11.5, 'Groupes'), (14.5, 'Messagerie'), (18, 'Agenda'),
           (21.5, 'Carte'), (24, 'Cote gerant'), (26.5, 'Animations'), (29.5, 'Signalements'), (32.5, 'Personnalisation'), (35.5, 'Fin / CTA')]
mk = [f'<marker start="{tc(round(t * FPS))}" duration="1/30s" value={quoteattr(v)}/>' for t, v in markers]

xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
 <resources>
  {chr(10).join('  ' + r for r in res)}
 </resources>
 <library>
  <event name="CampConnect">
   <project name="CampConnect_Pub_v2">
    <sequence format="r1" duration="{tc(DUR)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
     <spine>
      <asset-clip ref="plate" offset="0s" name="Fond + telephone + logo" start="0s" duration="{tc(DUR)}" format="r1">
       {chr(10).join('       ' + m for m in mk)}
       {chr(10).join('       ' + c for c in clips)}
       <asset-clip ref="mus" lane="-1" offset="0s" name="Musique" start="0s" duration="{tc(DUR)}"/>
       <asset-clip ref="sfx" lane="-2" offset="0s" name="Sound design" start="0s" duration="{tc(DUR)}"/>
      </asset-clip>
     </spine>
    </sequence>
   </project>
  </event>
 </library>
</fcpxml>
'''
open('kit/CampConnect_Pub_v2.fcpxml', 'w', encoding='utf-8').write(xml)
print('lanes:', len(lanes_end))
