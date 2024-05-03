BINARY_NAME=readme.bin

build:
	go build -o ${BINARY_NAME} .
run:
	go build -o ${BINARY_NAME} .
	./${NAME}