# State 1

FROM node:12-alpine as builder
WORKDIR /usr/app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn compile

# Stage 2 Production
FROM node:12-alpine
WORKDIR /usr/app
COPY package.json yarn.lock ./
RUN yarn install --production
RUN npm install pm2 -g
COPY password.paycom password.paycom
COPY --from=builder /usr/app/dist ./dist
COPY --from=builder /usr/app/.env .env


EXPOSE 1338
CMD [ "pm2-runtime", "dist/index.js" ]

