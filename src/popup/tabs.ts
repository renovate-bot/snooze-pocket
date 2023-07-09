/**
 * Top tabs.
 */
import {byId} from './shortcuts';
import {sync} from './snoozed-list-tab';

const tabs = Array.from(byId('tabset').children) as HTMLLIElement[];
const syncButton = byId('button-sync') as HTMLButtonElement;
const syncButtonAnimationSpan = syncButton.querySelector('span')!;

/**
 * Sets up the tabs.
 */
export function setupTabs() {
  console.debug('[setupTabs] called');

  syncButton.addEventListener('click', event => {
    console.debug('[syncButton] clicked');
    event.stopPropagation();
    sync(true);
  });

  for (const clickedTab of tabs) {
    clickedTab.addEventListener('click', () => {
      console.debug('[clickedTab] clicked', {clickedTab});
      for (const otherTab of tabs.filter(tab => tab !== clickedTab)) {
        otherTab.classList.remove('tabset__tab--selected');
        otherTab.firstElementChild?.classList.remove(
          'tabset__tab--selected__handle',
        );
        for (const button of otherTab.querySelectorAll('button')) {
          button.disabled = true;
        }
        document.getElementById(
          otherTab.getAttribute('data-section-id')!,
        )!.hidden = true;
      }

      clickedTab.classList.add('tabset__tab--selected');
      clickedTab.firstElementChild?.classList.add(
        'tabset__tab--selected__handle',
      );
      for (const button of clickedTab.querySelectorAll('button')) {
        // Should only be enabled if it's not currently pending.
        button.disabled = button.classList.contains('pending');
      }
      document.getElementById(
        clickedTab.getAttribute('data-section-id')!,
      )!.hidden = false;
    });
  }
}

/**
 * Disables the sync button.
 */
export function disableSyncButton() {
  syncButton.disabled = true;
  syncButton.classList.add('pending');
}

/**
 * Enables the sync button, after its animation finishes an iteration.
 */
export function animationDelayedEnableSyncButton() {
  syncButtonAnimationSpan.addEventListener(
    'animationiteration',
    () => {
      // Should only be enabled if it's in the currently selected tab.
      syncButton.disabled = !syncButton.closest(
        '.tabset__tab--selected__handle',
      );
      syncButton.classList.remove('pending');
    },
    {once: true},
  );
}
