[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# Workshop SDK for go/workshop

Workshop SDK allows building Workshop docker images using Markdown based 
contents. Additionally Workshop SDK allows features such as:
* Running a custom validation logic.
* Asking quizzes.
* Conducting user surveys.

When UI changes are needed, the CSS and JS assets under 
`gitbook/gitbook-plugin-theme-splunk` should be updated.

## Dev Environment

For JavaScript source code, we are using **JavaScript Standard Style**.
Running. Running `npm standard` under `app` directory will display lines of code
that violates the coding standard.

For text editor plugins, please read the 
[README page](https://github.com/standard/standard) from JavaScript Standard 
Style repository on Github.

## Building the SDK

The build the SDK, run the following command on your terminal:

```bash
make build
```

Once the SDK is built correctly, it can be used with `doc-hub` CLI utility.
To pick up the locally built SDK, `--dev` option should be used with `doc-hub` 
utility.

## Development Mode

Sometiemes, developers quickly want to test out changes in UI without going
through the process of building a Workshop image and running it.

To start the development mode, run the following command on your terminal:

```bash
make build-dev
```

The development mode does the followings:
1. Builds a docker image for development-mode.
    1. Install Gitbook using Gitbook builder image.
    2. Copy package.json files from `/scripts`, `/app`, `plugins/gitbook`, and 
        `plugins/gitbook/gitbook-plugin-theme-splunk`.
    3. Build npm dependencies.
    4. Copy `/scripts/dev.js`
2.  Create a new container using the docker image from the previous step.
    1.  Mount files from `doc-hub-kit` as `/src`. 
    2.  Expose port 4000.
3.  Copy files under `/src/scripts`, `/src/app`, `/src/app_sub`, 
    `/src/plugins` to `/kit`.
4.  Build JS & CSS assets for Gitbook Theme.
5.  Copy a sample doc from `/src/tests/test-doc` to `/mount`.
6.  Build a sample doc from `tests/test-doc`.
7.  Create a test auth token.
8.  Launch App Server to serve the doc.
9.  