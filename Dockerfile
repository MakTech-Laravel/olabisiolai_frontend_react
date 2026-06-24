# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Declare build-time env vars (Coolify passes these from Environment Variables)
ARG VITE_SITE_NAME
ARG VITE_API_BASE_URL
ARG VITE_AUTH_STRATEGY
ARG VITE_BEARER_TOKEN_STORAGE
ARG VITE_AUTH_ME_PATH
ARG VITE_AUTH_LOGOUT_PATH
ARG VITE_ENVIRONMENT_MODE
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_PLACES_USE_NEW_API
ARG VITE_FLUTTERWAVE_PUBLIC_KEY
ARG VITE_PAYSTACK_PUBLIC_KEY

# Make them available to Vite at build time
ENV VITE_SITE_NAME=$VITE_SITE_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AUTH_STRATEGY=$VITE_AUTH_STRATEGY
ENV VITE_BEARER_TOKEN_STORAGE=$VITE_BEARER_TOKEN_STORAGE
ENV VITE_AUTH_ME_PATH=$VITE_AUTH_ME_PATH
ENV VITE_AUTH_LOGOUT_PATH=$VITE_AUTH_LOGOUT_PATH
ENV VITE_ENVIRONMENT_MODE=$VITE_ENVIRONMENT_MODE
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_PLACES_USE_NEW_API=$VITE_GOOGLE_PLACES_USE_NEW_API
ENV VITE_FLUTTERWAVE_PUBLIC_KEY=$VITE_FLUTTERWAVE_PUBLIC_KEY
ENV VITE_PAYSTACK_PUBLIC_KEY=$VITE_PAYSTACK_PUBLIC_KEY

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf

COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]