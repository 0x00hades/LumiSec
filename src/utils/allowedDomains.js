const domainsEnv = process.env.ALLOWED_DOMAINS || '';

const allowedDomains = new Set(
  domainsEnv
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
);

function extractDomainFromEmail(email) {
  if (typeof email !== 'string') return '';
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return '';
  return email.slice(atIndex + 1).toLowerCase();
}

function isDomainAllowed(email) {
  const domain = extractDomainFromEmail(email);
  if (!domain) return false;
  if (allowedDomains.size === 0) return true; // allow all if not set (MVP behavior)
  return allowedDomains.has(domain);
}

export { allowedDomains, isDomainAllowed, extractDomainFromEmail };



