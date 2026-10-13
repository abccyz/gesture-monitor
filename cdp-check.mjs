import { spawn } from 'node:child_process';

const PORT = 9333;
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu',
  `--remote-debugging-port=${PORT}`, '--window-size=1600,1000',
  '--user-data-dir=/tmp/cdp-profile-gm', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('no devtools target');
}

const ws = new WebSocket(await getWs());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
function send(method, params = {}) {
  const mid = ++id;
  ws.send(JSON.stringify({ id: mid, method, params }));
  return new Promise((r) => pending.set(mid, r));
}
async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (res.result?.exceptionDetails) throw new Error(JSON.stringify(res.result.exceptionDetails));
  return res.result?.result?.value;
}

await send('Page.enable');
await send('Page.navigate', { url: 'http://localhost:4173/' });
await sleep(2500);

const tabs = await evaluate(`Array.from(document.querySelectorAll('*')).filter(e=>/映射/.test(e.textContent||'')&&e.children.length===0).map(e=>e.tagName+':'+e.textContent.trim())`);
console.log('TAB_CANDIDATES', JSON.stringify(tabs));

const clicked = await evaluate(`(()=>{
  const btn = Array.from(document.querySelectorAll('button,[role="tab"],a,div')).find(e=>/映射/.test((e.textContent||'').trim()) && (e.textContent||'').trim().length<8);
  if(!btn) return 'NOT_FOUND';
  btn.click();
  return 'CLICKED:'+btn.tagName+':'+btn.textContent.trim();
})()`);
console.log('CLICK', clicked);
await sleep(800);

const layout = await evaluate(`(()=>{
  const q=(s)=>document.querySelector(s);
  const rect=(s)=>{const el=q(s); if(!el) return null; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return {w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y),display:cs.display,cols:cs.gridTemplateColumns};};
  return {
    body: {w:document.body.clientWidth,h:document.body.clientHeight},
    mapView: !!q('.map-view'),
    list: rect('.map-list'),
    head: rect('.map-head'),
    firstRow: rect('.map-row'),
    firstRowChildren: q('.map-row') ? Array.from(q('.map-row').children).map(c=>{const r=c.getBoundingClientRect();return c.className+':'+Math.round(r.width)+'x'+Math.round(r.height);}) : [],
    chips: Array.from(document.querySelectorAll('.mchip')).slice(0,6).map(c=>c.textContent.trim()),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    docScrollW: document.documentElement.scrollWidth,
    viewportW: document.documentElement.clientWidth,
  };
})()`);
console.log('LAYOUT', JSON.stringify(layout, null, 1));

ws.close();
chrome.kill();
process.exit(0);
