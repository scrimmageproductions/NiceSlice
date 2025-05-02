### JavaScript (`script.js`)
```javascript
// Sample pizzeria data (replace with API/database in production)
const pizzerias = [
    {
        id: 1,
        name: "Luigi's Pizzeria",
        image: "https://via.placeholder.com/400x200.png?text=Luigi's+Pizza",
        address: "123 Slice St, New York, NY",
        lat: 40.7128,
        lng: -74.0060,
        avgPrice: 18,
        seating: ["indoor", "outdoor"],
        reservations: true
    },
    {
        id: 2,
        name: "Mama Mia's",
        image: "https://via.placeholder.com/400x200.png?text=Mama+Mia's",
        address: "456 Pie Ave, New York, NY",
        lat: 40.7228,
        lng: -74.0160,
        avgPrice: 15,
        seating: ["indoor"],
        reservations: false
    }
    // Add more local pizzerias as needed
];

// Initialize map
let map;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12
    });
}

// Render cards
function renderCards(filteredPizzerias = pizzerias) {
    const stack = document.getElementById("card-stack");
    stack.innerHTML = "";
    filteredPizzerias.forEach((pizzeria, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.zIndex = filteredPizzerias.length - index;
        card.innerHTML = `
            <img src="${pizzeria.image}" alt="${pizzeria.name}">
            <div class="card-content">
                <h2>${pizzeria.name}</h2>
                <p><strong>Address:</strong> ${pizzeria.address}</p>
                <p><strong>Avg. Pizza Cost:</strong> $${pizzeria.avgPrice}</p>
                <p><strong>Seating:</strong> ${pizzeria.seating.join(", ")}</p>
                <p><strong>Reservations:</strong> ${pizzeria.reservations ? "Yes" : "No"}</p>
            </div>
        `;
        card.dataset.id = pizzeria.id;
        stack.appendChild(card);
    });
    initSwipe();
    updateMap(filteredPizzerias);
}

// Update map with markers
function updateMap(pizzerias) {
    pizzerias.forEach(pizzeria => {
        new google.maps.Marker({
            position: { lat: pizzeria.lat, lng: pizzeria.lng },
            map: map,
            title: pizzeria.name
        });
    });
}

// Swipe functionality
function initSwipe() {
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        let startX;
        card.addEventListener("mousedown", startSwipe);
        card.addEventListener("touchstart", startSwipe);

        function startSwipe(e) {
            startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
            document.addEventListener("mousemove", swipe);
            document.addEventListener("touchmove", swipe);
            document.addEventListener("mouseup", endSwipe);
            document.addEventListener("touchend", endSwipe);
        }

        function swipe(e) {
            const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
            const deltaX = x - startX;
            card.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 20}deg)`;
        }

        function endSwipe() {
            document.removeEventListener("mousemove", swipe);
            document.removeEventListener("touchmove", swipe);
            document.removeEventListener("mouseup", endSwipe);
            document.removeEventListener("touchend", endSwipe);
            const deltaX = parseFloat(card.style.transform.match(/translateX\(([^)]+)\)/)?.[1]) || 0;
            if (Math.abs(deltaX) > 100) {
                card.style.transition = "transform 0.3s ease";
                card.style.transform = deltaX > 0 ? "translateX(1000px)" : "translateX(-1000px)";
                setTimeout(() => {
                    card.remove();
                    if (deltaX > 0) {
                        // Like action (save to user preferences or matches)
                        console.log(`Liked: ${card.dataset.id}`);
                    }
                }, 300);
            } else {
                card.style.transform = "translateX(0) rotate(0deg)";
            }
        }
    });
}

// Swipe actions
function swipeLeft() {
    const topCard = document.querySelector(".card");
    if (topCard) {
        topCard.style.transition = "transform 0.3s ease";
        topCard.style.transform = "translateX(-1000px)";
        setTimeout(() => topCard.remove(), 300);
    }
}

function swipeRight() {
    const topCard = document.querySelector(".card");
    if (topCard) {
        topCard.style.transition = "transform 0.3s ease";
        topCard.style.transform = "translateX(1000px)";
        setTimeout(() => {
            topCard.remove();
            console.log(`Liked: ${topCard.dataset.id}`);
        }, 300);
    }
}

// Update location (placeholder for geolocation or API call)
function updateLocation() {
    const location = document.getElementById("location").value;
    // In production, use Google Maps Geocoding API to convert location to lat/lng
    console.log(`Search for pizzerias in: ${location}`);
    // For now, re-render with existing data
    renderCards();
}

// Apply preferences
function applyPreferences() {
    const indoor = document.getElementById("indoor-seating").checked;
    const outdoor = document.getElementById("outdoor-seating").checked;
    const reservations = document.getElementById("reservations").checked;
    const maxPrice = document.getElementById("max-price").value;

    const filteredPizzerias = pizzerias.filter(pizzeria => {
        const hasIndoor = indoor ? pizzeria.seating.includes("indoor") : true;
        const hasOutdoor = outdoor ? pizzeria.seating.includes("outdoor") : true;
        const hasReservations = reservations ? pizzeria.reservations : true;
        const withinPrice = pizzeria.avgPrice <= maxPrice;
        return hasIndoor && hasOutdoor && hasReservations && withinPrice;
    });

    renderCards(filteredPizzerias);
}

// Update price display
document.getElementById("max-price").addEventListener("input", () => {
    document.getElementById("price-value").textContent = document.getElementById("max-price").value;
});

// Initialize
window.onload = () => {
    initMap();
    renderCards();
};
