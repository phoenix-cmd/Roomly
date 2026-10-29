import fs from 'fs';
import path from 'path';

console.log('🏛️ Roomly System Verification Runner');
console.log('====================================');

const requiredDocs = [
  'docs/PRD.md',
  'docs/ARCHITECTURE.md',
  'docs/DATABASE.md',
  'docs/API.md',
  'docs/SECURITY.md',
  'docs/TESTING.md',
  'docs/ADRs/0001-modular-monolith-and-package-structure.md',
  'docs/ADRs/0002-inventory-concurrency-and-reservation-hold.md',
  'docs/ADRs/0003-payment-abstraction-and-idempotent-webhooks.md',
  'docs/ADRs/0004-multi-tenant-hotel-isolation-and-rbac.md',
  '.env.example',
  'README.md',
];

let docErrors = 0;
for (const doc of requiredDocs) {
  const p = path.resolve(process.cwd(), doc);
  if (fs.existsSync(p)) {
    console.log(`✅ Document Verified: ${doc}`);
  } else {
    console.error(`❌ Missing Document: ${doc}`);
    docErrors++;
  }
}

if (docErrors === 0) {
  console.log('\n✨ All Architectural Documents, Specifications and ADRs are present and verified.');
} else {
  console.error(`\n❌ Failed with ${docErrors} missing documents.`);
  process.exit(1);
}
