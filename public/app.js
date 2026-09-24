(function () {
    "use strict";

    const state = {
        step: 1,
        product: null,
        goal: null,
        resources: null
    };

    const screen = document.getElementById("screen");
    const brand = document.getElementById("brand");
    const stepCounter = document.getElementById("stepCounter");

    if (!screen) {
        return;
    }

    if (typeof CONFIG === "undefined") {
        screen.innerHTML = `
            <div class="screen-inner">
                <h1 class="title">Ошибка загрузки</h1>
                <p class="subtitle">
                    Не найден файл config.js.
                </p>
            </div>
        `;
        return;
    }

    brand.textContent = CONFIG.brand || "";

    function updateStep(number) {
        state.step = number;

        if (stepCounter) {
            stepCounter.textContent =
                number <= 3
                    ? `${number} / 3`
                    : "";
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderStart() {
        updateStep(1);

        screen.innerHTML = `
            <div class="screen-inner">

                <div class="eyebrow">
                    Интерактивная диагностика
                </div>

                <h1 class="title">
                    ${escapeHtml(
                        CONFIG.title ||
                        "Что вам на самом деле нужно?"
                    )}
                </h1>

                <p class="subtitle">
                    ${escapeHtml(
                        CONFIG.subtitle ||
                        "Ответьте на три вопроса — и получите персональную механику."
                    )}
                </p>

                <div class="question">
                    Что вы продаёте?
                </div>

                <div class="options">
                    ${renderOptions(CONFIG.products || [], "product")}
                </div>

            </div>
        `;

        bindOptions("product");
    }

    function renderOptions(items, type) {
        return items.map(function (item) {
            return `
                <button
                    type="button"
                    class="option"
                    data-type="${escapeHtml(type)}"
                    data-id="${escapeHtml(item.id)}"
                >
                    <span class="option-title">
                        ${escapeHtml(item.title)}
                    </span>

                    ${
                        item.description
                            ? `
                                <span class="option-description">
                                    ${escapeHtml(item.description)}
                                </span>
                            `
                            : ""
                    }
                </button>
            `;
        }).join("");
    }

    function bindOptions(type) {
        const buttons = screen.querySelectorAll(
            `.option[data-type="${type}"]`
        );

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                const id = button.dataset.id;

                if (type === "product") {
                    state.product = id;
                    renderGoal();
                }

                if (type === "goal") {
                    state.goal = id;
                    renderResources();
                }

                if (type === "resources") {
                    state.resources = id;
                    renderResult();
                }
            });
        });
    }

    function renderGoal() {
        updateStep(2);

        screen.innerHTML = `
            <div class="screen-inner">

                <div class="eyebrow">
                    Вопрос 2 из 3
                </div>

                <h1 class="title">
                    Какая задача сейчас главная?
                </h1>

                <p class="subtitle">
                    Выберите то, что важнее всего прямо сейчас.
                </p>

                <div class="options">
                    ${renderOptions(CONFIG.goals || [], "goal")}
                </div>

            </div>
        `;

        bindOptions("goal");
    }

    function renderResources() {
        updateStep(3);

        screen.innerHTML = `
            <div class="screen-inner">

                <div class="eyebrow">
                    Последний вопрос
                </div>

                <h1 class="title">
                    Сколько ресурсов готовы вложить?
                </h1>

                <p class="subtitle">
                    Это поможет подобрать механику без лишней сложности.
                </p>

                <div class="options">
                    ${renderOptions(
                        CONFIG.resources || [],
                        "resources"
                    )}
                </div>

            </div>
        `;

        bindOptions("resources");
    }

    function getResult() {
        const key =
            `${state.product}_${state.goal}_${state.resources}`;

        if (
            CONFIG.results &&
            CONFIG.results[key]
        ) {
            return CONFIG.results[key];
        }

        if (
            CONFIG.results &&
            CONFIG.results.default
        ) {
            return CONFIG.results.default;
        }

        return {
            name: "Персональная механика",
            description:
                "По вашим ответам стоит подобрать механику, которая соответствует вашей задаче, продукту и доступным ресурсам."
        };
    }

    function renderResult() {
        updateStep(4);

        const result = getResult();

        const resultName =
            result.name ||
            result.title ||
            "Персональная механика";

        const resultDescription =
            result.description ||
            "";

        const buttonText =
            CONFIG.resultButtonText ||
            "Обсудить результат";

        screen.innerHTML = `
            <div class="screen-inner">

                <div class="eyebrow">
                    Ваш результат
                </div>

                <h1 class="title">
                    Вот что вам подходит
                </h1>

                <div class="result-card">

                    <div class="result-label">
                        Рекомендация
                    </div>

                    <div class="result-name">
                        ${escapeHtml(resultName)}
                    </div>

                    <div class="result-description">
                        ${escapeHtml(resultDescription)}
                    </div>

                    <div class="actions">

                        <a
                            class="primary-button messages-button"
                            href="${escapeHtml(
                                CONFIG.personalMessagesUrl || "#"
                            )}"
                        >
                            ${escapeHtml(buttonText)}
                        </a>

                        <button
                            type="button"
                            class="secondary-button"
                            id="restartButton"
                        >
                            ${escapeHtml(
                                CONFIG.restartButtonText ||
                                "Пройти заново"
                            )}
                        </button>

                    </div>

                    <div class="note">
                        Нажмите кнопку, чтобы перейти к личным сообщениям.
                    </div>

                </div>

            </div>
        `;

        const restartButton =
            document.getElementById("restartButton");

        if (restartButton) {
            restartButton.addEventListener(
                "click",
                function () {
                    state.product = null;
                    state.goal = null;
                    state.resources = null;

                    renderStart();
                }
            );
        }
    }

    renderStart();

})();
