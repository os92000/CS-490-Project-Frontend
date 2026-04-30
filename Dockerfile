FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Don't set CI=true — react-scripts treats warnings as errors under CI,
# and the codebase currently has a couple of benign ESLint warnings.
ENV GENERATE_SOURCEMAP=false
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
