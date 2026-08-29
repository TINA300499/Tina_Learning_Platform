import fs from "node:fs";
import assert from "node:assert/strict";

const ws =
  fs.readFileSync(
    "workspace-completion-v14.js",
    "utf8"
  );

const server =
  fs.readFileSync(
    "backend/server.mjs",
    "utf8"
  );

const results=[];

function check(name,fn){
  try{
    fn();
    results.push({name,pass:true});
  }catch(error){
    results.push({
      name,
      pass:false,
      detail:error.message
    });
  }
}

check(
  "reserved-qa-prefix-retained",
  ()=>{
    assert.match(
      ws,
      /__tina_test__/
    );
  }
);

check(
  "frontend-residual-closure-installed",
  ()=>{
    assert.match(
      ws,
      /TINA_V14_DISPOSABLE_QA_RESIDUAL_CLOSURE/
    );
  }
);

check(
  "frontend-purge-id-based",
  ()=>{
    assert.match(
      ws,
      /startsWith\(QA_PREFIX\)/
    );
  }
);

check(
  "backend-sanitizer-present",
  ()=>{
    assert.match(
      server,
      /function stripDisposableQaFixtures/
    );
  }
);

check(
  "backend-post-uses-clean-snapshot",
  ()=>{
    assert.match(
      server,
      /cleanSnapshot=stripDisposableQaFixtures\(snapshot\)/
    );

    assert.match(
      server,
      /encryptJSON\(cleanSnapshot\)/
    );
  }
);

check(
  "backend-get-sanitizes-snapshot",
  ()=>{
    assert.match(
      server,
      /stripDisposableQaFixtures\(decryptJSON\(row\.payload_enc\)\)/
    );
  }
);

check(
  "does-not-filter-by-temporary-title",
  ()=>{
    const helperStart=
      server.indexOf(
        "function stripDisposableQaFixtures"
      );

    const routeStart=
      server.indexOf(
        'if(req.method==="POST"&&url.pathname==="/api/sync/snapshot")'
      );

    assert.ok(helperStart>=0);
    assert.ok(routeStart>helperStart);

    const helper=
      server.slice(
        helperStart,
        routeStart
      );

    assert.equal(
      helper.includes('"Temporary"'),
      false
    );

    assert.equal(
      helper.includes('"QA issue"'),
      false
    );
  }
);

check(
  "no-mutation-observer",
  ()=>{
    const idx=
      ws.indexOf(
        "TINA_V14_DISPOSABLE_QA_RESIDUAL_CLOSURE"
      );

    assert.ok(idx>=0);

    const tail=ws.slice(idx);

    const code=tail
      .replace(/\/\*[\s\S]*?\*\//g,"")
      .replace(/\/\/[^\n]*/g,"");

    assert.doesNotMatch(
      code,
      /\bnew\s+MutationObserver\s*\(/
    );

    assert.doesNotMatch(
      code,
      /(^|[^\w.])MutationObserver\s*\(/
    );
  }
);

check(
  "no-polling-loop",
  ()=>{
    const idx=
      ws.indexOf(
        "TINA_V14_DISPOSABLE_QA_RESIDUAL_CLOSURE"
      );

    const tail=ws.slice(idx);

    assert.equal(
      tail.includes("setInterval("),
      false
    );
  }
);


check(
  "transactional-qa-rollback",
  ()=>{
    assert.match(
      ws,
      /TINA_V14_DISPOSABLE_QA_TRANSACTIONAL_ROLLBACK/
    );

    assert.match(
      ws,
      /TinaDisposableQaClosure\?\.purge\?\.\(\)/
    );

    assert.match(
      ws,
      /scheduleSync\?\.\("disposable-qa-rollback"\)/
    );
  }
);

const passed=
  results.filter(x=>x.pass).length;

const failed=
  results.length-passed;

console.log(JSON.stringify({
  suite:"v14-final-qa-contamination-closure",
  passed,
  failed,
  results
},null,2));

if(failed){
  process.exitCode=1;
}
