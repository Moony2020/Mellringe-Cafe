const menuData = [
  {
    category: "Varma drycker",
    icon: "☕",
    price: "Från 15 kr",
    image: "images/cat-hot-drinks.png",
    items: [
      ["Bryggkaffe", "15/20 kr"],
      ["Te", "15/20 kr"],
      ["Grönt te", "15/20 kr"],
      ["Chai Latte Kaffe", "20/25 kr"],
      ["Cappuccino", "20/25 kr"],
      ["Latte Macchiato", "25/30 kr"],
      ["Kaffe med mjölk", "20/30 kr"],
      ["Varm choklad", "25/30 kr"],
      ["Latte", "25/30 kr"],
      ["Espresso Macchiato", "25/30 kr"]
    ]
  },
  {
    category: "Kalla drycker",
    icon: "🥤",
    price: "Från 15 kr",
    image: "images/cat-cold-drinks.png",
    items: [
      ["Läsk", "15 kr"],
      ["Ayran", "15 kr"],
      ["Loka", "15 kr"],
      ["Juice", "15 kr"],
      ["Red Bull", "25 kr"]
    ]
  },
  {
    category: "Bakelser",
    icon: "🍰",
    price: "Från 10 kr",
    image: "images/cat-pastries.png",
    items: [
      ["Kokoskaka", "12 kr"],
      ["Morotskaka", "15 kr"],
      ["Chokladboll", "10 kr"],
      ["Choklad", "15 kr"],
      ["Croissant", "15 kr"],
      ["Croissant med choklad", "35 kr"],
      ["Croissant med pistage", "35 kr"]
    ]
  },
  {
    category: "Manakish och bröd",
    icon: "🫓",
    price: "Från 15 kr",
    image: "images/cat-manakish.png",
    items: [
      ["Zaatar", "20 kr"],
      ["Ost", "25 kr"],
      ["Grönsaker", "30 kr"],
      ["Kyckling", "30 kr"],
      ["Ost burak", "29 kr"],
      ["Fatayer kött", "29 kr"],
      ["Bröd 400 g", "15 kr"]
    ]
  },
  {
    category: "Falafel",
    icon: "🧆",
    price: "Från 55 kr",
    image: "images/cat-falafel.png",
    items: [
      ["Falafelrulle", "60 kr"],
      ["Falafel med bröd", "60 kr"],
      ["Falafelsnacks", "55 kr"],
      ["Falafelsallad", "75 kr"]
    ]
  },
  {
    category: "Veg",
    icon: "🥗",
    price: "119 kr",
    image: "images/cat-dolma.png",
    items: [
      ["Dolma tallrik", "119 kr"]
    ]
  },
  {
    category: "Såser",
    icon: "🥣",
    price: "10 kr",
    image: "images/cat-sauces.png",
    items: [
      ["Tsatsiki", "10 kr"],
      ["Vitlökssås", "10 kr"],
      ["Yoghurtsås", "10 kr"],
      ["Rhode Island", "10 kr"]
    ]
  },
  {
    category: "Smörgåsar",
    icon: "🥪",
    price: "Från 35 kr",
    image: "images/cat-sandwich.png",
    items: [
      ["Kycklingsmörgås", "45 kr"],
      ["Vegetarisk smörgås", "35 kr"]
    ]
  },
  {
    category: "Meze, sallader & röror",
    icon: "🥗",
    price: "Från 20 kr",
    image: "images/cat-meze.png",
    items: [
      ["Fattoush", "80 kr / 800 g"],
      ["Tabbouleh", "80 kr / 600 g"],
      ["Bulgur", "70 kr / 700 g"],
      ["Hummus", "25 kr / 250 g"],
      ["Mutabbal", "30 kr / 250 g"],
      ["Muhammara", "20 kr"]
    ]
  }
];

const galleryImages = [
  "images/hero-final.png",
  "images/gal-manakish.png",
  "images/gal-tabbouleh.png",
  "images/cat-pastries.png",
  "images/cat-hot-drinks.png",
  "images/hero-cinematic.png"
];

function scrollMenu(direction) {
  const container = document.getElementById("menuGrid");
  if (!container) return;
  const scrollAmount = 300;
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

// Keyboard Arrow Navigation for Horizontal Menu Scrolling
window.addEventListener("keydown", (e) => {
  // Ignore keypresses if the user is typing in forms or inputs
  if (
    document.activeElement.tagName === "INPUT" || 
    document.activeElement.tagName === "TEXTAREA" || 
    document.activeElement.isContentEditable
  ) {
    return;
  }
  
  if (e.key === "ArrowLeft") {
    scrollMenu("left");
  } else if (e.key === "ArrowRight") {
    scrollMenu("right");
  }
});

function updateScrollArrows() {
  const container = document.getElementById("menuGrid");
  const leftArrow = document.getElementById("leftArrow");
  const rightArrow = document.getElementById("rightArrow");
  if (!container || !leftArrow || !rightArrow) return;

  const scrollLeft = Math.round(container.scrollLeft);
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;
  
  // Maximum scrollable distance
  const maxScroll = scrollWidth - clientWidth;

  // Show/Hide Left Arrow (show if we have scrolled more than 10px)
  if (scrollLeft > 10) {
    leftArrow.style.opacity = "1";
    leftArrow.style.visibility = "visible";
    leftArrow.style.pointerEvents = "all";
  } else {
    leftArrow.style.opacity = "0";
    leftArrow.style.visibility = "hidden";
    leftArrow.style.pointerEvents = "none";
  }

  // Show/Hide Right Arrow (show if we are more than 10px from the end)
  if (scrollLeft < maxScroll - 10) {
    rightArrow.style.opacity = "1";
    rightArrow.style.visibility = "visible";
    rightArrow.style.pointerEvents = "all";
  } else {
    rightArrow.style.opacity = "0";
    rightArrow.style.visibility = "hidden";
    rightArrow.style.pointerEvents = "none";
  }
}

function renderMenu() {
  const menuGrid = document.getElementById("menuGrid");
  if (!menuGrid) return;

  menuGrid.innerHTML = activeMenuData.map((cat, index) => `
    <div class="menu-card-mobile" onclick="showCategoryDetails(${index})">
      <div class="card-image-box">
        <img src="${cat.image}" alt="${cat.category}">
      </div>
      <div class="card-info">
        <h3>${cat.category}</h3>
        <p>${cat.price}</p>
      </div>
    </div>
  `).join("");

  // Initialize arrow visibility after rendering with a slight delay
  setTimeout(updateScrollArrows, 500);
}

function showCategoryDetails(index) {
  const cat = activeMenuData[index];
  const modal = document.getElementById("categoryModal");
  if (!modal) return;

  modal.innerHTML = `
    <button class="mobile-close" onclick="closeCategoryModal()">&times;</button>
    <div class="container category-modal-content">
      <div class="category-modal-header-row">
        <span class="category-modal-icon">${cat.icon}</span>
        <h2 class="category-modal-title">${cat.category}</h2>
      </div>
      <div style="display: flex; flex-direction: column; gap: 20px;">
        ${cat.items.map(item => `
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dotted rgba(0,0,0,0.1); padding-bottom: 10px;">
            <span style="font-weight: 600; font-size: 18px;">${item[0]}</span>
            <span style="color: var(--gold-dark); font-weight: 700; font-size: 18px;">${item[1]}</span>
          </div>
        `).join("")}
      </div>
      <button onclick="closeCategoryModal()" style="margin-top: 50px; width: 100%; padding: 20px; background: var(--dark); color: white; border: none; border-radius: 15px; font-weight: 700; font-size: 16px; cursor: pointer;">TILLBAKA TILL MENYN</button>
    </div>
  `;
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeCategoryModal() {
  const modal = document.getElementById("categoryModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// Navigation Active State Handling
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav a, .mobile-menu a');
  
  let current = "";
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (window.scrollY >= (sectionTop - 150)) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (current && link.getAttribute('href').includes(current)) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);

// Click handler for all nav links
document.querySelectorAll('.desktop-nav a, .mobile-menu a').forEach(link => {
  link.addEventListener('click', function() {
    document.querySelectorAll('.desktop-nav a, .mobile-menu a').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    if(this.closest('.mobile-menu')) {
        closeMobileMenu();
    }
  });
});

function openMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  const overlay = document.getElementById("mobileOverlay");
  if (menu) menu.classList.add("active");
  if (overlay) overlay.classList.add("active");
  document.documentElement.classList.add("mobile-menu-active");
  document.body.classList.add("mobile-menu-active");
}

function closeMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  const overlay = document.getElementById("mobileOverlay");
  if (menu) menu.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
  document.documentElement.classList.remove("mobile-menu-active");
  document.body.classList.remove("mobile-menu-active");
}

function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
  grid.innerHTML = galleryImages.map(img => `<img src="${img}" alt="Galleri">`).join("");
}

let activeMenuData = menuData; // Default to hardcoded
let latestMenuSignature = JSON.stringify(menuData);
let menuEventSource = null;
let lastMenuUpdateMarker = localStorage.getItem('mellringe_menu_last_update') || '';

function buildMenuFromApiItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return menuData.map(cat => ({
      category: cat.category,
      icon: cat.icon,
      price: cat.price,
      image: cat.image,
      items: cat.items.map(([name, price]) => [name, price])
    }));
  }

  const baseByKey = {};
  const baseOrderKeys = [];
  menuData.forEach(cat => {
    const key = String(cat.category || "").trim().toLowerCase();
    baseByKey[key] = cat;
    baseOrderKeys.push(key);
  });

  const grouped = {};
  const discoveredOrder = [];
  const keyOf = (value) => String(value || "").trim().toLowerCase();

  items.forEach(item => {
    const categoryName = String(item.category || "").trim();
    if (!categoryName) return;

    const key = keyOf(categoryName);
    if (!grouped[key]) {
      const baseCategory = baseByKey[key];
      grouped[key] = {
        category: categoryName,
        icon: item.categoryIcon || baseCategory?.icon || '🍽️',
        price: item.categoryPrice || (item.price ? `Från ${item.price}` : (baseCategory?.price || 'Se meny')),
        image: baseCategory?.image || item.categoryImage || item.image || "images/cat-manakish.png",
        items: []
      };
      discoveredOrder.push(key);
    }

    if (item.categoryIcon && (!grouped[key].icon || grouped[key].icon === '🍽️')) {
      grouped[key].icon = item.categoryIcon;
    }

    if (item.categoryPrice) {
      grouped[key].price = item.categoryPrice;
    }

    const itemName = String(item.name || "").trim();
    const itemPrice = String(item.price || "").trim();
    if (!itemName || !itemPrice) return;

    const existingIndex = grouped[key].items.findIndex(([name]) =>
      String(name).trim().toLowerCase() === itemName.toLowerCase()
    );

    if (existingIndex >= 0) {
      grouped[key].items[existingIndex][1] = itemPrice;
    } else {
      grouped[key].items.push([itemName, itemPrice]);
    }
  });

  const knownKeys = baseOrderKeys.filter((key) => Boolean(grouped[key]));
  const newKeys = discoveredOrder.filter((key) => !baseOrderKeys.includes(key));
  const finalOrder = [...knownKeys, ...newKeys];
  return finalOrder.map((key) => grouped[key]);
}

async function fetchMenuData() {
  try {
    const res = await fetch('/api/menu', { cache: 'no-store' });
    const items = await res.json();
    activeMenuData = buildMenuFromApiItems(items);
    latestMenuSignature = JSON.stringify(activeMenuData);
  } catch (err) {
    console.log("Could not fetch from API, using default menuData");
  }
}

async function refreshMenuIfChanged() {
  try {
    const res = await fetch('/api/menu', { cache: 'no-store' });
    const items = await res.json();

    const nextData = buildMenuFromApiItems(items);
    const nextSignature = JSON.stringify(nextData);
    if (nextSignature !== latestMenuSignature) {
      activeMenuData = nextData;
      latestMenuSignature = nextSignature;
      renderMenu();
      updateScrollArrows();
    }
  } catch (err) {
    // Silent for background refresh
  }
}

function startMenuRealtimeUpdates() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
  if (menuEventSource) return;

  menuEventSource = new EventSource('/api/menu/stream');

  menuEventSource.addEventListener('menu-update', () => {
    refreshMenuIfChanged();
  });

  menuEventSource.onerror = () => {
    // EventSource reconnects automatically; keep polling fallback active.
  };
}

function watchMenuUpdateMarker() {
  setInterval(() => {
    try {
      const marker = localStorage.getItem('mellringe_menu_last_update') || '';
      if (marker && marker !== lastMenuUpdateMarker) {
        lastMenuUpdateMarker = marker;
        refreshMenuIfChanged();
      }
    } catch (err) {
      // Ignore storage read issues
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Set playsinline dynamically to satisfy HTML linter while maintaining perfect iOS Safari support
  const heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    heroVideo.setAttribute("playsinline", "");
    heroVideo.setAttribute("webkit-playsinline", "");
  }

  await fetchMenuData();
  renderMenu();
  renderGallery();
  
  // Close mobile menu on link click
  document.querySelectorAll("#mobileMenu a").forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });

  // Handle 'Se hela menyn' link
  const viewAllLink = document.querySelector(".view-all-link");
  if (viewAllLink) {
    viewAllLink.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("menuGrid")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Update arrows on scroll and resize
  const menuGrid = document.getElementById("menuGrid");
  if (menuGrid) {
    menuGrid.addEventListener("scroll", updateScrollArrows);
    window.addEventListener("resize", updateScrollArrows);
  }

  // Cinematic Scroll Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) => {
    observer.observe(el);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'mellringe_menu_last_update') {
      lastMenuUpdateMarker = event.newValue || '';
      refreshMenuIfChanged();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshMenuIfChanged();
    }
  });

  startMenuRealtimeUpdates();
  watchMenuUpdateMarker();
  setInterval(refreshMenuIfChanged, 15000);
});

window.onload = () => {
  updateScrollArrows();
};

function toggleGallery() {
  const hiddenItems = document.querySelectorAll('.gallery-item.additional-item');
  const btn = document.getElementById('toggleGalleryBtn');
  if (!btn) return;
  
  const isExpanded = btn.classList.contains('expanded');
  
  if (isExpanded) {
    // Hide additional items
    hiddenItems.forEach(item => {
      item.classList.add('hidden-item');
    });
    btn.textContent = 'Visa fler bilder';
    btn.classList.remove('expanded');
    
    // Smoothly scroll back to the gallery header so the user doesn't get lost
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
  } else {
    // Show additional items
    hiddenItems.forEach(item => {
      item.classList.remove('hidden-item');
    });
    btn.textContent = 'Visa färre bilder';
    btn.classList.add('expanded');
  }
}

