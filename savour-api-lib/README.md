# Savour Button API



### Installation

Install the Node.js packages 

``` bash
$ npm install
```

### Usage

Deploy project

``` bash
$ serverless deploy
```

Deploy a single function

``` bash
$ serverless deploy function --function <function name>
```

#### Running Tests

Run tests using

``` bash
$ npm test
```

Run a single test

``` bash
$ serverless invoke local --function <function name> --path <api name>/mocks/<file name>.json --stage dev --region us-east-1
```

Use Jest to run our tests. You can read more about setting up tests [here](https://facebook.github.io/jest/docs/en/getting-started.html#content).

--stage <prod or dev>

#### Linting

We use [ESLint](https://eslint.org) to lint code via the [serverless-bundle](https://github.com/AnomalyInnovations/serverless-bundle) plugin.

Turn this off by adding the following to `serverless.yml`.

``` yaml
custom:
  bundle:
    linting: false
```