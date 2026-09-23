const state = {
    step: 1,
    product: null,
    goal: null,
    resources: null
};


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
        console.log("VK Bridge init skipped:", error);
    }
}


function renderBrand() {
    const brandElement = document.getElementById("brand");

    if (!brandElement) {
        return;
    }

    brandElement.textContent = CONFIG.brand || "";
}


function updateStepCounter() {
    const counter = document.getElementById("stepCounter");

    if (!counter) {
        return;
    }

    if (state.step <= 3) {
        counter.textContent = `${state.step} / 3`;
    } else {
        counter.textContent = "Результат";
    }
}


function restartAnimation() {
    const screen = document.getElementById("screen");

    if (!screen) {
        return;
    }

    screen.style.animation = "none";

    requestAnimationFrame(() => {
        screen.style.animation = "";
    });
}


function render(content) {
    const screen = document.getElementById("screen");

    if (!screen) {
        return;
    }

    screen.innerHTML = content;

    restartAnimation();
}


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


function attachOptionHandlers() {
    const buttons = document.querySelectorAll(".option-button");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const type = button.dataset.type;
            const value = button.dataset.value;

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
            }
        });
    });
}


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

    document
        .getElementById("startButton")
        .addEventListener("click", () => {
            state.step = 1;
            renderProductQuestion();
        });
}


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
                    .map(item => createOption(item, "product"))
                    .join("")}
            </div>

        </section>
    `);

    attachOptionHandlers();
}


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
                    .map(item => createOption(item, "goal"))
                    .join("")}
            </div>

        </section>
    `);

    attachOptionHandlers();
}


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
                    .map(item => createOption(item, "resources"))
                    .join("")}
            </div>

        </section>
    `);

    attachOptionHandlers();
}


function getResultKey() {
    return [
        state.product,
        state.goal,
        state.resources
    ].join("_");
}


function getResult() {
    const key = getResultKey();

    return (
        CONFIG.results[key] ||
        CONFIG.results.default
    );
}


function renderResult() {
    state.step = 4;

    updateStepCounter();

    const result = getResult();

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

            <a
                class="primary-button messages-button"
                href="${CONFIG.personalMessagesUrl}"
            >
                ${CONFIG.resultButtonText}
            </a>

            <button
                class="secondary-button"
                type="button"
                id="restartButton"
            >
                ${CONFIG.restartButtonText}
            </button>

        </section>
    `);

    document
        .getElementById("restartButton")
        .addEventListener("click", () => {
            state.product = null;
            state.goal = null;
            state.resources = null;

            renderProductQuestion();
        });
}


document.addEventListener("DOMContentLoaded", async () => {
    renderBrand();

    await initVK();

    renderStart();
});
