FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm ci
COPY apps/frontend ./apps/frontend/
RUN cd apps/frontend && npm run build

FROM nginx:alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]