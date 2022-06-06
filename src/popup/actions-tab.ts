/**
 * Actions tab.
 */
import * as dayjs from 'dayjs';
import * as localizedFormat from 'dayjs/plugin/localizedFormat';
import filterUnique from 'filter-unique';
import type {FlatpickrFn} from 'flatpickr/dist/types/instance';
import type {Browser} from 'webextension-polyfill';
import {Actions} from '../enums';
import {getSettings} from '../settings';
import {sendMessage} from './message';
import {byId} from './shortcuts';
import {expandTemplate} from './template';
import {displayToast} from './toast';

declare const browser: Browser;
declare const flatpickr: FlatpickrFn;

const DUSK_HOUR = 4;
const QUARTER_IN_MONTHS = 3;

const SNOOZED_SUCCESS_ICON_MS = 800;

dayjs.extend(localizedFormat);

const snoozingIcon = byId('snoozing-icon');

const snoozeDateInput = byId('snooze-date-input') as HTMLFormElement;
const snoozeDateSubmit = byId('snooze-date-submit') as HTMLButtonElement;
const snoozeButtonTemplate = byId(
  'snooze-button-template'
) as HTMLTemplateElement;

const snoozeButtonsContainer = byId('snooze-buttons-container');
const snoozeDatePicker = byId('snooze-date-picker') as HTMLInputElement;

declare type SnoozeButton = {
  untilTimestamp: number;
  topText: string;
  buttomText: string;
};

/**
 * Returns the date of the next day of the week.
 *
 * @param date the date to start from.
 * @param dayOfWeek the day of the week to advance to.
 * @returns the date of the next day of the week.
 */
function nextDayOfWeek(
  date: dayjs.Dayjs,
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
): dayjs.Dayjs {
  return date.add(((dayOfWeek - date.day() - 7) % 7) + 7, 'day');
}

/**
 * Creates a single snooze button.
 * @param until until when to snooze this item.
 * @param topText text to place on the top of the button.
 * @returns a UI snooze button params object.
 */
function createSnoozeButton(until: dayjs.Dayjs, topText: string): SnoozeButton {
  return {
    untilTimestamp: until.unix(),
    topText,
    buttomText: until.calendar(),
  };
}

/**
 * Creates a series of snooze buttons that are relevant to the current time.
 */
async function createSnoozeButtons(): Promise<SnoozeButton[]> {
  console.debug('[snoozeButtons] called');
  const {
    morningHour,
    morningMinute,
    eveningHour,
    eveningMinute,
    firstDayOfWeek,
    weekendDay,
  } = await getSettings();

  const buttons: SnoozeButton[] = [];

  const now = dayjs().startOf('minute');
  const morning = now.hour(morningHour).minute(morningMinute);

  if (DUSK_HOUR < now.hour() && now.hour() < eveningHour - 1) {
    buttons.push(
      createSnoozeButton(
        now.hour(eveningHour).minute(eveningMinute),
        browser.i18n.getMessage('snoozeButtonThisEvening')
      )
    );
  } else if (now.hour() < DUSK_HOUR) {
    buttons.push(
      createSnoozeButton(
        morning,
        browser.i18n.getMessage('snoozeButtonInTheMorning')
      )
    );
  }

  buttons.push(
    createSnoozeButton(
      morning.add(1, 'day'),
      browser.i18n.getMessage('snoozeButtonTomorrowMorning')
    )
  );

  const weekend = nextDayOfWeek(morning, weekendDay);
  const topText = browser.i18n.getMessage(
    weekend.diff(morning, 'day') < (weekendDay - firstDayOfWeek + 7) % 7
      ? 'snoozeButtonThisWeekend'
      : 'snoozeButtonNextWeekend'
  );
  buttons.push(createSnoozeButton(weekend, topText));

  buttons.push(
    createSnoozeButton(
      nextDayOfWeek(morning, firstDayOfWeek),
      browser.i18n.getMessage('snoozeButtonNextWeek')
    )
  );
  buttons.push(
    createSnoozeButton(
      morning.add(QUARTER_IN_MONTHS, 'month'),
      browser.i18n.getMessage('snoozeButtonInOneQuarter')
    )
  );
  buttons.push(
    createSnoozeButton(
      morning.add(1, 'year'),
      browser.i18n.getMessage('snoozeButtonInOneYear')
    )
  );

  return filterUnique(
    buttons.sort((left, right) => left.untilTimestamp - right.untilTimestamp),
    button => button.untilTimestamp
  );
}

/**
 * Allows or disallows interacting with the snooze tab.
 *
 * @param enabled whether to allow.
 */
function allowInteraction(enabled: boolean): void {
  snoozeDatePicker.disabled = !enabled;
  snoozeButtonsContainer.querySelectorAll('button').forEach(button => {
    button.disabled = !enabled;
  });
}

/**
 * Snoozes a webpage.
 *
 * @param url to add to Pocket.
 * @param untilTimestamp until when to snooze this item (seconds).
 */
async function snooze(url: string, untilTimestamp: number): Promise<void> {
  console.debug('[snooze] called', {url, untilTimestamp});
  try {
    snoozingIcon.classList.add('working');
    allowInteraction(false);
    await sendMessage({action: Actions.SNOOZE, url, untilTimestamp});
    snoozingIcon.classList.remove('working');
    snoozingIcon.classList.add('success');
    setTimeout(() => {
      if (snoozingIcon.closest('.tabset__tab--selected__handle')) {
        window.close();
      } else {
        snoozingIcon.classList.remove('success');
        allowInteraction(true);
      }
    }, SNOOZED_SUCCESS_ICON_MS);
  } catch (error) {
    console.error('[snooze]', error);
    snoozingIcon.classList.remove('working');
    allowInteraction(true);
    displayToast(browser.i18n.getMessage('toastCannotSnooze'), error);
  }
}

/**
 * Sets up the actions tab.
 */
export async function setupActionTab(): Promise<void> {
  console.debug('[setupActionTab] called');
  const snoozeButtons = await createSnoozeButtons();
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTabs.length !== 1 || activeTabs[0].url === undefined) {
    return;
  }
  const {url} = activeTabs[0];

  for (const {untilTimestamp, topText, buttomText} of snoozeButtons) {
    const snoozeButton =
      expandTemplate<HTMLButtonElement>(snoozeButtonTemplate);
    snoozeButton.querySelector('.top-text')!.textContent = topText;
    snoozeButton.querySelector('.buttom-text')!.textContent = buttomText;

    snoozeButton.addEventListener('click', async () => {
      console.debug('[snoozeButton] clicked', {snoozeButton});
      await snooze(url, untilTimestamp);
    });

    snoozeDateInput.before(snoozeButton);
  }

  const snoozeDatePickerInstance = flatpickr(snoozeDatePicker, {
    enableTime: false,
    formatDate: (date: Date) => {
      return dayjs(date).format('dddd, LL');
    },
    minDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    onChange: (dates: Date[]) => {
      snoozeDateSubmit.disabled = !dates.length;
    },
    position: 'above',
  });

  snoozeDateSubmit.addEventListener('click', async event => {
    console.debug('[snoozeDateSubmit] clicked');
    event.stopPropagation();
    const untilTimestamp = dayjs(snoozeDatePickerInstance.selectedDates[0])
      .startOf('day')
      .unix();
    await snooze(url, untilTimestamp);
  });
}
