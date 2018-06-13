import grapesjs from 'grapesjs';

export default grapesjs.plugins.add('gjs-plugin-uppy', (editor, opts = {}) => {
  let c = opts;
  let config = editor.getConfig();
  let pfx = config.stylePrefix || '';
  let btnEl;

  let defaults = {
    // Custom button element which triggers Uppy modal
    btnEl: '',

    // Text for the button in case the custom one is not provided
    btnText: 'Add images',

    // Uppy's options
    uppyOpts: {
      Core: {
        restrictions: {
          allowedFileTypes: ['image/*']
        },
        maxNumberOfFiles: 10
      },
      Dashboard: {
        trigger: null, // undefined is btnEl
        inline: false
      },
      Webcam: {
        target: Uppy.Dashboard
      }
    },

    // On complete upload callback
    // blobs - Array of Objects, eg. [{url:'...', filename: 'name.jpeg', ...}]
    // assets - Array of inserted assets
    // for debug: console.log(JSON.stringify(blobs));
    onComplete: (blobs, assets) => { },
  };

  // Load defaults
  for (let name in defaults) {
    if (!(name in c))
      c[name] = defaults[name];
  }

  if (!Uppy) {
    throw new Error('Uppy instance not found');
  }

  const uppy = Uppy.Core(c.uppyOpts.Core);

  // When the Asset Manager modal is opened
  editor.on('run:open-assets', () => {
    const modal = editor.Modal;
    const modalBody = modal.getContentEl();
    const uploader = modalBody.querySelector('.' + pfx + 'am-file-uploader');
    const assetsHeader = modalBody.querySelector('.' + pfx + 'am-assets-header');
    const assetsBody = modalBody.querySelector('.' + pfx + 'am-assets-cont');

    uploader && (uploader.style.display = 'none');
    assetsHeader && (assetsHeader.style.display = 'none');
    assetsBody.style.width = '100%';

    // Instance button if not yet exists
    if (!btnEl) {
      btnEl = c.btnEl;

      if (!btnEl) {
        btnEl = document.createElement('button');
        btnEl.className = pfx + 'btn-prim ' + pfx + 'btn-uppy';
        btnEl.innerHTML = c.btnText;
      }

      if (c.uppyOpts.Dashboard) {
        if (!c.uppyOpts.Dashboard.trigger) {
          c.uppyOpts.Dashboard.trigger = btnEl;
        }
      }

      Object.keys(c.uppyOpts).forEach(key => {
        if (key === 'Core') return;
        uppy.use(Uppy[key], c.uppyOpts[key]);
      })

      uppy.on('complete', result => {
        const blobs = result.successful;
        let assets = addAssets(blobs);
        c.onComplete(blobs, assets);
      });
    }

    assetsBody.insertBefore(btnEl, assetsHeader);
  });

  /**
   * Add new assets to the editor
   * @param {Array} files
   */
  const addAssets = (files) => {
    const urls = files.map((file) => {
      file.src = file.uploadURL;
      return file;
    });
    return editor.AssetManager.add(urls);
  };

});
