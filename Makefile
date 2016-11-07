NODE_PATH := $(shell npm bin)
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)

all: $(TYPESCRIPT:%.ts=%.js)

install:
	npm rebuild
	$(NODE_PATH)/tsc

$(NODE_PATH)/tsc:
	npm install

%.js: %.ts $(NODE_PATH)/tsc
	$(NODE_PATH)/tsc
