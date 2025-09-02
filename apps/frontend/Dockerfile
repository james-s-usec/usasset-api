FROM node:20-alpine as build

# Accept build arguments
ARG VITE_API_URL=http://localhost:3000
ARG VITE_APP_VERSION=dev
ARG VITE_BUILD_TIME=unknown
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_BUILD_TIME=$VITE_BUILD_TIME

WORKDIR /app
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm ci
COPY apps/frontend ./apps/frontend/

# Build with env var available
RUN echo "Building with VITE_API_URL=$VITE_API_URL" && \
    cd apps/frontend && npm run build

FROM nginx:alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]