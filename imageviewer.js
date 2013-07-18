var ImageViewer;

(function () {
'use strict';

/*args: {
    imageholder: "id of element where images will be placed",
    files: "id of files input",
    filesPlaceholder: "optional, id of control which overlays input file",
    plugins: [] // list of plugin (names or objects with params) to use
}
*/
ImageViewer = function(args) {
    this._element = document.getElementById(args.imageholder);
    this._setStartValues();

    Object.defineProperty(this, 'count', {
        get: function() { return this._files.length; }
    });

    Object.defineProperty(this, 'element', {
        get: function() { return this._element; }
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

    document.addEventListener('keydown', this._onKeyPress.bind(this),
        false);

    this._element.addEventListener('click',
        this._onMouseClick.bind(this), false);

    this.pn = {};

    if (args.plugins) {
        var p, i, plugin;
        for (i = 0; i < args.plugins.length; i++) {
            p = args.plugins[i];
            if (typeof(p) === 'string') {
                plugin = this.plugins[p];
                if (!!plugin) {
                    this.pn[p] = p;
                    plugin(this);
                }
            } else {
                plugin = this.plugins[p.name];
                if (!!plugin) {
                    this.pn[p.name] = new plugin(this, p);
                }
            }
        }
    }
};

var KEY_SPACE = 32, KEY_RIGHT = 39, KEY_LEFT = 37,
    KEY_O = 79, KEY_F = 70;

ImageViewer.prototype = {
    EV_IMAGE_SHOWN: 'imageShown',
    EV_FILES_SELECTED: 'filesSelected',
    EV_PREFIX: 'imageviewer.',

    plugins: null,

    showImage: function(index) {
        if (index < 0 || index > this._files.length) return;
        if (index in this._images) {
            this._showImage(index);
        } else {
            this._loadImage(index);
        }
    },

    addEventListener: function(event, callback) {
        document.addEventListener(this.EV_PREFIX + event, callback);
    },

    openFileDialog: function() {
        this._filesElem.click();
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

    _setStartValues: function() {
        this._index = 0;
        this._files = [];
        this._images = {};
        this._loadingId = null;
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
        switch (e.keyCode) {
            case KEY_SPACE:
            case KEY_RIGHT:
                if (this._files.length <= 1) return;
                this.showNext();
                break;
            case KEY_LEFT:
                if (this._files.length <= 1) return;
                this.showPrevious();
                break;
            case KEY_O:
                this.openFileDialog();
                break;
        }
    },

    _onMouseClick: function(e) {
        console.log(e);
        if (this._files.length < 1) return;
        this.showNext();
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
        name = this.EV_PREFIX + name;
        var evt = new CustomEvent(name, {
            bubbles: false,
            cancelable: false,
            detail: detail
        });
        document.dispatchEvent(evt);
    }
};

function disable(disabled) {
    for (var i = 1, e; i < arguments.length; i++) {
        e = arguments[i];
        if (disabled === true) {
            e.disabled = true;
            e.classList.add('pure-button-disabled');
        } else {
            e.disabled = false;
            e.classList.remove('pure-button-disabled');
        }
    }
}

var plugins = {
    index: function(viewer) {
        var element = document.getElementById('index');
        viewer.addEventListener(viewer.EV_IMAGE_SHOWN, function(e) {
            element.classList.remove('hidden');
            element.innerHTML = (e.detail.index + 1) + '/' +
                e.detail.viewer.count;
        });
    },
    title: function(viewer) {
        var element = document.getElementById('title'),
            container = document.getElementById('title-container');
        viewer.addEventListener(viewer.EV_IMAGE_SHOWN, function(e) {
            container.classList.remove('hidden');
            var fileName = e.detail.file.name;
            element.innerHTML = fileName;
            document.title = 'imageviewer.js - ' + fileName;
        });
    },
    help: function(viewer) {
        var element = document.getElementById('help');
        element.style.display = 'block';
        viewer.addEventListener(viewer.EV_FILES_SELECTED, function() {
            element.style.display = 'none';
        });
    },
    navigation: function(viewer) {
        var btnPrev = document.getElementById('navigation-prev'),
            btnNext = document.getElementById('navigation-next'),
            btnPrevFull = document.getElementById('navigation-prev-full'),
            btnNextFull = document.getElementById('navigation-next-full'),
            btnFsExit = document.getElementById('navigation-fs-exit');
        viewer.addEventListener(viewer.EV_FILES_SELECTED, function(e) {
            disable(e.detail.viewer.count <= 1, btnPrev, btnNext);
        });
        var showNext = function(e) {
            if (!e.target.disabled) {
                e.stopPropagation();
                viewer.showNext();
            }
        };
        var showPrevious = function(e) {
            if (!e.target.disabled) {
                e.stopPropagation();
                viewer.showPrevious();
            }
        };
        btnPrev.addEventListener('click', showPrevious);
        btnNext.addEventListener('click', showNext);
        var fsPlugin = viewer.pn.fullscreen;
        if (!fsPlugin) {
            return;
        }
        btnPrevFull.addEventListener('click', showPrevious);
        btnNextFull.addEventListener('click', showNext);
        btnFsExit.addEventListener('click', function() {
            fsPlugin.exit();
        });
    }
};

/*
args = {
    activator: "id of clickable element activating fullscreen mode"
}
*/
var fullscreenPlugin = function(viewer, args) {
    this.viewer = viewer;

    if (this.fullscreenSupported()) {
        var activator = document.getElementById(args.activator);
        activator.addEventListener(
            'click', this.start.bind(this), false);
        document.addEventListener('keydown',
            this._onKeyPress.bind(this), false);

        viewer.addEventListener(viewer.EV_FILES_SELECTED, function() {
            activator.disabled = false;
            activator.classList.remove('pure-button-disabled');
        });
    }
};

fullscreenPlugin.prototype = {

    fullscreenSupported: function() {
        return document.documentElement.requestFullscreen ||
            document.documentElement.mozRequestFullScreen ||
            document.documentElement.webkitRequestFullscreen;
    },

    start: function() {
        this._requestFullscreen(this.viewer.element);
    },

    exit: function() {
        if(document.cancelFullscreen) {
            document.cancelFullscreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    },

    _requestFullscreen: function(elem) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    },

    _onKeyPress: function(e) {
        if (e.keyCode === KEY_F && this.viewer.count > 1) {
            this.start();
        }
    }
};

plugins.fullscreen = fullscreenPlugin;
ImageViewer.prototype.plugins = plugins;
})();
