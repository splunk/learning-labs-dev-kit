#!/bin/sh
mkdir -p _assets/website

# Copy static files
cp -r src/fonts _assets/website/fonts
cp -r node_modules/font-awesome/fonts _assets/website/fonts/fontawesome
cp -r src/images _assets/website/images
cp src/js/bootstrap.min.js _assets/website

# Build jsx and scss
webpack --mode production

# Delete unused files
rm _assets/website/style.js
