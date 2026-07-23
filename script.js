// Replace DEMO_KEY with your personal key from https://api.nasa.gov/.
const NASA_API_KEY = "kemKhW8lK7FAkCC0JF0xFUknbphdFzWf0oIcZfTO";
const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";

const dateForm = document.getElementById("date-form");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const fetchButton = document.getElementById("fetch-button");
const gallery = document.getElementById("gallery");
const statusMessage = document.getElementById("status-message");
const gallerySummary = document.getElementById("gallery-summary");
const spaceFact = document.getElementById("space-fact");
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const modalMedia = document.getElementById("modal-media");
const modalDate = document.getElementById("modal-date");
const modalTitle = document.getElementById("modal-title");
const modalExplanation = document.getElementById("modal-explanation");
const modalCopyright = document.getElementById("modal-copyright");

let lastFocusedElement = null;

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "Sunlight takes about eight minutes to reach Earth.",
  "The footprints left on the Moon can last for millions of years because there is almost no wind or rain.",
  "Jupiter is so large that more than 1,300 Earths could fit inside it by volume.",
  "Neutron stars can spin hundreds of times per second.",
  "Mars is home to Olympus Mons, the largest known volcano in the solar system.",
  "Saturn would float in water if a container large enough existed because its average density is lower than water.",
  "The Milky Way contains billions of stars, and our Sun is only one of them.",
  "A light-year measures distance, not time—it is how far light travels in one year.",
  "The International Space Station circles Earth roughly every 90 minutes."
];

function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  spaceFact.textContent = spaceFacts[randomIndex];
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getInclusiveDayCount(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseDate(endDate) - parseDate(startDate)) / millisecondsPerDay) + 1;
}

function formatDate(dateString) {
  return parseDate(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";
  if (type) statusMessage.classList.add(type);
}

function validateDates(startDate, endDate) {
  if (!startDate || !endDate) {
    return "Please select both a start date and an end date.";
  }

  if (startDate < window.apodDateRange.firstDate) {
    return "NASA's APOD archive begins on June 16, 1995.";
  }

  if (endDate > window.apodDateRange.today) {
    return "The end date cannot be later than today.";
  }

  if (startDate > endDate) {
    return "The start date must be before the end date.";
  }

  const dayCount = getInclusiveDayCount(startDate, endDate);
  if (dayCount > window.apodDateRange.maxDays) {
    return "Please choose a range of 9 days or fewer.";
  }

  return "";
}

async function fetchApodData(startDate, endDate) {
  const query = new URLSearchParams({
    api_key: NASA_API_KEY,
    start_date: startDate,
    end_date: endDate,
    thumbs: "true"
  });

  const response = await fetch(`${APOD_ENDPOINT}?${query}`);

  if (!response.ok) {
    let message = `NASA API request failed (${response.status}).`;

    try {
      const errorData = await response.json();
      if (errorData?.error?.message) message = errorData.error.message;
      if (errorData?.msg) message = errorData.msg;
    } catch {
      // Keep the default message if the response is not JSON.
    }

    throw new Error(message);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "gallery-card";
  card.setAttribute("aria-label", `Open details for ${item.title}, ${formatDate(item.date)}`);

  const media = document.createElement("div");
  media.className = "card-media";

  const image = document.createElement("img");
  image.loading = "lazy";
  image.alt = item.title;
  image.src = item.media_type === "video"
    ? item.thumbnail_url || "https://images-assets.nasa.gov/image/iss066e081311/iss066e081311~medium.jpg"
    : item.url;

  image.addEventListener("error", () => {
    image.alt = "Preview unavailable";
    image.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#061f4a"/>
        <circle cx="400" cy="250" r="115" fill="#105bd8"/>
        <text x="400" y="445" fill="white" text-anchor="middle" font-family="Arial" font-size="34">Preview unavailable</text>
      </svg>
    `);
  }, { once: true });

  media.append(image);

  if (item.media_type === "video") {
    const badge = document.createElement("span");
    badge.className = "video-badge";
    badge.textContent = "▶ Video";
    media.append(badge);
  }

  const content = document.createElement("div");
  content.className = "card-content";

  const date = document.createElement("p");
  date.className = "card-date";
  date.textContent = formatDate(item.date);

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = item.title;

  content.append(date, title);
  card.append(media, content);
  card.addEventListener("click", () => openModal(item, card));

  return card;
}

function displayGallery(items) {
  gallery.replaceChildren();

  const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const fragment = document.createDocumentFragment();

  sortedItems.forEach((item) => fragment.append(createCard(item)));
  gallery.append(fragment);

  gallerySummary.textContent = `${sortedItems.length} ${sortedItems.length === 1 ? "entry" : "entries"}`;
  setStatus("");
}

function isEmbeddableVideo(url) {
  return /youtube\.com\/embed|player\.vimeo\.com\/video/.test(url);
}

function openModal(item, triggerElement) {
  lastFocusedElement = triggerElement;
  modalMedia.replaceChildren();

  if (item.media_type === "video") {
    if (isEmbeddableVideo(item.url)) {
      const iframe = document.createElement("iframe");
      iframe.src = item.url;
      iframe.title = item.title;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      modalMedia.append(iframe);
    } else {
      const wrap = document.createElement("div");
      wrap.className = "video-link-wrap";

      const message = document.createElement("p");
      message.textContent = "This APOD entry is a video hosted on an external site.";

      const link = document.createElement("a");
      link.className = "video-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Watch the NASA video";

      wrap.append(message, link);
      modalMedia.append(wrap);
    }
  } else {
    const image = document.createElement("img");
    image.src = item.hdurl || item.url;
    image.alt = item.title;
    modalMedia.append(image);
  }

  modalDate.textContent = formatDate(item.date);
  modalTitle.textContent = item.title;
  modalExplanation.textContent = item.explanation;
  modalCopyright.textContent = item.copyright ? `Image credit: ${item.copyright}` : "";

  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalClose.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  modalMedia.replaceChildren();
  lastFocusedElement?.focus();
}

async function loadGallery(startDate, endDate) {
  const validationError = validateDates(startDate, endDate);

  if (validationError) {
    gallery.replaceChildren();
    gallerySummary.textContent = "";
    setStatus(validationError, "error");
    return;
  }

  fetchButton.disabled = true;
  fetchButton.textContent = "Loading...";
  gallery.replaceChildren();
  gallerySummary.textContent = "";
  setStatus("🔄 Loading space photos…", "loading");

  try {
    const items = await fetchApodData(startDate, endDate);
    displayGallery(items);
  } catch (error) {
    console.error(error);
    setStatus(
      `${error.message} Check your API key and internet connection, then try again.`,
      "error"
    );
  } finally {
    fetchButton.disabled = false;
    fetchButton.textContent = "Get Space Images";
  }
}

dateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadGallery(startDateInput.value, endDateInput.value);
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

showRandomFact();
loadGallery(startDateInput.value, endDateInput.value);
