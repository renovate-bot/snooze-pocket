/**
 * Page-wide interactions.
 */
import {byId} from './shortcuts';

const authenticateSection = byId('authenticate');
const interfaceSection = byId('interface');

export function showInterface() {
  authenticateSection.hidden = true;
  interfaceSection.hidden = false;
}

export function showAuthenticationPage() {
  authenticateSection.hidden = false;
  interfaceSection.hidden = true;
}
