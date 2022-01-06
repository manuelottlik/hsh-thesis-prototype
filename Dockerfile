FROM node:14

LABEL org.opencontainers.image.source=https://github.com/manuelottlik/hsh-thesis-prototype

ARG SERVICE
ENV SERVICE ${SERVICE}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY src .

EXPOSE 8080
CMD node ${SERVICE}