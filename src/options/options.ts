/**
 * Extension's options page script.
 */
import dayjs = require('dayjs');
import * as localizedFormat from 'dayjs/plugin/localizedFormat';
import type {Browser} from 'webextension-polyfill';
import {localize} from '../localize';
import {getSettings} from '../settings';

declare const browser: Browser;

const FIRST_DAY_OF_WEEK_AND_WEEKEND_PAIRS = [
  [6, 4],
  [6, 5],
  [0, 5],
  [0, 6],
  [1, 5],
  [1, 6],
  [1, 0],
];

dayjs.extend(localizedFormat);

const byId = (id: string) => document.getElementById(id)!;
const twoNumericValues = (element: HTMLSelectElement) =>
  element.value.split(';').map(s => Number(s));

const morningTimeSelect = byId('morning-time') as HTMLSelectElement;
const eveningTimeSelect = byId('evening-time') as HTMLSelectElement;
const daysSelect = byId('days') as HTMLSelectElement;

/**
 * Creates <option> tags for every half hour between start and end.
 *
 * @param element the <select> container element.
 * @param start start hour
 * @param end end hour
 * @param selectedHour currently selected hour component
 * @param selectedMinute currently selected minute component
 */
function createTimeOptions(
  element: HTMLSelectElement,
  start: number,
  end: number,
  selectedHour: number,
  selectedMinute: number
) {
  for (let hour = start; hour < end; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const date = dayjs().hour(hour).minute(minute);
      const option = document.createElement('option');
      option.textContent = date.format('LT');
      option.value = `${hour};${minute}`;
      if (hour === selectedHour && minute === selectedMinute) {
        option.selected = true;
      }
      element.appendChild(option);
    }
  }
}

/**
 * Initializes the options page.
 */
async function initialize() {
  localize();

  const settings = await getSettings();

  createTimeOptions(
    morningTimeSelect,
    5,
    12,
    settings.morningHour,
    settings.morningMinute
  );
  morningTimeSelect.addEventListener('input', () => {
    const [morningHour, morningMinute] = twoNumericValues(morningTimeSelect);
    browser.storage.sync.set({morningHour, morningMinute});
  });

  createTimeOptions(
    eveningTimeSelect,
    16,
    24,
    settings.eveningHour,
    settings.eveningMinute
  );
  eveningTimeSelect.addEventListener('input', () => {
    const [eveningHour, eveningMinute] = twoNumericValues(eveningTimeSelect);
    browser.storage.sync.set({eveningHour, eveningMinute});
  });

  for (const [start, end] of FIRST_DAY_OF_WEEK_AND_WEEKEND_PAIRS) {
    const week = dayjs().set('day', start);
    const weekend = dayjs().set('day', end);
    const option = document.createElement('option');
    option.textContent = browser.i18n.getMessage('optionsDaysOption', [
      week.format('dddd'),
      weekend.format('dddd'),
    ]);
    option.value = `${start};${end}`;
    if (start === settings.firstDayOfWeek && end === settings.weekendDay) {
      option.selected = true;
    }
    daysSelect.appendChild(option);
  }
}
daysSelect.addEventListener('input', () => {
  const [firstDayOfWeek, weekendDay] = twoNumericValues(daysSelect);
  browser.storage.sync.set({firstDayOfWeek, weekendDay});
});

initialize();
