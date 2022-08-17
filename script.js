const TEMPLATE_NAME = {
    feature: 'FEATURE.md',
    fix: 'FIX.md',
};

const PR_BUTTON_CONTENT = {
    draft: 'Draft pull request',
    create: 'Create pull request',
};

const selectorHTMLString = `
    <div class="ex-select-wrapper">
      <select class="ex-select">
        <option
            value=""
            disabled
            selected
            class="ex-select__option--placeholder"
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

function setQueryState(key, value) {
    const url = new URL(location.href);
    url.searchParams.set(key, value);

    location.href = url.href;
}

function registryOnChangeEventToSelectEl(selectEl) {
    selectEl.addEventListener('change', (e) => {
        const templateName = e.target.value;
        setQueryState('template', templateName);
    })
}

function init () {
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
    registryOnChangeEventToSelectEl(selector.querySelector('select'));

    parentOfPRCreateButton.parentElement.insertBefore(selector, parentOfPRCreateButton);
};

init();
