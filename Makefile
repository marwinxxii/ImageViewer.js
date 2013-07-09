CLOSURE_COMPILER_PATH = ../google-closure-compiler/compiler.jar
JS_INPUT = imageviewer.js
JS_OUTPUT = imageviewer.min.js

CSS_INPUT=main.scss
CSS_OUTPUT=main.css

all: jshint

build: styles compile

jshint:
	jshint $(JS_INPUT)

styles:
	sass --style compressed $(CSS_INPUT):$(CSS_OUTPUT)

compile:
	java -jar $(CLOSURE_COMPILER_PATH) --js $(JS_INPUT) --js_output_file $(JS_OUTPUT)
