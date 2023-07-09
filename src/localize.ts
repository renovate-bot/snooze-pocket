/**
 * Localization/internationalization helper.
 */
import type {Browser} from 'webextension-polyfill';

declare const browser: Browser;

/**
 * Localizes an HTML page.
 *
 * @param root optional root element to localize down from. Defaults to entire document.
 */
export async function localize(root: HTMLElement = undefined): Promise<void> {
  root ??= document.body;
  console.debug('[localize] called', {root});

  for (const i18nElement of document.querySelectorAll('[data-i18n-message]')) {
    i18nElement.textContent = browser.i18n.getMessage(
      i18nElement.getAttribute('data-i18n-message')!,
    );
  }
  for (const i18nElement of document.querySelectorAll('[data-i18n-attrs]')) {
    for (const [data, attr] of i18nElement
      .getAttributeNames()
      .filter(dataAttr => dataAttr.startsWith('data-i18n-attr-'))
      .map(dataAttr => [dataAttr, dataAttr.slice('data-i18n-attr-'.length)])) {
      const message = browser.i18n.getMessage(i18nElement.getAttribute(data)!);
      i18nElement.setAttribute(attr, message);
    }
  }
}
