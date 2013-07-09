all: jshint

jshint:
	jshint imageviewer.js

styles:
	sass --style compressed main.scss:main.css
