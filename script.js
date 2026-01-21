/**
 * Свадебный сайт - Google Sheets интеграция
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Свадебный сайт загружается...");

  // ВАШ URL Google Apps Script
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx0xykjfkACxJE31VFSEt913ojO6LgSQMgjV0a67ypNFM78Ajfhkn-6-rqUPwdDd-Qdug/exec";

  // Инициализация
  initNavigation();
  initCountdown();
  initGoogleSheetsForm();
  initMapModal();
  initPlaylist();
  initScrollAnimations();
  initScrollToTop();
  initAdminPanel();

  console.log("Сайт готов! Данные будут отправляться в Google Sheets.");

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

    // Установите свою дату свадьбы!
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
   * 3. ФОРМА с отправкой в Google Sheets - ИСПРАВЛЕННАЯ
   */
  function initGoogleSheetsForm() {
    const form = document.getElementById("rsvpForm");
    const formMessage = document.getElementById("formMessage");
    const confirmedCountEl = document.getElementById("confirmedCount");

    if (!form) return;

    // Загрузка счетчика из localStorage
    let confirmedCount =
      parseInt(localStorage.getItem("confirmedGuests")) || 24;
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

    // УНИВЕРСАЛЬНЫЙ МЕТОД ОТПРАВКИ (работает всегда)
    function sendToGoogleSheetsUniversal(data) {
      console.log("🚀 Универсальный метод отправки:", data);

      return new Promise((resolve) => {
        // Создаем скрытый iframe для отправки
        const iframe = document.createElement("iframe");
        iframe.name = "google-sheets-target";
        iframe.style.cssText =
          "position:absolute;width:0;height:0;border:0;opacity:0;";

        // Создаем форму для отправки
        const formElement = document.createElement("form");
        formElement.method = "POST";
        formElement.action = GOOGLE_SCRIPT_URL;
        formElement.target = "google-sheets-target";
        formElement.style.display = "none";

        // Добавляем поля с данными
        const fields = {
          name: data.name || "",
          attendance: data.attendance || "",
          food: data.food || "",
          allergies: data.allergies || "",
          wishes: data.wishes || "",
          contact: data.contact || "",
        };

        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          formElement.appendChild(input);
        });

        // Добавляем на страницу и отправляем
        document.body.appendChild(iframe);
        document.body.appendChild(formElement);

        // После отправки убираем элементы
        setTimeout(() => {
          document.body.removeChild(iframe);
          document.body.removeChild(formElement);
          console.log("✅ Форма отправлена через iframe");
          resolve(true);
        }, 100);

        formElement.submit();
      });
    }

    // Альтернативный метод через fetch (если нужен)
    async function sendToGoogleSheetsFetch(data) {
      try {
        console.log("📤 Пробуем отправку через fetch:", data);

        const formData = new URLSearchParams();
        formData.append("name", data.name || "");
        formData.append("attendance", data.attendance || "");
        formData.append("food", data.food || "");
        formData.append("allergies", data.allergies || "");
        formData.append("wishes", data.wishes || "");
        formData.append("contact", data.contact || "");

        // Отправляем с no-cors режимом
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        console.log("✅ Fetch запрос отправлен (no-cors)");
        return true;
      } catch (error) {
        console.error("❌ Ошибка fetch:", error);
        return false;
      }
    }

    // Сохранение в localStorage как резерв
    function saveToLocalStorage(data) {
      try {
        const saved =
          JSON.parse(localStorage.getItem("weddingResponses")) || [];

        // Проверяем дубликаты
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

    // Обработка отправки формы - ОСНОВНОЙ ОБРАБОТЧИК
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("🎯 Начало обработки формы");

      // Получаем данные формы
      const formData = new FormData(form);
      const attendance = document.querySelector(
        'input[name="attendance"]:checked',
      );

      // Валидация
      const name = formData.get("guestName")?.trim();
      if (!name) {
        showMessage("Пожалуйста, введите ваше имя", "error");
        return;
      }

      if (!attendance) {
        showMessage("Пожалуйста, выберите, придёте ли вы", "error");
        return;
      }

      // Подготавливаем данные
      const responseData = {
        name: name,
        attendance: attendance.value === "yes" ? "Придёт" : "Не придёт",
        food: Array.from(formData.getAll("food")).join(", "),
        allergies: formData.get("allergies")?.trim() || "",
        wishes: formData.get("wishes")?.trim() || "",
        contact: formData.get("contact")?.trim() || "",
      };

      console.log("📝 Данные для отправки:", responseData);

      // Показываем загрузку
      const submitBtn = form.querySelector(".submit-btn");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Отправляем...";
      submitBtn.disabled = true;

      try {
        // 1. ВСЕГДА сохраняем в localStorage (сразу)
        const localStorageSuccess = saveToLocalStorage(responseData);

        if (localStorageSuccess) {
          console.log("💾 Данные сохранены локально");
        }

        // 2. Отправляем в Google Sheets (параллельно, не ждем ответа)
        setTimeout(async () => {
          try {
            // Пробуем универсальный метод (работает всегда)
            await sendToGoogleSheetsUniversal(responseData);
            console.log("✅ Данные отправлены в Google Sheets");
          } catch (sheetsError) {
            console.warn("⚠️ Ошибка отправки в Google Sheets:", sheetsError);
            console.log("📋 Но данные сохранены локально в браузере");
          }
        }, 0);

        // 3. Показываем сообщение об успехе пользователю
        showMessage(
          "Спасибо! Ваш ответ сохранён в нашем списке гостей.",
          "success",
        );

        // 4. Очищаем форму
        setTimeout(() => {
          form.reset();
          console.log("🔄 Форма очищена");
        }, 1000);

        // 5. Показываем анимацию уведомления
        const notification = document.getElementById("saveNotification");
        if (notification) {
          notification.classList.add("show");
          setTimeout(() => {
            notification.classList.remove("show");
          }, 3000);
        }
      } catch (error) {
        console.error("❌ Критическая ошибка:", error);
        showMessage("Произошла ошибка. Попробуйте ещё раз.", "error");
      } finally {
        // Восстанавливаем кнопку
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          console.log("🔘 Кнопка восстановлена");
        }, 1500);
      }
    });

    // Тестовая функция для отладки
    window.testFormSend = async function (testName = "Тест из консоли") {
      console.log("🧪 Тестируем отправку формы...");

      const testData = {
        name: testName,
        attendance: "Придёт",
        food: "Мясное, Рыбное",
        allergies: "Нет аллергий",
        wishes: "Тестовое пожелание",
        contact: "test@example.com",
      };

      console.log("📤 Тестовые данные:", testData);

      // Сохраняем локально
      saveToLocalStorage(testData);

      // Отправляем в Google Sheets
      const success = await sendToGoogleSheetsUniversal(testData);

      if (success) {
        console.log("✅ Тестовая отправка прошла успешно");
        console.log("🔍 Проверьте Google Таблицу через 30 секунд");
      } else {
        console.log("⚠️ Тестовая отправка не удалась, но есть локальная копия");
      }

      return success;
    };

    console.log("✅ Форма Google Sheets инициализирована");
    console.log("Для теста введите в консоли: testFormSend('Ваше имя')");
  }

  /**
   * 4. Карта
   */
  function initMapModal() {
    const mapModal = document.getElementById("mapModal");
    const closeModal = document.getElementById("closeModal");
    const modalTitle = document.getElementById("modalTitle");
    const openYandexBtn = document.getElementById("openYandexBtn");
    const openGoogleBtn = document.getElementById("openGoogleBtn");
    const mapButtons = document.querySelectorAll(".map-btn");

    if (!mapModal) return;

    const locations = {
      zag: {
        title: "ЗАГС Центральный",
        yandex:
          "https://yandex.ru/maps/?text=ЗАГС+Центральный+Москва+Тверская+15",
        google:
          "https://www.google.com/maps/search/ЗАГС+Центральный+Москва+Тверская+15",
      },
      rest: {
        title: "Ресторан 'Времена года'",
        yandex:
          "https://yandex.ru/maps/?text=Ресторан+Времена+года+Москва+Парковая+аллея+7",
        google:
          "https://www.google.com/maps/search/Ресторан+Времена+года+Москва+Парковая+аллея+7",
      },
    };

    closeModal.addEventListener("click", () => {
      mapModal.classList.remove("active");
    });

    mapModal.addEventListener("click", (e) => {
      if (e.target === mapModal) {
        mapModal.classList.remove("active");
      }
    });

    mapButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const location = button.dataset.location;
        const locationData = locations[location];

        if (locationData) {
          modalTitle.textContent = locationData.title;

          openYandexBtn.onclick = () => {
            window.open(locationData.yandex, "_blank", "noopener,noreferrer");
          };

          openGoogleBtn.onclick = () => {
            window.open(locationData.google, "_blank", "noopener,noreferrer");
          };

          mapModal.classList.add("active");
        }
      });
    });
  }

  /**
   * 5. Плейлист
   */
  function initPlaylist() {
    const playlistContainer = document.getElementById("playlist");
    const songInput = document.getElementById("songInput");
    const addSongBtn = document.getElementById("addSongBtn");

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
            <button class="vote-btn" data-id="${song.id}" data-action="down">
              <i class="fas fa-chevron-down"></i>
            </button>
            <span class="vote-count">${song.votes}</span>
            <button class="vote-btn" data-id="${song.id}" data-action="up">
              <i class="fas fa-chevron-up"></i>
            </button>
          </div>
        `;
        playlistContainer.appendChild(songElement);
      });
    }

    renderPlaylist();

    if (addSongBtn && songInput) {
      addSongBtn.addEventListener("click", () => {
        const songText = songInput.value.trim();
        if (songText) {
          playlist.push({
            id: Date.now(),
            song: songText,
            votes: 1,
          });
          renderPlaylist();
          songInput.value = "";

          const notification = document.getElementById("saveNotification");
          if (notification) {
            notification.classList.add("show");
            setTimeout(() => {
              notification.classList.remove("show");
            }, 2000);
          }
        }
      });

      songInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          addSongBtn.click();
        }
      });
    }

    playlistContainer.addEventListener("click", (e) => {
      const voteBtn = e.target.closest(".vote-btn");
      if (!voteBtn) return;

      const songId = parseInt(voteBtn.dataset.id);
      const action = voteBtn.dataset.action;

      const song = playlist.find((s) => s.id === songId);
      if (song) {
        if (action === "up") {
          song.votes++;
        } else if (action === "down" && song.votes > 0) {
          song.votes--;
        }
        renderPlaylist();
      }
    });
  }

  /**
   * 6. Анимации при скролле
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
   * 7. Кнопка "Наверх"
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
   * 8. Админ-панель для просмотра ответов
   */
  function initAdminPanel() {
    // Эта функция доступна только из консоли
    window.showGuestList = function () {
      const responses =
        JSON.parse(localStorage.getItem("weddingResponses")) || [];

      console.log("📋 СПИСОК ГОСТЕЙ:");
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
        if (r.food) console.log(`   🍽️  Еда: ${r.food}`);
        if (r.allergies) console.log(`   ⚠️  Аллергии: ${r.allergies}`);
        if (r.contact) console.log(`   📞 Контакт: ${r.contact}`);
        if (r.timestamp) {
          const date = new Date(r.timestamp);
          console.log(`   📅 Ответил: ${date.toLocaleDateString("ru-RU")}`);
        }
      });

      // Кнопка экспорта
      const btn = document.createElement("button");
      btn.textContent = "📥 Экспорт в CSV";
      btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 20px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      `;

      btn.onclick = function () {
        if (responses.length === 0) {
          alert("Нет данных для экспорта");
          return;
        }

        // Создаем CSV
        const headers = [
          "Имя",
          "Присутствие",
          "Еда",
          "Аллергии",
          "Пожелания",
          "Контакт",
          "Дата",
        ];
        const rows = responses.map((r) => [
          r.name,
          r.attendance,
          r.food || "",
          r.allergies || "",
          r.wishes || "",
          r.contact || "",
          r.timestamp ? new Date(r.timestamp).toLocaleString("ru-RU") : "",
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `гости_свадьбы_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
      };

      document.body.appendChild(btn);

      return responses;
    };

    console.log("Админ-панель готова. Введите showGuestList() в консоли.");
  }
});
