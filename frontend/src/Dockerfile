# ui/Dockerfile

# Stage 1: Build the React app
FROM node:16-alpine as builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# Stage 2: Serve the built app with Nginx
FROM nginx:alpine
# Remove the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*
# Copy build output to Nginx's public folder
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
