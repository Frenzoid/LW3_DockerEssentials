# @Author: Frenzoid - 2023
# -------------------------------------
# From the official Node image.
FROM node:alpine3.10

# Creates the app directory ( directory inside the container where the app will be stored ).
WORKDIR /usr/src/app

COPY "./dist" "./"

# We can run commands using the RUN instruction, in this case we are installing globally the "serve" package.
RUN npm i -g serve

# We'll host our React app using the serve package.
CMD ["serve", "-s", "./"]