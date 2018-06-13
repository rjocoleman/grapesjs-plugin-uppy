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

    // complete callback
    // https://uppy.io/docs/uppy/#complete
    onComplete: (result) => {},

    // upload-success callback
    // https://uppy.io/docs/uppy/#upload-success
    onUploadSuccess: (file, resp, uploadURL) => {},

    // upload-error callback
    // https: //uppy.io/docs/uppy/#upload-error
    onUploadError: (file, error) => {},
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
        btnEl.setAttribute('type', 'button');
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
        c.onComplete(result);
      });

      uppy.on('upload-success', (file, data, uploadURL) => {
        c.onUploadSuccess(file, data, uploadURL);
      });

      uppy.on('upload-error', (file, error) => {
        c.onUploadError(file, error);
      })
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
