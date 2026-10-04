// ============================================================
// VK MINI APP
// Работает:
// 1. в браузере / VK Mini App
// 2. в BotHost через Node.js как HTTP-сервер
//
// ВАЖНО:
// Классы кнопок соответствуют существующему style.css:
// .option-button
// .primary-button
// .secondary-button
// ============================================================


(function () {

    // ========================================================
    // РЕЖИМ NODE.JS / BOTHOST
    // ========================================================

    const isBrowser =
        typeof window !== "undefined" &&
        typeof document !== "undefined";


    if (!isBrowser) {

        const http = require("http");
        const fs = require("fs");
        const path = require("path");

        const PORT =
            Number(process.env.PORT) || 3000;

        const PUBLIC_DIR =
            __dirname;


        const MIME_TYPES = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
            ".ico": "image/x-icon"
        };


        const server = http.createServer(
            (req, res) => {

                try {

                    let requestPath =
                        decodeURIComponent(
                            (req.url || "/").split("?")[0]
                        );


                    if (
                        !requestPath ||
                        requestPath === "/"
                    ) {

                        requestPath = "/index.html";

                    }


                    // Защита от выхода за пределы public
                    const safePath =
                        path.normalize(requestPath)
                            .replace(/^(\.\.(\/|\\|$))+/, "");


                    const filePath =
                        path.join(
                            PUBLIC_DIR,
                            safePath
                        );


                    if (!filePath.startsWith(PUBLIC_DIR)) {

                        res.writeHead(
                            403,
                            {
                                "Content-Type":
                                    "text/plain; charset=utf-8"
                            }
                        );

                        res.end("Forbidden");

                        return;

                    }


                    fs.readFile(
                        filePath,
                        (error, data) => {

                            if (error) {

                                // Если файл не найден,
                                // отдаём index.html.
                                // Это удобно для Mini App.

                                const fallback =
                                    path.join(
                                        PUBLIC_DIR,
                                        "index.html"
                                    );


                                fs.readFile(
                                    fallback,
                                    (fallbackError, fallbackData) => {

                                        if (fallbackError) {

                                            res.writeHead(
                                                404,
                                                {
                                                    "Content-Type":
                                                        "text/plain; charset=utf-8"
                                                }
                                            );

                                            res.end(
                                                "File not found"
                                            );

                                            return;
                                        }


                                        res.writeHead(
                                            200,
                                            {
                                                "Content-Type":
                                                    "text/html; charset=utf-8"
                                            }
                                        );

                                        res.end(
                                            fallbackData
                                        );

                                    }
                                );

                                return;

                            }


                            const extension =
                                path.extname(filePath)
                                    .toLowerCase();


                            const contentType =
                                MIME_TYPES[extension] ||
                                "application/octet-stream";


                            res.writeHead(
                                200,
                                {
                                    "Content-Type":
                                        contentType
                                }
                            );


                            res.end(data);

                        }
                    );

                } catch (error) {

                    console.error(
                        "Server error:",
                        error
                    );


                    res.writeHead(
                        500,
                        {
                            "Content-Type":
                                "text/plain; charset=utf-8"
                        }
                    );


                    res.end(
                        "Internal server error"
                    );

                }

            }
        );


        server.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `VK Mini App server started on port ${PORT}`
                );

            }
        );


        return;
    }


    // ========================================================
    // ДАЛЬШЕ — КОД, КОТОРЫЙ РАБОТАЕТ В БРАУЗЕРЕ
    // ========================================================


    const state = {

        step: 1,

        product: null,

        goal: null,

        resources: null

    };


    // ========================================================
    // ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ
    // ========================================================

    const screen =
        document.getElementById("screen");


    const stepCounter =
        document.getElementById("stepCounter");


    const brandElement =
        document.getElementById("brand");


    // ========================================================
    // ИНИЦИАЛИЗАЦИЯ VK
    // ========================================================

    async function initVK() {

        try {

            if (
                window.vkBridge &&
                typeof window.vkBridge.send === "function"
            ) {

                await Promise.race([

                    window.vkBridge.send(
                        "VKWebAppInit"
                    ),

                    new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                1000
                            )
                    )

                ]);

            }

        } catch (error) {

            console.log(
                "VK Bridge initialization skipped:",
                error
            );

        }

    }


    // ========================================================
    // БРЕНД
    // ========================================================

    function renderBrand() {

        if (
            brandElement &&
            typeof CONFIG !== "undefined"
        ) {

            brandElement.textContent =
                CONFIG.brand || "";

        }

    }


    // ========================================================
    // СЧЁТЧИК
    // ========================================================

    function updateStepCounter() {

        if (!stepCounter) {
            return;
        }


        if (state.step <= 3) {

            stepCounter.textContent =
                `${state.step} / 3`;

        } else {

            stepCounter.textContent =
                "Результат";

        }

    }


    // ========================================================
    // АНИМАЦИЯ
    // ========================================================

    function restartAnimation() {

        if (!screen) {
            return;
        }


        screen.style.animation = "none";


        void screen.offsetWidth;


        screen.style.animation = "";

    }


    // ========================================================
    // ОТРИСОВКА
    // ========================================================

    function render(content) {

        if (!screen) {

            console.error(
                "Ошибка: элемент #screen не найден."
            );

            return;

        }


        screen.innerHTML =
            content;


        restartAnimation();


        updateStepCounter();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // ========================================================
    // СОЗДАНИЕ КНОПКИ ВАРИАНТА
    //
    // ВАЖНО:
    // Здесь именно .option-button.
    // Это класс из существующего CSS.
    // ========================================================

    function createOption(
        item,
        type
    ) {

        return `
            <button
                class="option-button"
                type="button"
                data-type="${type}"
                data-value="${item.id}"
            >

                <span class="option-title">
                    ${item.title}
                </span>

                ${
                    item.description
                        ? `
                            <span class="option-description">
                                ${item.description}
                            </span>
                        `
                        : ""
                }

            </button>
        `;

    }


    // ========================================================
    // ОБРАБОТЧИКИ ВАРИАНТОВ
    // ========================================================

    function attachOptionHandlers() {

        document
            .querySelectorAll(".option-button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const type =
                            button.dataset.type;


                        const value =
                            button.dataset.value;


                        if (type === "product") {

                            state.product =
                                value;

                            state.step = 2;

                            renderGoalQuestion();

                            return;

                        }


                        if (type === "goal") {

                            state.goal =
                                value;

                            state.step = 3;

                            renderResourcesQuestion();

                            return;

                        }


                        if (type === "resources") {

                            state.resources =
                                value;

                            state.step = 4;

                            renderResult();

                            return;

                        }

                    }
                );

            });

    }


    // ========================================================
    // СТАРТОВЫЙ ЭКРАН
    // ========================================================

    function renderStart() {

        state.step = 1;

        state.product = null;

        state.goal = null;

        state.resources = null;


        updateStepCounter();


        render(`

            <section class="start-card">

                <div class="eyebrow">
                    Интерактивная диагностика
                </div>

                <h1>
                    ${CONFIG.title}
                </h1>

                <p class="subtitle">
                    ${CONFIG.subtitle}
                </p>

                <button
                    class="primary-button"
                    type="button"
                    id="startButton"
                >
                    Начать
                </button>

                <div class="note">
                    Всего 3 вопроса.
                    В конце вы получите
                    персональную рекомендацию.
                </div>

            </section>

        `);


        const startButton =
            document.getElementById(
                "startButton"
            );


        if (startButton) {

            startButton.addEventListener(
                "click",
                () => {

                    state.step = 1;

                    renderProductQuestion();

                }
            );

        }

    }


    // ========================================================
    // ВОПРОС 1
    // ========================================================

    function renderProductQuestion() {

        state.step = 1;

        updateStepCounter();


        const options =
            CONFIG.products
                .map(
                    item =>
                        createOption(
                            item,
                            "product"
                        )
                )
                .join("");


        render(`

            <section class="question-card">

                <div class="eyebrow">
                    Вопрос 1
                </div>

                <h2>
                    Что вы продаёте?
                </h2>

                <p class="description">
                    Выберите вариант,
                    который ближе всего
                    к вашей модели бизнеса.
                </p>

                <div class="option-list">
                    ${options}
                </div>

            </section>

        `);


        attachOptionHandlers();

    }


    // ========================================================
    // ВОПРОС 2
    // ========================================================

    function renderGoalQuestion() {

        state.step = 2;

        updateStepCounter();


        const options =
            CONFIG.goals
                .map(
                    item =>
                        createOption(
                            item,
                            "goal"
                        )
                )
                .join("");


        render(`

            <section class="question-card">

                <div class="eyebrow">
                    Вопрос 2
                </div>

                <h2>
                    Какая сейчас главная задача?
                </h2>

                <p class="description">
                    Выберите главную задачу,
                    которую хотите решить.
                </p>

                <div class="option-list">
                    ${options}
                </div>

                <button
                    class="back-button"
                    id="backButton"
                    type="button"
                >
                    ← Назад
                </button>

            </section>

        `);


        attachOptionHandlers();


        const backButton =
            document.getElementById(
                "backButton"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                () => {

                    renderProductQuestion();

                }
            );

        }

    }


    // ========================================================
    // ВОПРОС 3
    // ========================================================

    function renderResourcesQuestion() {

        state.step = 3;

        updateStepCounter();


        const options =
            CONFIG.resources
                .map(
                    item =>
                        createOption(
                            item,
                            "resources"
                        )
                )
                .join("");


        render(`

            <section class="question-card">

                <div class="eyebrow">
                    Вопрос 3
                </div>

                <h2>
                    Сколько ресурсов вы готовы вложить?
                </h2>

                <p class="description">
                    Не только деньги — учитываем также
                    время и готовность разбираться
                    с системой.
                </p>

                <div class="option-list">
                    ${options}
                </div>

                <button
                    class="back-button"
                    id="backButton"
                    type="button"
                >
                    ← Назад
                </button>

            </section>

        `);


        attachOptionHandlers();


        const backButton =
            document.getElementById(
                "backButton"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                () => {

                    renderGoalQuestion();

                }
            );

        }

    }


    // ========================================================
    // КЛЮЧ РЕЗУЛЬТАТА
    // ========================================================

    function getResultKey() {

        return [
            state.product,
            state.goal,
            state.resources
        ].join("_");

    }


    // ========================================================
    // ПОЛУЧЕНИЕ РЕЗУЛЬТАТА
    // ========================================================

    function getResult() {

        const key =
            getResultKey();


        return (
            CONFIG.results[key] ||
            CONFIG.results.default
        );

    }


    // ========================================================
    // ЭКРАН РЕЗУЛЬТАТА
    // ========================================================

    function renderResult() {

        state.step = 4;

        updateStepCounter();


        const result =
            getResult();


        const botHelpUrl =
            CONFIG.botHelpLandingUrl || "#";


        const materialsButtonText =
            CONFIG.materialsButtonText ||
            "Получить полезные материалы";


        const privacyUrl =
            CONFIG.privacyPolicyUrl ||
            "#";


        render(`

            <section class="result-card">

                <div class="result-label">
                    Ваш результат
                </div>

                <h1>
                    ${result.title}
                </h1>

                <p class="result-text">
                    ${result.text}
                </p>


                <!-- ======================================
                     СОГЛАСИЕ НА РАССЫЛКУ
                     ====================================== -->

                <label
                    class="consent-row"
                    for="consentCheckbox"
                >

                    <input
                        type="checkbox"
                        id="consentCheckbox"
                    >

                    <span>
                        Нажимая на эту кнопку, Вы
                        соглашаетесь с получением
                        рассылки и
                        <a
                            href="${privacyUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Политикой конфиденциальности
                        </a>
                    </span>

                </label>


                <!-- ======================================
                     BOTHELP
                     ====================================== -->

                <a
                    class="primary-button"
                    id="materialsButton"
                    href="${botHelpUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${materialsButtonText}
                </a>


                <!-- ======================================
                     ЛИЧНЫЕ СООБЩЕНИЯ
                     ====================================== -->

                <a
                    class="secondary-button"
                    href="${CONFIG.personalMessagesUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${
                        CONFIG.resultButtonText ||
                        "Обсудить мой результат"
                    }
                </a>


                <!-- ======================================
                     НАЧАТЬ ЗАНОВО
                     ====================================== -->

                <button
                    class="secondary-button"
                    type="button"
                    id="restartButton"
                >
                    ${
                        CONFIG.restartButtonText ||
                        "Пройти заново"
                    }
                </button>


                <div class="note">
                    Результат сформирован
                    на основе ваших ответов.
                    Это не универсальный рецепт,
                    а отправная точка
                    для выбора механики.
                </div>

            </section>

        `);


        const consentCheckbox =
            document.getElementById(
                "consentCheckbox"
            );


        const materialsButton =
            document.getElementById(
                "materialsButton"
            );


        // ----------------------------------------------------
        // Кнопка материалов работает только после согласия
        // ----------------------------------------------------

        if (
            consentCheckbox &&
            materialsButton
        ) {

            materialsButton.style.pointerEvents =
                "none";

            materialsButton.style.opacity =
                "0.5";


            consentCheckbox.addEventListener(
                "change",
                () => {

                    if (
                        consentCheckbox.checked
                    ) {

                        materialsButton.style.pointerEvents =
                            "auto";

                        materialsButton.style.opacity =
                            "1";

                    } else {

                        materialsButton.style.pointerEvents =
                            "none";

                        materialsButton.style.opacity =
                            "0.5";

                    }

                }
            );

        }


        // ----------------------------------------------------
        // Если ссылка BotHelp ещё не вставлена
        // ----------------------------------------------------

        if (
            materialsButton &&
            (
                !CONFIG.botHelpLandingUrl ||
                CONFIG.botHelpLandingUrl ===
                    "ВСТАВЬ_СЮДА_ССЫЛКУ_НА_ВК-ЛЕНДИНГ"
            )
        ) {

            materialsButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    alert(
                        "Сначала вставьте ссылку на ВК-лендинг BotHelp в файл public/config.js."
                    );

                }
            );

        }


        // ----------------------------------------------------
        // Кнопка "Пройти заново"
        // ----------------------------------------------------

        const restartButton =
            document.getElementById(
                "restartButton"
            );


        if (restartButton) {

            restartButton.addEventListener(
                "click",
                () => {

                    state.product = null;

                    state.goal = null;

                    state.resources = null;

                    renderProductQuestion();

                }
            );

        }

    }


    // ========================================================
    // ЗАПУСК
    // ========================================================

    document.addEventListener(
        "DOMContentLoaded",
        async () => {

            renderBrand();

            await initVK();

            renderStart();

        }
    );


})();
