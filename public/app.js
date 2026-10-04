/*
 * VK Mini App / BotHost
 *
 * Один и тот же файл работает в двух режимах:
 *
 * 1. В браузере:
 *    работает как интерфейс Mini App.
 *
 * 2. В Node.js / BotHost:
 *    запускает простой HTTP-сервер и отдаёт файлы из папки public.
 *
 * Это нужно потому, что BotHost запускает:
 *
 *     node public/app.js
 *
 * а браузерный объект document в Node.js отсутствует.
 */

(function () {
    "use strict";

    /*
     * ============================================================
     * РЕЖИМ NODE.JS / BOTHost
     * ============================================================
     *
     * Если document отсутствует — мы находимся не в браузере.
     * В этом случае запускаем HTTP-сервер.
     */

    if (typeof document === "undefined") {
        const http = require("http");
        const fs = require("fs");
        const path = require("path");

        const PORT = Number(process.env.PORT) || 3000;

        /*
         * Так как этот файл находится в:
         *
         * public/app.js
         *
         * __dirname уже равен:
         *
         * /app/public
         *
         * Поэтому статические файлы находятся прямо здесь.
         */
        const PUBLIC_DIR = __dirname;

        const MIME_TYPES = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".ico": "image/x-icon",
            ".webp": "image/webp"
        };

        const server = http.createServer((req, res) => {
            if (req.method !== "GET" && req.method !== "HEAD") {
                res.writeHead(405, {
                    "Content-Type": "text/plain; charset=utf-8"
                });

                res.end("Method Not Allowed");
                return;
            }

            let pathname;

            try {
                pathname = decodeURIComponent(
                    new URL(req.url, "http://localhost").pathname
                );
            } catch (error) {
                res.writeHead(400, {
                    "Content-Type": "text/plain; charset=utf-8"
                });

                res.end("Bad Request");
                return;
            }

            /*
             * Главная страница.
             */
            if (pathname === "/") {
                pathname = "/index.html";
            }

            /*
             * Убираем начальный слэш.
             */
            const relativePath = pathname.replace(/^\/+/, "");

            const filePath = path.resolve(
                PUBLIC_DIR,
                relativePath
            );

            /*
             * Защита от выхода за пределы public.
             */
            if (
                filePath !== PUBLIC_DIR &&
                !filePath.startsWith(PUBLIC_DIR + path.sep)
            ) {
                res.writeHead(403, {
                    "Content-Type": "text/plain; charset=utf-8"
                });

                res.end("Forbidden");
                return;
            }

            fs.stat(filePath, (statError, stats) => {
                if (statError || !stats.isFile()) {
                    res.writeHead(404, {
                        "Content-Type": "text/plain; charset=utf-8"
                    });

                    res.end("File Not Found");
                    return;
                }

                const extension = path
                    .extname(filePath)
                    .toLowerCase();

                const contentType =
                    MIME_TYPES[extension] ||
                    "application/octet-stream";

                res.writeHead(200, {
                    "Content-Type": contentType,
                    "X-Content-Type-Options": "nosniff"
                });

                if (req.method === "HEAD") {
                    res.end();
                    return;
                }

                const stream = fs.createReadStream(filePath);

                stream.on("error", () => {
                    if (!res.headersSent) {
                        res.writeHead(500);
                    }

                    res.end();
                });

                stream.pipe(res);
            });
        });

        server.listen(PORT, "0.0.0.0", () => {
            console.log(
                `VK Mini App server started on port ${PORT}`
            );
        });

        /*
         * После запуска серверного режима дальше
         * браузерный код не выполняем.
         */
        return;
    }


    /*
     * ============================================================
     * РЕЖИМ БРАУЗЕРА / VK MINI APP
     * ============================================================
     *
     * Ниже находится обычная логика Mini App.
     */

    const state = {
        step: 1,
        product: null,
        goal: null,
        resources: null
    };


    /*
     * ============================================================
     * VK BRIDGE
     * ============================================================
     */

    async function initVK() {
        try {
            if (
                window.vkBridge &&
                typeof window.vkBridge.send === "function"
            ) {
                await Promise.race([
                    window.vkBridge.send("VKWebAppInit"),

                    new Promise(resolve => {
                        setTimeout(resolve, 1000);
                    })
                ]);
            }
        } catch (error) {
            console.log(
                "VK Bridge init skipped:",
                error
            );
        }
    }


    /*
     * ============================================================
     * БРЕНД
     * ============================================================
     */

    function renderBrand() {
        const brandElement =
            document.getElementById("brand");

        if (brandElement) {
            brandElement.textContent =
                CONFIG.brand || "";
        }
    }


    /*
     * ============================================================
     * СЧЁТЧИК ШАГОВ
     * ============================================================
     */

    function updateStepCounter() {
        const counter =
            document.getElementById("stepCounter");

        if (!counter) {
            return;
        }

        counter.textContent =
            state.step <= 3
                ? `${state.step} / 3`
                : "Результат";
    }


    /*
     * ============================================================
     * АНИМАЦИЯ
     * ============================================================
     */

    function restartAnimation() {
        const screen =
            document.getElementById("screen");

        if (!screen) {
            return;
        }

        screen.style.animation = "none";

        requestAnimationFrame(() => {
            screen.style.animation = "";
        });
    }


    /*
     * ============================================================
     * ОТРИСОВКА
     * ============================================================
     */

    function render(content) {
        const screen =
            document.getElementById("screen");

        if (!screen) {
            return;
        }

        screen.innerHTML = content;

        restartAnimation();
    }


    /*
     * ============================================================
     * КНОПКА ВАРИАНТА ОТВЕТА
     * ============================================================
     */

    function createOption(item, type) {
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


    /*
     * ============================================================
     * ОБРАБОТКА ОТВЕТОВ
     * ============================================================
     */

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

                            state.product = value;

                            state.step = 2;

                            renderGoalQuestion();

                            return;
                        }


                        if (type === "goal") {

                            state.goal = value;

                            state.step = 3;

                            renderResourcesQuestion();

                            return;
                        }


                        if (type === "resources") {

                            state.resources = value;

                            state.step = 4;

                            renderResult();

                            return;
                        }
                    }
                );
            });
    }


    /*
     * ============================================================
     * СТАРТОВЫЙ ЭКРАН
     * ============================================================
     */

    function renderStart() {

        state.step = 1;

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

            </section>
        `);


        const startButton =
            document.getElementById("startButton");


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


    /*
     * ============================================================
     * ВОПРОС 1
     * ============================================================
     */

    function renderProductQuestion() {

        state.step = 1;

        updateStepCounter();

        render(`
            <section class="question-card">

                <div class="eyebrow">
                    Вопрос 1
                </div>

                <h2>
                    Что вы продаёте?
                </h2>

                <div class="option-list">
                    ${CONFIG.products
                        .map(item =>
                            createOption(
                                item,
                                "product"
                            )
                        )
                        .join("")}
                </div>

            </section>
        `);

        attachOptionHandlers();
    }


    /*
     * ============================================================
     * ВОПРОС 2
     * ============================================================
     */

    function renderGoalQuestion() {

        state.step = 2;

        updateStepCounter();

        render(`
            <section class="question-card">

                <div class="eyebrow">
                    Вопрос 2
                </div>

                <h2>
                    Какая сейчас главная задача?
                </h2>

                <div class="option-list">
                    ${CONFIG.goals
                        .map(item =>
                            createOption(
                                item,
                                "goal"
                            )
                        )
                        .join("")}
                </div>

            </section>
        `);

        attachOptionHandlers();
    }


    /*
     * ============================================================
     * ВОПРОС 3
     * ============================================================
     */

    function renderResourcesQuestion() {

        state.step = 3;

        updateStepCounter();

        render(`
            <section class="question-card">

                <div class="eyebrow">
                    Вопрос 3
                </div>

                <h2>
                    Сколько ресурсов вы готовы вложить?
                </h2>

                <div class="option-list">
                    ${CONFIG.resources
                        .map(item =>
                            createOption(
                                item,
                                "resources"
                            )
                        )
                        .join("")}
                </div>

            </section>
        `);

        attachOptionHandlers();
    }


    /*
     * ============================================================
     * КЛЮЧ РЕЗУЛЬТАТА
     * ============================================================
     */

    function getResultKey() {

        return [
            state.product,
            state.goal,
            state.resources
        ].join("_");
    }


    /*
     * ============================================================
     * РЕЗУЛЬТАТ
     * ============================================================
     */

    function getResult() {

        return (
            CONFIG.results[getResultKey()] ||
            CONFIG.results.default
        );
    }


    /*
     * ============================================================
     * ЭКРАН РЕЗУЛЬТАТА
     * ============================================================
     */

    function renderResult() {

        state.step = 4;

        updateStepCounter();

        const result = getResult();


        const botHelpUrl =
            CONFIG.botHelpLandingUrl || "#";


        const botHelpButtonText =
            CONFIG.materialsButtonText ||
            "Получить полезные материалы";


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


                <!--
                    КНОПКА 1.
                    Переход на ВК-лендинг BotHelp.
                -->

                <a
                    class="primary-button"
                    href="${botHelpUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="materialsButton"
                >
                    ${botHelpButtonText}
                </a>


                <!--
                    КНОПКА 2.
                    Переход в личные сообщения ВК.
                -->

                <a
                    class="secondary-button messages-button"
                    href="${CONFIG.personalMessagesUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${
                        CONFIG.resultButtonText ||
                        "Обсудить мой результат"
                    }
                </a>


                <!--
                    КНОПКА 3.
                    Повторное прохождение.
                -->

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

            </section>
        `);


        /*
         * Проверяем ссылку BotHelp.
         */

        const materialsButton =
            document.getElementById(
                "materialsButton"
            );


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


        /*
         * Повторное прохождение.
         */

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


    /*
     * ============================================================
     * ЗАПУСК MINI APP
     * ============================================================
     */

    document.addEventListener(
        "DOMContentLoaded",
        async () => {

            renderBrand();

            await initVK();

            renderStart();
        }
    );

})();
