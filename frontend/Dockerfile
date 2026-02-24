FROM node:20-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
RUN chown app:app /app

COPY --chown=app:app package.json package-lock.json ./

USER app

RUN npm ci

COPY --chown=app:app . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
