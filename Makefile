BINARY_NAME=hashtag-feed

build:
	go build -o $(BINARY_NAME) .

run: build
	./$(BINARY_NAME)

clean:
	rm -f $(BINARY_NAME)

.PHONY: build run clean
