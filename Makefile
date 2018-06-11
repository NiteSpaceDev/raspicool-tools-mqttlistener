ORG=nitespacedev
NAME=mqttlistener

default: image

.build: Dockerfile index.js package.json
	docker build -t $(ORG)/$(NAME):latest .
	touch .build

image: .build

push: image
	docker push $(ORG)/$(NAME):latest

clean:
	rm -f *~ .build_*

.PHONY: default image push clean
