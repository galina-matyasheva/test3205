import { z } from 'zod';

import { strings } from '../strings/validation';

function hasValidHostname(val: string): boolean {
  const url = new URL(val);
  const hostname = url.hostname;

  if (hostname === 'localhost') return true;
  //Check if hostname is an IPv4 address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

  if (hostname.startsWith('.') || hostname.endsWith('.') || hostname.includes('..')) return false;

  const labels = hostname.split('.');
  if (labels.length < 2) return false;

  for (const label of labels) {
    if (label.length === 0) return false;
    // DNS label must start and end with a letter/digit, hyphens only in the middle
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label)) return false;
  }

  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2) return false;

  return true;
}

export const urlSchema = z.string().refine(
  (val) => {
    try {
      const url = new URL(val);
      return (url.protocol === 'http:' || url.protocol === 'https:') && hasValidHostname(val);
    } catch {
      return false;
    }
  },
  { message: strings.invalidUrl },
);

export const urlsFormSchema = z.array(urlSchema).min(1, strings.atLeastOneUrl);
