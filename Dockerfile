# One image per edition: docker build --build-arg EDITION=adult .
# The build stage checks the music theory and builds the edition (it only copies files, so it runs on
# the build machine's own platform); the image is plain nginx serving static files.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /src
COPY site/ site/
COPY editions/ editions/
COPY tools/ tools/
ARG EDITION=adult
ARG BUILD_VERSION=
RUN node tools/check.mjs && BUILD_VERSION="$BUILD_VERSION" node tools/build.mjs "$EDITION" --out /out

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out/ /usr/share/nginx/html/
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
