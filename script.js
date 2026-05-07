// MOBILE MENU
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("navMenu");

toggle?.addEventListener("click", () => {
  nav.classList.toggle("active");
});

// SMOOTH SCROLL ACTIVE LINKS
document.querySelectorAll("a[href^='#']").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    document.querySelector(link.getAttribute("href")).scrollIntoView({
      behavior: "smooth"
    });
  });
});

// COUNTERS
const counters = document.querySelectorAll(".counter");

const runCounter = () => {
  counters.forEach(counter => {
    const update = () => {
      const target = +counter.getAttribute("data-target");
      const value = +counter.innerText;

      const inc = target / 50;

      if (value < target) {
        counter.innerText = Math.ceil(value + inc);
        setTimeout(update, 50);
      } else {
        counter.innerText = target;
      }
    };
    update();
  });
};

// SKILL BARS
const bars = document.querySelectorAll(".bar span");

const fillBars = () => {
  bars.forEach(bar => {
    bar.style.width = bar.dataset.width + "%";
  });
};

// SCROLL TRIGGER
window.addEventListener("scroll", () => {
  const trigger = window.innerHeight;

  counters.forEach(c => {
    if (c.getBoundingClientRect().top < trigger) runCounter();
  });

  bars.forEach(b => {
    if (b.getBoundingClientRect().top < trigger) fillBars();
  });
});

// CONTACT FORM
document.getElementById("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  alert("Message Sent (Demo Mode)");
});
