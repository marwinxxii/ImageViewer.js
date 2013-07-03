var ImageViewer;

(function () {
    'use strict';

    function fullscreenSupported() {
        return document.requestFullscreen ||
            document.mozRequestFullScreen ||
            document.webkitRequestFullscreen;
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
        this._size = 0;
        this._index = 0;

        document.getElementById(args.files).addEventListener('change',
            this._onFilesSelected.bind(this), false);
        if (args.fullscreener && fullscreenSupported()) {
            document.getElementById(args.fullscreener).addEventListener(
                'click', this.startFullscreen, false);
        }
        document.addEventListener('keypress', this._onKeyPress.bind(this),
            false);
    };

    var SPACE = 32, ARROW_RIGHT = 39, ARROW_LEFT = 37;

    ImageViewer.prototype = {
        startFullscreen: function() {
            requestFullscreen(this._element);
        },

        _onKeyPress: function(e) {
            if (e.keyCode === SPACE || e.keyCode === ARROW_RIGHT) {
                this.showNextImage();
            }
            else if (e.keyCode === ARROW_LEFT) {
                this.showPreviousImage();
            }
        },

        showNextImage: function() {
            var imgs = this._element.getElementsByTagName('img');
            imgs[this._index].className = 'hidden';
            this._index = (this._index + 1) % this._size;
            imgs[this._index].className = '';
        },

        showPreviousImage: function() {
            var imgs = this._element.getElementsByTagName('img');
            imgs[this._index].className = 'hidden';
            if (this._index === 0)
                this._index = this._size - 1;
            else
                this._index -= 1;
            imgs[this._index].className = '';
        },

        _onFilesSelected: function(evt) {
            var files = evt.target.files;
            if (!files || files.length === 0) return;
            this._element.innerHTML = '';
            var reader, self = this;
            for (var i = 0; i < files.length; i++)
            {
                reader = new FileReader();
                reader.onload = (function(index){
                    return function(e)
                    {
                        var img = document.createElement('img');
                        if (index !== 0) {
                            img.className = 'hidden';
                        }
                        img.src = e.target.result;
                        self._element.appendChild(img);
                    };
                })(i);
                reader.readAsDataURL(files[i]);
            }
            this._size = files.length;
            this._element.addEventListener('click',
                this.showNextImage.bind(this), false);
            this._index = 0;
        }
    };
})();
