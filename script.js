const GITHUB_URL = 'https://github.com';

const defaultBranch = 'develop';
const templateFolder = 'PULL_REQUEST_TEMPLATE';
const [_, company, repository] = document.URL.match(/github.com\/(.+?)\/(.+?)\//);
const templateParsingJob = parseTemplates();

waitDomReady()
  .then(async () => {
    const $pr_form = document.querySelector('turbo-frame form div[data-view-component=true].Layout-main .js-slash-command-surface');

    // Wait until pull_request_body rendered
    const $pull_request_body = await waitElement('#pull_request_body', $pr_form);
    console.log('pull_request_body detected');

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
    const templates = await templateParsingJob;

    for(const template of templates) {
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
  });

async function parseTemplates() {
  const res = await fetch([GITHUB_URL, company, repository, 'tree', defaultBranch, '.github', templateFolder].join('/'));
  const text = await res.text();

  const $document = new DOMParser().parseFromString(text, 'text/html');
  const $innerFiles = [...$document.querySelectorAll('div[data-test-selector=subdirectory-container] div[role=grid] div[role=row].js-navigation-item')].slice(1);
  const templateNames = $innerFiles.map($elem => $elem.querySelector('div[role=rowheader] span a').text);
  console.log(`Detected templates: [${templateNames.join(', ')}]`);

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
}

function waitDomReady() {
  return new Promise(resolve => {
    if (document.readyState === "complete") {
      resolve();
    } else {
      window.addEventListener("load", () => {
        resolve();
      }, {
        once: true,
      });
    }
  });
}

function waitElement(selector, parent) {
  return new Promise(resolve => {
    let $item = parent.querySelector(selector);

    if($item)
      resolve($item);

    const observer = new MutationObserver(mutations => {
      $item = parent.querySelector(selector);

      if($item) {
        resolve($item);
        observer.disconnect();
      }
    })

    observer.observe(parent, {
      childList: true, subtree: true
    });
  });
}


