var ImageViewer;

(function () {
    'use strict';

    function fullscreenSupported() {
        return document.documentElement.requestFullscreen ||
            document.documentElement.mozRequestFullScreen ||
            document.documentElement.webkitRequestFullscreen;
    }

    function requestFullscreen(elem) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    }

    function cancelFullscreen() {
        if(document.cancelFullscreen) {
            document.cancelFullscreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }

    var plugins = {
        index: function(viewer) {
            var element = document.getElementById('index');
            viewer.addEventListener(viewer.EV_IMAGE_SHOWN, function(e) {
                element.className = '';
                element.innerHTML = (e.detail.index + 1) + '/' +
                    e.detail.viewer.count;
            });
        },
        title: function(viewer) {
            var element = document.getElementById('title'),
                container = document.getElementById('title-container');
            viewer.addEventListener(viewer.EV_IMAGE_SHOWN, function(e) {
                container.className = '';
                element.innerHTML = e.detail.file.name;
            });
        },
        navigation: function(viewer) {
            var btnPrev = document.getElementById('navigation-prev'),
                btnNext = document.getElementById('navigation-next'),
                btnPrevFull = document.getElementById('navigation-prev-full'),
                btnNextFull = document.getElementById('navigation-next-full'),
                btnFsExit = document.getElementById('navigation-fs-exit'),
                disClass = 'pure-button-disabled';
            viewer.addEventListener(viewer.EV_FILES_SELECTED, function(e) {
                var disabled = e.detail.viewer.count <= 1;
                btnPrev.disabled = btnPrevFull.disabled = disabled;
                btnNext.disabled = btnNextFull.disabled = disabled;
                if (disabled) {
                    btnPrev.classList.add(disClass);
                    btnNext.classList.add(disClass);
                    btnPrevFull.classList.add(disClass);
                    btnNextFull.classList.add(disClass);
                } else {
                    btnPrev.classList.remove(disClass);
                    btnNext.classList.remove(disClass);
                    btnPrevFull.classList.remove(disClass);
                    btnNextFull.classList.remove(disClass);
                }
            });
            var onclick = function(e) {
                if (e.target.disabled !== false) {
                    return;
                }
                if (e.target.id === 'navigation-next') {
                    viewer.showNext();
                } else {
                    viewer.showPrevious();
                }
            };
            var panel = document.getElementById('navigation-panel-wrapper');
            viewer.addEventListener(viewer.EV_FULLSCREEN_STARTED, function() {
                panel.className = '';
            });
            viewer.addEventListener(viewer.EV_FULLSCREEN_FINISHED, function() {
                panel.className = 'hidden';
            });
            btnPrev.addEventListener('click', onclick);
            btnNext.addEventListener('click', onclick);
            btnPrevFull.addEventListener('click', onclick);
            btnNextFull.addEventListener('click', onclick);
            btnFsExit.addEventListener('click', function() {
                viewer.exitFullscreen();
            });
        }
    };

    /*args: {
        imageholder: "id of element where images will be placed",
        fullscreener: "id of clickable element activating fullscreen mode",
        files: "id of files input",
        filesPlaceholder: "optional, id of control which overlays input file",
        plugins: [] // list of plugin names to use
    }
    */
    ImageViewer = function(args) {
        this._element = document.getElementById(args.imageholder);
        this._setStartValues();

        Object.defineProperty(this, 'count', {
            get: function() { return this._files.length; }
        });

        this._reader = new FileReader();
        this._reader.onload = this._onImageRead.bind(this);

        this._filesElem = document.getElementById(args.files);
        this._filesElem.addEventListener('change',
            this._onFilesSelected.bind(this), false);

        if (args.filesPlaceholder) {
            var holder = document.getElementById(args.filesPlaceholder);
            holder.className = holder.className.replace('hidden', '');
            this._filesElem.className = 'hidden';
            holder.addEventListener('click',
                this.openFileDialog.bind(this),
                false);
        }

        if (args.fullscreener && fullscreenSupported()) {
            document.getElementById(args.fullscreener).addEventListener(
                'click', this.startFullscreen.bind(this), false);
            var fschange = this._onFullscreenChange.bind(this);
            document.addEventListener('mozfullscreenchange',
                fschange, false);
            document.addEventListener('fullscreenchange',
                fschange, false);
            document.addEventListener('webkitfullscreenchange',
                fschange, false);
        }

        document.addEventListener('keydown', this._onKeyPress.bind(this),
            false);

        this._element.addEventListener('click',
            this.showNext.bind(this), false);

        if (args.plugins) {
            var p, i;
            for (i = 0; i < args.plugins.length; i++) {
                p = args.plugins[i];
                if (p in plugins) {
                    plugins[p](this);
                }
            }
        }
    };

    var KEY_SPACE = 32, KEY_RIGHT = 39, KEY_LEFT = 37,
        KEY_O = 79, KEY_F = 70;
    var EV_PREFIX = 'imageviewer.';

    ImageViewer.prototype = {
        EV_IMAGE_SHOWN: 'imageShown',
        EV_FILES_SELECTED: 'filesSelected',
        EV_FULLSCREEN_STARTED: 'fullscreenStarted',
        EV_FULLSCREEN_FINISHED: 'fullscreenFinished',

        showImage: function(index) {
            if (index < 0 || index > this._files.length) return;
            if (index in this._images) {
                this._showImage(index);
            } else {
                this._loadImage(index);
            }
        },

        startFullscreen: function() {
            requestFullscreen(this._element);
        },

        exitFullscreen: function() {
            cancelFullscreen();
        },

        addEventListener: function(event, callback) {
            document.addEventListener(EV_PREFIX + event, callback);
        },

        openFileDialog: function() {
            this._filesElem.click();
        },

        _setStartValues: function() {
            this._index = 0;
            this._files = [];
            this._images = {};
            this._loadingId = null;
            this._fullscreen = false;
        },

        _onFilesSelected: function(evt) {
            var files = evt.target.files;
            if (!files || files.length === 0) return;
            this._setStartValues();
            var i = 0, child;
            while (i < this._element.children.length) {
                child = this._element.children[i];
                if (child.nodeName === 'IMG') {
                    this._element.removeChild(child);
                } else {
                    i++;
                }
            }
            var file;
            for (i = 0; i < files.length; i++)
            {
                file = files[i];
                this._files.push(file);
            }
            this._element.className = 'pointer';

            this._dispatchEvent(this.EV_FILES_SELECTED);
            this.showImage(0);
        },

        _onImageRead: function(e) {
            var img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'hidden';
            this._element.appendChild(img);
            this._images[this._loadingId] = img;
            this._showImage(this._loadingId);
            this._loadingId = null;
        },

        _onKeyPress: function(e) {
            if (this._files.length < 1) return;
            switch (e.keyCode) {
                case KEY_SPACE:
                case KEY_RIGHT:
                    this.showNext();
                    break;
                case KEY_LEFT:
                    this.showPrevious();
                    break;
                case KEY_O:
                    this.openFileDialog();
                    break;
                case KEY_F:
                    this.startFullscreen();
                    break;
            }
        },

        _onMouseClick: function() {
            if (this._files.length < 1) return;
            this.showNext();
        },

        showNext: function() {
            this.showImage((this._index + 1) % this._files.length);
        },

        showPrevious: function() {
            var index;
            if (this._index === 0)
                index = this._files.length - 1;
            else
                index = this._index - 1;
            this.showImage(index);
        },

        _loadImage: function(index) {
            if (this._reader.readyState !== FileReader.LOADING) {
                this._loadingId = index;
                this._reader.readAsDataURL(this._files[index]);
            }
        },

        _showImage: function(index) {
            this._images[this._index].className = 'hidden';
            this._index = index;
            this._images[this._index].className = '';
            this._dispatchEvent(this.EV_IMAGE_SHOWN, {
                index: index,
                file: this._files[index]
            });
        },

        _dispatchEvent: function(name, detail) {
            if (detail === undefined) {
                detail = {};
            }
            detail.viewer = this;
            name = EV_PREFIX + name;
            var evt = new CustomEvent(name, {
                bubbles: false,
                cancelable: false,
                detail: detail
            });
            document.dispatchEvent(evt);
        },

        _onFullscreenChange: function() {
            if (!this._fullscreen) {
                this._dispatchEvent(this.EV_FULLSCREEN_STARTED);
            } else {
                this._dispatchEvent(this.EV_FULLSCREEN_FINISHED);
            }
            this._fullscreen = !this._fullscreen;
        }
    };
})();
