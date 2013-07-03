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

    /*args: {
        imageholder: "id of element where images will be placed",
        fullscreener: "id of clickable element activating fullscreen mode",
        files: "id of files input"
    }
    */
    ImageViewer = function(args) {
        this._element = document.getElementById(args.imageholder);
        this._setStartValues();

        this._reader = new FileReader();
        this._reader.onload = this._onImageRead.bind(this);

        document.getElementById(args.files).addEventListener('change',
            this._onFilesSelected.bind(this), false);

        if (args.fullscreener && fullscreenSupported()) {
            document.getElementById(args.fullscreener).addEventListener(
                'click', this.startFullscreen.bind(this), false);
        }

        document.addEventListener('keypress', this._onKeyPress.bind(this),
            false);

        this._element.addEventListener('click',
            this._onShowNext.bind(this), false);
    };

    var SPACE = 32, ARROW_RIGHT = 39, ARROW_LEFT = 37;

    ImageViewer.prototype = {
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
            this._element.innerHTML = '';
            var i, file;
            for (i = 0; i < files.length; i++)
            {
                file = files[i];
                this._files.push(file);
            }
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
            if (e.keyCode === SPACE || e.keyCode === ARROW_RIGHT) {
                this._onShowNext();
            }
            else if (e.keyCode === ARROW_LEFT) {
                this._onShowPrevious();
            }
        },

        _onMouseClick: function() {
            if (this._files.length < 1) return;
            this._onShowNext();
        },

        _onShowNext: function() {
            this.showImage((this._index + 1) % this._files.length);
        },

        _onShowPrevious: function() {
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
        }
    };
})();
