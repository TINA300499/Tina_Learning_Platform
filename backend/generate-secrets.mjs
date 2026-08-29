import crypto from "node:crypto";
console.log(`TINA_MASTER_KEY_BASE64=${crypto.randomBytes(32).toString("base64")}`);
