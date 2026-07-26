import puppeteer from 'puppeteer'
const CHROME='/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']})
const p=await b.newPage()
await p.setViewport({width:800,height:900})
p.on('console',m=>{ if(m.type()==='error') console.log('  [console]',m.text().slice(0,120)) })
await p.goto('file:///workspace/campconnect/index.html',{waitUntil:'networkidle0'})
await new Promise(r=>setTimeout(r,900))
await p.evaluate(()=>{
  document.querySelector('[name=nom]').value='TEST AUTOMATIQUE — à supprimer'
  document.querySelector('[name=email]').value='test-auto@campconnect.fr'
  document.querySelector('[name=camping]').value='Camping de test'
  document.querySelector('[name=message]').value='Vérification du formulaire'
  document.getElementById('contactForm').dispatchEvent(new Event('submit',{cancelable:true}))
})
await new Promise(r=>setTimeout(r,4000))
const etat=await p.evaluate(()=>({
  succes: getComputedStyle(document.getElementById('cfSuccess')).display !== 'none',
  bouton: document.getElementById('cfBtn')?.textContent?.trim(),
  repli: !!document.getElementById('cfFallback'),
}))
console.log('résultat :', JSON.stringify(etat))
await b.close()
