import {localize} from '../localize';

/**
 * Clones and localizes a template into a DOM element.
 *
 * @param template HTML element of the template.
 * @returns a cloned version of the template's root contents, localized.
 */
export function expandTemplate<E extends HTMLElement>(
  template: HTMLTemplateElement
): E {
  const element = template.content.children[0].cloneNode(true) as E;
  localize(element);
  return element;
}
