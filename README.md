# FFC AHWR Application Manager

> Application Manager for Animal Health and Welfare Review

## Prerequisites

- Docker
- Docker Compose

Optional:

- Kubernetes
- Helm

### Environment variables

The following environment variables are required by the application.
Values for development are set in the Docker Compose configuration. Default
values for production-like deployments are set in the Helm chart and may be
overridden by build and release pipelines.

| Name                                            | Description                                                                                      |
| ----                                            | -----------                                                                                      |
| MESSAGE_QUEUE_HOST                              | Azure Service Bus hostname, e.g. `myservicebus.servicebus.windows.net`                           |
| MESSAGE_QUEUE_PASSWORD                          | Azure Service Bus SAS policy key                                                                 |
| MESSAGE_QUEUE_SUFFIX                            | Developer initials                                                                               |
| MESSAGE_QUEUE_USER                              | Azure Service Bus SAS policy name, e.g. `RootManageSharedAccessKey`                              |
| APPLICATIONREQUEST_QUEUE_ADDRESS                | Azure Service Bus message request queue name, e.g. `application-request`                         |
| APPLICATIONRESPONSE_QUEUE_ADDRESS               | Azure Service Bus message response queue name, e.g. `application-response`                       |
| NOTIFY_API_KEY                                  | GOV.UK Notify API Key                                                                            |
| NOTIFY_TEMPLATE_ID_FARMER_APPLICATION_CLAIM     | Id of email template used to notify farmer for claim                                             |
| NOTIFY_TEMPLATE_ID_FARMER_APPLICATION_COMPLETE  | Id of email template used for farmer application complete                                        |
| NOTIFY_TEMPLATE_ID_FARMER_CLAIM_COMPLETE        | Id of email template used to notify farmer for claim being completed                             |
| NOTIFY_TEMPLATE_ID_FARMER_VET_RECORD_INELIGIBLE | Id of email template used to notify farmer when the vet has recorded ineligible animal numbers   |
| NOTIFY_TEMPLATE_ID_VET_APPLICATION_COMPLETE     | Id of email template used for veet application complete                                          |
| PAYMENTREQUEST_TOPIC_ADDRESS                    | Azure Service Bus message request topic for sending to the Payment service                       |
| PAYMENTRESPONSE_TOPIC_ADDRESS                   | Azure Service Bus message response topic for receiving messages from the Payment service         |
| PAYMENTRESPONSE_SUBSCRIPTION_ADDRESS            | Azure Service Bus message subscription for receiving messages from the Payment service           |
| SEND_PAYMENT_REQUEST                            | Enables the sending of a payment request to the payment service                                  |
| SERVICE_URI                                     | URI of service (used in links, in emails) e.g. `http://localhost:3000` or `https://defra.gov.uk` |

## Running the application

The application is designed to run in containerised environments, using Docker
Compose in development and Kubernetes in production.

- A Helm chart is provided for production deployments to Kubernetes.

### Run database migrations

For local development run the Docker Compose command to execute the
Liquibase database migrations (creating tables, columns, seed data etc):

```sh
# Run the database-up script (executes Liquibase)
# Explicitly run the docker compose down command to shut down the database container
docker compose -f docker-compose.migrate.yaml up database-up && docker compose -f docker-compose.migrate.yaml down
```

For ease or running, the above command has been added to a script -
`./scripts/migrate`. The script will also shut down the application as if it is
still running errors will be reported when the migration(s) run.

### Build container image

Container images are built using Docker Compose, with the same images used to
run the service with either Docker Compose or Kubernetes.

When using the Docker Compose files in development the local `app` folder will
be mounted on top of the `app` folder within the Docker container, hiding the
CSS files that were generated during the Docker build. For the site to render
correctly locally `npm run build` must be run on the host system.

By default, the start script will build (or rebuild) images so there will
rarely be a need to build images manually. However, this can be achieved
through the Docker Compose
[build](https://docs.docker.com/compose/reference/build/) command:

```sh
# Build container images
docker compose build
```

### Start

Use Docker Compose to run service locally.

```sh
docker compose up
```

## Test structure

The tests have been structured into subfolders of `./test` as per the
[Microservice test approach and repository structure](https://eaflood.atlassian.net/wiki/spaces/FPS/pages/1845396477/Microservice+test+approach+and+repository+structure)

### Running tests

A convenience script is provided to run automated tests in a containerised
environment. This will rebuild images before running tests via docker compose,
using a combination of `docker-compose.yaml` and `docker-compose.test.yaml`.
The command given to `docker compose run` may be customised by passing
arguments to the test script.

Examples:

```sh
# Run all tests
scripts/test

# Run tests with file watch
scripts/test -w
```

## CI pipeline

This service uses the [FFC CI pipeline](https://github.com/DEFRA/ffc-jenkins-pipeline-library)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT
LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and
applications when using this information.

> Contains public sector information licensed under the Open Government license
> v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her
Majesty's Stationery Office (HMSO) to enable information providers in the
public sector to license the use and re-use of their information under a common
open licence.

It is designed to encourage use and re-use of information freely and flexibly,
with only a few conditions.
