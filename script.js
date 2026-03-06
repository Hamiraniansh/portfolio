const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

const DB_URL = "https://jsonbox.io/box_portfolio_contact";

const DB_NAME = "bruhzansh_portfolio";
const DB_VERSION = 1;
const STORE_CONTACTS = "contacts";

function toggleNav() {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  nav.classList.toggle("is-open");
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_CONTACTS)) {
        db.createObjectStore(STORE_CONTACTS, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveContactDB(data) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_CONTACTS, "readwrite");
    tx.objectStore(STORE_CONTACTS).add(data);
    return tx.complete;
  } catch (error) {
    console.warn("IndexedDB save failed", error);
  }
}

async function getStoredContacts() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_CONTACTS, "readonly");
    const store = tx.objectStore(STORE_CONTACTS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("IndexedDB read failed", error);
    return [];
  }
}

function closeNav() {
  navToggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
}

async function submitContact(data) {
  const response = await fetch(DB_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to save contact: ${response.statusText}`);
  }

  return response.json();
}

function saveContactLocal(data) {
  const existing = JSON.parse(localStorage.getItem("contactMessages") || "[]");
  existing.push(data);
  localStorage.setItem("contactMessages", JSON.stringify(existing));
}

async function saveContactOffline(data) {
  saveContactLocal(data);
  await saveContactDB(data);
}

window.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (navToggle) {
    navToggle.addEventListener("click", toggleNav);
  }

  // Initialize the in-browser database early so it can accept writes immediately.
  openDatabase().catch((error) => {
    console.warn("Failed to initialize indexedDB:", error);
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) {
        closeNav();
      }
    });
  });

  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const message = {
        name: formData.get("name")?.toString().trim(),
        email: formData.get("email")?.toString().trim(),
        message: formData.get("message")?.toString().trim(),
        submittedAt: new Date().toISOString(),
      };

      try {
        const submitButton = contactForm.querySelector("button[type='submit']");
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Sending...";
        }

        await submitContact(message);
        await saveContactOffline(message);

        alert("Thanks! Your message has been saved.");
        contactForm.reset();
      } catch (error) {
        console.error(error);
        alert("We couldn't submit your message. Please try again later.");
      } finally {
        const submitButton = contactForm.querySelector("button[type='submit']");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Send message";
        }
      }
    });
  }

  const quotes = [
    "The second any blood is shed, we’ll no longer be robbers. We’ll become murderers.",
    "Sometimes a truce is the most important battle of all.",
    "The perfect crime doesn’t exist. But the perfect plan does.",
    "In the end, love is a weakness that can destroy you.",
    "When you hit rock bottom, you only have one way to go… up.",
    "Hope is kind of like dominos. Once one falls, the rest follow.",
    "I’m not a hero, I’m a robber.",
    "Nothing is more valuable than freedom.",
    "Plans are only as good as the people who follow them.",
    "The world will always try to erase you, but you have to resist.",
    "Sometimes, the best way to save someone is to let them fall.",
    "Chaos is not a pit. Chaos is a ladder.",
    "Behind every mask, there’s a story.",
    "Love doesn’t last in a war. Strategy does.",
    "We are not afraid of dying, we are afraid of being forgotten.",
    "A good plan today is better than a perfect plan tomorrow.",
    "The most dangerous weapon is a calm mind in a storm.",
    "Even the strongest walls can be broken with the right key.",
    "In a world of rules, sometimes breaking them is the only way to survive.",
    "We all wear masks, but some hide their pain better than others.",
  ];

  const quoteEl = document.querySelector(".testimonial");
  const metaName = document.querySelector(".testimonial-name");
  const metaTag = document.querySelector(".testimonial-tag");

  if (quoteEl && metaName && metaTag) {
    let current = 0;

    function showQuote(index) {
      const quote = quotes[index % quotes.length];
      quoteEl.textContent = quote;
      metaName.textContent = "– Professor";
      metaTag.textContent = "(confidential)";
      quoteEl.classList.add("fade-in");
      setTimeout(() => quoteEl.classList.remove("fade-in"), 1200);
    }

    showQuote(current);
    setInterval(() => {
      current = (current + 1) % quotes.length;
      showQuote(current);
    }, 20000);
  }
});
