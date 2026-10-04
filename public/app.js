// ============================================================
// VK MINI APP
// Основная логика приложения
//
// Работает:
// 1. в браузере / VK Mini App
// 2. в BotHost через Node.js как HTTP-сервер
//
// ВАЖНО:
// Не меняем существующие CSS-классы.
// Варианты ответов используют:
// .option
// .options
// ============================================================


// ============================================================
// РЕЖИМ BOTHOST / NODE.JS
// ============================================================
//
// BotHost запускает:
// node public/app.js
//
// Поэтому сначала проверяем:
// есть ли document.
//
// Если document нет — мы находимся в Node.js,
// и запускаем HTTP-сервер.
//
// Если document есть — мы в браузере,
// и запускаем обычную Mini App.
// ============================================================

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

        ".html":
            "text/html; charset=utf-8",

        ".js":
            "application/javascript; charset=utf-8",

        ".css":
            "text/css; charset=utf-8",

        ".json":
            "application/json; charset=utf-8",

        ".png":
            "image/png",

        ".jpg":
            "image/jpeg",

        ".jpeg":
            "image/jpeg",

        ".gif":
            "image/gif",

        ".svg":
            "image/svg+xml",

        ".webp":
            "image/webp",

        ".ico":
            "image/x-icon"

    };


    const server =
        http.createServer(
            (req, res) => {

                try {

                    let requestPath =
                        decodeURIComponent(
                            (req.url || "/")
                                .split("?")[0]
                        );


                    if (
                        !requestPath ||
                        requestPath === "/"
                    ) {

                        requestPath =
                            "/index.html";

                    }


                    const relativePath =
                        requestPath
                            .replace(/^\/+/, "");


                    const filePath =
                        path.resolve(
                            PUBLIC_DIR,
                            relativePath
                        );


                    const publicRoot =
                        path.resolve(
                            PUBLIC_DIR
                        );


                    // Защита от выхода
                    // за пределы папки public.
                    if (
                        filePath !== publicRoot &&
                        !filePath.startsWith(
                            publicRoot +
                            path.sep
                        )
                    ) {

                        res.writeHead(
                            403,
                            {
                                "Content-Type":
                                    "text/plain; charset=utf-8"
                            }
                        );

                        res.end(
                            "Forbidden"
                        );

                        return;

                    }


                    fs.readFile(
                        filePath,
                        (error, data) => {

                            if (error) {

                                // Если файл не найден,
                                // для Mini App возвращаем
                                // index.html.

                                const fallbackPath =
                                    path.join(
                                        PUBLIC_DIR,
                                        "index.html"
                                    );


                                fs.readFile(
                                    fallbackPath,
                                    (
                                        fallbackError,
                                        fallbackData
                                    ) => {

                                        if (
                                            fallbackError
                                        ) {

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
                                path.extname(
                                    filePath
                                ).toLowerCase();


                            const contentType =
                                MIME_TYPES[
                                    extension
                                ] ||
                                "application/octet-stream";


                            res.writeHead(
                                200,
                                {
                                    "Content-Type":
                                        contentType
                                }
                            );


                            res.end(
                                data
                            );

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


    // В Node.js дальше браузерный код
    // выполнять нельзя.
    return;

}


// ============================================================
// НИЖЕ — ТОЛЬКО БРАУЗЕРНАЯ ЧАСТЬ
// ============================================================


// ============================================================
// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ============================================================

let state = {

    step: 1,

    product: null,

    goal: null,

    resources: null

};


// ============================================================
// ЭЛЕМЕНТЫ СТРАНИЦЫ
// ============================================================

const screen =
    document.getElementById(
        "screen"
    );


const stepCounter =
    document.getElementById(
        "stepCounter"
    );


const brandElement =
    document.getElementById(
        "brand"
    );


// ============================================================
// ИНИЦИАЛИЗАЦИЯ VK
// ============================================================

async function initVK() {

    try {

        if (
            window.vkBridge &&
            typeof window.vkBridge.send ===
                "function"
        ) {

            await Promise.race([

                window.vkBridge.send(
                    "VKWebAppInit"
                ),

                new Promise(
                    resolve => {

                        setTimeout(
                            resolve,
                            1000
                        );

                    }
                )

            ]);

        }

    } catch (error) {

        console.log(
            "VK Bridge initialization:",
            error
        );

    }

}


// ============================================================
// БРЕНД
// ============================================================

function renderBrand() {

    if (
        brandElement &&
        typeof CONFIG !==
            "undefined" &&
        CONFIG.brand
    ) {

        brandElement.textContent =
            CONFIG.brand;

    }

}


// ============================================================
// СЧЁТЧИК ШАГОВ
// ============================================================

function updateStepCounter() {

    if (!stepCounter) {

        return;

    }


    if (state.step <= 3) {

        stepCounter.textContent =
            `${state.step} / 3`;

    } else {

        stepCounter.textContent =
            "";

    }

}


// ============================================================
// ПЕРЕЗАПУСК CSS-АНИМАЦИИ
// ============================================================

function restartAnimation() {

    if (!screen) {

        return;

    }


    screen.style.animation =
        "none";


    void screen.offsetWidth;


    screen.style.animation =
        "";

}


// ============================================================
// ОТРИСОВКА ЭКРАНА
// ============================================================

function render(html) {

    if (!screen) {

        console.error(
            "Ошибка: элемент #screen не найден."
        );

        return;

    }


    screen.innerHTML =
        html;


    restartAnimation();


    updateStepCounter();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ============================================================
// СОЗДАНИЕ ВАРИАНТА ОТВЕТА
// ============================================================
//
// ВАЖНО:
// Здесь именно class="option".
// Это существующий класс твоего style.css.
//
// НЕ менять на option-button.
// ============================================================

function createOption(item) {

    return `

        <button
            class="option"
            type="button"
            data-id="${item.id}"
        >

            <span class="option-title">
                ${item.title}
            </span>

            <span class="option-description">
                ${item.description || ""}
            </span>

        </button>

    `;

}


// ============================================================
// ПОДКЛЮЧЕНИЕ ОБРАБОТЧИКОВ КНОПОК
// ============================================================

function attachOptionHandlers(
    handler
) {

    document
        .querySelectorAll(
            ".option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        handler(id);

                    }
                );

            }
        );

}


// ============================================================
// ГЛАВНЫЙ ЭКРАН
// ============================================================

function renderStart() {

    state.step = 1;

    state.product = null;

    state.goal = null;

    state.resources = null;


    render(`

        <div class="badge">
            ИНТЕРАКТИВНЫЙ
            ДИАГНОСТИЧЕСКИЙ ТЕСТ
        </div>


        <h1>
            ${CONFIG.title}
        </h1>


        <p class="description">
            ${CONFIG.subtitle}
        </p>


        <button
            class="primary-button"
            id="startButton"
            type="button"
        >
            Начать
        </button>


        <div class="note">
            Всего 3 вопроса.
            В конце вы получите
            персональную рекомендацию.
        </div>

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


// ============================================================
// ВОПРОС 1
// ============================================================

function renderProductQuestion() {

    state.step = 1;


    const options =
        CONFIG.products
            .map(
                item =>
                    createOption(item)
            )
            .join("");


    render(`

        <div class="progress">

            <div
                class="progress-inner"
                style="width: 33.33%"
            ></div>

        </div>


        <div class="badge">
            ВОПРОС 1
        </div>


        <h2>
            Что вы продаёте?
        </h2>


        <p class="description">
            Выберите вариант,
            который ближе всего
            к вашей модели бизнеса.
        </p>


        <div class="options">

            ${options}

        </div>

    `);


    attachOptionHandlers(
        productId => {

            state.product =
                productId;


            renderGoalQuestion();

        }
    );

}


// ============================================================
// ВОПРОС 2
// ============================================================

function renderGoalQuestion() {

    state.step = 2;


    const options =
        CONFIG.goals
            .map(
                item =>
                    createOption(item)
            )
            .join("");


    render(`

        <div class="progress">

            <div
                class="progress-inner"
                style="width: 66.66%"
            ></div>

        </div>


        <div class="badge">
            ВОПРОС 2
        </div>


        <h2>
            Что сейчас важнее всего?
        </h2>


        <p class="description">
            Выберите главную задачу,
            которую хотите решить.
        </p>


        <div class="options">

            ${options}

        </div>


        <button
            class="back-button"
            id="backButton"
            type="button"
        >
            ← Назад
        </button>

    `);


    attachOptionHandlers(
        goalId => {

            state.goal =
                goalId;


            renderResourcesQuestion();

        }
    );


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


// ============================================================
// ВОПРОС 3
// ============================================================

function renderResourcesQuestion() {

    state.step = 3;


    const options =
        CONFIG.resources
            .map(
                item =>
                    createOption(item)
            )
            .join("");


    render(`

        <div class="progress">

            <div
                class="progress-inner"
                style="width: 100%"
            ></div>

        </div>


        <div class="badge">
            ВОПРОС 3
        </div>


        <h2>
            Сколько ресурсов готовы вложить?
        </h2>


        <p class="description">
            Не только деньги — учитываем также
            время и готовность разбираться
            с системой.
        </p>


        <div class="options">

            ${options}

        </div>


        <button
            class="back-button"
            id="backButton"
            type="button"
        >
            ← Назад
        </button>

    `);


    attachOptionHandlers(
        resourceId => {

            state.resources =
                resourceId;


            renderResult();

        }
    );


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


// ============================================================
// КЛЮЧ РЕЗУЛЬТАТА
// ============================================================

function getResultKey() {

    return [

        state.product,

        state.goal,

        state.resources

    ].join("_");

}


// ============================================================
// ПОЛУЧЕНИЕ РЕЗУЛЬТАТА
// ============================================================

function getResult() {

    const key =
        getResultKey();


    return (

        RESULTS[key] ||

        RESULTS.default

    );

}


// ============================================================
// ЭКРАН РЕЗУЛЬТАТА
// ============================================================

function renderResult() {

    state.step = 4;


    const result =
        getResult();


    const botHelpUrl =
        CONFIG.botHelpLandingUrl || "#";


    const privacyUrl =
        CONFIG.privacyPolicyUrl || "#";


    render(`

        <div class="badge">
            ВАШ РЕЗУЛЬТАТ
        </div>


        <h2>
            Вот что вам сейчас
            действительно нужно
        </h2>


        <div class="result-card">

            <div class="result-label">
                РЕКОМЕНДАЦИЯ
            </div>


            <div class="result-name">
                ${result.name}
            </div>


            <div class="result-description">
                ${result.description}
            </div>

        </div>


        <!-- =========================================
             СОГЛАСИЕ
             ========================================= -->

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


        <!-- =========================================
             BOTHELP
             ========================================= -->

        <a
            class="primary-button"
            id="materialsButton"
            href="${botHelpUrl}"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${
                CONFIG.materialsButtonText ||
                "Получить полезные материалы"
            }
        </a>


        <!-- =========================================
             ЛИЧНЫЕ СООБЩЕНИЯ
             ========================================= -->

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


        <!-- =========================================
             ЗАНОВО
             ========================================= -->

        <button
            class="secondary-button"
            id="restartButton"
            type="button"
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

    `);


    // ========================================================
    // СОГЛАСИЕ НА РАССЫЛКУ
    // ========================================================

    const consentCheckbox =
        document.getElementById(
            "consentCheckbox"
        );


    const materialsButton =
        document.getElementById(
            "materialsButton"
        );


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


    // ========================================================
    // ПРОВЕРКА ССЫЛКИ BOTHELP
    // ========================================================

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
                    "В public/config.js ещё не указана ссылка на ВК-лендинг BotHelp."
                );

            }
        );

    }


    // ========================================================
    // КНОПКА "ПРОЙТИ ЗАНОВО"
    // ========================================================

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


// ============================================================
// 27 РЕЗУЛЬТАТОВ
// ============================================================

const RESULTS = {


    // ========================================================
    // УСЛУГИ — ПРОДАЖИ
    // ========================================================

    services_sales_minimum: {

        name:
            "Не усложняйте. Сначала — короткий путь к покупке.",

        description:
            "Если ресурсов немного, не стройте большую воронку. Выберите одну конкретную услугу и сделайте простой сценарий: проблема клиента → короткая польза → предложение услуги. Ваша задача сейчас — убрать лишние шаги между интересом и обращением."

    },


    services_sales_medium: {

        name:
            "Соберите мини-воронку под одну услугу.",

        description:
            "Вы уже можете автоматизировать первый этап продаж. Сделайте небольшой тест, опрос или подбор решения, который заканчивается персональной рекомендацией и предложением обратиться к вам. Это позволит не объяснять одно и то же каждому человеку вручную."

    },


    services_sales_maximum: {

        name:
            "Автоматизируйте первичную консультацию.",

        description:
            "При наличии ресурсов можно построить полноценный путь клиента: знакомство → диагностика → персональная рекомендация → запись или заявка. Главное — автоматизировать не всё подряд, а тот участок, где вы регулярно отвечаете на одинаковые вопросы."

    },


    // ========================================================
    // УСЛУГИ — ПРОГРЕВ
    // ========================================================

    services_warming_minimum: {

        name:
            "Начните с одного полезного сценария.",

        description:
            "Вам не нужен сложный прогрев. Выберите один частый вопрос клиента и превратите его в небольшую интерактивную механику: человек отвечает на несколько вопросов и получает практическую рекомендацию. Так вы одновременно даёте пользу и показываете свою экспертизу."

    },


    services_warming_medium: {

        name:
            "Дайте аудитории повод взаимодействовать с вами.",

        description:
            "Сделайте интерактивный материал вместо очередного поста: тест, диагностику или подбор решения. После результата предложите следующий логичный шаг — консультацию, разбор или другой ваш продукт."

    },


    services_warming_maximum: {

        name:
            "Постройте цепочку от интереса до обращения.",

        description:
            "У вас уже достаточно ресурсов, чтобы соединить контент и автоматизацию. Можно сделать сценарий из нескольких касаний: диагностика → полезный результат → дополнительный материал → предложение услуги. Такой путь работает как продолжение контента, а не как отдельная рекламная конструкция."

    },


    // ========================================================
    // УСЛУГИ — ВОЗВРАТ
    // ========================================================

    services_reactivation_minimum: {

        name:
            "Вернитесь к тем, кто уже проявлял интерес.",

        description:
            "Не начинайте поиск клиентов с нуля. Возьмите людей, которые когда-то спрашивали о вашей услуге, но не купили. Подготовьте одно короткое сообщение с новой причиной вернуться к разговору: новый формат, полезный материал или актуальная проблема."

    },


    services_reactivation_medium: {

        name:
            "Сегментируйте тех, кто уже вас знает.",

        description:
            "Разделите старую аудиторию хотя бы на две группы: интересовались услугой и покупали раньше. Для каждой группы подготовьте отдельное предложение. Даже такая простая сегментация обычно полезнее массового одинакового сообщения всем."

    },


    services_reactivation_maximum: {

        name:
            "Создайте автоматический сценарий возврата.",

        description:
            "Можно настроить механику, которая собирает старую аудиторию, предлагает короткую диагностику и в зависимости от ответа показывает подходящий следующий шаг. Это превращает забытый контакт в потенциального клиента без постоянной ручной работы."

    },


    // ========================================================
    // ТОВАРЫ — ПРОДАЖИ
    // ========================================================

    products_sales_minimum: {

        name:
            "Помогите человеку быстрее выбрать товар.",

        description:
            "Если ассортимент большой, покупателю может быть сложно принять решение. Начните с простого подбора: несколько вопросов → подходящий товар или категория. Даже без сложной автоматизации вы убираете один из главных барьеров перед покупкой."

    },


    products_sales_medium: {

        name:
            "Сделайте интерактивный подбор.",

        description:
            "Ваш следующий шаг — превратить каталог в помощника по выбору. Человек отвечает на несколько вопросов о своей задаче, а система показывает подходящие варианты. Это особенно полезно, если клиенту трудно самостоятельно разобраться в ассортименте."

    },


    products_sales_maximum: {

        name:
            "Превратите выбор товара в полноценный сценарий.",

        description:
            "Можно построить путь: задача клиента → подбор → рекомендации → дополнительные товары → переход к покупке. Такой сценарий помогает не просто показать ассортимент, а провести человека через выбор."

    },


    // ========================================================
    // ТОВАРЫ — ПРОГРЕВ
    // ========================================================

    products_warming_minimum: {

        name:
            "Покажите товар через задачу клиента.",

        description:
            "Не начинайте прогрев с перечисления характеристик. Возьмите одну ситуацию, в которой человеку нужен ваш товар, и покажите решение этой задачи. Один конкретный сценарий обычно понятнее, чем длинное описание всех преимуществ."

    },


    products_warming_medium: {

        name:
            "Добавьте интерактив в знакомство с продуктом.",

        description:
            "Попробуйте механику «ответьте на несколько вопросов — получите подходящий вариант». Она одновременно вовлекает человека и помогает ему понять, какой товар ему действительно нужен."

    },


    products_warming_maximum: {

        name:
            "Свяжите контент, подбор и продажу.",

        description:
            "Можно создать полноценный интерактивный путь: человек определяет свою задачу → получает рекомендацию → знакомится с подходящим товаром → получает дополнительные предложения. Так контент становится частью продаж."

    },


    // ========================================================
    // ТОВАРЫ — ВОЗВРАТ
    // ========================================================

    products_reactivation_minimum: {

        name:
            "Напомните о себе с конкретным поводом.",

        description:
            "Не отправляйте старым клиентам просто «давно не виделись». Дайте причину вернуться: новый товар, обновлённая коллекция, решение сезонной задачи или полезная подборка."

    },


    products_reactivation_medium: {

        name:
            "Сделайте повторный выбор проще.",

        description:
            "Посмотрите, что покупали ваши клиенты раньше, и предложите им следующий логичный вариант: дополнение, расходник, обновление или похожий товар. Персонализация здесь может быть очень простой."

    },


    products_reactivation_maximum: {

        name:
            "Постройте систему повторных продаж.",

        description:
            "Если база уже есть, можно автоматизировать повторные касания: сегментировать покупателей, учитывать предыдущие покупки и показывать подходящие предложения. Начните с одного товарного сценария, а затем расширяйте систему."

    },


    // ========================================================
    // ОБУЧЕНИЕ — ПРОДАЖИ
    // ========================================================

    education_sales_minimum: {

        name:
            "Продавайте не курс, а следующий шаг.",

        description:
            "Если человеку сложно решиться на обучение, не пытайтесь сразу рассказать обо всём курсе. Дайте ему короткую диагностику или мини-разбор, который помогает увидеть собственную точку А. После этого предложение обучения становится логичным продолжением."

    },


    education_sales_medium: {

        name:
            "Сделайте диагностику входом в обучение.",

        description:
            "Создайте короткий тест, который помогает человеку определить свою ситуацию. В результате покажите, что ему стоит сделать дальше, и свяжите эту рекомендацию с вашим обучением. Так вы продаёте через полезность, а не через длинную презентацию."

    },


    education_sales_maximum: {

        name:
            "Постройте персональный маршрут до продукта.",

        description:
            "При достаточных ресурсах можно сделать интерактивную диагностику с разными результатами. Каждый результат должен объяснять проблему человека, давать один практический шаг и показывать, какой формат обучения подойдёт дальше."

    },


    // ========================================================
    // ОБУЧЕНИЕ — ПРОГРЕВ
    // ========================================================

    education_warming_minimum: {

        name:
            "Дайте человеку маленький результат ещё до покупки.",

        description:
            "Выберите одну проблему из программы обучения и помогите человеку сделать первый шаг бесплатно. Хороший прогрев здесь — не количество контента, а ощущение: «Я уже получил пользу от этого эксперта»."

    },


    education_warming_medium: {

        name:
            "Превратите экспертность в интерактив.",

        description:
            "Вместо очередной серии постов попробуйте диагностику, тест или мини-кейс. Человек проходит механику, получает разбор своей ситуации и видит, что ещё можно изменить с вашей помощью."

    },


    education_warming_maximum: {

        name:
            "Создайте полноценный диагностический лид-магнит.",

        description:
            "Можно соединить несколько вопросов, персональные результаты, полезные материалы и следующий шаг. Главное — каждый результат должен быть самостоятельной мини-пользой, а не просто рекламой курса."

    },


    // ========================================================
    // ОБУЧЕНИЕ — ВОЗВРАТ
    // ========================================================

    education_reactivation_minimum: {

        name:
            "Вернитесь к старой аудитории через пользу.",

        description:
            "Не начинайте с предложения купить курс. Напомните о себе через короткую диагностику, полезный материал или новый разбор проблемы, с которой ваша аудитория уже сталкивалась."

    },


    education_reactivation_medium: {

        name:
            "Разделите старую базу по интересам.",

        description:
            "Посмотрите, какие темы интересовали людей раньше. Затем предложите каждой группе свой следующий шаг: материал, диагностику, открытый урок или соответствующий продукт. Даже простая сегментация сделает повторное касание гораздо точнее."

    },


    education_reactivation_maximum: {

        name:
            "Соберите систему возвращения аудитории.",

        description:
            "Можно настроить несколько сценариев в зависимости от того, что человек изучал, на каком этапе остановился и какой продукт ему уже предлагали. Начните с одного сегмента и одного сценария, а не пытайтесь автоматизировать всю базу сразу."

    },


    // ========================================================
    // РЕЗЕРВНЫЙ РЕЗУЛЬТАТ
    // ========================================================

    default: {

        name:
            "Начните с одного понятного сценария.",

        description:
            "Не пытайтесь автоматизировать весь бизнес сразу. Найдите один повторяющийся путь клиента и сделайте его понятнее: что человек делает, что получает и какой следующий шаг ему предложить."

    }

};


// ============================================================
// ЗАПУСК ПРИЛОЖЕНИЯ
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        renderBrand();

        await initVK();

        renderStart();

    }
);
