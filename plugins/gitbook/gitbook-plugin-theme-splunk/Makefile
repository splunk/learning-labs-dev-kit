all: build
build:
	docker run --rm -it -v $(PWD):/mount node:10 /bin/bash -c 'cd /mount && npm install'
exec:
	docker run --rm -it -v $(PWD):/mount node:10 /bin/bash