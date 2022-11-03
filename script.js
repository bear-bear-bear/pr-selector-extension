const GITHUB_URL = 'https://github.com';
const defaultBranch = 'develop';
const templateFolder = 'PULL_REQUEST_TEMPLATE';

const highlightColor = 'pink';

console.log('%cpr-selector-extension %chas loaded', `color: ${highlightColor}`, '');

waitDomReady().then(async () => {

  while(true) {
    console.log('Waiting %cPull Request form element..', `color: ${highlightColor}`);
    const $pull_request_body = await waitElement('#pull_request_body', document, false);
    console.log('%cPull Request form element %cdetected', `color: ${highlightColor}`, '');
    const $pr_form = document.querySelector('turbo-frame form div[data-view-component=true].Layout-main .js-slash-command-surface');

    const templateFetchingJob = fetchTemplates();

    // Add template selector
    const $pull_request_footer = $pr_form.querySelector('div.flex-md-justify-end');

    // Create select
    const $select = document.createElement('div');
    $select.classList.add('BtnGroup');

    const $selectTitle = document.createElement('div');
    $selectTitle.textContent = 'Choose template';
    $selectTitle.classList = 'btn-secondary btn BtnGroup-item flex-auto';

    const $details = document.createElement('details');
    $details.classList = 'details-reset details-overlay select-menu BtnGroup-parent position-relative';
    const $summary = document.createElement('summary');
    $summary.classList = 'select-menu-button btn-secondary btn BtnGroup-item float-none';

    const $detailsMenu = document.createElement('details-menu');
    $detailsMenu.classList = 'select-menu-modal position-absolute right-0 js-sync-select-menu-text';
    $detailsMenu.style.width = 'auto';
    $detailsMenu.style.zIndex = '99';
    $detailsMenu.setAttribute('data-focus-trap', 'suspended');

    $details.append($summary);
    $details.append($detailsMenu);


    // Append options
    const templates = await templateFetchingJob;

    if(templates.length > 0) {
      for (const template of templates) {
        const $label = document.createElement('label');
        $label.classList = 'select-menu-item';
        $label.style.padding = '8px 16px';
        $label.style.textAlign = 'right';

        const $templateText = document.createElement('span');
        $templateText.textContent = template.title;
        $templateText.classList = 'select-menu-item-heading';

        $label.append($templateText);
        $detailsMenu.append($label);

        $label.addEventListener('click', () => {
          $details.open = false;
          $selectTitle.textContent = template.title;
          $pull_request_body.value = template.content;
        });
      }

      $select.append($selectTitle);
      $select.append($details);

      $pull_request_footer.prepend($select);
      console.log(`%cpr-selector %chas appended successfully`, `color: ${highlightColor}`, '');
    } else {
      console.log(`There is no templates. not appending pr-selector`);
    }

    await waitElement('#pull_request_body', document,true);
    console.log('%cPull Request form %cdestroyed', `color: ${highlightColor}`, '');

    console.log('reload pr-selector');
  }
});

async function fetchTemplates() {
  console.log('Start parsing templates on background');

  try {
    const [_, company, repository] = document.URL.match(/github.com\/(.+?)\/(.+?)\//);
    const res = await fetch([GITHUB_URL, company, repository, 'tree', defaultBranch, '.github', templateFolder].join('/'));
    if(!res.ok) {
      console.warn('No template folder:', templateFolder);
      return [];
    }

    const text = await res.text();

    const $document = new DOMParser().parseFromString(text, 'text/html');
    const $innerFiles = [...$document.querySelectorAll('div[data-test-selector=subdirectory-container] div[role=grid] div[role=row].js-navigation-item')].slice(1);
    const templateNames = $innerFiles.map($elem => $elem.querySelector('div[role=rowheader] span a').text);
    console.log(`Detected templates: %c[${templateNames.join(', ')}]`, `color: ${highlightColor}`);

    const templateRequests = templateNames.map(templateName => {
      return fetch([GITHUB_URL, company, repository, 'raw', defaultBranch, '.github', templateFolder, templateName].join('/'))
        .then(async res => {
          return {
            title: templateName,
            content: await res.text()
          }
        });
    });

    return await Promise.all(templateRequests);
  } catch {
    console.warn('Failed to fetch templates');
    return [];
  }
}

function waitDomReady() {
  return new Promise(resolve => {
    console.log('Waiting DOM is ready..');

    if (document.readyState === "complete") {
      console.log('DOM is now ready');
      resolve();
    } else {
      console.log('DOM is now ready');
      window.addEventListener("load", () => {
        resolve();
      }, {
        once: true,
      });
    }
  });
}

function waitElement(selector, parent, destroy = false) {
  return new Promise(resolve => {
    let $item = parent.querySelector(selector);

    // Check is element is already loaded.
    if (!destroy && !!$item === !destroy) {
      resolve($item);
    }

    const observer = new MutationObserver(mutations => {
      $item = parent.querySelector(selector);

      if(!!$item === !destroy) {
        observer.disconnect();
        resolve($item);
      }
    })

    observer.observe(parent, {
      childList: true, subtree: true
    });
  });
}
