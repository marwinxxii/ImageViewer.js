(function () {
'use strict';

var ImageViewer = {
    index: null,
    element: null,
    size: 0
};

function onFilesSelected() {
    if (!this.files || this.files.length === 0) return;
    ImageViewer.element.innerHTML = '';
    var reader;
    for (var i = 0; i < this.files.length; i++)
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
                ImageViewer.element.appendChild(img);
            };
        })(i);
        reader.readAsDataURL(this.files[i]);
    }
    ImageViewer.size = this.files.length;
    ImageViewer.element.addEventListener('click',
        showNextImage, false);
    ImageViewer.index = 0;
}

function showNextImage() {
    var imgs = ImageViewer.element.getElementsByTagName('img');
    imgs[ImageViewer.index].className = 'hidden';
    ImageViewer.index = (ImageViewer.index + 1) % ImageViewer.size;
    imgs[ImageViewer.index].className = '';
}

function showPreviousImage() {
    var imgs = ImageViewer.element.getElementsByTagName('img');
    imgs[ImageViewer.index].className = 'hidden';
    if (ImageViewer.index === 0)
        ImageViewer.index = ImageViewer.size - 1;
    else
        ImageViewer.index -= 1;
    imgs[ImageViewer.index].className = '';
}

function requestFullScreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
}

function startFullscreen() {
    requestFullScreen(ImageViewer.element);
}

function onKeyPress(e) {
    var SPACE = 32, ARROW_RIGHT = 39, ARROW_LEFT = 37;
    if (e.keyCode === SPACE || e.keyCode === ARROW_RIGHT)
    {
        showNextImage(e);
    }
    else if (e.keyCode === ARROW_LEFT)
    {
        showPreviousImage();
    }
}

function init() {
    document.getElementById('files').addEventListener('change', onFilesSelected, false);
    ImageViewer.element = document.getElementById('imageviewer');
    document.getElementById('fullscreen').addEventListener('click',
        startFullscreen, false);
    document.addEventListener('keypress', onKeyPress, false);
}
})();
