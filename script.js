const TEMPLATE_NAME = {
    feature: 'FEATURE.md',
    fix: 'FIX.md',
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

window.addEventListener("DOMContentLoaded", () => {
    const PRCreateButton = [...document.querySelectorAll('button')].find((v) => {
        return v.querySelector('span')?.textContent.trim() === 'Create pull request';
    })

    if (!PRCreateButton) return;

    const parentOfPRCreateButton = PRCreateButton.closest('.BtnGroup');
    const selector = createElementFromHTMLTemplate(selectorHTMLString);

    registryOnChangeEventToSelectEl(selector.querySelector('select'));

    parentOfPRCreateButton.parentElement.insertBefore(selector, parentOfPRCreateButton);
});
