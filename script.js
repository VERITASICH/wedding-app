/**
 * Свадебный сайт - интеграция с собственным сервером
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Свадебный сайт загружается...");

  // URL вашего сервера (замените на реальный при деплое)
  const API_URL =
    "https://wedding-server-production-f21a.up.railway.app/api/guests";

  // Инициализация
  initNavigation();
  initCountdown();
  initGuestForm();
  initPlaylist();
  initScrollAnimations();
  initScrollToTop();
  initAdminPanel();

  console.log("Сайт готов! Данные будут отправляться на сервер.");

  // ==================== МОДУЛИ ====================

  /**
   * 1. Навигация
   */
  function initNavigation() {
    const menuToggle = document.querySelector(".menu-toggle");
    const closeMenu = document.querySelector(".close-menu");
    const navOverlay = document.querySelector(".nav-overlay");
    const navMenu = document.querySelector(".nav-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    if (!menuToggle) return;

    menuToggle.addEventListener("click", () => {
      navOverlay.classList.add("active");
      navMenu.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    function closeNav() {
      navOverlay.classList.remove("active");
      navMenu.classList.remove("active");
      document.body.style.overflow = "";
    }

    closeMenu.addEventListener("click", closeNav);
    navOverlay.addEventListener("click", closeNav);

    navLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        closeNav();

        const targetId = this.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          const offset = 80;
          const targetPosition = targetElement.offsetTop - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
        }
      });
    });
  }

  /**
   * 2. Обратный отсчет
   */
  function initCountdown() {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");

    if (!daysEl || !hoursEl || !minutesEl) return;

    const weddingDate = new Date("2026-07-04T15:00:00");

    function updateCountdown() {
      const now = new Date();
      const timeDiff = weddingDate.getTime() - now.getTime();

      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        daysEl.textContent = days.toString().padStart(2, "0");
        hoursEl.textContent = hours.toString().padStart(2, "0");
        minutesEl.textContent = minutes.toString().padStart(2, "0");
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 60000);
  }

  /**
   * 3. ФОРМА с отправкой на сервер и отображением списка гостей
   */
  function initGuestForm() {
    const form = document.getElementById("rsvpForm");
    const formMessage = document.getElementById("formMessage");
    const confirmedCountEl = document.getElementById("confirmedCount");

    if (!form) return;

    // Загрузка начального счетчика из localStorage
    let confirmedCount = parseInt(localStorage.getItem("confirmedGuests")) || 0;
    if (confirmedCountEl) {
      confirmedCountEl.textContent = confirmedCount;
    }

    // Показ сообщений
    function showMessage(text, type = "success") {
      if (!formMessage) return;

      formMessage.textContent = text;
      formMessage.className = `form-message ${type}`;
      formMessage.classList.remove("hidden");

      setTimeout(() => {
        formMessage.classList.add("hidden");
      }, 5000);
    }

    // Сохранение в localStorage (резерв)
    function saveToLocalStorage(data) {
      try {
        const saved =
          JSON.parse(localStorage.getItem("weddingResponses")) || [];

        const existingIndex = saved.findIndex(
          (r) => r.name?.toLowerCase() === data.name?.toLowerCase(),
        );

        if (existingIndex >= 0) {
          saved[existingIndex] = {
            ...saved[existingIndex],
            ...data,
            updated: new Date().toISOString(),
          };
          console.log("🔄 Обновлен существующий ответ");
        } else {
          saved.push({
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString(),
          });
          console.log("➕ Добавлен новый ответ");
        }

        localStorage.setItem("weddingResponses", JSON.stringify(saved));

        // Обновляем счетчик
        if (data.attendance === "Придёт" && existingIndex < 0) {
          confirmedCount++;
          localStorage.setItem("confirmedGuests", confirmedCount);
          if (confirmedCountEl) {
            confirmedCountEl.textContent = confirmedCount;
            console.log("📈 Счетчик обновлен:", confirmedCount);
          }
        }

        return true;
      } catch (error) {
        console.error("Ошибка сохранения в localStorage:", error);
        return false;
      }
    }

    // Отправка на сервер
    async function sendToServer(data) {
      try {
        console.log("📤 Отправляем на сервер:", data);

        const requestData = {
          guestName: data.name,
          attendance: data.attendance === "Придёт" ? "yes" : "no",
          wishes: data.wishes || "",
        };

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const result = await response.json();
        console.log("✅ Ответ сервера:", result);

        return result.success;
      } catch (error) {
        console.error("❌ Ошибка отправки на сервер:", error);
        return false;
      }
    }

    // ===== ФУНКЦИЯ ЗАГРУЗКИ И ОТОБРАЖЕНИЯ СПИСКА ГОСТЕЙ =====
    async function loadGuestsList() {
      const guestsListEl = document.getElementById("guestsList");
      if (!guestsListEl) return;

      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.success && data.guests.length > 0) {
          // Сортируем: сначала те, кто придут, потом по дате (новые сверху)
          const sortedGuests = data.guests.sort((a, b) => {
            if (a.attendance === "Придёт" && b.attendance !== "Придёт")
              return -1;
            if (a.attendance !== "Придёт" && b.attendance === "Придёт")
              return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          let html = "";
          sortedGuests.forEach((guest) => {
            const avatarLetter = guest.name.charAt(0).toUpperCase();
            const statusClass =
              guest.attendance === "Придёт" ? "attending" : "not-attending";
            const date = new Date(guest.createdAt).toLocaleDateString("ru-RU");

            html += `
              <div class="guest-item">
                <div class="guest-avatar">${avatarLetter}</div>
                <div class="guest-info">
                  <div class="guest-name">${guest.name}</div>
                  <div class="guest-status ${statusClass}">${guest.attendance}</div>
                  ${
                    guest.wishes
                      ? `<div class="guest-wishes">💭 ${guest.wishes}</div>`
                      : ""
                  }
                </div>
                <div class="guest-date">${date}</div>
              </div>
            `;
          });

          guestsListEl.innerHTML = html;

          // Обновляем счетчик подтвердивших
          const attendingCount = data.guests.filter(
            (g) => g.attendance === "Придёт",
          ).length;
          if (confirmedCountEl) {
            confirmedCountEl.textContent = attendingCount;
          }
        } else {
          guestsListEl.innerHTML =
            '<p class="loading">Загружаем список гостей</p>';
        }
      } catch (error) {
        console.error("Ошибка загрузки списка гостей:", error);
        guestsListEl.innerHTML =
          '<p class="loading">Не удалось загрузить список гостей</p>';
      }
    }

    // ===== ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ =====
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("🎯 Начало обработки формы");

      const formData = new FormData(form);
      const attendance = document.querySelector(
        'input[name="attendance"]:checked',
      );

      const name = formData.get("guestName")?.trim();
      if (!name) {
        showMessage("Пожалуйста, введите ваше имя", "error");
        return;
      }

      if (!attendance) {
        showMessage("Пожалуйста, выберите, придёте ли вы", "error");
        return;
      }

      const responseData = {
        name: name,
        attendance: attendance.value === "yes" ? "Придёт" : "Не придёт",
        wishes: formData.get("wishes")?.trim() || "",
      };

      console.log("📝 Данные для отправки:", responseData);

      const submitBtn = form.querySelector(".submit-btn");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Отправляем...";
      submitBtn.disabled = true;

      try {
        // 1. Сохраняем локально
        saveToLocalStorage(responseData);

        // 2. Отправляем на сервер
        const serverSuccess = await sendToServer(responseData);

        if (serverSuccess) {
          showMessage("Спасибо! Ваш ответ сохранён на сервере.", "success");

          // 3. Обновляем список гостей
          await loadGuestsList();
        } else {
          showMessage(
            "Ответ сохранён локально, но не отправлен на сервер",
            "error",
          );
        }

        // 4. Очищаем форму
        setTimeout(() => form.reset(), 1000);

        const notification = document.getElementById("saveNotification");
        if (notification) {
          notification.classList.add("show");
          setTimeout(() => notification.classList.remove("show"), 3000);
        }
      } catch (error) {
        console.error("❌ Критическая ошибка:", error);
        showMessage("Произошла ошибка. Попробуйте ещё раз.", "error");
      } finally {
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1500);
      }
    });

    // Загружаем список гостей при загрузке страницы
    loadGuestsList();

    console.log("✅ Форма инициализирована. Сервер:", API_URL);
  }

  /**
   * 4. Плейлист (упрощенный)
   */
  function initPlaylist() {
    const playlistContainer = document.getElementById("playlist");
    if (!playlistContainer) return;

    let playlist = [
      { id: 1, song: "Queen - Bohemian Rhapsody", votes: 5 },
      { id: 2, song: "Elvis Presley - Can't Help Falling in Love", votes: 8 },
      { id: 3, song: "The Beatles - All You Need Is Love", votes: 7 },
    ];

    function renderPlaylist() {
      playlistContainer.innerHTML = "";
      playlist.sort((a, b) => b.votes - a.votes);

      playlist.forEach((song) => {
        const songElement = document.createElement("div");
        songElement.className = "playlist-item";
        songElement.innerHTML = `
          <div class="song-info">
            <strong>${song.song}</strong>
          </div>
          <div class="song-votes">
            <span class="vote-count">${song.votes}</span>
          </div>
        `;
        playlistContainer.appendChild(songElement);
      });
    }

    renderPlaylist();
  }

  /**
   * 5. Анимации при скролле
   */
  function initScrollAnimations() {
    const fadeElements = document.querySelectorAll(".fade-in");
    if (fadeElements.length === 0) return;

    function checkVisibility() {
      fadeElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          element.classList.add("visible");
        }
      });
    }

    let scrollTimeout;
    function handleScroll() {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkVisibility, 100);
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    setTimeout(checkVisibility, 500);
  }

  /**
   * 6. Кнопка "Наверх"
   */
  function initScrollToTop() {
    const toTopBtn = document.getElementById("toTopBtn");
    if (!toTopBtn) return;

    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        toTopBtn.classList.add("visible");
      } else {
        toTopBtn.classList.remove("visible");
      }
    });

    toTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  /**
   * 7. Админ-панель для просмотра ответов
   */
  function initAdminPanel() {
    window.showGuestList = function () {
      const responses =
        JSON.parse(localStorage.getItem("weddingResponses")) || [];

      console.log("📋 СПИСОК ГОСТЕЙ (локальный):");
      console.log("Всего ответов:", responses.length);

      const attending = responses.filter((r) => r.attendance === "Придёт");
      const notAttending = responses.filter(
        (r) => r.attendance === "Не придёт",
      );

      console.log("\n📊 Статистика:");
      console.log("✅ Придут:", attending.length);
      console.log("❌ Не придут:", notAttending.length);

      console.log("\n👤 Детали по гостям:");
      attending.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.name}`);
        if (r.wishes) console.log(`   💭 Пожелания: ${r.wishes}`);
      });

      return responses;
    };

    console.log("Админ-панель готова. Введите showGuestList() в консоли.");
  }
});
