// This file manages the valid APOD date range and default nine-day selection.
(() => {
  const APOD_FIRST_DATE = "1995-06-16";
  const MAX_DAYS = 9;
  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");

  function toLocalISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(dateString, amount) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + amount);
    return toLocalISODate(date);
  }

  const today = toLocalISODate(new Date());
  const defaultStart = addDays(today, -(MAX_DAYS - 1));

  startInput.min = APOD_FIRST_DATE;
  startInput.max = today;
  endInput.min = APOD_FIRST_DATE;
  endInput.max = today;
  startInput.value = defaultStart < APOD_FIRST_DATE ? APOD_FIRST_DATE : defaultStart;
  endInput.value = today;

  startInput.addEventListener("change", () => {
    if (!startInput.value) return;

    endInput.min = startInput.value;
    const latestAllowedEnd = addDays(startInput.value, MAX_DAYS - 1);
    endInput.max = latestAllowedEnd < today ? latestAllowedEnd : today;

    if (!endInput.value || endInput.value < startInput.value || endInput.value > endInput.max) {
      endInput.value = endInput.max;
    }
  });

  endInput.addEventListener("change", () => {
    if (!endInput.value) return;

    const earliestAllowedStart = addDays(endInput.value, -(MAX_DAYS - 1));
    startInput.max = endInput.value;
    startInput.min = earliestAllowedStart > APOD_FIRST_DATE ? earliestAllowedStart : APOD_FIRST_DATE;

    if (!startInput.value || startInput.value > endInput.value || startInput.value < startInput.min) {
      startInput.value = startInput.min;
    }
  });

  window.apodDateRange = {
    firstDate: APOD_FIRST_DATE,
    maxDays: MAX_DAYS,
    today,
    addDays
  };
})();
