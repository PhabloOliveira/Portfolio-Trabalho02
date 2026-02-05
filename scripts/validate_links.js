const fs = require('fs');
const path = require('path');

const root = process.cwd();
const htmlFiles = [];

function walk(dir){
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for(const it of items){
    const p = path.join(dir, it.name);
    if(it.isDirectory()){
      walk(p);
    } else if(/\.html?$/.test(it.name)){
      htmlFiles.push(p);
    }
  }
}

walk(root);

if(htmlFiles.length===0){
  console.error('Nenhum arquivo HTML encontrado para validar');
  process.exit(2);
}

const fetchWithTimeout = (url, opts = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const signal = controller.signal;
  return fetch(url, Object.assign({}, opts, { signal })).finally(()=>clearTimeout(id));
};

async function checkUrl(file, u){
  if(!u || u.startsWith('#') || u.startsWith('mailto:')) return null;
  if(u.startsWith('http://') || u.startsWith('https://')){
    try{
      let res;
      try{
        // try HEAD first
        res = await fetchWithTimeout(u, { method: 'HEAD' }, 10000);
      } catch(e){
        // fallback to GET with a browser-like User-Agent and timeout
        try{
          res = await fetchWithTimeout(u, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CI/1.0)' } }, 10000);
        } catch(e2){
          return {file,u,error: e2.message || 'no-response'};
        }
      }

      // Treat 2xx and 3xx as OK. Many sites return 405 for automated HEAD requests;
      // treat 405 as non-fatal (warn only) to avoid failing CI on third-party hosts.
      if(res && res.status){
        if(res.status === 405){
          console.warn(`Warning: ${u} returned 405 Method Not Allowed; skipping strict check.`);
          return null;
        }
        if(res.status >= 400) return {file,u,status:res.status};
      }
      if(!res) return {file,u,status:'no-response'};
      return null;
    } catch(err){
      return {file,u,error:err.message};
    }
  } else {
    const localPath = path.join(path.dirname(file), u);
    if(!fs.existsSync(localPath)) return {file,u,reason:'missing-file'};
    return null;
  }
}

(async ()=>{
  const checks = [];
  for(const file of htmlFiles){
    const content = fs.readFileSync(file, 'utf8');
    const hrefs = [...content.matchAll(/href\s*=\s*"([^"]+)"/g)].map(m=>m[1]);
    const srcs = [...content.matchAll(/src\s*=\s*"([^"]+)"/g)].map(m=>m[1]);
    const urls = [...new Set([...hrefs, ...srcs])];
    for(const u of urls){
      checks.push(checkUrl(file,u));
    }
  }

  const results = await Promise.all(checks);
  const invalids = results.filter(Boolean);
  if(invalids.length>0){
    console.error('Links ou imagens inválidos encontrados:');
    invalids.forEach(it=>console.error(JSON.stringify(it)));
    process.exit(3);
  }
  console.log('Validação de links concluída sem erros');
})();
