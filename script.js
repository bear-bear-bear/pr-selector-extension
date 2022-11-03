const GITHUB_URL = 'https://github.com';
const PrSelector = (() => {
  const _templates = {
    frame: `
<div id="PrSelector" class="BtnGroup">
  <div class="pr-selector-title btn-secondary btn BtnGroup-item flex-auto">
    <span class="tooltipped tooltipped-s tooltipped-multiline" aria-label="Clear a comment to change template">
      Choose template
    </span>
  </div>
  <details class="details-reset details-overlay select-menu BtnGroup-parent position-relative">
    <summary class="select-menu-button btn-secondary btn BtnGroup-item float-none" aria-haspopup="menu" role="button"></summary>
    <details-menu class="pr-selector-list select-menu-modal position-absolute right-0 js-sync-select-menu-text" data-focus-trap="active" role="menu" style="width: auto; z-index: 99;">
      <!--
      <label class="pr-selector-list-item select-menu-item" style="padding: 8px 16px; text-align: right;">
        <span class="select-menu-item-heading">FEATURE.md</span>
      </label>
      -->
    </details-menu>
  </details>
</div>`,
    listItem: `
<label class="pr-selector-list-item select-menu-item" style="padding: 8px 16px; text-align: right;">
  <span class="pr-selector-list-item-title select-menu-item-heading">FEATURE.md</span>
</label>`
  };

  const _elements = {};
  for (const templateType of Object.keys(_templates)) {
    _elements['$' + templateType] = createElement(_templates[templateType]);
  }

  let $_prBody;

  return {
    setDisabled(isDisabled) {
      const $frame = _elements['$frame'];
      if (isDisabled && !$frame.classList.contains('disabled')) {
        $frame.classList.add('disabled');
        [...$frame.querySelectorAll('.btn-secondary')].forEach($e => {
          $e.classList.add('disabled');
        })
      } else if (!isDisabled && $frame.classList.contains('disabled')) {
        $frame.classList.remove('disabled');
        [...$frame.querySelectorAll('.btn-secondary')].forEach($e => {
          $e.classList.remove('disabled');
        })
      }
    },

    setPrBody(prBody) {
      $_prBody = prBody;

      if ($_prBody.value.length > 0) {
        this.setDisabled(true);
      } else {
        this.setDisabled(false);
      }

      $_prBody.addEventListener('keyup', () => {
        if ($_prBody.value.length > 0) {
          this.setDisabled(true);
        } else {
          this.setDisabled(false);
        }
      });
    },

    /***
     * Set pr templates
     * @param {[ {title: string, content: string} ]} prTemplates
     */
    setTemplates: function (prTemplates) {
      const $frame = _elements['$frame'];

      if (prTemplates.length === 0) {
        $frame.style.display = 'none';
        return;
      }

      $frame.style.display = '';

      // Clean pr-selector-list children
      const $list = $frame.querySelector('.pr-selector-list');
      [...$list.children].forEach($e => $e.remove());

      // templates: [{ title: string, content: string }]
      for (let prTemplate of prTemplates) {
        let $listItem = _elements['$listItem'].cloneNode(true);
        $listItem.querySelector('span.pr-selector-list-item-title').innerText = prTemplate.title;

        $list.append($listItem);

        $listItem.addEventListener('click', () => {
          $frame.querySelector('details').open = false;
          $frame.querySelector('.pr-selector-title').textContent = prTemplate.title;
          $_prBody.value = prTemplate.content;
        });
      }
    },

    setCurrentTemplate: function (template) {
      const $frame = _elements['$frame'];

      $frame.querySelector('.pr-selector-title').textContent = template.title;
      $_prBody.value = template.content;
    },

    getElement: function () {
      return _elements['$frame'];
    }
  };
})();

/***
 * Parse github information from current location URL
 * @returns {{compareBranch: string, baseBranch: string, company: string, repository: string}}
 */
function getGithubInfo() {
  const [_, company, repository, baseBranch, compareBranch] = document.URL.match(/https:\/\/github.com\/(.+?)\/(.+)\/compare\/(.+)\.\.\.(.+)$/);
  return {
    company, repository, baseBranch, compareBranch
  };
}

async function fetchHTML(url) {
  const res = await fetch(url)
  return new DOMParser().parseFromString(await res.text(), 'text/html');
}

async function fetchTemplates({company, repository}) {
  let defaultBranch = (await fetchHTML([GITHUB_URL, company, repository].join('/')))
    .querySelector('#branch-select-menu')
    .querySelector('span[data-menu-button]').textContent;

  console.log(`Start fetching templates from ${company} ${repository} ${defaultBranch}`);

  let $document;
  try {
    $document = await fetchHTML([GITHUB_URL, company, repository, 'tree', defaultBranch, '.github', templateFolder].join('/'));
  } catch (e) {
    console.warn('Failed to get templates');
    return [];
  }

  // Fetch template file list
  const $innerFiles = [...$document.querySelectorAll('div[data-test-selector=subdirectory-container] div[role=grid] div[role=row].js-navigation-item')].slice(1);
  const templateNames = $innerFiles.map($elem => $elem.querySelector('div[role=rowheader] span a').text);

  console.log(`Detected templates: %c[${templateNames.join(', ')}]`, `color: ${highlightColor}`);

  // Fetch template file contents
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

      if (!!$item === !destroy) {
        observer.disconnect();
        resolve($item);
      }
    })

    observer.observe(parent, {
      childList: true, subtree: true
    });
  });
}

function createElement(html) {
  const $div = document.createElement('div');
  $div.innerHTML = html.trim();
  return $div.firstChild;
}


/*** Main ***/
const templateFolder = 'PULL_REQUEST_TEMPLATE';
const highlightColor = 'pink';

console.log('%cpr-selector-extension %chas loaded', `color: ${highlightColor}`, '');

waitDomReady().then(async () => {
  while (true) {

    console.log('Waiting %cPull Request form element..', `color: ${highlightColor}`);
    const $pull_request_body = await waitElement('#pull_request_body', document, false);

    console.log('%cPull Request form element %cdetected', `color: ${highlightColor}`, '');
    PrSelector.setPrBody($pull_request_body);

    const githubInfo = getGithubInfo();
    console.log('githubInfo:', githubInfo);
    const fetchTemplatesJob = fetchTemplates(githubInfo);

    // Inject element
    const $pr_form = document.querySelector('turbo-frame form div[data-view-component=true].Layout-main .js-slash-command-surface');
    const $pull_request_footer = $pr_form.querySelector('div.flex-md-justify-end');
    $pull_request_footer.prepend(PrSelector.getElement());

    const templates = await fetchTemplatesJob
    PrSelector.setTemplates(templates);

    // Auto template select
    const suggestTemplate = templates.find(({title}) =>
      title.replace(/\.([^.]+)$/, '').toLowerCase().startsWith(githubInfo.compareBranch.split('/')[0].toLowerCase())
    );

    if (!!suggestTemplate) {
      console.log(`Template %c${suggestTemplate.title} %cis automatically selected`, `color: ${highlightColor}`, '');
      PrSelector.setCurrentTemplate(suggestTemplate);
    } else {
      console.log(`No template selected`);
    }

    // Wait until pull request destroyed
    await waitElement('#pull_request_body', document, true);
    console.log('%cPull Request form %cdestroyed', `color: ${highlightColor}`, '');

    console.log('reload pr-selector');
  }
});
