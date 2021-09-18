SDK_VERSION ?= development
KIT_IMAGE ?= localhost/go-workshop/kit-release:latest
KIT_BASE_IMAGE ?= localhost/go-workshop/kit-base:latest
KIT_NODE_IMAGE ?= node:10
WORKSHOP_BASE_IMAGE ?= node:10-alpine
WORKSHOP_IMAGE_PREFIX ?= localhost/go-workshop/docs/
BUILD_BASE_IMAGE ?= yes

RELEASE_DOCKERFILE = dockerfiles/Dockerfile.kit-release
DEV_DOCKERFILE = dockerfiles/Dockerfile.kit-dev
BASE_DOCKERFILE = dockerfiles/Dockerfile.kit-base

KIT_DEV_IMAGE = localhost/go-workshop/kit-dev:latest

ifeq (, $(shell which standard))
	INSTALL_STANDARD = npm install -g standard
endif

ifeq (yes, $(BUILD_BASE_IMAGE))
	MAKE_BASE_IMAGE=base-image
endif

.PHONY: build push build-clean shell standard build-dev-kit build-dev base-image shell-dev clean

all: build

build: $(MAKE_BASE_IMAGE)
	@echo "=========================="
	@echo "Building Release Kit Image"
	@echo "=========================="
	docker build --build-arg BASE_IMAGE=$(KIT_BASE_IMAGE) \
		--build-arg SDK_VERSION=$(SDK_VERSION) \
		-f $(RELEASE_DOCKERFILE) -t $(KIT_IMAGE) .

push:
	docker push $(KIT_IMAGE)

build-clean:
	docker build --no-cache -f $(RELEASE_DOCKERFILE)  -t $(KIT_IMAGE) .

shell:
	docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock:ro \
		--entrypoint /bin/bash $(KIT_IMAGE)

standard:
	$(INSTALL_STANDARD)
	cd app && standard
	cd plugins/gitbook/gitbook-plugin-splunk-highlight && standard
	cd plugins/gitbook/gitbook-plugin-theme-splunk && standard
	cd scripts && standard

build-dev-kit:
	@echo "======================"
	@echo "Building Dev Kit Image"
	@echo "======================"
	docker build --build-arg BASE_IMAGE=$(KIT_BASE_IMAGE)\
		-f $(DEV_DOCKERFILE) -t $(KIT_DEV_IMAGE) .

build-dev: standard build-dev-kit
	docker run --rm -it -v $(PWD):/src -p 4000:4000 $(KIT_DEV_IMAGE)

shell-dev:
	docker run --rm -it -v $(PWD):/src --entrypoint /bin/bash $(KIT_DEV_IMAGE)

promote:
	curl -f -u $(ARTIFACTORY_USER):$(ARTIFACTORY_TOKEN) -X POST \
    -H "Content-type: application/json" \
    --data "{\"targetRepo\": \"$(ARTIFACTORY_TARGET_REPO)\", \"dockerRepository\": \"$(IMAGE)\", \"tag\":\"$(TAG)\", \"targetTag\":\"$(TARGET_TAG)\", \"copy\": true}" \
    https://$(ARTIFACTORY_SERVER)/artifactory/api/docker/$(ARTIFACTORY_SOURCE_REPO)/v2/promote

base-image:
	@echo "======================="
	@echo "Building Base Kit Image"
	@echo "======================="
	docker build --build-arg NODE_IMAGE=$(KIT_NODE_IMAGE) \
		-f $(BASE_DOCKERFILE) -t $(KIT_BASE_IMAGE) .

test-docs: build
	docker run --rm -it -v $(PWD):/workspace \
		-v /var/run/docker.sock:/var/run/docker.sock:ro \
		-e PATH_WORKSHOP=/workspace/tests \
		$(KIT_IMAGE) \
		build --recursive

clean:
	rm -rf gitbook
	docker rmi $(KIT_BASE_IMAGE)
