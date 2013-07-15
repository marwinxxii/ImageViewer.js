BUILT_PREFIX = built/
CLOSURE_COMPILER_PATH = ../google-closure-compiler/compiler.jar
JS_INPUT = imageviewer.js
JS_OUTPUT = $(BUILT_PREFIX)imageviewer.min.js

CSS_INPUT = main.scss
CSS_OUTPUT = $(BUILT_PREFIX)main.min.css

all: jshint

build: jshint styles scripts copy

jshint:
	jshint $(JS_INPUT)

styles:
	sass --style compressed $(CSS_INPUT):$(CSS_OUTPUT)

scripts:
	java -jar $(CLOSURE_COMPILER_PATH) --js $(JS_INPUT) --js_output_file $(JS_OUTPUT)

copy:
	cp index.html $(BUILT_PREFIX)index.html
