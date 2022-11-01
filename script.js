const TEMPLATE_KEY = 'template';
const TEMPLATE_NAME = {
    feature: 'FEATURE.md',
    fix: 'FIX.md',
};

const SELECTOR_IDENTIFIER = {
    wrapper: 'ex-select-wrapper',
    select: 'ex-select',
    optionForPlaceholder: 'ex-select__option--placeholder',
};

const PR_BUTTON_CONTENT = {
    draft: 'Draft pull request',
    create: 'Create pull request',
};

const selectorHTMLString = `
    <div id=${SELECTOR_IDENTIFIER.wrapper}>
      <select id="${SELECTOR_IDENTIFIER.select}">
        <option
            value="-- Select PR template --"
            disabled
            selected
            id="${SELECTOR_IDENTIFIER.optionForPlaceholder}"
        >
            -- Select PR template --
        </option>
        <option value="${TEMPLATE_NAME.feature}">Feature</option>
        <option value="${TEMPLATE_NAME.fix}">Fix</option>
      </select>
    </div>
`;

function createElementFromHTMLTemplate(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    return div.firstChild;
}

function injectSelector() {
    const prEditorOpened = document.body.classList.contains('is-pr-composer-expanded');
    if (!prEditorOpened) return;

    const alreadyInjected = document.getElementById(SELECTOR_IDENTIFIER.wrapper);
    if (alreadyInjected) return;

    const PRButtonContents = Object.values(PR_BUTTON_CONTENT);
    const PRCreateButton = [...document.querySelectorAll('button')].find((button) => {
        const childSpan = button.querySelector('span');
        const buttonTextContent = childSpan?.textContent.trim();
        if (!buttonTextContent) return;

        return PRButtonContents.includes(buttonTextContent);
    })

    if (!PRCreateButton) {
        console.warn('[PR Selector]: Fail to find PRCreateButton');
        return;
    }

    const parentOfPRCreateButton = PRCreateButton.closest('.BtnGroup');
    const selector = createElementFromHTMLTemplate(selectorHTMLString);
    const selectEl = selector.querySelector('select');

    const url = new URL(location.href);

    const currentTemplate = url.searchParams.get(TEMPLATE_KEY);
    if (currentTemplate) {
        const currentOption = selectEl.querySelector(`option[value="${currentTemplate}"]`);

        if (currentOption) {
            const optionForPlaceholder = selectEl.querySelector(`#${SELECTOR_IDENTIFIER.optionForPlaceholder}`);
            optionForPlaceholder?.removeAttribute('selected');

            currentOption.disabled = true;
            currentOption.defaultSelected = true;
        }
    }

    selectEl.addEventListener('change', (e) => {
        const templateName = e.target.value;
        url.searchParams.set(TEMPLATE_KEY, templateName);
        location.href = url.href;
    })

    parentOfPRCreateButton.parentElement.insertBefore(selector, parentOfPRCreateButton);
};

setInterval(() => {
    injectSelector();
}, 2000);
