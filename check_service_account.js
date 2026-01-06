import fs from 'fs';
import path from 'path';

const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(keyPath)) {
  console.error('serviceAccountKey.json not found at', keyPath);
  process.exit(1);
}

const raw = fs.readFileSync(keyPath, 'utf8');
if (!raw || raw.trim().length === 0) {
  console.error('serviceAccountKey.json is empty');
  process.exit(2);
}

try {
  const obj = JSON.parse(raw);
  const hasKey = typeof obj.private_key === 'string' && obj.private_key.length > 0;
  const looksLikePem = hasKey && /-----BEGIN PRIVATE KEY-----/.test(obj.private_key) && /-----END PRIVATE KEY-----/.test(obj.private_key);

  console.log('serviceAccountKey.json: valid JSON');
  console.log('Has private_key field:', hasKey);
  console.log('private_key looks like PEM:', looksLikePem);

  if (hasKey) {
    const pk = obj.private_key;
    const sample = pk.slice(0, 12) + '...' + pk.slice(-12);
    console.log('private_key sample (masked):', sample);
  }

  process.exit(0);
} catch (err) {
  console.error('serviceAccountKey.json is not valid JSON:');
  console.error(err.message);
  console.error('First 400 chars of file:');
  console.error(raw.slice(0, 400));
  process.exit(3);
}
