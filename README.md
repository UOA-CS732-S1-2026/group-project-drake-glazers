# CS732 project - Team Drake Glazers

Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Your team members are:
- Arnav Bhatiani _(abha257@aucklanduni.ac.nz)_
- Divyanshu Khadka _(dkha055@aucklanduni.ac.nz)_
- Jerry Kim _(pkim777@aucklanduni.ac.nz)_
- Harry Ma _(hma481@aucklanduni.ac.nz)_
- Oshan Premkumar _(opre469@aucklanduni.ac.nz)_
- Dhruv Sawant _(dsaw164@aucklanduni.ac.nz)_
- Milan Ahuja _(mahu925@aucklanduni.ac.nz)_

You have complete control over how you run this repo. All your members will have admin access. The only thing setup by default is branch protections on `main`, requiring a PR with at least one code reviewer to modify `main` rather than direct pushes.

Please use good version control practices, such as feature branching, both to make it easier for markers to see your group's history and to lower the chances of you tripping over each other during development

![](./Drake%20Glazers.png)

## Running tests

Make sure Docker Desktop is installed and running. From the root, install dependencies then run tests:

```
npm run install:all
npm test
```

This will automatically start a local Postgres container, apply migrations, and run all tests.
