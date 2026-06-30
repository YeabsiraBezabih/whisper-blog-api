# **6. Postman — Complete Guide for Beginners**

Postman is the industry-standard tool for developing and testing APIs. You will use it throughout this roadmap. Here is everything you need to know to use it effectively.

## **Core Concepts**

- Request: a single API call (method + URL + headers + body)

- Collection: a folder of related requests (e.g., "Blog API — Auth")

- Environment: a set of variables like {{baseUrl}}, {{token}} that you can swap between dev/prod

- Variable: a reusable value. Collection variables persist across sessions; environment variables are environment-specific

- Pre-request Script: JavaScript that runs before the request (e.g., generate a timestamp)

- Test Script: JavaScript that runs after the response (e.g., assert status === 200)

## **Setting Up Your First Collection**

1. Open Postman → New → Collection → name it "Blog API"

1. Right-click Collection → Add Environment Variable: baseUrl = http://localhost:3000

1. Add a folder: "Auth" — put Register and Login requests here

1. Add a folder: "Posts" — put CRUD requests here

1. In the Login request Tests tab, save the token: pm.environment.set("token", pm.response.json().access_token)

1. On protected requests, set Auth: Bearer Token → value: {{token}}

## **Writing Test Scripts**

  // In the Tests tab of any request:

  pm.test("Status is 201", () => {

    pm.response.to.have.status(201);

  });

  pm.test("Body has id", () => {

    pm.expect(pm.response.json()).to.have.property("id");

  });

## **Running Collections with Newman (CLI)**

Newman lets you run Postman collections from the terminal — essential for CI pipelines.

  npm install -g newman

  newman run BlogAPI.postman_collection.json -e dev.postman_environment.json
