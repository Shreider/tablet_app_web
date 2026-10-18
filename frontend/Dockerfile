FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY admin/package*.json ./admin/
RUN npm ci --prefix admin

COPY . .

ARG TABLET_ROOM_ID=
ENV VITE_ROOM_ID=${TABLET_ROOM_ID}

RUN npm run build && npm run build --prefix admin

FROM nginx:stable-alpine

COPY --chmod=755 docker-entrypoint.d/19-validate-backend-url.sh /docker-entrypoint.d/19-validate-backend-url.sh
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/admin/dist /usr/share/nginx/html/admin

ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
