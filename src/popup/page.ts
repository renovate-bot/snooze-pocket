/**
 * Page-wide interactions.
 */
import {byId} from './shortcuts';

const authenticateSection = byId('authenticate');
const interfaceSection = byId('interface');

/**
 * Shows the extension main interface.
 */
export function showInterface() {
  authenticateSection.hidden = true;
  interfaceSection.hidden = false;
}

/**
 * Shows the Pocket authentication interface.
 */
export function showAuthenticationPage() {
  authenticateSection.hidden = false;
  interfaceSection.hidden = true;
}
