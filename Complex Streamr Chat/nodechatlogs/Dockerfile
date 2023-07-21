# @Author: Frenzoid - 2023
# -------------------------------------
FROM node:alpine3.10

WORKDIR /usr/src/app

COPY "./logger.js" "./logger.js"
COPY "./package.json" "./package.json"

# Install npm packages.
RUN npm i

# We define default values for the following environment variables.
ENV STREAMRPORT 1883
ENV DBPORT 5432

CMD ["node", "logger.js"]