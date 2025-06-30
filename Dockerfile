FROM node:20-alpine AS build

LABEL maintainer="Graviton Apps <contact@gravionapps.com>"

WORKDIR /etc/u2e

COPY . .

RUN npm install -g pnpm@latest 

RUN pnpm install --prod 

RUN pnpm add typescript @nestjs/cli 
RUN pnpm add --save-dev ts-loader
RUN pnpm add --save-dev prisma

RUN npx prisma generate

RUN pnpm build --webpack

#-----------------------------------------------------#
FROM node:20-alpine

WORKDIR /etc/u2e
RUN apk update && apk add --no-cache ffmpeg
COPY --from=build ./etc/u2e/dist ./dist
COPY --from=build ./etc/u2e/seed.js ./seed.js
COPY --from=build ./etc/u2e/prisma ./prisma
COPY --from=build ./etc/u2e/node_modules ./node_modules
COPY --from=build ./etc/u2e/package.json ./package.json

EXPOSE 3000

CMD ["npx", "prisma", "migrate", "deploy"]
ENTRYPOINT [ "node", "./dist/main.js" ]
