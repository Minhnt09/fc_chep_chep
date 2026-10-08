import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const container = `fc-interactions-qa-${randomUUID().slice(0,8)}`;
const run = (args,input) => {
  const result = spawnSync('docker',args,{input,encoding:'utf8'});
  if(result.status !== 0) throw Error(result.stderr || result.stdout || 'Docker command failed');
  return result.stdout;
};
const sql = input => run(['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'],input);
function asyncSql(input) {
  return new Promise(resolve=>{
    const child = spawn('docker',['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At']);
    let output='';child.stdout.on('data',v=>output+=v);child.stderr.on('data',v=>output+=v);
    child.on('close',code=>resolve({code,output}));child.stdin.end(input);
  });
}
let created=false;
try {
  run(['run','-d','--name',container,'-e',`POSTGRES_PASSWORD=${randomUUID()}`,'postgres:17-alpine']);created=true;
  let ready=false;
  for(let i=0;i<40;i++){const r=spawnSync('docker',['exec',container,'pg_isready','-U','postgres']);if(r.status===0){ready=true;break;}await new Promise(r=>setTimeout(r,250));}
  assert.ok(ready,'Postgres did not start');
  sql(await readFile('tests/database-bootstrap.sql','utf8'));
  const migration = await readFile('supabase/migrations/202610080001_shared_interactions.sql','utf8');
  sql(migration);sql(migration); // rerunning must preserve data/schema without errors
  sql(await readFile('tests/interactions.database.sql','utf8'));
  console.log('Database: aggregates, hidden, DTO privacy, RLS/grants, unique, validation, cooldown, rate limit, pagination passed');
  const uid='33333333-3333-4333-8333-333333333333';
  sql(`insert into auth.users(id) values('${uid}');`);
  const claims=`set request.jwt.claims = '{"sub":"${uid}","is_anonymous":true}'; set role authenticated;`;
  const first=asyncSql(`begin; ${claims} select public.fc_add_comment('bayco','Concurrent','First'); select pg_sleep(1); commit;`);
  // Wait until transaction one holds its lock, so transaction two must serialize behind it.
  for(let i=0;i<40;i++){if(sql("select count(*) from pg_locks where locktype='advisory' and granted;").trim()!=='0')break;await new Promise(r=>setTimeout(r,25));}
  const second=asyncSql(`${claims} select public.fc_add_review('Concurrent',5,'Second');`);
  const results=await Promise.all([first,second]);
  assert.equal(results[0].code,0,results[0].output);assert.notEqual(results[1].code,0);assert.match(results[1].output,/đợi/);
  assert.equal(sql(`select (select count(*) from public.comments where visitor_id='${uid}') + (select count(*) from public.reviews where visitor_id='${uid}');`).trim(),'1');
  console.log('Database: simultaneous comment/review serialized; only one write accepted');
} finally { if(created)run(['rm','-f',container]); }
